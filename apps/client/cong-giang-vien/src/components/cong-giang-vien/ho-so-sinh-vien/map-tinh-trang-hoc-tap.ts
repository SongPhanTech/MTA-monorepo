import type {
  HocBongSinhVien,
  SuKienCanhBaoKyLuat,
  TinhTrangHocTapSinhVien,
} from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { AcademicActionType, DecisionStatus } from "@workspace/db/client"
import dayjs from "dayjs"

type ScholarshipAwardRow = {
  id: string
  amount: unknown
  gpaAtAward: number
  createdAt: Date | string
  scholarship?: { name?: string | null } | null
  semester?: {
    name?: string | null
    schoolYear?: { name?: string | null } | null
  } | null
}

type AcademicWarningRow = {
  id: string
  level: number
  increasedFrom?: number | null
  decreasedFrom?: number | null
  createdAt: Date | string
  semester?: { name?: string | null } | null
}

type DisciplinaryWarningRow = {
  id: string
  level: number
  createdAt: Date | string
  semester?: { name?: string | null } | null
  reasonDetails?: { name: string }[]
}

type AcademicDecisionRow = {
  id: string
  actionTaken: AcademicActionType
  status: DecisionStatus
  reason?: string | null
  decisionDate: Date | string
  createdAt: Date | string
  semester?: { name?: string | null } | null
  appliedConfig?: { name?: string | null; actionType?: AcademicActionType | null } | null
}

export type MapTinhTrangHocTapInput = {
  scholarshipAwards?: ScholarshipAwardRow[] | null
  academicWarning?: AcademicWarningRow[] | null
  disciplinaryWarning?: DisciplinaryWarningRow[] | null
  studentAcademicDecision?: AcademicDecisionRow[] | null
}

const dinhDangNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : ""

const dinhDangTien = (amount: unknown) => {
  const value = amount != null ? Number(amount) : NaN
  if (Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
}

const layNhanHanhDongHocVu = (action: AcademicActionType) => {
  switch (action) {
    case AcademicActionType.REPEAT_YEAR:
      return "Lưu ban"
    case AcademicActionType.SUSPENSION:
      return "Đình chỉ học tập"
    case AcademicActionType.EXPULSION:
      return "Buộc thôi học"
    default:
      return "Xử lý học vụ"
  }
}

const dinhDangGpa = (gpaAtAward: number) =>
  gpaAtAward != null && !Number.isNaN(Number(gpaAtAward))
    ? Number(gpaAtAward).toFixed(2)
    : "—"

const mapHocBong = (awards: ScholarshipAwardRow[]): HocBongSinhVien[] =>
  awards.map((item) => ({
    id: item.id,
    namHoc: item.semester?.schoolYear?.name ?? "—",
    hocKy: item.semester?.name ?? "—",
    loaiHocBong: item.scholarship?.name ?? "—",
    gpaTaiThoiDiem: dinhDangGpa(item.gpaAtAward),
    giaTri: dinhDangTien(item.amount),
    trangThai: { label: "Đã cấp", color: "green" },
    ngayQuyetDinh: dinhDangNgay(item.createdAt),
  }))

const moTaCanhBaoHocTap = (item: AcademicWarningRow) => {
  const hocKy = item.semester?.name ? `Học kỳ ${item.semester.name}` : ""
  if (item.decreasedFrom != null) {
    const tuMuc = item.decreasedFrom
    const denMuc = item.level
    return [hocKy, `Giảm từ mức ${tuMuc} xuống mức ${denMuc}`].filter(Boolean).join(" — ")
  }
  if (item.increasedFrom != null) {
    return [hocKy, `Tăng từ mức ${item.increasedFrom} lên mức ${item.level}`]
      .filter(Boolean)
      .join(" — ")
  }
  return [hocKy, `Mức cảnh báo hiện tại: ${item.level}`].filter(Boolean).join(" — ")
}

const mapLichSuCanhBaoKyLuat = (
  academicWarning: AcademicWarningRow[],
  disciplinaryWarning: DisciplinaryWarningRow[],
  studentAcademicDecision: AcademicDecisionRow[]
): SuKienCanhBaoKyLuat[] => {
  const suKien: SuKienCanhBaoKyLuat[] = []

  for (const item of academicWarning) {
    if (item.decreasedFrom != null) {
      suKien.push({
        id: `aw-resolved-${item.id}`,
        ngay: dinhDangNgay(item.createdAt),
        tieuDe: "Đã khắc phục cảnh báo",
        lyDo: moTaCanhBaoHocTap(item),
        trangThai: { label: "Đã khắc phục", color: "green" },
      })
    } else if (item.level > 0) {
      suKien.push({
        id: `aw-${item.id}`,
        ngay: dinhDangNgay(item.createdAt),
        tieuDe: `Cảnh báo học tập mức ${item.level}`,
        lyDo: moTaCanhBaoHocTap(item),
        trangThai: { label: "Cảnh báo", color: "yellow" },
      })
    }
  }

  for (const item of disciplinaryWarning) {
    if (item.level <= 0) continue
    const lyDo = [
      item.semester?.name ? `Học kỳ ${item.semester.name}` : "",
      item.reasonDetails?.map((r) => r.name).join(", "),
    ]
      .filter(Boolean)
      .join(" — ")

    suKien.push({
      id: `dw-${item.id}`,
      ngay: dinhDangNgay(item.createdAt),
      tieuDe: "Cảnh cáo học đường",
      lyDo: lyDo || `Mức cảnh cáo: ${item.level}`,
      trangThai: { label: "Cảnh cáo", color: "orange" },
    })
  }

  for (const item of studentAcademicDecision) {
    const hanhDong = item.appliedConfig?.name ?? layNhanHanhDongHocVu(item.actionTaken)
    const hocKy = item.semester?.name ? `Học kỳ ${item.semester.name}` : ""

    if (item.status === DecisionStatus.PENDING || item.status === DecisionStatus.APPEALED) {
      suKien.push({
        id: `dec-pending-${item.id}`,
        ngay: dinhDangNgay(item.decisionDate ?? item.createdAt),
        tieuDe: "Đang trong thời gian xem xét mức xử lý",
        lyDo:
          item.reason ??
          [hocKy, `Hội đồng kỷ luật đang xem xét hồ sơ: ${hanhDong}`].filter(Boolean).join(" — "),
        trangThai: { label: "Đang xử lý", color: "gray" },
      })
      continue
    }

    if (item.status === DecisionStatus.APPROVED) {
      suKien.push({
        id: `dec-${item.id}`,
        ngay: dinhDangNgay(item.decisionDate ?? item.createdAt),
        tieuDe: hanhDong,
        lyDo: item.reason ?? [hocKy, `Quyết định: ${hanhDong}`].filter(Boolean).join(" — "),
        trangThai: { label: "Đã xử lý", color: "green" },
      })
    }
  }

  return suKien.sort((a, b) => {
    const da = a.ngay ? dayjs(a.ngay, "DD/MM/YYYY").valueOf() : 0
    const db = b.ngay ? dayjs(b.ngay, "DD/MM/YYYY").valueOf() : 0
    return db - da
  })
}

const layCapNhatCuoi = (
  hocBong: HocBongSinhVien[],
  lichSu: SuKienCanhBaoKyLuat[]
): string | undefined => {
  const ngay = [...hocBong.map((h) => h.ngayQuyetDinh), ...lichSu.map((s) => s.ngay)]
    .filter(Boolean)
    .sort((a, b) => dayjs(b, "DD/MM/YYYY").valueOf() - dayjs(a, "DD/MM/YYYY").valueOf())[0]
  return ngay || undefined
}

export const mapTinhTrangHocTap = (input: MapTinhTrangHocTapInput): TinhTrangHocTapSinhVien => {
  const hocBong = mapHocBong(input.scholarshipAwards ?? [])
  const lichSuCanhBaoKyLuat = mapLichSuCanhBaoKyLuat(
    input.academicWarning ?? [],
    input.disciplinaryWarning ?? [],
    input.studentAcademicDecision ?? []
  )

  return {
    hocBong,
    lichSuCanhBaoKyLuat,
    capNhatCuoi: layCapNhatCuoi(hocBong, lichSuCanhBaoKyLuat),
  }
}
