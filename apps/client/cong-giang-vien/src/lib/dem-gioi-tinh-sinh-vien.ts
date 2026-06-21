type GioiTinh =
  | {
      sMa?: string | null
      sTen?: string | null
    }
  | null
  | undefined

type SinhVienCoGioiTinh = {
  userProfile?: {
    gender?: GioiTinh
  } | null
}

const laNam = (gender: GioiTinh) => {
  if (!gender) return false
  const ma = (gender.sMa ?? "").toUpperCase()
  const ten = (gender.sTen ?? "").toLowerCase()
  return ma === "MALE" || ma === "1" || ten === "nam" || ten.includes("nam")
}

const laNu = (gender: GioiTinh) => {
  if (!gender) return false
  const ma = (gender.sMa ?? "").toUpperCase()
  const ten = (gender.sTen ?? "").toLowerCase()
  return (
    ma === "FEMALE" ||
    ma === "2" ||
    ten === "nữ" ||
    ten === "nu" ||
    ten.includes("nữ") ||
    ten.includes("nu")
  )
}

export const demGioiTinhSinhVien = (students: SinhVienCoGioiTinh[]) => {
  let siSoNam = 0
  let siSoNu = 0

  for (const student of students) {
    const gender = student.userProfile?.gender
    if (laNam(gender)) siSoNam += 1
    else if (laNu(gender)) siSoNu += 1
  }

  return {
    siSoNam,
    siSoNu,
    siSoTong: students.length,
  }
}
