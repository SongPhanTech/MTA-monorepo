import { mkdirSync, rmSync, writeFileSync } from "node:fs"

for (const dir of ["generated/zod", "generated/hooks"]) {
  rmSync(dir, { recursive: true, force: true })
}

mkdirSync("generated/zod", { recursive: true })
writeFileSync("generated/zod/index.ts", "export {}\n")
