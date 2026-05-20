import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import { GetAllDepartmentResponse } from "../dto/department.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })
function buildDeptCodeTree(code: string): string {
  if (!code) return ""

  const trimmed = code.endsWith("/") ? code.slice(0, -1) : code

  if (trimmed === "001") {
    return "0.1"
  }

  if (trimmed.startsWith("001/")) {
    const rest = trimmed.slice(4)
    return "0.1." + rest.replace(/\//g, ".")
  }

  return trimmed.replace(/\//g, ".")
}

function getDeptLevelFromHierarchy(code: string): number {
  if (!code) return 0
  const trimmed = code.endsWith("/") ? code.slice(0, -1) : code
  return trimmed.split("/").length
}

const getAllDepartment = createRoute({
  operationId: "get-all-department",
  tags: ["Department — Đơn vị / Khoa"],
  path: "get-all-department",
  summary: "2.7. Danh sách đơn vị",
  description: `Lấy toàn bộ cây đơn vị tổ chức (khoa, bộ môn, …).

**Bảng dữ liệu nguồn:** DM_DonVi (schema ql-danh-muc / he-thong).

**Không có tham số đầu vào.**`,
  method: "post",
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: GetAllDepartmentResponse,
        },
      },
    },
  },
})

app.openapi(getAllDepartment, async (c) => {
  const res = await prisma.dM_DonVi.findMany({
    select: {
      sMa: true,
      sTen: true,
      sDiaChi: true,
      iSTT: true,
      sParentId: true,
      sTenVietTat: true,
      sCode: true,
    },
  })

  const data = res.map((r, idx) => {
    const hierarchyCode = r.sCode ?? ""
    const deptCode = r.sMa ?? ""

    const buildTreeCode = buildDeptCodeTree(hierarchyCode)
    const deptLevel = getDeptLevelFromHierarchy(hierarchyCode)

    return {
      gid: idx + 1,
      dept_code: deptCode,
      dept_name: r.sTenVietTat ?? "",
      dept_full_name: r.sTen ?? "",
      dept_email: "",
      dept_address: r.sDiaChi ?? "",
      dept_order: r.iSTT?.toString() ?? "",
      dept_level: deptLevel,
      dept_parent_id: r.sParentId ?? null,
      dept_code_build_tree: buildTreeCode,
    }
  })

  return c.json({
    result_code: "000",
    result_desc: "success",
    department_list: data,
  })
})

export default app
