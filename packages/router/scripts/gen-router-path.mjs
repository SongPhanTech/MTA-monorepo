import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { glob } from "glob"

const routerPath = {}
const ignorePages = ["_app", "_document", "404", "403", "_"]
const convertRouterPathToPermission = (subSystem, routerPath) => {
  // Nếu là path trực tiếp, tạo permission name từ path
  if (routerPath.startsWith("/")) {
    // Xử lý đặc biệt cho các path của QL_NGUOI_DUNG
    const cleanPath = routerPath.replace(/^\//, "").replace(/\[.*?\]/g, "ID")
    const pathParts = cleanPath.split("/").filter(Boolean)

    if (pathParts.length === 0) return `${subSystem}_INDEX`

    const permissionParts = pathParts.map((part) => part.toUpperCase().replace(/-/g, "_"))

    return `${subSystem}_${permissionParts.join("_")}`
  }
}

const cleanPath = (path = "") => {
  return path
    .replaceAll("/", " ")
    .replaceAll("\\", " ")
    .trim()
    .replaceAll(" ", "_")
    .replaceAll("-", "_")
    .replaceAll("[", "")
    .replaceAll("]", "")
    .replace(".tsx", "")
    .replace("_index", "")
    .replaceAll("...", "")
    .toUpperCase()
}

const cleanRouter = (router = "") => {
  let r = router.replace("/index.tsx", "").replace(".tsx", "")
  if (r.includes("...")) {
    r = r.split("/").slice(0, -1).join("/")
  }
  return r === "" ? "/" : r
}

const basePath = join(process.cwd(), "..", "..", "apps", "client")
console.log("basePath:", basePath)

const subsystems = await glob(`${basePath}/*`, {
  dotRelative: true,
  posix: true,
})
let permission = {}

for (const subsystem of subsystems.sort()) {
  const subsystemKey = subsystem
    .replace(`${basePath}/`, "")
    .replace("../../apps/client/", "")
    .replaceAll("...", "")
    .toUpperCase()
    .replaceAll("-", "_")
  const pages = await glob(`${subsystem}/src/pages/**/*.tsx`, {
    dotRelative: true,
    posix: true,
  })
  // Bỏ qua thư mục không có pages (vd: thư mục cũ chỉ còn node_modules / bản build CDN)
  if (pages.length === 0) continue
  routerPath[subsystemKey] = {}
  for (const page of pages.sort()) {
    const key = page.replace(`${subsystem}/src/pages`, "")
    // Trang 403 cần route để chuyển hướng nhưng không cần permission
    if (key === "/403.tsx") {
      routerPath[subsystemKey].FORBIDDEN = cleanRouter(key)
      continue
    }
    if (ignorePages.some((ignorePage) => page.includes(ignorePage))) continue
    routerPath[subsystemKey][cleanPath(key)] = cleanRouter(key)
    permission = {
      ...permission,
      [subsystemKey]: [
        ...(permission[subsystemKey] || []),
        convertRouterPathToPermission(subsystemKey, cleanRouter(key)),
      ],
    }
    console.log("Processing:", subsystemKey, cleanPath(key), "=>", cleanRouter(key))
  }
}

const generatedPath = join(process.cwd(), "generated")

for (const sub in permission) {
  console.log("sub:", sub, permission[sub])
  await writeFile(
    join(generatedPath, `${sub.split("_").join("-").toLowerCase()}.ts`),
    `export enum ${sub}_PERMISSION {${permission[sub].map((e) => `${e}='${e}'`).join(",\n")}}`
  )
}

if (!existsSync(generatedPath)) {
  await mkdir(generatedPath)
}

await writeFile(
  join(generatedPath, "router.ts"),
  `export default ${JSON.stringify(routerPath, null, 2)}`
)

console.log(`
    Generated file: packages/router/generated/router.ts
    Define menu here: packages/router/src/index.ts
`)
