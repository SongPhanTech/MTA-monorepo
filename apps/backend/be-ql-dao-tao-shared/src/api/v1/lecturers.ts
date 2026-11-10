import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from "../.."
import { V1ErrorResponse, V1LecturersResponse, V1SearchQuery } from "../../dto/v1.dto"
import { resolveBoMonAndDepartmentBatch } from "../../services/org-resolve"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const listLecturers = createRoute({
  operationId: "v1-list-lecturers",
  tags: ["V1 — Giảng viên"],
  path: "/lecturers",
  method: "get",
  summary: "Danh sách giảng viên (bộ môn + đơn vị)",
  description: `RESTful list giảng viên kèm Bộ môn và Đơn vị (khoa/viện).

**Scope:** \`read:lecturers\`

**Headers:** Authorization Bearer, X-Timestamp, X-Nonce`,
  security: [{ Bearer: [] }],
  request: { query: V1SearchQuery },
  responses: {
    200: {
      description: "Thành công",
      content: { "application/json": { schema: V1LecturersResponse } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: V1ErrorResponse } },
    },
  },
})

app.openapi(listLecturers, async (c) => {
  const { q } = c.req.valid("query")

  const res = await prisma.lecturer.findMany({
    where: q
      ? {
          userProfile: {
            OR: [
              { fullname: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    select: {
      userProfile: {
        select: {
          code: true,
          fullname: true,
          sDM_DonViId: true,
          phoneNumber: true,
          email: true,
          rank: { select: { sTen: true } },
          positionCPV: { select: { sTen: true } },
        },
      },
    },
    take: 500,
  })

  const orgMap = await resolveBoMonAndDepartmentBatch(
    res.map((r) => r.userProfile.sDM_DonViId).filter(Boolean) as string[]
  )

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data: res.map((item) => {
        const org = item.userProfile.sDM_DonViId
          ? orgMap.get(item.userProfile.sDM_DonViId)
          : undefined
        return {
          teacher_code: item.userProfile.code ?? null,
          teacher: item.userProfile.fullname ?? "",
          bo_mon_code: org?.bo_mon_code ?? null,
          bo_mon_name: org?.bo_mon_name ?? "",
          department_code: org?.department_code ?? null,
          department_name: org?.department_name ?? "",
          rank_name: item.userProfile.rank?.sTen ?? "",
          position_name: item.userProfile.positionCPV?.sTen ?? "",
          phone_number: item.userProfile.phoneNumber ?? "",
          working_mail: item.userProfile.email ?? "",
        }
      }),
    },
    200
  )
})

export default app
