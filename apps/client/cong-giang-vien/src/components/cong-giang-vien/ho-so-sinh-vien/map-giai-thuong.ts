import type { GiaiThuongSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { ArchivedCertificateStatus } from "@workspace/db/client"
import dayjs from "dayjs"

type ArchivedAwardRow = {
  id: string
  code?: string | null
  bonusScore: number
  date?: Date | string | null
  status: ArchivedCertificateStatus
  description?: string | null
  award?: { name?: string | null } | null
}

const dinhDangNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : ""

const layNamHocTuNgay = (value?: Date | string | null) => {
  if (!value) return ""
  const nam = dayjs(value).year()
  return `${nam - 1}-${nam}`
}

const layNhanTrangThai = (status: ArchivedCertificateStatus) => {
  switch (status) {
    case ArchivedCertificateStatus.APPROVED:
      return { label: "Đã duyệt", color: "green" }
    case ArchivedCertificateStatus.PENDING:
      return { label: "Chờ duyệt", color: "blue" }
    case ArchivedCertificateStatus.REJECTED:
      return { label: "Từ chối", color: "red" }
    case ArchivedCertificateStatus.CANCEL:
      return { label: "Hủy bỏ", color: "default" }
    default:
      return { label: status, color: "default" }
  }
}

export const mapGiaiThuong = (archivedAward: ArchivedAwardRow[] = []): GiaiThuongSinhVien[] =>
  archivedAward
    .map((item) => ({
      id: item.id,
      ngay: dinhDangNgay(item.date ?? null),
      namHoc: layNamHocTuNgay(item.date),
      tenGiaiThuong: item.award?.name ?? "—",
      thanhTich: item.description?.trim() || item.award?.name || "—",
      donViTrao: "Học viện Kỹ thuật Quân sự",
      soQuyetDinh: item.code ?? "—",
      diemThuong: item.bonusScore,
      trangThai: layNhanTrangThai(item.status),
      moTa: item.description ?? "",
    }))
    .sort((a, b) => {
      const da = a.ngay ? dayjs(a.ngay, "DD/MM/YYYY").valueOf() : 0
      const db = b.ngay ? dayjs(b.ngay, "DD/MM/YYYY").valueOf() : 0
      return db - da
    })
