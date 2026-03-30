import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

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
  tags: ["Department"],
  path: "get-all-department",
  summary: "2.7. Danh sách đơn vị",
  method: "post",
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.object({
            result_code: z.string(),
            result_desc: z.string(),
            department_list: z.array(
              z.object({
                gid: z.number(),
                dept_code: z.string(),
                dept_name: z.string(),
                dept_full_name: z.string(),
                dept_email: z.string(),
                dept_address: z.string(),
                dept_order: z.string(),
                dept_level: z.number(),
                dept_parent_id: z.string().nullable(),
                dept_code_build_tree: z.string(),
              })
            ),
          }),
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
      sCode: true, // hierarchical path
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
