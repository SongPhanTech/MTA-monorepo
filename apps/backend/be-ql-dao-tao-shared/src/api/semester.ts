import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import {
  GetAllYearResponse,
  GetSemesterRequest,
  GetSemesterResponse,
} from "../dto/semester.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getSemester = createRoute({
  operationId: "get-class-terms",
  tags: ["Semester — Học kỳ"],
  path: "get-class-terms",
  summary: "2.11. Lấy thông tin kì học",
  description: `Danh sách học kỳ theo năm học.

**Bảng dữ liệu nguồn:** SchoolYear, Semester.

**Tham số:** year — lọc theo tên năm học (tùy chọn).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GetSemesterRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetSemesterResponse,
        },
      },
    },
  },
})
app.openapi(getSemester, async (c) => {
  const { year } = c.req.valid("json")

  const res = await prisma.schoolYear.findMany({
    where: {
      name: {
        contains: year,
        mode: "insensitive",
      },
    },
    select: {
      code: true,
      name: true,
      semesters: {
        select: { name: true, code: true },
      },
    },
  })

  const data = res.flatMap((sy) =>
    sy.semesters.map((s) => ({
      year_code: sy.code ?? "",
      year_name: sy.name ?? "",
      class_terms: s.name,
      class_terms_code: s.code ?? "",
    }))
  )

  return c.json({
    result_code: "000",
    result_desc: "success",
    data: data,
  })
})

const getAllYear = createRoute({
  operationId: "get-all-year",
  tags: ["SchoolYear — Năm học"],
  path: "get-all-year",
  summary: "2.10. Lấy danh sách năm học",
  description: `Danh sách tất cả năm học.

**Bảng dữ liệu nguồn:** SchoolYear.

**Không có tham số đầu vào.**`,
  method: "post",
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetAllYearResponse,
        },
      },
    },
  },
})
app.openapi(getAllYear, async (c) => {
  const res = await prisma.schoolYear.findMany({
    select: {
      code: true,
      name: true,
    },
    orderBy: { name: "asc" },
  })

  const data = res.map((r) => {
    return {
      year_code: r.code ?? "",
      year: r.name ?? "",
    }
  })

  return c.json({
    result_code: "000",
    result_desc: "success",
    data,
  })
})

export default app
