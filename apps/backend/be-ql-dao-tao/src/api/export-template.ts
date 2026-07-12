import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { renderXlsxTemplate } from "../services/render-xlsx-template"
import { prisma } from ".."

const app = new OpenAPIHono()

const xlsxTemplateSheetSchema = z
  .object({
    sheetName: z
      .string()
      .optional()
      .openapi(fieldDesc("Tên sheet khi gộp nhiều sheet vào 1 file.")),
    sheet: z
      .union([z.number(), z.string()])
      .optional()
      .openapi(fieldDesc("Sheet trong template cần fill. Mặc định: 1.")),
    data: z
      .object({})
      .catchall(z.any())
      .openapi(
        fieldDesc(
          "Dữ liệu theo cú pháp xlsx-template, ví dụ: { semesterName, courseName, data: [...] }."
        )
      ),
  })
  .openapi("XlsxTemplateSheetInput")

const renderXlsxTemplateRequestSchema = z
  .object({
    templatePath: z
      .string()
      .openapi(
        fieldDesc(
          "Đường dẫn template trên MinIO hoặc mã template. Ví dụ: /mta/template/TKB_K18_filled V2.xlsx hoặc MAU2_DanSu_template.xlsx."
        )
      ),
    fileName: z.string().openapi(fieldDesc("Tên file tải về.")),
    sheets: z
      .array(xlsxTemplateSheetSchema)
      .min(1)
      .openapi(fieldDesc("Danh sách sheet cần render. Mỗi phần tử tương ứng 1 sheet output.")),
    autoPatchTablePlaceholders: z
      .boolean()
      .optional()
      .openapi(
        fieldDesc(
          "Tự động vá placeholder bảng cũ thiếu cột Thứ/Tiết/Giảng đường. Mặc định false."
        )
      ),
  })
  .openapi("RenderXlsxTemplateRequest")

const renderXlsxTemplateRoute = createRoute({
  operationId: "renderXlsxTemplate",
  tags: ["Xuất template Excel"],
  path: "/render",
  method: "post",
  summary: "Xuất Excel từ template (giữ shape)",
  description: `Render file Excel từ template xlsx-template và giữ nguyên shape/drawing có sẵn.

**Cách dùng:**
1. \`templatePath\`: path MinIO hoặc mã template.
2. \`sheets[].data\`: object dữ liệu theo placeholder trong template.

**Placeholder phổ biến:**
- Header: \`\${semesterName}\`, \`\${courseName}\`, \`\${trainingObjectTypeName}\`
- Bảng: \`\${table:data.no}\`, \`\${table:data.subjectCode}\`, \`\${table:data.weekday}\`, ...

**Nhiều khóa / nhiều sheet:** truyền nhiều phần tử trong \`sheets\`, mỗi phần tử 1 sheet output.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: renderXlsxTemplateRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Excel đã render",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(renderXlsxTemplateRoute, async (c) => {
  const body = c.req.valid("json")

  try {
    const result = await renderXlsxTemplate(prisma, {
      templatePath: body.templatePath,
      sheets: body.sheets,
      autoPatchTablePlaceholders: body.autoPatchTablePlaceholders,
    })

    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(body.fileName)}`

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất template thất bại"
    return c.json({ message }, 404)
  }
})

export default app
