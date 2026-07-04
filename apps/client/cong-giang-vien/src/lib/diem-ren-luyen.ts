import { StudentTrainingType, TrainingScoreStatus } from "@workspace/db/client"

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

type NguonDiemRenLuyenNamHoc = {
  studentYearResult?: Array<{
    conductScore?: number | null
    studentTrainingType?: StudentTrainingType | null
  }> | null
  schoolYearTrainingScore?: Array<{
    score?: number | null
    description?: string | null
    status?: string | null
  }> | null
  semesterTrainingScore?: Array<{
    score?: number | null
    description?: string | null
    status?: string | null
  }> | null
}

export const layDiemRenLuyenSinhVien = (student: NguonDiemRenLuyen) => {
  const diemKy = student.semesterTrainingScore?.[0]
  if (diemKy?.status === TrainingScoreStatus.APPROVED && diemKy.score != null) return diemKy.score

  return null
}

export const layXepLoaiRenLuyen = (student: NguonDiemRenLuyen) => {
  return student.studentSemesterResult?.[0]?.studentTrainingType ?? null
}

export const layGhiChuDiemRenLuyen = (student: NguonDiemRenLuyen) => {
  return student.semesterTrainingScore?.[0]?.description ?? ""
}

export const layDiemRenLuyenNamHoc = (student: NguonDiemRenLuyenNamHoc) => {
  const diemNam = student.schoolYearTrainingScore?.[0]
  if (diemNam?.status === TrainingScoreStatus.APPROVED && diemNam.score != null)
    return diemNam.score

  const diemHk2 = student.semesterTrainingScore?.[0]
  if (diemHk2?.status === TrainingScoreStatus.APPROVED && diemHk2.score != null)
    return diemHk2.score

  return null
}

export const layXepLoaiRenLuyenNamHoc = (student: NguonDiemRenLuyenNamHoc) => {
  return student.studentYearResult?.[0]?.studentTrainingType ?? null
}

export const layGhiChuDiemRenLuyenNamHoc = (student: NguonDiemRenLuyenNamHoc) => {
  return student.schoolYearTrainingScore?.[0]?.description ?? ""
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
