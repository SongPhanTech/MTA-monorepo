import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, Prisma } from "@workspace/db"
import { calcFinalScore } from "@workspace/libs/utils"
import { prisma } from ".."
import { ErrorMessageResponseSchema, SuccessBooleanResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

const genExamListCode = createRoute({
  operationId: "gen-exam-list-code",
  path: "/gen-exam-list-code",
  tags: ["Kỳ thi"],
  summary: "Sinh phách danh sách thi",
  description: `Sinh số phách cho các bài thi trong kỳ thi.

**Bảng dữ liệu nguồn:** Exam, ExamRoom, ExamList, ExamPaper.

**Tham số:** examId.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              examId: z.string().openapi(fieldDesc("ID kỳ thi (Exam).")),
            })
            .openapi("gen-exam-room-code"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Generate Exam List code result",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("gen-exam-list-code-result"),
        },
      },
    },
    400: {
      description: "failed",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(genExamListCode, async (c) => {
  const { examId } = c.req.valid("json")
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examRooms: {
        include: {
          examList: {
            include: {
              examPapers: {
                include: { studentSubjectScore: true },
                where: {
                  studentSubjectScore: {
                    suspended: false,
                    examBanned: false,
                    examPostponed: false,
                    // attendanceScore: {
                    //     not: null,
                    // },
                    // midtermScore: {
                    //     not: null,
                    // },
                    OR: [
                      {
                        attendanceScore: {
                          not: null,
                        },
                        midtermScore: {
                          not: null,
                        },
                        subjectVersion: {
                          onePoint: false,
                        },
                      },
                      {
                        subjectVersion: {
                          onePoint: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!exam) {
    return c.json({ message: "Kỳ thi không tồn tại" }, 404)
  }

  if (exam.examRooms.some((er) => er.examList.some((el) => el.lockExamCode))) {
    return c.json({ message: "Phách đã khoá" }, 400)
  }

  const examList = exam.examRooms.flatMap((er) => er.examList)
  const examPapers = examList.flatMap((el) => el.examPapers)
  if (!examPapers.length) {
    return c.json({ message: "Không có thí sinh" }, 404)
  }

  // const hasScore = examPapers.some((s) => s.studentSubjectScore.examScore !== null)

  // if (hasScore) {
  //   return c.json({ message: "Phách đã được nhập điểm" }, 400)
  // }

  const padding = examPapers.length.toString().length
  const examCodes = Array.from({ length: examPapers.length }, (_, i) =>
    String(i + 1).padStart(padding, "0")
  ).sort(() => Math.random() - 0.5)

  const examPaperUpdates = examPapers.map((s, i) => ({
    id: s.id,
    examCode: examCodes[i],
  }))

  const examCodesCases = examPaperUpdates.map(
    (u) => Prisma.sql`WHEN "id" = ${u.id} THEN ${u.examCode}`
  )

  const ids = examPaperUpdates.map((u) => u.id)

  await prisma.$transaction(async (tx) => {
    await tx.examPaper.updateMany({
      where: {
        examList: {
          examRoom: {
            examId,
          },
        },
      },
      data: { examCode: null },
    })
    await tx.$executeRaw`
            UPDATE "khao-thi"."ExamPaper"
            SET
                "examCode" = CASE ${Prisma.join(examCodesCases, " ")} END
            WHERE
                "id" IN (${Prisma.join(ids)})
            `
    await tx.examList.updateMany({
      where: { id: { in: examList.map((el) => el.id) } },
      data: { lockExamCode: true, createdExamCode: true },
    })
  })

  return c.json({ success: true, message: "Success" }, 200)
})

const saveExamScore = createRoute({
  operationId: "save-exam-score",
  path: "/save-exam-score",
  tags: ["Kỳ thi"],
  summary: "Lưu điểm theo phách",
  description: `Cập nhật điểm thi theo danh sách phách.

**Bảng dữ liệu nguồn:** ExamPaper, StudentSubjectScore.

**Tham số:** mảng { id, score } — id bài thi/phách, score điểm.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.string().openapi(fieldDesc("ID exam paper / phách.")),
                score: z.number().nullish().openapi(fieldDesc("Điểm thi.")),
              })
            )
            .openapi("ExamCodes"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Save exam codes result",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("SaveExamCodesResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(saveExamScore, async (c) => {
  const payload = c.req.valid("json")
  const map = new Map(payload.map((u) => [u.id, u.score]))

  const examPapers = await prisma.examPaper.findMany({
    where: {
      id: { in: payload.map((u) => u.id) },
    },
    select: {
      id: true,
      studentSubjectScore: {
        select: {
          id: true,
          subjectClass: {
            select: { type: true },
          },
          subjectVersion: {
            select: { onePoint: true },
          },
          certificates: {
            select: {
              archivedCertificate: {
                select: {
                  finalScore: true,
                },
              },
            },
          },
          awards: {
            where: {
              status: $Enums.ArchivedCertificateStatus.APPROVED,
            },
            select: {
              status: true,
              archivedAward: {
                select: {
                  bonusScore: true,
                },
              },
            },
          },
          attendanceScore: true,
          midtermScore: true,
          examScore: true,
          student: {
            select: {
              fixedClass: {
                select: {
                  trainingCourse: {
                    select: {
                      coef_1: true,
                      coef_2: true,
                      coef_3: true,
                      scoreToTakeExam: true,
                      scoreToPass: true,
                      maxReExamScore: true,
                      reduceReExamScore: true,
                      examScoreToPass: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      subjectClassStudent: {
        some: {
          student: {
            id: {
              in: examPapers.map((p) => p.studentSubjectScore.id),
            },
          },
        },
      },
    },
  })

  const lockedClasses = subjectClasses.filter((cls) => {
    // const now = new Date()
    // return !cls.examScoreDeadline || cls.examScoreDeadline <= now || cls.isLockExamScore
    return cls.isLockExamScore
  })

  if (lockedClasses.length) {
    return c.json(
      { message: `Lớp đã khoá điểm thi: ${lockedClasses.map((cls) => cls.code).join(", ")}` },
      400
    )
  }

  const defaultCoef = {
    coef_1: 0.1,
    coef_2: 0.3,
    coef_3: 0.6,
    scoreToTakeExam: 1,
    scoreToPass: 4,
    maxReExamScore: 10,
    reduceReExamScore: 0,
    examScoreToPass: 5,
  }

  const updates = examPapers.map((p) => {
    const examScore = Number(map.get(p.id)) >= 0 ? Number(map.get(p.id)) : null
    const isOnePoint = !!p.studentSubjectScore.subjectVersion?.onePoint
    const attendanceScore = isOnePoint ? examScore : p.studentSubjectScore.attendanceScore
    const midtermScore = isOnePoint ? examScore : p.studentSubjectScore.midtermScore

    const finalScore = calcFinalScore(
      p.studentSubjectScore.student.fixedClass?.trainingCourse || defaultCoef,
      { ...p.studentSubjectScore, attendanceScore, midtermScore, examScore },
      p.studentSubjectScore.subjectClass?.type || $Enums.SubjectClassType.NORMAL
    )

    return { examPaperId: p.id, examScore, attendanceScore, midtermScore, finalScore }
  })

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
          UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
          SET
              "examScore" = data."examScore",
              "attendanceScore" = data."attendanceScore",
              "midtermScore" = data."midtermScore",
              "finalScore" = data."finalScore",
              "updatedAt" = NOW()
          FROM (
              VALUES
              ${updates
                .map(
                  (u) => `(
                          '${u.examPaperId}',
                          ${u.examScore === null ? "NULL::double precision" : u.examScore},
                          ${u.attendanceScore === null ? "NULL::double precision" : u.attendanceScore},
                          ${u.midtermScore === null ? "NULL::double precision" : u.midtermScore},
                          ${u.finalScore === null ? "NULL::double precision" : u.finalScore}
                      )`
                )
                .join(",\n")}
          ) AS data("examPaperId", "examScore", "attendanceScore", "midtermScore", "finalScore")
          JOIN "khao-thi"."ExamPaper" AS es
              ON es."id" = data."examPaperId"
          WHERE sss."id" = es."studentSubjectScoreId";
          `)
    const subjectClasses = await tx.subjectClass.findMany({
      where: {
        subjectClassStudent: {
          some: {
            id: {
              in: examPapers.map((p) => p.studentSubjectScore.id),
            },
          },
        },
      },
      include: {
        subjectClassStudent: true,
      },
    })

    for (const cls of subjectClasses) {
      const enteredExamScore = cls.subjectClassStudent.every((s) => {
        return (
          s.examScore || s.examBanned || s.examPostponed || s.exempted || s.withdrew || s.suspended
        )
      })

      await tx.subjectClass.update({
        where: { id: cls.id },
        data: { enteredExamScore },
      })
    }
  })

  return c.json({ success: true, message: "Success" }, 200)
})

export default app
