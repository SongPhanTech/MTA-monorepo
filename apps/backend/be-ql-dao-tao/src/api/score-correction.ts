import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { calcFinalScore } from "@workspace/libs/utils"
import Decimal from "decimal.js"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })

const approveScoreCorrection = createRoute({
  operationId: "approve-score-correction",
  path: "/approve",
  tags: ["ScoreCorrection"],
  summary: "Duyệt phiếu sửa điểm",
  description: "Duyệt phiếu sửa điểm và cập nhật điểm cho sinh viên",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              ticketId: z.string(),
            })
            .openapi("ApproveScoreCorrectionInput"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Error",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(approveScoreCorrection, async (c) => {
  const { ticketId } = c.req.valid("json")

  try {
    await prisma.$transaction(async (tx) => {
      const ticket = await tx.scoreCorrectionTicket.findUnique({
        where: { id: ticketId },
        include: {
          items: {
            include: {
              studentSubjectScore: {
                include: {
                  student: {
                    include: {
                      fixedClass: {
                        include: {
                          trainingCourse: true,
                        },
                      },
                    },
                  },
                  certificates: {
                    include: {
                      archivedCertificate: true,
                    },
                  },
                  awards: {
                    where: {
                      status: $Enums.ArchivedCertificateStatus.APPROVED,
                    },
                    include: {
                      archivedAward: true,
                    },
                  },
                  subjectClass: {
                    select: { type: true },
                  },
                },
              },
            },
          },
        },
      })

      if (!ticket) {
        throw new Error("Phiếu không tồn tại")
      }

      if (ticket.status === $Enums.ScoreCorrectionStatus.APPROVED) {
        throw new Error("Phiếu đã được duyệt")
      }

      if (!ticket.proposal || !ticket.decision || !ticket.date) {
        throw new Error("Thông tin phiếu chưa đầy đủ (Tờ trình, Số quyết định, Ngày)")
      }

      if (!ticket.items || ticket.items.length === 0) {
        throw new Error("Phiếu chưa có sinh viên")
      }

      const invalidItems = ticket.items.some(
        (item) =>
          item.newAttendanceScore === null ||
          item.newAttendanceScore === undefined ||
          item.newMidtermScore === null ||
          item.newMidtermScore === undefined ||
          item.newExamScore === null ||
          item.newExamScore === undefined
      )

      if (invalidItems) {
        throw new Error("Thông tin điểm mới của các sinh viên chưa đầy đủ")
      }

      for (const item of ticket.items) {
        const { studentSubjectScore, newAttendanceScore, newMidtermScore, newExamScore } = item

        if (!studentSubjectScore) continue

        const trainingCourse = studentSubjectScore.student?.fixedClass?.trainingCourse
        const subjectClassType =
          studentSubjectScore.subjectClass?.type || $Enums.SubjectClassType.NORMAL

        if (!trainingCourse) {
          throw new Error(
            `Sinh viên ${studentSubjectScore.studentId} không thuộc khoá học nào có cấu hình điểm`
          )
        }

        const updatedSubjectScorePayload = {
          ...studentSubjectScore,
          attendanceScore:
            newAttendanceScore !== null && newAttendanceScore !== undefined
              ? newAttendanceScore
              : studentSubjectScore.attendanceScore,
          midtermScore:
            newMidtermScore !== null && newMidtermScore !== undefined
              ? newMidtermScore
              : studentSubjectScore.midtermScore,
          examScore:
            newExamScore !== null && newExamScore !== undefined
              ? newExamScore
              : studentSubjectScore.examScore,
        }

        const finalScore = calcFinalScore(
          trainingCourse,
          updatedSubjectScorePayload,
          subjectClassType
        )

        await tx.studentSubjectScore.update({
          where: { id: studentSubjectScore.id },
          data: {
            attendanceScore: updatedSubjectScorePayload.attendanceScore,
            midtermScore: updatedSubjectScorePayload.midtermScore,
            examScore: updatedSubjectScorePayload.examScore,
            finalScore: finalScore ? new Decimal(finalScore) : null,
          },
        })

        await tx.studentSubjectScoreHistory.create({
          data: {
            attendanceScore: updatedSubjectScorePayload.attendanceScore,
            midtermScore: updatedSubjectScorePayload.midtermScore,
            examScore: updatedSubjectScorePayload.examScore,
            finalScore: finalScore ? new Decimal(finalScore) : null,
            studentSubjectScoreId: studentSubjectScore.id,
            // updatedById: profileId,
          },
        })
      }

      await tx.scoreCorrectionTicket.update({
        where: { id: ticketId },
        data: { status: $Enums.ScoreCorrectionStatus.APPROVED },
      })
    })

    return c.json({ success: true, message: "Duyệt phiếu thành công" }, 200)
  } catch (error: any) {
    console.error(error)
    return c.json({ success: false, message: error.message || "Lỗi khi duyệt phiếu" }, 400)
  }
})

export default app
