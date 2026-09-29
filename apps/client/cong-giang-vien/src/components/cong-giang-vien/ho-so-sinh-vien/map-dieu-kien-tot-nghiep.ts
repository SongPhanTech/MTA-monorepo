import type {
  ChungChiDaDuyet,
  DieuKienTotNghiep,
  DieuKienTotNghiepItem,
} from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import dayjs from "dayjs"

export type LoaiDieuKienTotNghiep = "ngoaiNgu" | "tinHoc" | "giaoDucQuocPhong" | "renLuyenSucKhoe"

const PHAN_LOAI_THEO_TEN: Record<LoaiDieuKienTotNghiep, RegExp[]> = {
  ngoaiNgu: [
    /ngoại ngữ/i,
    /tiếng anh/i,
    /tiếng nga/i,
    /tiếng pháp/i,
    /tiếng trung/i,
    /ielts/i,
    /toeic/i,
    /toefl/i,
    /foreign/i,
    /language/i,
  ],
  tinHoc: [/tin học/i, /cntt/i, /\bmos\b/i, /công nghệ thông tin/i, /tin học ứng dụng/i],
  giaoDucQuocPhong: [/quốc phòng/i, /an ninh/i, /\bgdqp\b/i, /quân sự/i, /giáo dục quốc phòng/i],
  renLuyenSucKhoe: [/sức khỏe/i, /rèn luyện sức khỏe/i, /thể dục/i, /thể chất/i, /thể thao/i],
}

type ChuanDauRaCt = {
  outputStandard: {
    name: string
    certificates: { id: string; name: string }[]
  }
}

type MonHocRow = {
  finalScore?: number | null | { toNumber?: () => number }
  manualFinalScore?: number | null | { toNumber?: () => number }
  subjectClass?: {
    subject?: { 
      name?: string | null; 
      code?: string | null;
      trainingBlocks?: {
        trainingBlockOnCurriculumVersion?: {
          trainingBlock?: {
            isNationalDefense?: boolean | null
          } | null
        } | null
      }[] | null
    } | null
    semester?: {
      name?: string | null
      schoolYear?: { name?: string | null } | null
    } | null
  } | null
}

export type ArchivedCertificateInput = {
  id: string
  certificateId: string
  status: string
  score?: number | null | { toNumber?: () => number }
  finalScore?: number | null | { toNumber?: () => number }
  issuedDate?: Date | string | null
  issuedBy?: string | null
  certificate?: {
    id?: string
    name?: string | null
    outputStandard?: { id?: string; name?: string | null } | null
  } | null
}

export type MapDieuKienTotNghiepInput = {
  foreignLangPass: boolean
  ITCertificationPass: boolean
  militaryTrainingPass: boolean
  strengthTrainingPass: boolean
  archivedCertificate?: ArchivedCertificateInput[] | null
  outputStandardOnCurriculum?: ChuanDauRaCt[] | null
  subjectClassStudent?: MonHocRow[] | null
}

const chuyenThanhSo = (value?: number | null | { toNumber?: () => number }) => {
  if (value == null) return null
  if (typeof value === "object" && typeof value.toNumber === "function") return value.toNumber()
  return Number(value)
}

const dinhDangNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : ""

const dinhDangDiem = (score?: number | null | { toNumber?: () => number }) => {
  const giaTri = chuyenThanhSo(score)
  if (giaTri == null) return "Đạt"
  return giaTri.toFixed(2).replace(".", ",")
}

const phanLoaiTheoTen = (ten: string): LoaiDieuKienTotNghiep | null => {
  const chuoi = ten.trim()
  if (!chuoi) return null
  for (const loai of Object.keys(PHAN_LOAI_THEO_TEN) as LoaiDieuKienTotNghiep[]) {
    if (PHAN_LOAI_THEO_TEN[loai].some((mau) => mau.test(chuoi))) return loai
  }
  return null
}

const mapChungChiDaDuyet = (items?: ArchivedCertificateInput[] | null): ChungChiDaDuyet[] =>
  (items ?? [])
    .filter((item) => item.status === "APPROVED")
    .map((item) => ({
      id: item.id,
      certificateId: item.certificateId,
      tenChungChi: item.certificate?.name ?? "",
      trinhDoYeuCau: item.certificate?.outputStandard?.name ?? "",
      ketQua: dinhDangDiem(item.score ?? item.finalScore),
      ngayCap: dinhDangNgay(item.issuedDate),
      donViCap: item.issuedBy ?? "",
    }))

const layTrinhDoYeuCauCt = (chuanDauRa: ChuanDauRaCt[], loai: LoaiDieuKienTotNghiep) =>
  chuanDauRa
    .filter((item) => phanLoaiTheoTen(item.outputStandard.name) === loai)
    .map((item) => item.outputStandard.name)
    .join(", ")

const layCertificateIdsTheoLoai = (chuanDauRa: ChuanDauRaCt[], loai: LoaiDieuKienTotNghiep) =>
  new Set(
    chuanDauRa
      .filter((item) => phanLoaiTheoTen(item.outputStandard.name) === loai)
      .flatMap((item) => item.outputStandard.certificates.map((cert) => cert.id))
  )

const timChungChiTheoLoai = (
  chungChi: ChungChiDaDuyet[],
  loai: LoaiDieuKienTotNghiep,
  certificateIds: Set<string>
) =>
  chungChi.find((item) => {
    if (certificateIds.has(item.certificateId)) return true
    return (
      phanLoaiTheoTen(item.trinhDoYeuCau) === loai || phanLoaiTheoTen(item.tenChungChi) === loai
    )
  }) ?? null

const timMonHocTheoLoai = (monHoc: MonHocRow[], loai: LoaiDieuKienTotNghiep) =>
  monHoc.filter((item) => {
    // Ưu tiên check flag isNationalDefense từ database trước
    if (loai === "giaoDucQuocPhong") {
      const isGDQPFlag = item.subjectClass?.subject?.trainingBlocks?.some(
        (tbs) => tbs.trainingBlockOnCurriculumVersion?.trainingBlock?.isNationalDefense
      )
      if (isGDQPFlag) return true
    }

    const tenMon = item.subjectClass?.subject?.name ?? ""
    return phanLoaiTheoTen(tenMon) === loai
  })

const mapChiTietMonHoc = (monHoc: MonHocRow[]) => {
  const mon = monHoc[0]
  if (!mon) return null

  const diem = chuyenThanhSo(mon.manualFinalScore) ?? chuyenThanhSo(mon.finalScore)
  const tenMon = mon.subjectClass?.subject?.name ?? ""
  const namHoc =
    mon.subjectClass?.semester?.schoolYear?.name ?? mon.subjectClass?.semester?.name ?? ""

  return {
    tenMon,
    ketQua: diem != null ? (diem >= 5 ? "Đạt" : dinhDangDiem(diem)) : "—",
    namHoc,
    ghiChu: diem != null && diem >= 5 ? "Hoàn thành đầy đủ khóa học" : undefined,
    diem: diem ?? undefined,
  }
}

const CO_DAT_MON: Record<LoaiDieuKienTotNghiep, boolean> = {
  ngoaiNgu: false,
  tinHoc: false,
  giaoDucQuocPhong: true,
  renLuyenSucKhoe: true,
}

const taoDieuKienItem = (
  loai: LoaiDieuKienTotNghiep,
  datCoSan: boolean,
  chungChi: ChungChiDaDuyet[],
  chuanDauRa: ChuanDauRaCt[],
  monHoc: MonHocRow[]
): DieuKienTotNghiepItem => {
  const certificateIds = layCertificateIdsTheoLoai(chuanDauRa, loai)
  const chungChiDat = timChungChiTheoLoai(chungChi, loai, certificateIds)
  const monHocLoai = timMonHocTheoLoai(monHoc, loai)
  const chiTietMonHocRaw = CO_DAT_MON[loai] ? mapChiTietMonHoc(monHocLoai) : null
  const chiTietMonHoc = chiTietMonHocRaw
    ? {
        tenMon: chiTietMonHocRaw.tenMon,
        ketQua: chiTietMonHocRaw.ketQua,
        diem:
          chiTietMonHocRaw.diem != null
            ? chiTietMonHocRaw.diem.toFixed(1).replace(".", ",")
            : undefined,
        namHoc: chiTietMonHocRaw.namHoc,
        ghiChu: chiTietMonHocRaw.ghiChu,
      }
    : null

  const datTuChungChi = !!chungChiDat
  const datTuMon = !!chiTietMonHocRaw?.diem && chiTietMonHocRaw.diem >= 5
  const dat = datCoSan || datTuChungChi || datTuMon

  const uuTienMonHoc = CO_DAT_MON[loai] && !!chiTietMonHoc

  return {
    dat,
    trinhDoYeuCau: layTrinhDoYeuCauCt(chuanDauRa, loai) || undefined,
    chungChi: uuTienMonHoc ? null : chungChiDat,
    chiTietMonHoc,
  }
}

const mapDieuKienTotNghiep = (input: MapDieuKienTotNghiepInput): DieuKienTotNghiep => {
  const chuanDauRa = input.outputStandardOnCurriculum ?? []
  const chungChi = mapChungChiDaDuyet(input.archivedCertificate)
  const monHoc = input.subjectClassStudent ?? []

  const ngoaiNgu = taoDieuKienItem("ngoaiNgu", input.foreignLangPass, chungChi, chuanDauRa, monHoc)
  const tinHoc = taoDieuKienItem("tinHoc", input.ITCertificationPass, chungChi, chuanDauRa, monHoc)
  const giaoDucQuocPhong = taoDieuKienItem(
    "giaoDucQuocPhong",
    input.militaryTrainingPass,
    chungChi,
    chuanDauRa,
    monHoc
  )
  const renLuyenSucKhoe = taoDieuKienItem(
    "renLuyenSucKhoe",
    input.strengthTrainingPass,
    chungChi,
    chuanDauRa,
    monHoc
  )

  return {
    ngoaiNgu,
    tinHoc,
    giaoDucQuocPhong,
    renLuyenSucKhoe,
    duDieuKienDayDu: ngoaiNgu.dat && tinHoc.dat && giaoDucQuocPhong.dat && renLuyenSucKhoe.dat,
  }
}

export { mapDieuKienTotNghiep, phanLoaiTheoTen }
