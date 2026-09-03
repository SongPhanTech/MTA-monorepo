import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { $Enums, type ScoreConvert } from "@workspace/db"
import { convertScoreWithCourseConfig, courseScoreConfigFrom } from "@workspace/libs/utils"
import { prisma } from ".."
import {
  StudentScoreNotFoundResponse,
  StudentScoreRequest,
  StudentScoreResponse,
} from "../dto/student-score"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

function scoreConverter(scoreRanges: ScoreConvert[] = []) {
  const convertScore = (
    finalScore: number,
    config?: Parameters<typeof convertScoreWithCourseConfig>[2]
  ) => convertScoreWithCourseConfig(finalScore, scoreRanges, config)

  return { convertScore }
}

const getStudentScore = createRoute({
  operationId: "get-student-score",
  tags: ["Bảng điểm"],
  path: "get-student-score",
  summary: "2.18. Lấy điểm sinh viên",
  description: `Bảng điểm sinh viên theo học kỳ và từng học phần.

**Bảng dữ liệu nguồn:** Student, Semester, SubjectClass, SubjectClassStudent, SubjectVersion, ScoreConvert, ArchivedAward, ArchivedCertificate.

**Tham số:** student_code — mã sinh viên.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentScoreRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: StudentScoreResponse,
        },
      },
    },
    404: {
      description: "Student not found",
      content: {
        "application/json": {
          schema: StudentScoreNotFoundResponse,
        },
      },
    },
  },
})

app.openapi(getStudentScore, async (c) => {
  const { student_code } = c.req.valid("json")
  const student = await prisma.student.findUnique({
    where: { code: student_code },
    include: {
      fixedClass: {
        include: {
          trainingCourse: {
            include: { scoreConverts: true },
          },
        },
      },
    },
  })

  if (!student) {
    return c.json(
      {
        result_code: "404",
        result_desc: "Không tìm thấy thông tin sinh viên!",
      },
      404
    )
  }
  const { convertScore } = scoreConverter(student.fixedClass?.trainingCourse?.scoreConverts ?? [])
  const data = await prisma.semester.findMany({
    where: {
      subjectClasses: {
        some: {
          subjectClassStudent: { some: { studentId: student.id } },
        },
      },
    },
    include: {
      subjectClasses: {
        where: {
          subjectClassStudent: { some: { studentId: student.id } },
        },
        include: {
          subjectClassStudent: {
            where: { studentId: student.id },
            include: {
              subjectVersion: true,
              awards: {
                where: {
                  status: $Enums.ArchivedCertificateStatus.APPROVED,
                },
                include: { archivedAward: true },
              },
              certificates: { include: { archivedCertificate: true } },
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  })
  const semestersFormatted = data.map((item) => ({
    semester_name: item.name,
    semester_code: item.code,
    subject_classes: item.subjectClasses
      .map((sc) => {
        const subjectStudent = sc.subjectClassStudent[0]
        if (!subjectStudent) return null
        const score10 =
          subjectStudent.manualFinalScore ?? subjectStudent.finalScore?.toNumber() ?? 0
        const converted = convertScore(
          score10,
          courseScoreConfigFrom(student.fixedClass?.trainingCourse, subjectStudent)
        )
        const totalBonus =
          subjectStudent.awards?.reduce(
            (acc, curr) => acc + (curr.archivedAward?.bonusScore ?? 0),
            0
          ) ?? 0

        const certString =
          subjectStudent.certificates
            ?.map((i) => i.archivedCertificate?.code)
            .filter(Boolean)
            .join(", ") ?? ""

        return {
          subject_code: subjectStudent.subjectVersion.code,
          subject_name: subjectStudent.subjectVersion.name,
          class_id: sc.id,
          attendanceScore: subjectStudent.attendanceScore,
          midtermScore: subjectStudent.midtermScore,
          examScore: subjectStudent.examScore,
          credit: subjectStudent.subjectVersion.credit,
          final_score10: score10,
          final_score4: converted.base4,
          grade_letter: converted.letter,
          pass: converted.pass,
          bonusScore: totalBonus,
          archivedCertificate: certString,
          description: subjectStudent.description ?? "",
        }
      })

      .filter((i): i is NonNullable<typeof i> => i !== null),
  }))

  return c.json(
    {
      result_code: "000",
      result_desc: "success" as const,
      semesters: semestersFormatted,
    },
    200
  )
})
export default app
