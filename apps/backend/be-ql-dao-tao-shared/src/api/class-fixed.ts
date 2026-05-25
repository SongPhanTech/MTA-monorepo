import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import { GetClassRequest, GetClassResponse } from "../dto/class-fixed.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getClassFixed = createRoute({
  operationId: "get-class",
  tags: ["Lớp niên chế"],
  path: "get-class",
  summary: "2.12. Lấy thông tin lớp niên chế",
  description: `Lấy danh sách lớp niên chế (lớp cố định).

**Bảng dữ liệu nguồn:** FixedClass, CurriculumVersion, Curriculum, TrainingMajor, TrainingCourse, LecturerManagement, UserProfile.

**Tham số:** key_word — lọc theo tên lớp.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetClassRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetClassResponse,
        },
      },
    },
  },
})

app.openapi(getClassFixed, async (c) => {
  const { key_word } = c.req.valid("json")
  const res = await prisma.fixedClass.findMany({
    where: key_word ? { name: { contains: key_word, mode: "insensitive" } } : undefined,
    select: {
      code: true,
      name: true,
      curriculumVersion: {
        select: {
          name: true,
          curriculum: {
            select: {
              trainingMajor: { select: { name: true } },
            },
          },
        },
      },
      trainingCourse: { select: { name: true, description: true } },
      lecturerManagement: {
        select: { userProfile: { select: { fullname: true } } },
      },
    },
  })

  const data = res.map((i) => ({
    class_code: i.code ?? "",
    class_name: i.name,
    major: i.curriculumVersion?.name ?? "",
    teacher: i.lecturerManagement?.userProfile?.fullname ?? "",
    scholastic_name: i.trainingCourse?.name ?? "",
  }))

  return c.json({
    result_code: "000",
    result_desc: "success",
    data,
  })
})

export default app
