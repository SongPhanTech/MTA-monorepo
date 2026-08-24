import { z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn } from "@workspace/libs/timezone"
import XlsxTemplate from "xlsx-template"
import { fieldDesc } from "../dto/openapi-helpers"
import { prisma } from ".."

const StatsArchivedAwardItemSchema = z.object({
  studentCode: z.string().openapi(fieldDesc("Mã học viên (Student.code).")),
  studentName: z.string().openapi(fieldDesc("Họ tên (UserProfile.fullname).")),
  dateOfBirth: z.date().nullable().openapi(fieldDesc("Ngày sinh.")),
  classCode: z.string().openapi(fieldDesc("Mã lớp niên chế (FixedClass.code).")),
  className: z.string().openapi(fieldDesc("Tên lớp niên chế.")),
  awardName: z.string().openapi(fieldDesc("Tên giải thưởng (Award.name).")),
  awardDate: z.date().openapi(fieldDesc("Ngày đạt giải (ArchivedAward.date).")),
  receivedSemester: z.string().openapi(fieldDesc("Học kỳ nhận giải.")),
  bonusScore: z.number().nullable().openapi(fieldDesc("Điểm cộng thưởng.")),
  subjectName: z.string().nullable().openapi(fieldDesc("Tên học phần được cộng điểm.")),
  subjectSemester: z.string().nullable().openapi(fieldDesc("Học kỳ của học phần.")),
  subjectScore: z.number().nullable().openapi(fieldDesc("Điểm học phần sau cộng.")),
})

export const StatsArchivedResponseSchema = z.object({
  fromSemester: z.string().openapi(fieldDesc("Tên học kỳ bắt đầu.")),
  toSemester: z.string().openapi(fieldDesc("Tên học kỳ kết thúc.")),
  data: z
    .array(StatsArchivedAwardItemSchema)
    .openapi(fieldDesc("Danh sách học viên có điểm thưởng trong khoảng học kỳ.")),
})

export type StatsArchivedResponse = z.infer<typeof StatsArchivedResponseSchema>
export type StatItem = z.infer<typeof StatsArchivedAwardItemSchema>

export const getStatsArchivedAward = async ({
  fromSemesterId,
  toSemesterId,
  trainingCourseId,
}: {
  fromSemesterId: string
  toSemesterId: string
  trainingCourseId: string
}): Promise<StatsArchivedResponse> => {
  const fromSemester = await prisma.semester.findUniqueOrThrow({ where: { id: fromSemesterId } })
  const toSemester = await prisma.semester.findUniqueOrThrow({ where: { id: toSemesterId } })

  const startDate =
    fromSemester.startDate < toSemester.startDate ? fromSemester.startDate : toSemester.startDate
  const endDate =
    fromSemester.endDate > toSemester.endDate ? fromSemester.endDate : toSemester.endDate

  const allSemesters = await prisma.semester.findMany({
    orderBy: { startDate: "asc" },
  })

  const awards = await prisma.archivedAward.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      active: true,
      student: {
        fixedClass: {
          trainingCourseId,
        },
      },
    },
    include: {
      student: {
        include: {
          userProfile: true,
          fixedClass: true,
        },
      },
      award: true,
      studentSubjectScore: {
        include: {
          studentSubjectScore: {
            include: {
              subjectVersion: true,
              subjectClass: {
                include: {
                  semester: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const result: StatsArchivedResponse = {
    fromSemester: fromSemester.name,
    toSemester: toSemester.name,
    data: awards.flatMap((award) => {
      const awardDate = award.date || award.createdAt
      const receivedSemester = allSemesters.find(
        (s) => awardDate >= s.startDate && awardDate <= s.endDate
      )

      if (award.studentSubjectScore.length === 0) {
        return [
          {
            studentCode: award.student.code ?? "",
            dateOfBirth: award.student.userProfile.dateOfBirth,
            studentName: award.student.userProfile.fullname || "Không xác định",
            classCode: award.student.fixedClass?.code ?? "Không xác định",
            className: award.student.fixedClass?.name ?? "Không xác định",
            awardName: award.award.name,
            awardDate,
            receivedSemester: receivedSemester?.name ?? "Không xác định",
            bonusScore: award.bonusScore,
            subjectName: null,
            subjectSemester: null,
            subjectScore: null,
          } as StatItem,
        ]
      }

      return award.studentSubjectScore.map((assoc) => {
        const score = assoc.studentSubjectScore
        return {
          studentCode: award.student.code ?? "",
          dateOfBirth: award.student.userProfile.dateOfBirth,
          studentName: award.student.userProfile.fullname || "Không xác định",
          classCode: award.student.fixedClass?.code ?? "Không xác định",
          className: award.student.fixedClass?.name ?? "Không xác định",
          awardName: award.award.name,
          awardDate,
          receivedSemester: receivedSemester?.name ?? "Không xác định",
          bonusScore: award.bonusScore,
          subjectName: score.subjectVersion.name || "Không xác định",
          subjectSemester: score.subjectClass?.semester.name || "Không xác định",
          subjectScore: score.finalScore?.toNumber() || null,
        }
      })
    }),
  }

  return result
}

export const exportStatsArchivedAward = async (params: {
  fromSemesterId: string
  toSemesterId: string
  trainingCourseId: string
}) => {
  const { fromSemester, toSemester, data } = await getStatsArchivedAward(params)

  const buffer = await getTemplateBuffer(prisma, "THONG_KE_DIEM_THUONG")
  const template = new XlsxTemplate(buffer)

  // Format data for excel
  const formattedData = data.map((item, idx) => ({
    ...item,
    no: idx + 1,
    dateOfBirth: item.dateOfBirth ? formatDateVn(item.dateOfBirth) : "",
    awardDate: item.awardDate ? formatDateVn(item.awardDate) : "",
  }))

  template.substitute(1, {
    fromSemester,
    toSemester,
    data: formattedData,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}
