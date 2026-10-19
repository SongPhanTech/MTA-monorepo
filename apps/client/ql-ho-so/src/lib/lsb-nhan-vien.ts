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
  newCurrentAddress?: string | null
  viTriCongViecId?: string | null
  quanLyTrucTiepId?: string | null
  provinceCurrentAddressId?: string | null
  districtCurrentAddressId?: string | null
  communeCurrentAddressId?: string | null
  newProvinceCurrentAddressId?: string | null
  newCommuneCurrentAddressId?: string | null
  bLaHocVien?: boolean | null
  bLaSinhVien?: boolean | null
  bLaCanBoNhanVien?: boolean | null
  bLaGiangVien?: boolean | null
  bLaNguoiDung?: boolean | null
  active?: boolean | null
}

const toBool = (value?: boolean | null) => !!value

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
    sDM_ViTriCongViecId: input.viTriCongViecId || null,
    sQuanlyTrucTiepId: input.quanLyTrucTiepId || null,
    sDM_TinhId: input.provinceCurrentAddressId || null,
    sDM_QuanHuyenId: input.districtCurrentAddressId || null,
    sDM_XaPhuongId: input.communeCurrentAddressId || null,
    sDiaChi: input.currentAddress || undefined,
    sDM_TinhId_New: input.newProvinceCurrentAddressId || null,
    sDM_XaPhuongId_New: input.newCommuneCurrentAddressId || null,
    sDiaChi_New: input.newCurrentAddress || undefined,
    // Gửi true/false rõ ràng để bỏ tick cũng đồng bộ về LSB.
    bLaHocVien: toBool(input.bLaHocVien),
    bLaSinhVien: toBool(input.bLaSinhVien),
    bLaCanBoNhanVien: toBool(input.bLaCanBoNhanVien),
    bLaGiangVien: toBool(input.bLaGiangVien),
    // LSB dùng bLaTaiKhoan tương ứng checkbox bLaNguoiDung trên hồ sơ.
    bLaTaiKhoan: toBool(input.bLaNguoiDung),
    bActive: input.active ?? true,
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
