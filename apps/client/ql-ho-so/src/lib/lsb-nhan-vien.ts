type LsbNhanVienInput = {
  id?: string
  donViId?: string | null
  code?: string | null
  lastName?: string | null
  firstName?: string | null
  genderId?: string | null
  dateOfBirth?: string | null
  idCardNumber?: string | null
  phoneNumber?: string | null
  email?: string | null
  avatar?: string | null
  officerNumber?: string | null
  nationalityId?: string | null
  currentAddress?: string | null
  bLaHocVien?: boolean | null
  bLaCanBoNhanVien?: boolean | null
  bLaGiangVien?: boolean | null
}

export function buildLsbNhanVienPayload(input: LsbNhanVienInput) {
  const lastName = input.lastName?.trim() || ""
  const firstName = input.firstName?.trim() || ""
  return {
    ...(input.id ? { Id: input.id } : {}),
    sDM_DonViId: input.donViId || null,
    sMa: input.code?.trim() || undefined,
    sHoVaDem: lastName || undefined,
    sTen: firstName || undefined,
    sTenDayDu: `${lastName} ${firstName}`.trim() || undefined,
    sDM_GioiTinhId: input.genderId || null,
    dNgaySinh: input.dateOfBirth || null,
    sCCCD: input.idCardNumber || undefined,
    sSDTDiDong: input.phoneNumber?.trim() || "",
    sEmail: input.email?.trim() || undefined,
    sAvatarId: input.avatar || undefined,
    sSoHieuSQ: input.officerNumber || undefined,
    sDM_QuocGiaId: input.nationalityId || null,
    sDiaChi: input.currentAddress || undefined,
    bLaHocVien: input.bLaHocVien || undefined,
    bLaCanBoNhanVien: input.bLaCanBoNhanVien || undefined,
    bLaGiangVien: input.bLaGiangVien || undefined,
  }
}

export function getLsbErrorMessage(res: { status?: number; data?: unknown }, fallback: string) {
  const data = res?.data
  if (typeof data === "string" && data.trim()) return data
  if (data && typeof data === "object") {
    const obj = data as {
      message?: string
      title?: string
      extra?: { message?: string }
    }
    return obj.extra?.message || obj.message || obj.title || fallback
  }
  return fallback
}
