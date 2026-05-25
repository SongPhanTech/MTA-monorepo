import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import {
  GetListTeacherRequest,
  GetListTeacherResponse,
  GetTeacherDetailRequest,
  GetTeacherDetailResponse,
} from "../dto/lecturer.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListTeacher = createRoute({
  operationId: "get-list-teacher",
  tags: ["Giảng viên"],
  path: "get-list-teacher",
  summary: "2.16. Lấy danh sách hồ sơ giảng viên",
  description: `Tìm kiếm giảng viên theo từ khóa.

**Bảng dữ liệu nguồn:** Lecturer, UserProfile, Organization (DM_DonVi), DM_QuanHam, DM_ChucVu.

**Tham số:** key_word — lọc theo họ (lastName).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetListTeacherRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetListTeacherResponse,
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
      result_code: "000" as const,
      result_desc: "success" as const,
      data,
    },
    200
  )
})

const getTeacherDetail = createRoute({
  operationId: "get-teacher-detail",
  tags: ["Hồ sơ giảng viên "],
  path: "get-teacher-detail",
  summary: "2.17 Lấy hồ sơ giảng viên",
  description: `Chi tiết một giảng viên theo mã.

**Bảng dữ liệu nguồn:** Lecturer, UserProfile, Organization.

**Tham số:** teacher_code — mã giảng viên (Lecturer.code).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetTeacherDetailRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetTeacherDetailResponse,
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
    result_code: "000" as const,
    result_desc: "success" as const,
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
