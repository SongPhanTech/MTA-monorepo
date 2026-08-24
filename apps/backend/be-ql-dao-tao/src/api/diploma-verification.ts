import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { DiplomaVerificationStatus } from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn } from "@workspace/libs/timezone"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { excelSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const exportDiplomaVerification = createRoute({
  operationId: "exportDiplomaVerification",
  tags: ["Xác minh văn bằng"],
  path: "/export-diploma-verification",
  method: "get",
  summary: "Xuất xác minh văn bằng",
  description: `Xuất Excel danh sách hồ sơ xác minh văn bằng trong khoảng thời gian.

**Bảng dữ liệu nguồn:** DiplomaVerificationApplication.

**Tham số:** startDate, endDate (query).`,
  request: {
    query: z.object({
      startDate: z.coerce.date().openapi(fieldDesc("Từ ngày (lọc createdAt).")),
      endDate: z.coerce.date().openapi(fieldDesc("Đến ngày.")),
    }),
  },
  responses: {
    ...excelSuccess("File Excel xác minh văn bằng"),
    ...standardErrorResponses(),
    400: {
      description: "Khoảng ngày không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportDiplomaVerification, async (c) => {
  const { startDate, endDate } = c.req.valid("query")

  const applications = await prisma.diplomaVerificationApplication.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  const statusMap = {
    [DiplomaVerificationStatus.PENDING]: "Chưa xử lý",
    [DiplomaVerificationStatus.IN_PROGRESS]: "Chưa xử lý",
    [DiplomaVerificationStatus.APPROVED]: "Đã duyệt",
    [DiplomaVerificationStatus.REJECTED]: "Từ chối",
  }

  const total = applications.length
  const totalAccepted = applications.filter(
    (application) => application.status === DiplomaVerificationStatus.APPROVED
  ).length
  const totalRejected = applications.filter(
    (application) => application.status === DiplomaVerificationStatus.REJECTED
  ).length
  const totalPending = total - totalAccepted - totalRejected

  const data = applications.map((application, idx) => ({
    no: idx + 1,
    ...application,
    dateOfBirth: application.dateOfBirth ? formatDateVn(application.dateOfBirth) : "",
    createdAt: formatDateVn(application.createdAt),
    status: statusMap[application.status],
  }))

  const buffer = await getTemplateBuffer(prisma, "XAC_MINH_VAN_BANG")

  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    startDate: formatDateVn(startDate),
    endDate: formatDateVn(endDate),
    total,
    totalPending,
    totalAccepted,
    totalRejected,
    data,
  })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = "XAC_MINH_VAN_BANG.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
