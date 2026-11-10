import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { $Enums } from "@workspace/db"
import { convertScoreWithCourseConfig, courseScoreConfigFrom } from "@workspace/libs/utils"
import { HTTPException } from "hono/http-exception"
import { prisma } from "../.."
import {
  V1ErrorResponse,
  V1StudentCodeParam,
  V1StudentScoreItem,
  V1StudentScoresResponse,
} from "../../dto/v1.dto"
import type { z } from "@hono/zod-openapi"

type ScoreItem = z.infer<typeof V1StudentScoreItem>

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getStudentScores = createRoute({
  operationId: "v1-get-student-scores",
  tags: ["V1 — Điểm sinh viên"],
  path: "/students/{student_code}/scores",
  method: "get",
  summary: "Full điểm sinh viên (gom theo học kỳ)",
  description: `Lấy toàn bộ điểm của một sinh viên theo mã, gom nhóm theo học kỳ.
Mỗi môn kèm cờ học lại / thi lại dựa trên \`SubjectClass.type\` (\`RETAKE\` / \`REEXAM\`).

**Scope:** \`read:student-scores\`

**Headers:** Authorization Bearer, X-Timestamp, X-Nonce`,
  security: [{ Bearer: [] }],
  request: { params: V1StudentCodeParam },
  responses: {
    200: {
      description: "Thành công",
      content: { "application/json": { schema: V1StudentScoresResponse } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
    404: {
      description: "Không tìm thấy sinh viên",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
  },
})

app.openapi(getStudentScores, async (c) => {
  const { student_code } = c.req.valid("param")

  const student = await prisma.student.findFirst({
    where: { userProfile: { code: student_code } },
    include: {
      userProfile: { select: { code: true, fullname: true } },
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
    throw new HTTPException(404, { message: "Không tìm thấy thông tin sinh viên" })
  }

  const scoreRanges = student.fixedClass?.trainingCourse?.scoreConverts ?? []
  const trainingCourse = student.fixedClass?.trainingCourse

  const rows = await prisma.studentSubjectScore.findMany({
    where: {
      studentId: student.id,
      deletedAt: null,
    },
    include: {
      subjectVersion: {
        select: { code: true, name: true, credit: true },
      },
      subjectClass: {
        select: {
          code: true,
          name: true,
          type: true,
          semester: {
            select: { id: true, code: true, name: true, startDate: true },
          },
        },
      },
      semester: {
        select: { id: true, code: true, name: true, startDate: true },
      },
      awards: {
        where: { status: $Enums.ArchivedCertificateStatus.APPROVED },
        include: { archivedAward: true },
      },
      certificates: { include: { archivedCertificate: true } },
    },
  })

  type SemMeta = {
    semester_code: string | null
    semester_name: string
    startDate: Date | null
    scores: ScoreItem[]
  }

  const bySemester = new Map<string, SemMeta>()

  for (const row of rows) {
    const semester = row.semester ?? row.subjectClass?.semester ?? null
    const semKey = semester?.id ?? "_unknown"
    if (!bySemester.has(semKey)) {
      bySemester.set(semKey, {
        semester_code: semester?.code ?? null,
        semester_name: semester?.name ?? "Chưa phân học kỳ",
        startDate: semester?.startDate ?? null,
        scores: [],
      })
    }

    const classType = row.subjectClass?.type ?? $Enums.SubjectClassType.NORMAL
    const score10 = row.manualFinalScore ?? row.finalScore?.toNumber() ?? 0
    const converted = convertScoreWithCourseConfig(
      score10,
      scoreRanges,
      courseScoreConfigFrom(trainingCourse, row)
    )
    const bonusScore =
      row.awards?.reduce((acc, curr) => acc + (curr.archivedAward?.bonusScore ?? 0), 0) ?? 0

    const item: ScoreItem = {
      subject_code: row.subjectVersion.code,
      subject_name: row.subjectVersion.name,
      class_code: row.subjectClass?.code ?? null,
      class_name: row.subjectClass?.name ?? null,
      class_type: classType,
      is_retake: classType === $Enums.SubjectClassType.RETAKE,
      is_reexam: classType === $Enums.SubjectClassType.REEXAM,
      is_improving: row.isImproving,
      credit: row.subjectVersion.credit,
      attendance_score: row.attendanceScore,
      midterm_score: row.midtermScore,
      exam_score: row.examScore,
      final_score10: score10,
      final_score4: converted.base4,
      grade_letter: converted.letter,
      pass: converted.pass,
      bonus_score: bonusScore,
      description: row.description ?? "",
    }
    bySemester.get(semKey)!.scores.push(item)
  }

  const semesters = [...bySemester.values()]
    .sort((a, b) => {
      const ta = a.startDate?.getTime() ?? 0
      const tb = b.startDate?.getTime() ?? 0
      return tb - ta
    })
    .map(({ startDate: _s, ...rest }) => rest)

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data: {
        student_code: student.userProfile?.code ?? student_code,
        student_name: student.userProfile?.fullname ?? "",
        semesters,
      },
    },
    200
  )
})

export default app
