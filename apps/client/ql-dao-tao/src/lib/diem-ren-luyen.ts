import { StudentTrainingType } from "@workspace/db/client"

export const NGUONG_DAT_DIEM_REN_LUYEN = 50

type NguonDiemRenLuyen = {
  studentSemesterResult?: Array<{
    conductScore?: number | null
    studentTrainingType?: StudentTrainingType | null
  }> | null
  semesterTrainingScore?: Array<{
    score?: number | null
    description?: string | null
    status?: string | null
  }> | null
}

export const layDiemRenLuyenSinhVien = (student: NguonDiemRenLuyen) => {
  const ketQuaKy = student.studentSemesterResult?.[0]
  if (ketQuaKy?.conductScore != null) return ketQuaKy.conductScore

  const diemKy = student.semesterTrainingScore?.[0]
  if (diemKy?.score != null) return diemKy.score

  return null
}

export const layXepLoaiRenLuyen = (student: NguonDiemRenLuyen) => {
  return student.studentSemesterResult?.[0]?.studentTrainingType ?? null
}

export const layGhiChuDiemRenLuyen = (student: NguonDiemRenLuyen) => {
  return student.semesterTrainingScore?.[0]?.description ?? ""
}

export const laDatDiemRenLuyen = (
  diem: number | null | undefined,
  xepLoai?: StudentTrainingType | null
) => {
  if (xepLoai === StudentTrainingType.POOR || xepLoai === StudentTrainingType.VERY_POOR) {
    return false
  }
  if (diem == null) return false
  return diem >= NGUONG_DAT_DIEM_REN_LUYEN
}
