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
    pageBreakAfter: z
      .boolean()
      .optional()
      .openapi(
        fieldDesc(
          "Chèn ngắt trang sau block này. Chỉ có tác dụng khi mergeBlocksToOneSheet = true."
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
      .openapi(
        fieldDesc(
          "Danh sách block/sheet cần render. Mỗi phần tử = 1 lần fill template. Khi mergeBlocksToOneSheet=true thì xếp dọc 1 sheet."
        )
      ),
    autoPatchTablePlaceholders: z
      .boolean()
      .optional()
      .openapi(
        fieldDesc("Tự động vá placeholder bảng cũ thiếu cột Thứ/Tiết/Giảng đường. Mặc định false.")
      ),
    mergeBlocksToOneSheet: z
      .boolean()
      .optional()
      .openapi(
        fieldDesc(
          "Ghép nhiều block vào 1 sheet (xếp dọc), giữ shape bằng offset drawing XML. Mặc định false (mỗi block 1 tab)."
        )
      ),
    blockGapRows: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi(fieldDesc("Số dòng trống giữa các block khi ghép dọc. Mặc định 0.")),
    prefix: z
      .string()
      .optional()
      .openapi(
        fieldDesc(
          "Prefix đường dẫn MinIO (ví dụ /mta/template). Không truyền → lấy mặc định từ DB template hoặc /mta/template."
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

**Nhiều block 1 sheet (giữ shape):**
- \`mergeBlocksToOneSheet: true\`
- Mỗi phần tử \`sheets[]\` = 1 block (header + table + footer)
- \`sheets[].pageBreakAfter: true\` để ngắt trang sau block (tương đương field "ngắt trang")
- Hệ thống render từng block rồi ghép dọc, offset drawing XML để shape lặp lại ở mọi block.`,
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
      mergeBlocksToOneSheet: body.mergeBlocksToOneSheet,
      blockGapRows: body.blockGapRows,
      prefix: body.prefix,
    })

    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(body.fileName)}`

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất template thất bại"
    console.error("[export-template/render]", message, error)
    return c.json({ message }, 404)
  }
})

export default app
