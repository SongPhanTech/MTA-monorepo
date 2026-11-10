import { prisma } from ".."

export type ResolvedOrg = {
  bo_mon_code: string | null
  bo_mon_name: string
  department_code: string | null
  department_name: string
}

type DonViRow = {
  Id: string
  sMa: string | null
  sTen: string | null
  sParentId: string | null
  iCapDonVi: number | null
  iLoaiDonVi: number | null
}

function isBoMon(org: DonViRow): boolean {
  // iLoaiDonVi 7 = Bộ môn; iCapDonVi 3 = cấp Bộ môn / Phòng TN / Đại đội (schema comment)
  return org.iLoaiDonVi === 7 || org.iCapDonVi === 3
}

/** Resolve bộ môn + đơn vị (khoa/viện) từ DM_DonVi gắn UserProfile. */
export async function resolveBoMonAndDepartment(
  donViId: string | null | undefined
): Promise<ResolvedOrg> {
  const empty: ResolvedOrg = {
    bo_mon_code: null,
    bo_mon_name: "",
    department_code: null,
    department_name: "",
  }
  if (!donViId) return empty

  const org = await prisma.dM_DonVi.findUnique({
    where: { Id: donViId },
    select: {
      Id: true,
      sMa: true,
      sTen: true,
      sParentId: true,
      iCapDonVi: true,
      iLoaiDonVi: true,
    },
  })
  if (!org) return empty

  if (isBoMon(org)) {
    const parent = org.sParentId
      ? await prisma.dM_DonVi.findUnique({
          where: { Id: org.sParentId },
          select: { sMa: true, sTen: true },
        })
      : null
    return {
      bo_mon_code: org.sMa ?? null,
      bo_mon_name: org.sTen ?? "",
      department_code: parent?.sMa ?? null,
      department_name: parent?.sTen ?? "",
    }
  }

  return {
    bo_mon_code: null,
    bo_mon_name: "",
    department_code: org.sMa ?? null,
    department_name: org.sTen ?? "",
  }
}

export async function resolveBoMonAndDepartmentBatch(
  donViIds: string[]
): Promise<Map<string, ResolvedOrg>> {
  const unique = [...new Set(donViIds.filter(Boolean))]
  const map = new Map<string, ResolvedOrg>()
  if (!unique.length) return map

  const orgs = await prisma.dM_DonVi.findMany({
    where: { Id: { in: unique } },
    select: {
      Id: true,
      sMa: true,
      sTen: true,
      sParentId: true,
      iCapDonVi: true,
      iLoaiDonVi: true,
    },
  })
  const byId = new Map(orgs.map((o) => [o.Id, o]))
  const parentIds = [
    ...new Set(orgs.filter((o) => isBoMon(o) && o.sParentId).map((o) => o.sParentId!)),
  ]
  const parents = parentIds.length
    ? await prisma.dM_DonVi.findMany({
        where: { Id: { in: parentIds } },
        select: { Id: true, sMa: true, sTen: true },
      })
    : []
  const parentById = new Map(parents.map((p) => [p.Id, p]))

  for (const id of unique) {
    const org = byId.get(id)
    if (!org) {
      map.set(id, {
        bo_mon_code: null,
        bo_mon_name: "",
        department_code: null,
        department_name: "",
      })
      continue
    }
    if (isBoMon(org)) {
      const parent = org.sParentId ? parentById.get(org.sParentId) : undefined
      map.set(id, {
        bo_mon_code: org.sMa ?? null,
        bo_mon_name: org.sTen ?? "",
        department_code: parent?.sMa ?? null,
        department_name: parent?.sTen ?? "",
      })
    } else {
      map.set(id, {
        bo_mon_code: null,
        bo_mon_name: "",
        department_code: org.sMa ?? null,
        department_name: org.sTen ?? "",
      })
    }
  }
  return map
}
