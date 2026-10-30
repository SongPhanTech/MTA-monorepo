import type { PrismaClient } from "@workspace/db"

function readCode(code: unknown): string | undefined {
  if (typeof code === "string") return code
  if (code && typeof code === "object" && "set" in code) {
    const set = (code as { set?: unknown }).set
    if (typeof set === "string") return set
  }
  return undefined
}

/** Unique `code` vẫn giữ bản ghi đã xoá mềm. Đổi mã đó trước khi ghi mã mới. */
export async function releaseSoftDeletedSurveyObjectCode(prisma: PrismaClient, code: unknown) {
  const value = readCode(code)
  if (value === undefined) return

  const deleted = await prisma.surveyObjectType.findFirst({
    where: { code: value, deletedAt: { not: null } },
    select: { id: true },
  })
  if (!deleted) return

  await prisma.surveyObjectType.update({
    where: { id: deleted.id },
    data: { code: `${deleted.id}-deleted` },
  })
}
