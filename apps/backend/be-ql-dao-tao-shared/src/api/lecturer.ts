import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListTeacher = createRoute({
  operationId: "get-list-teacher",
  tags: ["Teacher"],
  path: "get-list-teacher",
  summary: "2.16. Lấy danh sách hồ sơ giảng viên",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              key_word: z.string().optional(),
            })
            .openapi("GetListTeacherRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z
            .object({
              result_code: z.string(),
              result_desc: z.string(),
              data: z.array(
                z.object({
                  teacher_code: z.string().nullish(),
                  teacher: z.string(),
                  department_code: z.string().nullish(),
                  department_name: z.string(),
                  rank_name: z.string(),
                  position_name: z.string(),
                  phone_number: z.string(),
                  working_number: z.string(),
                  working_mail: z.string(),
                })
              ),
            })
            .openapi("GetListTeacherResponse"),
        },
      },
    },
  },
})

app.openapi(getListTeacher, async (c) => {
  const { key_word } = c.req.valid("json")

  const res = await prisma.lecturer.findMany({
    where: {
      userProfile: {
        lastName: {
          contains: key_word,
          mode: "insensitive",
        },
      },
    },
    select: {
      code: true,
      organization: {
        select: {
          sMa: true,
          sTen: true,
        },
      },
      userProfile: {
        select: {
          firstName: true,
          lastName: true,
          fullname: true,
          rank: {
            select: {
              sTen: true,
            },
          },
          positionCPV: {
            select: {
              sTen: true,
            },
          },
          phoneNumber: true,
          email: true,
        },
      },
    },
  })

  const data = res.map((item) => ({
    teacher_code: item.code ?? null,
    teacher: item.userProfile.fullname ?? "",
    department_code: item.organization.sMa ?? null,
    department_name: item.organization.sTen ?? "",
    rank_name: item.userProfile.rank?.sTen ?? "",
    position_name: item.userProfile.positionCPV?.sTen ?? "",
    phone_number: item.userProfile.phoneNumber ?? "",
    working_number: item.userProfile.phoneNumber ?? "",
    working_mail: item.userProfile.email ?? "",
  }))

  return c.json(
    {
      result_code: "0000",
      result_desc: "success",
      data,
    },
    200
  )
})

const getTeacherDetail = createRoute({
  operationId: "get-teacher-detail",
  tags: ["TeacherDetail"],
  path: "get-teacher-detail",
  summary: "2.17 Lấy hồ sơ giảng viên",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              teacher_code: z.string(),
            })
            .openapi("GetTeacherDetailRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z
            .object({
              result_code: z.string(),
              result_desc: z.string(),
              teacher_code: z.string().nullable(),
              teacher: z.string(),
              department_code: z.string().nullable(),
              department_name: z.string(),
              rank_name: z.string(),
              position_name: z.string(),
              phone_number: z.string(),
              working_phone: z.string(),
              working_mail: z.string(),
            })
            .openapi("GetTeacherDetailResponse"),
        },
      },
    },
  },
})

app.openapi(getTeacherDetail, async (c) => {
  const { teacher_code } = c.req.valid("json")
  const lecturer = await prisma.lecturer.findUnique({
    where: { code: teacher_code },
    select: {
      code: true,
      organization: {
        select: {
          sMa: true,
          sTen: true,
        },
      },
      userProfile: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,

          email: true,
          rank: { select: { sTen: true } },
          positionCPV: { select: { sTen: true } },
        },
      },
    },
  })
  const res = {
    result_code: "000",
    result_desc: "success",
    teacher_code: lecturer?.code ?? null,
    teacher: `${lecturer?.userProfile.lastName} ${lecturer?.userProfile.firstName}`,
    department_code: lecturer?.organization?.sMa ?? null,
    department_name: lecturer?.organization?.sTen ?? "",
    rank_name: lecturer?.userProfile.rank?.sTen ?? "",
    position_name: lecturer?.userProfile.positionCPV?.sTen ?? "",
    phone_number: lecturer?.userProfile.phoneNumber ?? "",
    working_phone: lecturer?.userProfile.phoneNumber ?? "",
    working_mail: lecturer?.userProfile.email ?? "",
  }

  return c.json(res)
})

export default app
