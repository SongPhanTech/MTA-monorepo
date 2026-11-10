import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from "../.."
import {
  V1ClassCodeParam,
  V1ErrorResponse,
  V1SubjectClassDetailResponse,
  V1SubjectClassListQuery,
  V1SubjectClassesResponse,
} from "../../dto/v1.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const teacherSelect = {
  userProfile: { select: { code: true, fullname: true } },
} as const

const listSubjectClasses = createRoute({
  operationId: "v1-list-subject-classes",
  tags: ["V1 — Lớp học phần"],
  path: "/subject-classes",
  method: "get",
  summary: "Danh sách lớp học phần",
  description: `RESTful list lớp học phần (SubjectClass).

**Scope:** \`read:subject-classes\`

**Headers:** Authorization Bearer, X-Timestamp, X-Nonce`,
  security: [{ Bearer: [] }],
  request: { query: V1SubjectClassListQuery },
  responses: {
    200: {
      description: "Thành công",
      content: { "application/json": { schema: V1SubjectClassesResponse } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
  },
})

app.openapi(listSubjectClasses, async (c) => {
  const { q, semester_code } = c.req.valid("query")

  const rows = await prisma.subjectClass.findMany({
    where: {
      deletedAt: null,
      cancelled: false,
      ...(semester_code
        ? {
            OR: [
              { semester: { code: semester_code } },
              { semester: { name: { contains: semester_code, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { subject: { code: { contains: q, mode: "insensitive" } } },
              { subject: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      code: true,
      name: true,
      enrolledCount: true,
      subject: { select: { code: true, name: true } },
      semester: { select: { name: true } },
      mainLecturer: { select: teacherSelect },
      extraLecturer: { select: teacherSelect },
    },
    take: 500,
    orderBy: { code: "asc" },
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data: rows.map((r) => ({
        class_code: r.code,
        class_name: r.name,
        subject_code: r.subject.code,
        subject_name: r.subject.name,
        semester_name: r.semester.name,
        main_teacher: r.mainLecturer?.userProfile.fullname ?? null,
        extra_teacher: r.extraLecturer?.userProfile.fullname ?? null,
        enrolled_count: r.enrolledCount,
      })),
    },
    200
  )
})

const getSubjectClassDetail = createRoute({
  operationId: "v1-get-subject-class",
  tags: ["V1 — Lớp học phần"],
  path: "/subject-classes/{class_code}",
  method: "get",
  summary: "Chi tiết lớp học phần",
  description: `Chi tiết lớp: mã, tên, GV chính/phụ, danh sách học viên.

**Scope:** \`read:subject-classes\`

**Headers:** Authorization Bearer, X-Timestamp, X-Nonce`,
  security: [{ Bearer: [] }],
  request: { params: V1ClassCodeParam },
  responses: {
    200: {
      description: "Thành công",
      content: { "application/json": { schema: V1SubjectClassDetailResponse } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
  },
})

app.openapi(getSubjectClassDetail, async (c) => {
  const { class_code } = c.req.valid("param")

  const sc = await prisma.subjectClass.findFirst({
    where: { code: class_code, deletedAt: null, cancelled: false },
    select: {
      code: true,
      name: true,
      enrolledCount: true,
      mainLecturer: { select: teacherSelect },
      extraLecturer: { select: teacherSelect },
      subjectClassStudent: {
        where: { deletedAt: null },
        select: {
          student: {
            select: {
              userProfile: { select: { code: true, fullname: true } },
            },
          },
        },
      },
    },
  })

  if (!sc) {
    return c.json({ message: "Lớp học phần không tồn tại" }, 404)
  }

  const toTeacher = (
    lec: { userProfile: { code: string | null; fullname: string | null } } | null
  ) =>
    lec
      ? {
          teacher_code: lec.userProfile.code,
          teacher: lec.userProfile.fullname ?? "",
        }
      : null

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data: {
        class_code: sc.code,
        class_name: sc.name,
        main_teacher: toTeacher(sc.mainLecturer),
        extra_teacher: toTeacher(sc.extraLecturer),
        students: sc.subjectClassStudent.map((s) => ({
          student_code: s.student.userProfile.code,
          student_name: s.student.userProfile.fullname ?? "",
        })),
        enrolled_count: sc.enrolledCount,
      },
    },
    200
  )
})

export default app
