/** Đơn vị quản lý giảng viên: chỉ UserProfile.sDM_DonViId → DM_DonVi. */

export type LecturerDonViSource = {
  userProfile?: {
    sDM_DonViId?: string | null
    donVi?: {
      Id?: string
      sMa?: string | null
      sTen?: string | null
      sCode?: string | null
      sParentId?: string | null
      iCapDonVi?: number | null
      iLoaiDonVi?: number | null
    } | null
  } | null
}

export function lecturerDonViId(lecturer?: LecturerDonViSource | null): string | undefined {
  return lecturer?.userProfile?.sDM_DonViId ?? undefined
}

export function lecturerDonVi(
  lecturer?: LecturerDonViSource | null
): { Id?: string; sMa?: string | null; sTen?: string | null } | null | undefined {
  return lecturer?.userProfile?.donVi
}

export function lecturerDonViLabel(
  lecturer: LecturerDonViSource | null | undefined,
  orgs:
    | Map<string, { sMa?: string | null; sTen?: string | null }>
    | Array<{ Id: string; sMa?: string | null; sTen?: string | null }>
): string {
  const fromRelation = lecturerDonVi(lecturer)
  if (fromRelation?.sTen || fromRelation?.sMa) {
    return [fromRelation.sMa, fromRelation.sTen].filter(Boolean).join("-")
  }
  const id = lecturerDonViId(lecturer)
  if (!id) return ""
  const org = Array.isArray(orgs) ? orgs.find((item) => item.Id === id) : orgs.get(id)
  if (!org) return ""
  return [org.sMa, org.sTen].filter(Boolean).join("-")
}
