import { prisma } from ".."

/** Resolve Expert.id → currentVersionId. Throws if any id thiếu current version. */
export async function resolveCurrentVersionIds(
  expertIds: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(expertIds.filter((id): id is string => !!id))]
  const map = new Map<string, string>()
  if (!uniqueIds.length) return map

  const experts = await prisma.expert.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, currentVersionId: true },
  })

  for (const expert of experts) {
    if (!expert.currentVersionId) {
      throw new Error(`Chuyên gia ${expert.id} chưa có phiên bản hồ sơ hiện tại.`)
    }
    map.set(expert.id, expert.currentVersionId)
  }

  for (const id of uniqueIds) {
    if (!map.has(id)) {
      throw new Error(`Không tìm thấy chuyên gia ${id}.`)
    }
  }

  return map
}

export const expertVersionInclude = {
  academicRankType: true,
  academicDegreeType: true,
  expert: {
    include: {
      lecturer: {
        include: {
          userProfile: {
            include: {
              donVi: true,
              academicRankType: true,
              academicDegreeType: true,
            },
          },
        },
      },
    },
  },
} as const
