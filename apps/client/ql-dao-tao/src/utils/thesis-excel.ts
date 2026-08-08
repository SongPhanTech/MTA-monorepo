import {
  CouncilRole,
  type SupervisorRole,
  ThesisType,
  TrainingObjectTypes,
} from "@workspace/db/client"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import PizZip from "pizzip"
import { excelTemplate } from "@workspace/libs/api/model"
import type { ExcelTemplateBody } from "@workspace/libs/api/schemas"
import { exportFromTemplate, type TableRow } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { dayjs } from "@workspace/ui"
import { toRoman } from "./romans"
import {
  formatDefenseSessionClock,
  getSupervisorName,
} from "../pages/quan-ly-luan-van/dm-luan-van/index"
import {
  exportThesisCouncilPayments,
  exportThesisSupervisorPayments,
  syncThesisCouncilPayments,
  syncThesisSupervisorPayments,
} from "@workspace/libs/api/thesis-payment"
import { docxTemplate } from "./docx-template"
import { renderXlsxTemplate } from "@workspace/libs/api/training"
import { buildSupervisorPaymentRows } from "./thesis-supervisor-payment-export"
interface ExportOptions {
  thesisSessionId?: string
  allStudentsInClasses: any[]
  studentIds?: string[]
  showSpinner: () => void
  hideSpinner: () => void
  message: any // Antd message instance
  inAcademy?: boolean
  signerName?: string
  isChief?: boolean
  signingDate?: Date | string
  moneyAmount?: number
  defaultCouncilPayAmounts?: DefaultCouncilPayAmountRow[]
  defaultSupervisorPayAmounts?: DefaultSupervisorPayAmountRow[]
  recreateAllPayments?: boolean
}

export type DefaultCouncilPayAmountRow = {
  role: CouncilRole
  amount: number | string | { toNumber?: () => number }
  inAcademy: boolean
  description?: string | null
}

export type DefaultSupervisorPayAmountRow = {
  role: SupervisorRole
  amount: number | string | { toNumber?: () => number }
  inAcademy: boolean
  description?: string | null
}

const resolveSigningDate = (signingDate?: Date | string) =>
  signingDate ? dayjs(signingDate) : dayjs()
const formatAmountWithComma = (amount: number) =>
  Number(amount || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 })

export const readDecimalAmount = (value: unknown): number => {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || 0
  if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value) || 0
}

const THESIS_PAY_DESCRIPTION = "THESIS"

export function getCouncilDefaultPayAmount(
  amounts: DefaultCouncilPayAmountRow[] | undefined,
  role: CouncilRole,
  inAcademy: boolean
): number {
  if (!amounts?.length) return 0
  const row =
    amounts.find(
      (x) =>
        x.role === role &&
        x.inAcademy === inAcademy &&
        (x.description === THESIS_PAY_DESCRIPTION || !x.description)
    ) ?? amounts.find((x) => x.role === role && x.inAcademy === inAcademy)
  return row ? readDecimalAmount(row.amount) : 0
}

export function getSupervisorDefaultPayAmount(
  amounts: DefaultSupervisorPayAmountRow[] | undefined,
  role: SupervisorRole,
  inAcademy: boolean
): number {
  if (!amounts?.length) return 0
  const row =
    amounts.find(
      (x) =>
        x.role === role &&
        x.inAcademy === inAcademy &&
        (x.description === THESIS_PAY_DESCRIPTION || !x.description)
    ) ?? amounts.find((x) => x.role === role && x.inAcademy === inAcademy)
  return row ? readDecimalAmount(row.amount) : 0
}

export function resolveCouncilPayAmountsForProject(
  project:
    | { thesisSession?: { configPayment?: { councilPayAmounts?: DefaultCouncilPayAmountRow[] } } }
    | null
    | undefined,
  fallback: DefaultCouncilPayAmountRow[] = []
): DefaultCouncilPayAmountRow[] {
  const embedded = project?.thesisSession?.configPayment?.councilPayAmounts
  if (embedded?.length) return embedded
  return fallback
}

export function resolveSupervisorPayAmountsForProject(
  project:
    | {
        thesisSession?: {
          configPayment?: { supervisorPayAmounts?: DefaultSupervisorPayAmountRow[] }
        }
      }
    | null
    | undefined,
  fallback: DefaultSupervisorPayAmountRow[] = []
): DefaultSupervisorPayAmountRow[] {
  const embedded = project?.thesisSession?.configPayment?.supervisorPayAmounts
  if (embedded?.length) return embedded
  return fallback
}

export function resolveCouncilMemberPayAmount(
  member: { role: CouncilRole; payment?: { amount?: unknown } | null },
  expert: { lecturerId?: string | null; lecturer?: unknown } | null | undefined,
  councilDefaults: DefaultCouncilPayAmountRow[]
): number {
  const recorded = readDecimalAmount(member.payment?.amount)
  if (recorded > 0) return recorded
  const inAcademy = !!(expert?.lecturerId || expert?.lecturer)
  return getCouncilDefaultPayAmount(councilDefaults, member.role, inAcademy)
}
/** Phạm vi chuyên gia khi gom dữ liệu giấy mời chấm LV PB (cán bộ trong / ngoài học viện). */
type GmcLvPbExpertScope = "all" | "inAcademy" | "outsideAcademy"

/** Cán bộ trong học viện: có liên kết giảng viên (lecturer / lecturerId). Ngoài HV = không có. */
const isExpertInAcademy = (expert: any) => !!(expert?.lecturer || expert?.lecturerId)

interface GmcLvPbData {
  data: {
    dotXet: string
    ngay: string
    thang: string
    nam: string
    type: string
    tongSoHocVien: number
    text1: string
    text2: string
    nguoiki: string
    tenThanhVien: string
    data: GmcLvPbTable[]
  }
}
interface GmcLvPbTable {
  stt: number
  ngaybaove: string
  giobaove: string
  phongbaove: string
  tenhocvien: string
  chuyennganh: string
  tenchucdanh: string
}
interface TthdbvData {
  data: {
    ngay: string
    thang: string
    nam: string
    khoa: string
    dotXet: string
    nguoiki: string
    chuyenNganh: string
    khoaQuanLi: string
    data: TthdbvTable[]
    tongTienBangSo: string
    tongTienBangChu: string
  }
}
interface TthdbvTable {
  stt: number
  thongTinBaoVe: string
  thongTinHoiDong: string
  thongTinThanhToan: string
  thongTinStk: string
  thongTinNganHang: string
  empty: string
}

interface DsnlvtvData {
  data: {
    khoa: string
    dotxet: string
    data: DsnlvtvTable[]
    tongSo: string
    nguoiki: string
  }
}
interface DsnlvtvTable {
  stt: number
  thongTinBaoVe: string
  thongTinHuongDan: string
  thongTinDeTai: string
  thongTinLuuTru: string
}
interface ThongKeCbThamGiaHdData {
  data: {
    trainingCourse: string
    trainingCourseTitle: string
    chuyenNganh: string
    dotXet: string
    tong: number
    tongChuTich: number
    tongThuky: number
    tongUyVien: number
    tongPhanBien1: number
    tongPhanBien2: number
    tongThanhToan: number
    data: ThongKeCbThamGiaHdTable[]
  }
}
interface ThongKeCbThamGiaHdTable {
  stt: number
  tenThanhVien: string
  donViQuanLi: string
  tongSo: number
  chuTich: number
  thuKi: number
  uyVien: number
  phanBien1: number
  phanBien2: number
  thanhToan: number
  stk: string
  tennganhang: string
}
interface ThanhToanHuongDanTrongHvData {
  data: {
    ngay: string
    thang: string
    nam: string
    khoa: string
    dotXet: string
    khoaQuanLi: string
    soHocVien: string
    tongTienSo: number
    tongTienChu: string
    nguoiki: string
    data: ThanhToanHuongDanTrongHvTable[]
  }
}
interface ThanhToanHuongDanTrongHvTable {
  stt: number
  quyetDinh: string
  thongTinHuongDan: string
  thongTinBaoVe: string
  thongTinKhoa: string
  thongTinThanhToan: string
  thongTinStk: string
  thongTinBank: string
  thongtinKyNhan: string
  tienThanhToan: number
}
interface KqbvlvData {
  data: {
    total: number
    totalXuatSac: number
    totalTyLeXuatSac: number
    totalGioi: number
    totalTyLeGioi: number
    totalKha: number
    totalTyLeKha: number
    totalTB: number
    totalTyLeTB: number
    data: KqbvlvTable[]
  }
}
interface KqbvlvTable {
  stt: number
  chuyenNganh: string
  tongSo: number
  soLuongXuatSac: number
  tyLeXuatSac: number
  soLuongGioi: number
  tyLeGioi: number
  soLuongKha: number
  tyLeKha: number
  soLuongTB: number
  tyLeTB: number
}
interface banSaoHDDGLV {
  data: {
    text1: string
    text2: string
    nguoiki1: string
    text3: string
    text4: string
    nguoiki2: string
    soQd: string
    ngayTl: string
    thangTl: string
    namTl: string
    khoa: string
    dotXet: string
    loaiLuanVan: string
    councilReport: string
    deTai: string
    nganh: string
    chuyenNganh: string
    tenHocVien: string
    ngaySinh: string
    khoaHoc: string
    nienkhoahoc: string
    gvhd: string
    tenChuTich: string
    toChucChuTich: string
    tenThuKy: string
    toChucThuKy: string
    tenUyVien: string
    toChucUyVien: string
    tenPb1: string
    toChucPb1: string
    tenPb2: string
    toChucPb2: string
    ngay: string
    thang: string
    nam: string
  }
}
interface PhuLucQdhdHead {
  data: {
    khoa: string
    dotXet: string
    soQd: string
    ngayQd: string
  }
}
interface PhuLucQdhdTail {
  data: {
    soHoiDong: string
  }
}
interface PhuLucQdhdData {
  data: {
    sttChuyenNganh: string
    tenChuyenNganh: string
    data: PhuLucQdhdTable[]
  }
}
interface PhuLucQdhdTable {
  sttHoiDong: string
  loaiLuanVan: string
  nganh: string
  tenDeTai: string
  tenHocVien: string
  ngaySinh: string
  khoaHoc: string
  gvhd1: string
  gvhd2: string
  tenChuTich: string
  toChucChuTich: string
  tenThuKy: string
  toChucThuKy: string
  tenUyVien: string
  toChucUyVien: string
  tenPb1: string
  toChucPb1: string
  tenPb2: string
  toChucPb2: string
}
interface PhuLucQdhdTemplateData {
  head: PhuLucQdhdHead
  tail: PhuLucQdhdTail
  data: PhuLucQdhdData[]
}
interface DsChuyenGiaData {
  data: {
    ngay: string
    thang: string
    nam: string
    diaDiem: string
    thoiGian: string
    tongTienSo: string
    soChuyenGia: number
    tongTienChu: string
    nguoiki: string
    data: DsChuyenGiaTable[]
  }
}
interface DsChuyenGiaTable {
  stt: string
  tenChuyenGia: string
  chucVu: string
  donViQuanLi: string
  soTien: string
  stk: string
  ngangHang: string
  kiNhan: string
}
interface HDDanhGiaLuanVanTail {
  tongSoHocVien: number
  ngay: string
  thang: string
  nam: string
}
interface HDDanhGiaLuanVanHead {
  khoa: string
  tenDonViQuanLi: string
}
interface HDDanhGiaLuanVanData {
  tenDonViQuanLi: string
  data: HDDanhGiaLuanVanTable[]
}
interface HDDanhGiaLuanVanTable {
  stt: number
  maHv: string
  ngaySinh: string
  hocVienCanBoHuongDan: string
  deTai: string
  gioBaoVe: string
  ngayBaoVe: string
  diaDiem: string
  tenChuTich: string
  tenThuKy: string
  tenUyVien: string
  tenPb1: string
  tenPb2: string
}
interface HDDanhGiaLuanVanTemplateData {
  head: HDDanhGiaLuanVanHead
  tail: HDDanhGiaLuanVanTail
  data: HDDanhGiaLuanVanData[]
}

const formatDay = (day: number) => day.toString().padStart(2, "0")
const formatMonth = (month: number) => (month === 1 || month === 2 ? `0${month}` : month.toString())

export const formatDocDate = (date?: Date | string | null) => {
  if (!date) return { day: "", month: "", year: "" }
  const d = dayjs(date)

  return {
    day: formatDay(d.date()),
    month: formatMonth(d.month() + 1),
    year: d.year().toString(),
  }
}

export const formatBirthDate = (date?: Date | string | null) => {
  if (!date) return ""
  const d = dayjs(date)

  return `${formatDay(d.date())}/${formatMonth(d.month() + 1)}/${d.year()}`
}

export const exportPhuLucDsLuanVan = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
}: ExportOptions) => {
  showSpinner()
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
    hideSpinner()
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để xuất phụ lục danh sách luận văn")
    return
  }
  try {
    const majorMap = new Map<string, any>()
    let dotxet = ""
    let soQD = ""
    let ngayQD = ""
    project.forEach((student: any) => {
      const thesisProject = student?.thesisRegistrations?.find(
        (reg: any) => reg?.thesisProject?.thesisSession?.id === thesisSessionId
      )?.thesisProject
      if (!thesisProject) return
      dotxet = dotxet || thesisProject?.thesisSession?.name || ""
      soQD = soQD || thesisProject?.thesisSession?.decisionNumber || ""
      ngayQD =
        ngayQD ||
        (thesisProject?.thesisSession?.decisionDate
          ? dayjs(thesisProject.thesisSession.decisionDate).format("DD/MM/YYYY")
          : "")
      const majorName =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
      const specializationName =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
      const groupKey = `${majorName}__${specializationName}`
      if (!majorMap.has(groupKey)) {
        majorMap.set(groupKey, {
          majorName: majorName || "Chưa có ngành",
          specializationName: specializationName || "Chưa có chuyên ngành",
          thesisProject: [],
        })
      }
      const groupData = majorMap.get(groupKey)
      groupData.thesisProject.push({
        studentId: student.id || "",
        hovatenhocvien: student.userProfile?.fullname || "",
        ngaysinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        doituongdaotao:
          tenDoiTuong[
            student?.fixedClass?.trainingCourse?.trainingObjectType
              ?.type as keyof typeof tenDoiTuong
          ]?.shortname || "",
        khoa: student.fixedClass?.trainingCourse?.name || "",
        tendetai: thesisProject.title || "",
        gvhd1: getSupervisorName(thesisProject.supervisor, false, true) || "",
        gvhd2: getSupervisorName(thesisProject.coSupervisor, false, true) || "",
        isThesis: thesisProject.type,
        language: thesisProject.language.trim(),
      })
    })
    const result = Array.from(majorMap.values())
    if (result.length === 0) {
      message.error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
      hideSpinner()
      return
    }
    let count = 1
    const dataRows: TableRow[] = result.flatMap((item: any, index: number) => {
      const orgRow: TableRow = {
        cells: [
          {
            value: `${index + 1} Ngành ${item.majorName} (${item.specializationName}) : ${item.thesisProject.length} học viên`,
            border: true,
            align: "center",
            colSpan: 6,
            bold: true,
            fontSize: 12,
          },
        ],
      }
      const thesisRows: TableRow[] = item.thesisProject.map((thesis: any) => {
        return {
          cells: [
            { value: count++, border: true, align: "center", fontSize: 12 },
            {
              value: `${thesis.hovatenhocvien}\nNS:${thesis.ngaysinh}\n${thesis.doituongdaotao}-${thesis.khoa}`,
              border: true,
              align: "left",
              fontSize: 12,
            },
            { value: `${thesis.tendetai}`, border: true, align: "left", fontSize: 12 },
            {
              value:
                thesis.gvhd1 && thesis.gvhd2
                  ? `1. ${thesis.gvhd1}\n2. ${thesis.gvhd2}`
                  : thesis.gvhd1 || thesis.gvhd2 || "",
              border: true,
              align: "left",
              fontSize: 12,
            },
            { value: `${thesis.isThesis}`, border: true, align: "center", fontSize: 12 },
            {
              value: `${thesis.language.trim().toLowerCase() === "tiếng việt" ? "" : thesis.language}`,
              border: true,
              align: "center",
              fontSize: 12,
            },
          ],
        }
      })
      return [orgRow, ...thesisRows]
    })
    const gapRow: TableRow = {
      cells: [{ value: "", border: false, colSpan: 6 }],
    }
    const totalRow: TableRow = {
      cells: [
        {
          value: `(Tổng số: ${count - 1} học viên)`,
          align: "center",
          colSpan: 6,
          border: false,
          italic: true,
          fontSize: 12,
        },
      ],
    }
    await exportFromTemplate({
      templateUrl: getMinioUrl("mta/luan-van/PhuLucDanhSachLuanVan.xlsx"),
      sheets: [
        {
          sheet: "PhuLucDanhSachLuanVan",
          rows: [...dataRows, gapRow, totalRow],
          tableStartCell: { row: 7, col: 1 },
          data: {
            dotxet: dotxet.trim().toUpperCase() || "",
            soQD: soQD || "",
            ngay: ngayQD.split("/")[0] || "",
            thang: ngayQD.split("/")[1] || "",
            nam: ngayQD.split("/")[2] || "",
          },
        },
      ],
      fileName: "PhuLucDsLuanVan",
    })
    message.success("Xuất file thành công")
  } catch (error) {
    console.error("error", error)
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const getExpertSupervisionStats = (allStudentsInClasses: any[]) => {
  if (!allStudentsInClasses || allStudentsInClasses.length === 0) {
    return []
  }

  const expertStatsMap = new Map<string, any>()

  const updateStats = (expert: any, amount: any, role: "GVHD1" | "GVHD2" | "SINGLE") => {
    if (!expert) return

    const expertId = expert.id
    const paymentAmount = Number(amount?.toString()) || 0

    let stats = expertStatsMap.get(expertId)
    if (!stats) {
      stats = {
        expertId: expertId,
        name: (getSupervisorName(expert, false, false) as string) || "",
        sDonvi: expert?.workplace || expert?.lecturer?.organization?.sTen || "",
        stk: expert?.bankAccountNumber || expert?.lecturer?.userProfile?.bankAccountNumber || "",
        tennganhang: expert?.bankName || expert?.lecturer?.userProfile?.bankName || "",
        GVHD1Student: 0,
        GVHD2Student: 0,
        singleStudent: 0,
        totalPayment: 0,
      }
      expertStatsMap.set(expertId, stats)
    }

    stats.totalPayment += paymentAmount

    if (role === "GVHD1") {
      stats.GVHD1Student += 1
    } else if (role === "GVHD2") {
      stats.GVHD2Student += 1
    } else {
      stats.singleStudent += 1
    }
  }
  for (const student of allStudentsInClasses) {
    for (const registration of student.thesisRegistrations) {
      const project = registration.thesisProject
      if (!project) continue

      const hasSupervisor = !!project.supervisor
      const hasCoSupervisor = !!project.coSupervisor

      if (hasSupervisor && hasCoSupervisor) {
        updateStats(project.supervisor, project.supervisorPayment?.amount, "GVHD1")
        updateStats(project.coSupervisor, project.coSupervisorPayment?.amount, "GVHD2")
      } else if (hasSupervisor || hasCoSupervisor) {
        const singleExpert = project.supervisor || project.coSupervisor
        const singleAmount =
          project.singleSupervisorPayment?.amount ||
          project.supervisorPayment?.amount ||
          project.coSupervisorPayment?.amount
        updateStats(singleExpert, singleAmount, "SINGLE")
      }
    }
  }

  return Array.from(expertStatsMap.values())
}
export const exportThongKeCbHdlv = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thống kê cán bộ hướng dẫn LV")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (project.length === 0) {
    message.error("Không tìm thấy dữ liệu để tạo thống kê cán bộ hướng dẫn LV")
    return
  }

  showSpinner()
  const dataMapping = getExpertSupervisionStats(project)
  const ngayhientai = dayjs().format("DD/MM/YYYY")
  const ngay = ngayhientai.split("/")[0]
  const thang = ngayhientai.split("/")[1]
  const nam = ngayhientai.split("/")[2]
  const tendot = project[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name || ""

  const tenkhoa = "Tất cả khoa viện"
  const tongSoDocLap = dataMapping?.reduce((acc, item) => acc + (item.singleStudent || 0), 0)
  const data = dataMapping?.map((item, index) => {
    return {
      stt: index + 1,
      gvhd: item.name,
      donvi: item.sDonvi,
      tongsohv: item.GVHD1Student + item.GVHD2Student + item.singleStudent || 0,
      doclap: item.singleStudent || 0,
      gvhd1: item.GVHD1Student,
      gvhd2: item.GVHD2Student,
      thanhtoan: formatAmountWithComma(item.totalPayment),
      stk: item.stk,
      bank: item.tennganhang,
    }
  })
  try {
    const tongsohocvien = dataMapping?.reduce(
      (acc, item) => acc + item.GVHD1Student + item.GVHD2Student + item.singleStudent,
      0
    )
    const tongsohd1 = dataMapping?.reduce((acc, item) => acc + item.GVHD1Student, 0)
    const tongsohd2 = dataMapping?.reduce((acc, item) => acc + item.GVHD2Student, 0)
    const tongsotien = dataMapping?.reduce((acc, item) => acc + item.totalPayment, 0)

    const items = [
      {
        tendot: tendot ? tendot.trim().toUpperCase() : "",
        tenkhoa: tenkhoa ? tenkhoa.trim().toUpperCase() : "",
        ngay: ngay,
        thang: thang,
        nam: nam,
        tongsohocvien: tongsohocvien,
        tongsodoclap: tongSoDocLap,
        tongsohd1: tongsohd1,
        tongsohd2: tongsohd2,
        tongsotien: formatAmountWithComma(tongsotien),
        data: data,
        "ngắt trang": "",
      },
    ]

    const response = await renderXlsxTemplate({
      templatePath: "ThongKeCanBoHuongDan.xlsx",
      prefix: "mta/luan-van",
      fileName: "ThongKeCanBoHuongDan.xlsx",
      mergeBlocksToOneSheet: true,
      sheets: items.map((item, idx) => ({
        data: item,
        pageBreakAfter: idx < items.length - 1,
      })),
    })
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    if (blob instanceof Blob) {
      downloadFile(blob, "ThongKeCanBoHuongDan.xlsx")
      message.success("Xuất file thành công")
    } else {
      message.error("Đã xảy ra lỗi khi tạo file Excel")
    }
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const exportDanhSachBaoVe = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo danh sách bảo vệ LV")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  showSpinner()
  try {
    let index = 0
    const data = project
      ?.map((student) => {
        if (!student?.thesisRegistrations?.[0]?.thesisProject) return null
        return {
          stt: ++index,
          chuyennganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
          dt:
            tenDoiTuong[
              student?.fixedClass?.trainingCourse?.trainingObjectType
                ?.type as keyof typeof tenDoiTuong
            ]?.shortname || "",
          lastname: student.userProfile?.lastName || "",
          firstname: student.userProfile?.firstName || "",
          empty: student.userProfile?.phoneNumber || "",
          ngaybaove: student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
            ? dayjs(student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate).format(
                "DD/MM/YYYY"
              )
            : "",
          giobaove: student?.thesisRegistrations?.[0]?.thesisProject?.defenseSession?.startTime
            ? dayjs(
                student?.thesisRegistrations?.[0]?.thesisProject?.defenseSession?.startTime
              ).format("HH:mm")
            : "",
          phongbaove: student?.thesisRegistrations?.[0]?.thesisProject?.room?.name || "",
        }
      })
      .filter(Boolean)
    const dotxet =
      project
        ?.map((student) =>
          student?.thesisRegistrations
            ?.find((registration: any) => registration?.thesisProject?.thesisSession?.name)
            ?.thesisProject?.thesisSession?.name?.trim()
        )
        .find(Boolean) || "CHƯA CÓ ĐỢT XÉT"
    const normalizedDotxet = dotxet?.trim()?.toUpperCase()
    const soluonghocvien =
      project?.filter((student) =>
        student?.thesisRegistrations?.some((registration: any) => {
          const thesisSessionName = registration?.thesisProject?.thesisSession?.name
            ?.trim()
            ?.toUpperCase()
          return Boolean(registration?.thesisProject && thesisSessionName === normalizedDotxet)
        })
      )?.length || 0
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "DanhSachBaoVe",
      path: "DanhSachBaoVe.xlsx",
      prefix: "mta/luan-van",
      payload: [
        {
          data: {
            dotxet: dotxet?.toUpperCase() || "",
            soluonghocvien: soluonghocvien,
            data: data,
          },
        },
      ],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "DanhSachBaoVe.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    console.error(error)
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}

type DanhSachBaoVeDanNgoaiPhongHall = {
  roomName: string
  hoiDong: string
  ctName: string
  tkName: string
  pb1Name: string
  pb2Name: string
  uvNames: string[]
}

interface DanhSachBaoVeDanNgoaiPhongSlot {
  stt: number
  thoiGianBatDau: string
  ngayBaoVe: string
  hallsByRoom: Map<string, DanhSachBaoVeDanNgoaiPhongHall>
}

interface DanhSachBaoVeDanNgoaiPhongResult {
  khoa: string
  nganh: string
  dotXet: string
  allRooms: string[]
  slots: DanhSachBaoVeDanNgoaiPhongSlot[]
}

const ROWS_PER_SLOT = 6

const buildDanhSachBaoVeDanNgoaiPhongHall = (
  project: any,
  studentNames: string[]
): DanhSachBaoVeDanNgoaiPhongHall => {
  const councilMembers = project?.council?.members || []
  const getMember = (role: CouncilRole) => councilMembers.find((m: any) => m.role === role)

  const chairman = getMember(CouncilRole.CHAIRMAN)
  const secretary = getMember(CouncilRole.SECRETARY)
  const reviewer1 = getMember(CouncilRole.REVIEWER_1)
  const reviewer2 = getMember(CouncilRole.REVIEWER_2)

  const uvNames = councilMembers
    .filter((m: any) => m.role === CouncilRole.MEMBER)
    .map((m: any) => (getSupervisorName(m?.expert, false, true) as string) || "")
    .filter(Boolean)

  const cbhd1Name = (getSupervisorName(project?.supervisor, false, true) as string) || ""
  const cbhd2Name = (getSupervisorName(project?.coSupervisor, false, true) as string) || ""

  return {
    roomName: project?.room?.name || "",
    hoiDong: [
      ...studentNames.filter(Boolean),
      cbhd1Name ? `CBHD1: ${cbhd1Name}` : "",
      cbhd2Name ? `CBHD2: ${cbhd2Name}` : "",
    ]
      .filter((line) => line.trim() !== "")
      .join("\n"),
    ctName: (getSupervisorName(chairman?.expert, false, true) as string) || "",
    tkName: (getSupervisorName(secretary?.expert, false, true) as string) || "",
    pb1Name: (getSupervisorName(reviewer1?.expert, false, true) as string) || "",
    pb2Name: (getSupervisorName(reviewer2?.expert, false, true) as string) || "",
    uvNames,
  }
}

const buildSlotsFromEntries = (
  entries: { project: any; studentName: string }[]
): { allRooms: string[]; slots: DanhSachBaoVeDanNgoaiPhongSlot[] } => {
  const allRoomSet = new Set<string>()
  const slotMap = new Map<string, { project: any; studentName: string }[]>()

  for (const entry of entries) {
    const { project } = entry
    const date = project?.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : ""
    const time = project?.defenseSession?.startTime
      ? dayjs(project.defenseSession.startTime).format("HH:mm")
      : ""
    if (!date || !time) continue
    const roomName = project?.room?.name || ""
    if (roomName) allRoomSet.add(roomName)
    const key = `${date}__${time}`
    if (!slotMap.has(key)) slotMap.set(key, [])
    slotMap.get(key)?.push(entry)
  }

  const allRooms = Array.from(allRoomSet).sort()

  const slots: DanhSachBaoVeDanNgoaiPhongSlot[] = Array.from(slotMap.entries())
    .sort(([a], [b]) => {
      const [aDate, aTime] = a.split("__")
      const [bDate, bTime] = b.split("__")
      const dateA = dayjs(`${aDate} ${aTime}`, "DD/MM/YYYY HH:mm")
      const dateB = dayjs(`${bDate} ${bTime}`, "DD/MM/YYYY HH:mm")
      return dateA.valueOf() - dateB.valueOf()
    })
    .map(([key, slotEntries], slotIdx) => {
      const [ngayBaoVe, thoiGianBatDau] = key.split("__")
      const hallsByRoom = new Map<string, DanhSachBaoVeDanNgoaiPhongHall>()

      const roomStudentNames = new Map<string, string[]>()
      for (const { project, studentName } of slotEntries) {
        const roomName = project?.room?.name || ""
        if (!roomName) continue
        if (!roomStudentNames.has(roomName)) roomStudentNames.set(roomName, [])
        if (studentName) roomStudentNames.get(roomName)?.push(studentName)
      }

      for (const { project } of slotEntries) {
        const roomName = project?.room?.name || ""
        if (roomName && !hallsByRoom.has(roomName)) {
          const studentNames = roomStudentNames.get(roomName) || []
          hallsByRoom.set(roomName, buildDanhSachBaoVeDanNgoaiPhongHall(project, studentNames))
        }
      }
      return { stt: slotIdx + 1, thoiGianBatDau, ngayBaoVe, hallsByRoom }
    })

  return { allRooms, slots }
}

export const convertToDanhSachBaoVeDanNgoaiPhongData = (
  allStudentsInClasses: any[]
): DanhSachBaoVeDanNgoaiPhongResult[] => {
  if (!allStudentsInClasses?.length) return []

  const validStudents = allStudentsInClasses.filter((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    return project?.defenseDate && project?.defenseSession?.startTime && project?.room?.name
  })
  if (!validStudents.length) return []

  const firstProject = validStudents[0]?.thesisRegistrations?.[0]?.thesisProject
  const dotXet = firstProject?.thesisSession?.name || ""

  const orgMap = new Map<
    string,
    { orgName: string; nganh: string; entries: { project: any; studentName: string }[] }
  >()

  validStudents.forEach((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    const orgId = project?.organization?.Id || project?.organizationId || "unknown"
    const orgName = project?.organization?.sTen || "Chưa có đơn vị"
    const nganh = student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""

    if (!orgMap.has(orgId)) {
      orgMap.set(orgId, { orgName, nganh, entries: [] })
    }
    orgMap.get(orgId)?.entries.push({
      project,
      studentName: student.userProfile?.fullname || "",
    })
  })

  const results: DanhSachBaoVeDanNgoaiPhongResult[] = []
  for (const [, { orgName, nganh, entries }] of orgMap) {
    const { allRooms, slots } = buildSlotsFromEntries(entries)
    if (slots.length) {
      results.push({ khoa: orgName, nganh, dotXet, allRooms, slots })
    }
  }

  return results
}

export const exportDanhSachBaoVeDanNgoaiPhong = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách bảo vệ dán ngoài phòng")
    return []
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  showSpinner?.()
  try {
    const results = convertToDanhSachBaoVeDanNgoaiPhongData(project)
    if (!results.length) {
      message.error("Chưa có dữ liệu để xuất danh sách bảo vệ dán ngoài phòng")
      return []
    }

    const COLS_PER_ROOM = 3
    const FIXED_COLS = 3

    const thin = { style: "thin" as const }
    const dotted = { style: "dotted" as const }
    const allBorders = { top: thin, left: thin, bottom: thin, right: thin }

    const hoiDongBorders = { top: thin, left: thin, bottom: dotted, right: thin }
    const memberCdBorders = (isLast: boolean) => ({
      top: dotted,
      left: thin,
      bottom: isLast ? thin : dotted,
      right: dotted,
    })
    const memberHdBorders = (isLast: boolean) => ({
      top: dotted,
      left: dotted,
      bottom: isLast ? thin : dotted,
      right: dotted,
    })
    const memberPbBorders = (isLast: boolean) => ({
      top: dotted,
      left: dotted,
      bottom: isLast ? thin : dotted,
      right: thin,
    })
    const defaultFont = { name: "Times New Roman", size: 13 }
    const boldFont = { ...defaultFont, bold: true }
    const titleFont = { name: "Times New Roman", size: 14, bold: true }

    const centerAlign = {
      horizontal: "center" as const,
      vertical: "middle" as const,
      wrapText: true,
    }
    const leftAlign = { horizontal: "left" as const, vertical: "middle" as const, wrapText: true }

    const workbook = new ExcelJS.Workbook()

    for (const result of results) {
      const { khoa, nganh, dotXet, allRooms, slots } = result
      const totalCols = FIXED_COLS + allRooms.length * COLS_PER_ROOM

      const sheetName = (khoa || "Chưa có đơn vị").substring(0, 31)
      const ws = workbook.addWorksheet(sheetName)

      ws.getColumn(1).width = 3
      ws.getColumn(2).width = 5
      ws.getColumn(3).width = 16
      for (let i = 0; i < allRooms.length; i++) {
        ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 1).width = 6
        ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 2).width = 40
        ws.getColumn(FIXED_COLS + i * COLS_PER_ROOM + 3).width = 6
      }

      const setCell = (
        row: number,
        col: number,
        value: string | number,
        opts?: { font?: Record<string, any>; align?: Record<string, any>; border?: boolean }
      ) => {
        const cell = ws.getRow(row).getCell(col)
        cell.value = value as any
        cell.font = opts?.font ?? defaultFont
        cell.alignment = opts?.align ?? centerAlign
        if (opts?.border !== false) cell.border = allBorders
      }

      const mergeSafe = (top: number, left: number, bottom: number, right: number) => {
        ws.mergeCells(top, left, bottom, right)
      }

      // --- Header rows ---
      let r = 1
      setCell(r, 1, "HỌC VIỆN KỸ THUẬT QUÂN SỰ", {
        font: boldFont,
        align: centerAlign,
        border: false,
      })
      mergeSafe(r, 1, r, 5)
      r++
      setCell(r, 1, "PHÒNG SAU ĐẠI HỌC", { font: boldFont, align: centerAlign, border: false })
      mergeSafe(r, 1, r, 5)
      r++

      setCell(r, 1, "LỊCH BẢO VỆ LUẬN VĂN THẠC SĨ", { font: titleFont, border: false })
      mergeSafe(r, 1, r, totalCols)
      r++
      setCell(r, 1, khoa ? `${khoa.toUpperCase()}` : "", { font: boldFont, border: false })
      mergeSafe(r, 1, r, totalCols)
      r++
      setCell(r, 1, nganh ? `NGÀNH: ${nganh}` : "", { font: boldFont, border: false })
      mergeSafe(r, 1, r, totalCols)
      r++

      // --- Room header row ---
      setCell(r, 1, "", { border: true })
      mergeSafe(r, 1, r + 1, 1)
      setCell(r, 2, "TT", { font: boldFont })
      mergeSafe(r, 2, r + 1, 2)
      setCell(r, 3, "Thời gian\nBắt đầu", { font: boldFont })
      mergeSafe(r, 3, r + 1, 3)

      for (let i = 0; i < allRooms.length; i++) {
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        setCell(r, startCol, `Hội trường: ${allRooms[i]}`, { font: boldFont })
        mergeSafe(r, startCol, r, startCol + COLS_PER_ROOM - 1)
      }
      r++

      // --- Sub-header row ---
      for (let i = 0; i < allRooms.length; i++) {
        const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
        setCell(r, startCol, "CD", { font: boldFont })
        setCell(r, startCol + 1, "Hội đồng", { font: boldFont })
        setCell(r, startCol + 2, "PB", { font: boldFont })
      }
      r++

      // --- Data rows ---
      for (const slot of slots) {
        const slotStartRow = r

        // Row 1: Hội đồng info
        setCell(r, 1, "", { border: true })
        setCell(r, 2, "", { border: true })
        setCell(r, 3, "", { border: true })
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          setCell(r, startCol, "", { border: true })
          setCell(r, startCol + 1, "", { border: true })
          setCell(r, startCol + 2, "", { border: true })
          mergeSafe(r, startCol, r, startCol + 2)
          const mergedCell = ws.getRow(r).getCell(startCol)
          mergedCell.value = hall?.hoiDong || ("" as any)
          mergedCell.font = defaultFont
          mergedCell.alignment = centerAlign
          mergedCell.border = hoiDongBorders
        }
        const hoiDongLineCount = Math.max(
          3,
          ...allRooms.map((room) => (slot.hallsByRoom.get(room)?.hoiDong || "").split("\n").length)
        )
        ws.getRow(r).height = hoiDongLineCount * 16
        r++

        const setMemberRow = (
          hall: DanhSachBaoVeDanNgoaiPhongHall | undefined,
          startCol: number,
          cdLabel: string,
          name: string,
          pbLabel: string,
          rowNum: number,
          isLast: boolean
        ) => {
          const cell1 = ws.getRow(rowNum).getCell(startCol)
          cell1.value = cdLabel as any
          cell1.font = defaultFont
          cell1.alignment = centerAlign
          cell1.border = memberCdBorders(isLast)

          const cell2 = ws.getRow(rowNum).getCell(startCol + 1)
          cell2.value = name as any
          cell2.font = defaultFont
          cell2.alignment = leftAlign
          cell2.border = memberHdBorders(isLast)

          const cell3 = ws.getRow(rowNum).getCell(startCol + 2)
          cell3.value = pbLabel as any
          cell3.font = defaultFont
          cell3.alignment = centerAlign
          cell3.border = memberPbBorders(isLast)
        }

        // Row 2: CT (Chủ tịch)
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          setMemberRow(hall, startCol, hall?.ctName ? "CT" : "", hall?.ctName || "", "", r, false)
        }
        r++

        // Row 3: TK (Thư ký)
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          setMemberRow(hall, startCol, hall?.tkName ? "TK" : "", hall?.tkName || "", "", r, false)
        }
        r++

        // Row 4: PB1 (Phản biện 1)
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          setMemberRow(
            hall,
            startCol,
            hall?.pb1Name ? "UV" : "",
            hall?.pb1Name || "",
            hall?.pb1Name ? "PB1" : "",
            r,
            false
          )
        }
        r++

        // Row 5: PB2 (Phản biện 2)
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          setMemberRow(
            hall,
            startCol,
            hall?.pb2Name ? "UV" : "",
            hall?.pb2Name || "",
            hall?.pb2Name ? "PB2" : "",
            r,
            false
          )
        }
        r++

        // Row 6: UV (Ủy viên)
        for (let i = 0; i < allRooms.length; i++) {
          const startCol = FIXED_COLS + i * COLS_PER_ROOM + 1
          const hall = slot.hallsByRoom.get(allRooms[i])
          const uvName = hall?.uvNames?.[0] || ""
          setMemberRow(hall, startCol, uvName ? "UV" : "", uvName, "", r, true)
        }
        r++

        // Fill fixed columns for the slot (merged vertically)
        setCell(slotStartRow, 2, slot.stt)
        mergeSafe(slotStartRow, 2, slotStartRow + ROWS_PER_SLOT - 1, 2)

        setCell(slotStartRow, 3, `${slot.thoiGianBatDau}\n---\n${slot.ngayBaoVe}`)
        mergeSafe(slotStartRow, 3, slotStartRow + ROWS_PER_SLOT - 1, 3)

        mergeSafe(slotStartRow, 1, slotStartRow + ROWS_PER_SLOT - 1, 1)

        // Apply borders on all empty fixed-col cells
        for (let dr = slotStartRow; dr < slotStartRow + ROWS_PER_SLOT; dr++) {
          for (let c = 1; c <= FIXED_COLS; c++) {
            ws.getRow(dr).getCell(c).border = allBorders
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "DanhSachBaoVeDanNgoaiPhong.xlsx"
    )
    message.success("Xuất file thành công")
  } catch (error) {
    console.error(error)
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}

export const exportHosobvlv = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  isChief,
  signerName,
  // signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo danh sách bảo vệ LV dán PBV")
    return
  }
  const project = allStudentsInClasses.map((student) => {
    const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
    if (!thesisProject) return null
    return {
      ...student,
      thesisRegistrations: [{ thesisProject }],
    }
  })
  showSpinner()
  try {
    const allSheetOptions = project?.map((student) => {
      if (!student?.thesisRegistrations?.[0]?.thesisProject) return null
      const thanhvienhoidong = student?.thesisRegistrations?.[0]?.thesisProject?.council?.members
      const phanbien1 = thanhvienhoidong?.find(
        (member: any) => member.role === CouncilRole.REVIEWER_1
      )
      const phanbien2 = thanhvienhoidong?.find(
        (member: any) => member.role === CouncilRole.REVIEWER_2
      )
      const chutich = thanhvienhoidong?.find((member: any) => member.role === CouncilRole.CHAIRMAN)
      const thuky = thanhvienhoidong?.find((member: any) => member.role === CouncilRole.SECRETARY)
      const uyvien = thanhvienhoidong?.find((member: any) => member.role === CouncilRole.MEMBER)

      // const qddtKyTokens = nguoikiqddt.split(/\s+/).filter(Boolean)
      const nguoiki = signerName || ""
      const text1 = isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC"
      const text2 = isChief ? "" : "PHÓ TRƯỞNG PHÒNG SAU ĐẠI HỌC"
      const ngayQDBV = formatBirthDate(
        student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.defenseDecisionDate || ""
      )
      const soQDBV =
        student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.defenseDecisionNumber
      const dotxetBV = student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name
      const ngaysinh = formatBirthDate(student?.userProfile?.dateOfBirth)
      const khoas = student?.fixedClass?.trainingCourse?.name || ""
      const ngaybaove = formatBirthDate(
        student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate || ""
      )
      // const nguoiKi
      const data = {
        tenhocvien: student.userProfile?.fullname || "",
        soQD: soQDBV || "",
        ngayQD: ngayQDBV || "",
        dotxet: dotxetBV || "",
        ngaysinh: ngaysinh || "",
        type:
          student.thesisRegistrations?.[0]?.thesisProject?.type?.trim().toLowerCase() || "luận văn",
        khoa: `${khoas || ""}`,
        chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
        nganh:
          student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
          "",
        detai: `${student?.thesisRegistrations?.[0]?.thesisProject?.title || ""}`,
        ngaybaove: ngaybaove || "",
        phanbien1: getSupervisorName(phanbien1?.expert, false, true) || "",
        phanbien2: getSupervisorName(phanbien2?.expert, false, true) || "",
        chutich: getSupervisorName(chutich?.expert, false, true) || "",
        thuky: getSupervisorName(thuky?.expert, false, true) || "",
        uyvien: getSupervisorName(uyvien?.expert, false, true) || "",
        nguoiki: nguoiki || "",
        text1: text1 || "",
        text2: text2 || "",
      }
      return {
        // sheet: `${student.userProfile?.code}`,
        data: data,
        // tableStartCell: { row: 104, col: 1 },
        // rows: [gapRow],
      }
    })
    const payload = {
      fileName: "Hosobvlv",
      path: "Hosobvlv.docx",
      prefix: "mta/luan-van",
      data: {
        items: allSheetOptions?.filter((item) => item !== null).map((item) => item!.data) ?? [],
      },
    }
    const response = await docxTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "Hosobvlv.docx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const exportGiayMoiHdlv = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  isChief,
  signerName,
  signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu đế tạo giấy mời HDLV")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu đế tạo giấy mời HDLV")
    return
  }
  showSpinner()
  const presentDay = resolveSigningDate(signingDate).format("DD/MM/YYYY")
  const ngay = presentDay.split("/")[0]
  const thang = presentDay.split("/")[1]
  const nam = presentDay.split("/")[2]
  try {
    const allSheetOptions = project?.map((student) => {
      const supervisor = student?.thesisRegistrations?.[0]?.thesisProject?.supervisor
      if (!supervisor) return null
      const khoahoc =
        `${student?.fixedClass?.trainingCourse?.name}(${student?.fixedClass?.trainingCourse?.academicYear})` ||
        ""
      const data = {
        ngay: ngay,
        thang: thang,
        nam: nam,
        tenhocvien: student?.userProfile?.fullname,
        tenhuongdan: supervisor ? ` ${getSupervisorName(supervisor, false, true)}` : "",
        khoa: khoahoc,
        chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
        tendetai: student?.thesisRegistrations?.[0]?.thesisProject?.title
          ? `Tên đề tài: "${student.thesisRegistrations[0].thesisProject.title.trim()}"`
          : "",
        type: student?.thesisRegistrations?.[0]?.thesisProject?.type?.trim().toLowerCase() || "",
        text1: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
        text2: isChief ? "" : "PHÓ TRƯỞNG PHÒNG SAU ĐẠI HỌC",
        nguoiky1: signerName || "",
      }
      return {
        data: data,
      }
    })
    const payload = {
      fileName: "GiayMoiHDLV",
      path: "GiayMoiHDLV.docx",
      prefix: "mta/luan-van",
      data: {
        items: allSheetOptions?.filter((item) => item !== null).map((item) => item!.data) ?? [],
      },
    }
    const response = await docxTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "GiayMoiHDLV.docx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const exportSaoQDHDLV = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  signerName,
  isChief,
  signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu đế tạo sao QĐ HDLV")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để tạo sao QĐ HDLV")
    return
  }
  showSpinner()
  const { day: ngayHT, month: thangHT, year: namHT } = formatDocDate(signingDate)
  try {
    const allSheetOptions = project
      ?.filter((s: any) => s?.thesisRegistrations?.[0]?.thesisProject)
      .map((student: any) => {
        const thesisProject = student?.thesisRegistrations?.[0]?.thesisProject
        const supervisor = thesisProject?.supervisor
        if (!supervisor) return null
        const coSupervisor = thesisProject?.coSupervisor
        const major = student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
        const khoa = student?.fixedClass?.trainingCourse || ""
        const type = thesisProject.type
        const nganh = major?.trainingField?.name || ""
        const chuyennganh = major?.name || ""
        const detai = thesisProject.title || ""
        const hoten = student?.userProfile?.fullname || ""

        const {
          day: ngayQD,
          month: thangQD,
          year: namQD,
        } = formatDocDate(thesisProject?.thesisSession?.decisionDate)

        const canbohuongdan1 = `1. ${getSupervisorName(supervisor, false, true)}`
        const canbohuongdan2 = coSupervisor
          ? `2. ${getSupervisorName(coSupervisor, false, true)}`
          : ""
        const khoaquanli = thesisProject.organization?.sTen || ""
        const nguoikiqddt =
          student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionMaker?.trim() ||
          ""
        const qddtKyTokens = nguoikiqddt.split(/\s+/).filter(Boolean)
        const chucVuNguoiKyQddt = qddtKyTokens[0] ?? ""
        const tenNguoiKyQddt = qddtKyTokens.slice(1).join(" ").trim()
        const text1 = chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT. GIÁM ĐỐC"
        const text2 = text1 === "GIÁM ĐỐC" ? "" : "PHÓ GIÁM ĐỐC"
        // const dieu1 = `Điều 1: Giao đề tài ${type} tốt nghiệp và cán hộ hướng dẫn ngành ${nganh} (${chuyennganh}) về đề tài "${detai}".
        // Học viên thực hiện: ${hoten}, ${khoa.name}(${khoa.academicYear}).
        // Cán bộ hướng dẫn: ${canbohuongdan1}
        //                       ${canbohuongdan2}`
        // const dieu2 = `Điều 2: ${khoaquanli} tổ chức triển khai cho cán bộ hướng dẫn và học viên thực hiện theo quy định.`
        const data = {
          soQD:
            student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionNumber || "",
          councilReport:
            student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.councilReport || "",
          proposalReport:
            student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.proposalReport || "",
          ngayQD: ngayQD,
          thangQD: thangQD,
          namQD: namQD,
          type: type || "",
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          nganh: nganh,
          chuyennganh: chuyennganh,
          detai: detai,
          hoten: hoten,
          ngaySinh: formatBirthDate(student.userProfile?.dateOfBirth),
          khoaHoc: khoa.name || "",
          canbohuongdan1: canbohuongdan1,
          canbohuongdan2: canbohuongdan2,
          khoaquanli: khoaquanli,
          text1: text1,
          text2: text2,
          nguoiky1: tenNguoiKyQddt,
          text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          text4: isChief ? "" : "PHÓ TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          nguoiki2: signerName,
          ngay: ngayHT,
          thang: thangHT,
          nam: namHT,
          data: [],
        }
        return {
          data: data,
        }
      })
    // const payload: ExcelTemplateBody = {
    //   head: { data: null },
    //   tail: { data: null },
    //   fileName: "BanSaoQDHuongDanLuanVan",
    //   path: "BanSaoQDHuongDanLuanVan.xlsx",
    //   payload: allSheetOptions?.filter((item) => item !== null) ?? [],
    //   showGridLines: true,
    //   wrapText: true,
    // }
    const validItems = allSheetOptions?.filter((item: any) => item !== null) ?? []
    if (validItems.length === 0) {
      message.error("Không có học viên hợp lệ để xuất")
      return
    }

    const items = validItems.map((item: any) => item!.data)
    const payload = {
      fileName: "BanSaoQDHuongDanLuanVan.docx",
      path: "BanSaoQDHuongDanLuanVan.docx",
      prefix: "mta/luan-van",
      data: {
        councilReport: items[0]?.councilReport || "",
        proposalReport: items[0]?.proposalReport || "",
        items: items,
      },
    }
    const response = await docxTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "BanSaoQDHuongDanLuanVan.docx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Vui lòng kiểm tra lại dữ liệu")
  } finally {
    hideSpinner()
  }
}

export const exportKiemTraTienDo = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo kiểm tra tiến độ")
    return
  }
  showSpinner()
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  try {
    const organizationMap = new Map<string, any>()
    let dotxet = ""

    project.forEach((student) => {
      const thesisProject = student?.thesisRegistrations?.find(
        (reg: any) => reg?.thesisProject?.thesisSession?.id === thesisSessionId
      )?.thesisProject
      if (!thesisProject) return
      dotxet = dotxet || thesisProject?.thesisSession?.name || ""
      const organizationId = thesisProject.organization?.Id || ""
      const organizationName = thesisProject.organization?.sTen || "Chưa có đơn vị"
      const organizationCode = thesisProject.organization?.sCode || ""
      if (!organizationMap.has(organizationId)) {
        organizationMap.set(organizationId, {
          organizationId: organizationId === "" ? null : organizationId,
          sTen: organizationName || "",
          sCode: organizationCode || "",
          thesisProject: [],
        })
      }
      const orgData = organizationMap.get(organizationId)
      const gvhd1 = getSupervisorName(thesisProject.supervisor, false, true) || ""
      const gvhd2 = getSupervisorName(thesisProject.coSupervisor, false, true) || ""
      const gvhdNames = [gvhd1, gvhd2].filter(Boolean)
      orgData.thesisProject.push({
        studentId: student.id || "",
        hovatenhocvien: student.userProfile?.fullname || "",
        khoa: student.fixedClass?.trainingCourse?.name || "",
        ngaysinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        doituongdaotao:
          tenDoiTuong[
            student?.fixedClass?.trainingCourse?.trainingObjectType
              ?.type as keyof typeof tenDoiTuong
          ]?.shortname || "",
        decisionNumber: thesisProject?.thesisSession?.decisionNumber || "",
        tendetai: thesisProject.title || "",
        gvhd:
          gvhdNames.length > 1
            ? gvhdNames.map((name, idx) => `${idx + 1}. ${name}`).join("\n")
            : gvhdNames[0] || "",
        isThesis: thesisProject.description?.split("-")[1].trim().split(":")[1] || "".toLowerCase(),
        language: thesisProject.description?.split("-")[0].trim().split(":")[1] || "".toLowerCase(),
      })
    })
    const result = Array.from(organizationMap.values())
    if (result.length === 0) {
      message.error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
      hideSpinner()
      return
    }
    let count = 1
    const dataRows: TableRow[] = result.flatMap((item: any, index: number) => {
      const tongHocVien = new Set(
        item.thesisProject.map((thesis: any) => thesis.studentId).filter(Boolean)
      ).size
      const orgRow: TableRow = {
        cells: [
          { value: "" },
          {
            value: `${index + 1}.  ${item.sTen}: ${tongHocVien} học viên`,
            border: true,
            align: "left",
            colSpan: 4,
            bold: true,
          },
        ],
      }
      const thesisRows: TableRow[] = item.thesisProject.map((thesis: any, index: number) => {
        count++
        return {
          cells: [
            { value: index + 1, border: true, align: "center", fontSize: 12 },
            {
              value:
                `${thesis.hovatenhocvien}\nNS:${thesis.ngaysinh} \nĐT:${thesis.doituongdaotao} - ${thesis.khoa} \n${thesis.gvhd ? `CBHD:\n${thesis.gvhd}` : "CBHD"}`.trim(),
              border: true,
              align: "left",
              fontSize: 12,
            },
            { value: `${thesis.tendetai}`, border: true, align: "left" },
            {
              value: "",
              border: true,
              align: "left",
              fontSize: 12,
            },
            { value: "", border: true, align: "center", fontSize: 12 },
          ],
        }
      })
      return [orgRow, ...thesisRows]
    })
    const gapRow: TableRow = {
      cells: [{ value: null, border: false }],
    }
    const totalRow: TableRow = {
      cells: [
        {
          value: `Tổng số: ${count - 1} học viên./.`,
          align: "center",
          fontSize: 12,
          colSpan: 5,
          italic: true,
          border: false,
        },
      ],
    }
    const signRow: TableRow = {
      cells: [
        { value: "", border: false, align: "center" },
        { value: "", border: false, align: "center" },
        { value: "", border: false, align: "center" },
        {
          value: "Chủ nhiệm khoa/viện trưởng".toUpperCase(),
          colSpan: 2,
          border: false,
          bold: true,
          align: "center",
        },
      ],
    }
    const signRow2: TableRow = {
      cells: [
        { value: "", border: false, align: "center" },
        { value: "", border: false, align: "center" },
        { value: "", border: false, align: "center" },
        {
          value: "(Ký và ghi rõ họ tên)",
          colSpan: 2,
          border: false,
          italic: true,
          align: "center",
        },
      ],
    }
    await exportFromTemplate({
      templateUrl: getMinioUrl("mta/template/KiemTraTienDoLuanVan.xlsx"),
      sheets: [
        {
          sheet: "Detai",
          rows: [...dataRows, gapRow, totalRow, gapRow, signRow, signRow2],
          tableStartCell: { row: 8, col: 1 },
          data: { dotxet: dotxet.toUpperCase() || "" },
        },
      ],
      fileName: "KiemTraTienDoLuanVan",
    })
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}

export const convertToGmcLvPbData = (
  allStudentsInClasses: any[],
  signerName?: string,
  isChief?: boolean,
  signingDate?: Date | string,
  expertScope: GmcLvPbExpertScope = "all"
): GmcLvPbData[] => {
  if (!allStudentsInClasses?.length) return []
  const parseDateSortValue = (dateStr?: string) => {
    if (!dateStr) return Number.MAX_SAFE_INTEGER
    const [ddRaw, mmRaw, yyyyRaw] = dateStr.split("/")
    const dd = Number.parseInt(ddRaw || "", 10)
    const mm = Number.parseInt(mmRaw || "", 10)
    const yyyy = Number.parseInt(yyyyRaw || "", 10)
    if (!dd || !mm || !yyyy) return Number.MAX_SAFE_INTEGER
    return yyyy * 10000 + mm * 100 + dd
  }
  const parseTimeSortValue = (timeStr?: string) => {
    if (!timeStr) return Number.MAX_SAFE_INTEGER
    const [hhRaw, mmRaw] = timeStr.split(":")
    const hh = Number.parseInt(hhRaw || "", 10)
    const mm = Number.parseInt(mmRaw || "", 10)
    if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER
    return hh * 60 + mm
  }

  const expertMap = new Map<string, GmcLvPbData>()
  const expertStudentMap = new Map<string, Set<string>>()
  const expertProjectTypeMap = new Map<string, Set<"luận văn" | "đề án">>()

  const now = resolveSigningDate(signingDate)
  const ngay = now.format("DD")
  const thang = now.format("MM")
  const nam = now.format("YYYY")

  allStudentsInClasses.forEach((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    if (!project) return

    const dotXet = project.thesisSession?.trainingCourses?.map((c: any) => c.name).join(", ") || ""
    const ngaybaove = project.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : ""
    const giobaove = project.defenseSession?.startTime
      ? dayjs(project.defenseSession.startTime).format("HH:mm")
      : ""
    const phongbaove = project.room?.name || ""
    const tenhocvien = student.userProfile?.fullname || ""
    const studentId = student?.id || tenhocvien
    const projectType: "luận văn" | "đề án" =
      project?.thesisType === ThesisType.THESIS ? "luận văn" : "đề án"
    const chuyennganh =
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.summary || ""

    const members = project.council?.members || []
    members.forEach((member: any) => {
      const expert = member.expert
      if (!expert?.id) return

      const internal = isExpertInAcademy(expert)
      if (expertScope === "inAcademy" && !internal) return
      if (expertScope === "outsideAcademy" && internal) return

      if (!expertMap.has(expert.id)) {
        expertMap.set(expert.id, {
          data: {
            dotXet,
            ngay,
            thang,
            nam,
            type: projectType,
            tongSoHocVien: 0,
            text1: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
            text2: isChief ? "" : "PHÓ TRƯỞNG PHÒNG SAU ĐẠI HỌC",
            nguoiki: signerName || "",
            tenThanhVien: (getSupervisorName(expert, false, true) as string) || "",
            data: [],
          },
        })
        expertStudentMap.set(expert.id, new Set<string>())
        expertProjectTypeMap.set(expert.id, new Set<"luận văn" | "đề án">())
      }

      const expertEntry = expertMap.get(expert.id) as GmcLvPbData
      const studentSet = expertStudentMap.get(expert.id) as Set<string>
      const projectTypeSet = expertProjectTypeMap.get(expert.id) as Set<"luận văn" | "đề án">

      let tenchucdanh = ""
      switch (member.role) {
        case CouncilRole.CHAIRMAN:
          tenchucdanh = "Chủ tịch"
          break
        case CouncilRole.SECRETARY:
          tenchucdanh = "Thư ký"
          break
        case CouncilRole.REVIEWER_1:
          tenchucdanh = "Ủy viên, PB1"
          break
        case CouncilRole.REVIEWER_2:
          tenchucdanh = "Ủy viên, PB2"
          break
        case CouncilRole.MEMBER:
          tenchucdanh = "Ủy viên"
          break
        default:
          tenchucdanh = member.role
      }

      expertEntry.data.data.push({
        stt: expertEntry.data.data.length + 1,
        ngaybaove,
        giobaove,
        phongbaove,
        tenhocvien,
        chuyennganh,
        tenchucdanh,
      })
      studentSet.add(studentId)
      expertEntry.data.tongSoHocVien = studentSet.size
      projectTypeSet.add(projectType)
      expertEntry.data.type = projectTypeSet.size > 1 ? "luận văn/ đề án" : [...projectTypeSet][0]
    })
  })

  return Array.from(expertMap.values()).map((expertEntry) => {
    const sortedRows = [...expertEntry.data.data].sort((a, b) => {
      const dateDiff = parseDateSortValue(a.ngaybaove) - parseDateSortValue(b.ngaybaove)
      if (dateDiff !== 0) return dateDiff
      return parseTimeSortValue(a.giobaove) - parseTimeSortValue(b.giobaove)
    })
    sortedRows.forEach((row, index) => {
      row.stt = index + 1
    })
    return {
      ...expertEntry,
      data: {
        ...expertEntry.data,
        data: sortedRows,
      },
    }
  })
}
export const exportGiayMoiChamLvPb = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  signerName,
  isChief,
  signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo giấy mời chấm LV PB")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu đế tạo giấy mời chấm LV PB")
    return
  }
  try {
    showSpinner?.()
    const dataTrongHv = convertToGmcLvPbData(project, signerName, isChief, signingDate, "inAcademy")
    const dataNgoaiHv = convertToGmcLvPbData(
      project,
      signerName,
      isChief,
      signingDate,
      "outsideAcademy"
    )
    if (dataTrongHv.length === 0 && dataNgoaiHv.length === 0) {
      message.error("Không có dữ liệu để tạo giấy mời chấm LV PB")
      return
    }
    const exportGroups = [
      ...(dataTrongHv.length > 0
        ? [
            {
              downloadFileName: "GiayMoiChamLuanVan_TrongHocVien.docx",
              items: dataTrongHv.map((item, idx) => ({
                ...item.data,
                "ngắt trang": idx === dataTrongHv.length - 1 ? "" : "ngắt trang",
              })),
            },
          ]
        : []),
      ...(dataNgoaiHv.length > 0
        ? [
            {
              downloadFileName: "GiayMoiChamLuanVan_NgoaiHocVien.docx",
              items: dataNgoaiHv.map((item, idx) => ({
                ...item.data,
                "ngắt trang": idx === dataNgoaiHv.length - 1 ? "" : "ngắt trang",
              })),
            },
          ]
        : []),
    ]
    const responses = await Promise.all(
      exportGroups.map((group) =>
        docxTemplate({
          fileName: "GiayMoiChamLuanVan",
          path: "GiayMoiChamLuanVan.docx",
          prefix: "mta/luan-van",
          data: {
            items: group.items,
          },
        })
      )
    )

    if (responses.some((response) => response.status !== 200)) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    responses.forEach((response, index) => {
      downloadFile(response.data, exportGroups[index].downloadFileName)
    })
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportThanhToanHoiDongBaoVe = async ({
  allStudentsInClasses,
  studentIds,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  recreateAllPayments = false,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thanh toán hội đồng bảo vệ")
    return
  }
  if (!thesisSessionId) {
    message.warning("Vui lòng chọn đợt xét luận văn trước khi xuất.")
    return
  }
  const scopeStudentIds = studentIds?.length
    ? studentIds
    : allStudentsInClasses.map((student) => student.id).filter(Boolean)
  try {
    showSpinner?.()
    const syncResponse = await syncThesisCouncilPayments({
      thesisSessionId,
      studentIds: scopeStudentIds,
      recreateAll: recreateAllPayments,
    })
    if (syncResponse.status !== 200) {
      message.error(
        "message" in syncResponse.data
          ? syncResponse.data.message
          : "Đồng bộ thanh toán hội đồng thất bại"
      )
      return
    }

    const exportResponse = await exportThesisCouncilPayments({
      thesisSessionId,
      studentIds: scopeStudentIds,
    })
    if (exportResponse.status !== 200 || !(exportResponse.data instanceof Blob)) {
      message.error(
        exportResponse.data &&
          typeof exportResponse.data === "object" &&
          "message" in exportResponse.data
          ? String(exportResponse.data.message)
          : "Xuất file thanh toán hội đồng thất bại"
      )
      return
    }
    downloadFile(exportResponse.data, "ThanhToanHoiDongBaoVe.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    return
  } finally {
    hideSpinner?.()
  }
}
const tenDoiTuong = {
  [TrainingObjectTypes.MILITARY]: { fullname: "Quân sự", shortname: "QS" },
  [TrainingObjectTypes.CIVILIAN]: { fullname: "Dân sự", shortname: "DS" },
  [TrainingObjectTypes.INTERNATIONAL_MILITARY]: {
    fullname: "Quân sự quốc tế",
    shortname: "QSQT",
  },
}

const getThesisProjectBySessionId = (student: any, thesisSessionId?: string) => {
  if (!thesisSessionId) return undefined
  return student?.thesisRegistrations?.find((reg: any) => {
    const project = reg?.thesisProject
    if (!project) return false
    return (
      project.thesisSession?.id === thesisSessionId || project.thesisSessionId === thesisSessionId
    )
  })?.thesisProject
}

const getThesisProjectWithCouncilBySessionId = (student: any, thesisSessionId?: string) => {
  const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
  if (!thesisProject?.council?.members?.length) return undefined
  return thesisProject
}

const convertToTthdbvData = async (
  allStudentsInClasses: any[],
  thesisSessionId?: string,
  createCouncilPaymentRecord?: (payload: {
    councilMemberId: string
    amount: number
  }) => Promise<unknown>,
  defaultCouncilPayAmounts: DefaultCouncilPayAmountRow[] = [],
  paymentOptions: {
    recreateAllPayments?: boolean
    upsertCouncilPaymentRecord?: (payload: {
      councilMemberId: string
      amount: number
      existingPaymentId?: string
    }) => Promise<unknown>
  } = {}
): Promise<TthdbvData[]> => {
  const { recreateAllPayments = false, upsertCouncilPaymentRecord } = paymentOptions
  if (!allStudentsInClasses?.length) return []
  const now = dayjs()
  const studentsWithProject = allStudentsInClasses.filter((student) => {
    return Boolean(getThesisProjectWithCouncilBySessionId(student, thesisSessionId))
  })
  if (!studentsWithProject.length) return []
  const majorMap = new Map<string, any[]>()
  let khoaquanli = ""

  const createdCouncilPaymentIds = new Set<string>()
  for (const student of studentsWithProject) {
    const project = getThesisProjectWithCouncilBySessionId(student, thesisSessionId)
    const council = project?.council?.members
    if (!project || !council?.length) continue

    const majorName = student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    if (!khoaquanli) {
      khoaquanli =
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.organization?.sTen || ""
    }

    const dob = student.userProfile?.dateOfBirth
      ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
      : ""
    const doiTuong = student?.fixedClass?.trainingCourse?.trainingObjectType?.type
    const loaiDoiTuong = tenDoiTuong[doiTuong as keyof typeof tenDoiTuong]?.fullname || ""
    const khoaHoc = student?.fixedClass?.trainingCourse?.name || ""
    const chuyenNganhCode =
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    const ngayBV = project.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : ""

    const thongTinBaoVe = `${student.userProfile?.fullname || ""}\nNgày sinh: ${dob}\nĐối tượng: ${loaiDoiTuong}, ${khoaHoc}\nChuyên ngành: ${chuyenNganhCode}\nNgày BV: ${ngayBV}`

    const members = project.council?.members || []
    const sortedMembers = [...members].sort((a, b) => {
      const roleOrder = {
        [CouncilRole.CHAIRMAN]: 1,
        [CouncilRole.SECRETARY]: 2,
        [CouncilRole.REVIEWER_1]: 3,
        [CouncilRole.REVIEWER_2]: 4,
        [CouncilRole.MEMBER]: 5,
      }
      return (
        (roleOrder[a.role as keyof typeof roleOrder] || 99) -
        (roleOrder[b.role as keyof typeof roleOrder] || 99)
      )
    })

    const hdLines: string[] = []
    const ttLines: string[] = []
    const stkLines: string[] = []
    const nhLines: string[] = []
    let studentTotal = 0

    for (const m of sortedMembers) {
      const expert = m.expert
      let rolePrefix = "UV"
      let roleSuffix = ""

      if (m.role === CouncilRole.CHAIRMAN) rolePrefix = "CT"
      else if (m.role === CouncilRole.SECRETARY) rolePrefix = "TK"
      else if (m.role === CouncilRole.REVIEWER_1) roleSuffix = ", PB1"
      else if (m.role === CouncilRole.REVIEWER_2) roleSuffix = ", PB2"

      const org = expert?.organization ? `, ${expert.organization}` : ""
      const name = (getSupervisorName(expert, false, true) as string) || ""
      hdLines.push(`${rolePrefix}: ${name || ""}${org}${roleSuffix}`)

      const councilDefaults = resolveCouncilPayAmountsForProject(project, defaultCouncilPayAmounts)
      const inAcademy = !!(expert?.lecturerId || expert?.lecturer)
      const defaultAmount = getCouncilDefaultPayAmount(councilDefaults, m.role, inAcademy)

      let rawAmount = defaultAmount
      if (recreateAllPayments) {
        if (m.id && upsertCouncilPaymentRecord && !createdCouncilPaymentIds.has(m.id)) {
          const existingPaymentId = m.payment?.id as string | undefined
          const upserted = (await upsertCouncilPaymentRecord({
            councilMemberId: m.id,
            amount: defaultAmount,
            existingPaymentId,
          })) as { id?: string } | undefined
          m.payment = {
            ...m.payment,
            id: upserted?.id ?? existingPaymentId,
            amount: defaultAmount,
          }
          createdCouncilPaymentIds.add(m.id)
        }
      } else {
        rawAmount = resolveCouncilMemberPayAmount(m, expert, councilDefaults)
        const hasPaymentRecord = readDecimalAmount(m.payment?.amount) > 0
        if (!hasPaymentRecord && m.id && !createdCouncilPaymentIds.has(m.id)) {
          if (createCouncilPaymentRecord && defaultAmount > 0) {
            await createCouncilPaymentRecord({
              councilMemberId: m.id,
              amount: defaultAmount,
            })
            rawAmount = defaultAmount
            m.payment = { amount: defaultAmount }
            createdCouncilPaymentIds.add(m.id)
          }
        }
      }
      studentTotal += rawAmount
      ttLines.push(formatAmountWithComma(rawAmount))
      const bankNumber =
        expert?.lecturer?.userProfile?.bankAccountNumber ||
        expert?.bankAccountNumber ||
        "Chưa có thông tin"
      stkLines.push(bankNumber || "")
      const bankName =
        expert?.lecturer?.userProfile?.bankName || expert?.bankName || "Chưa có thông tin"

      nhLines.push(bankName || "")
    }

    const tableRow = {
      thongTinBaoVe,
      thongTinHoiDong: hdLines.join("\n"),
      thongTinThanhToan: ttLines.join("\n"),
      thongTinStk: stkLines.join("\n"),
      thongTinNganHang: nhLines.join("\n"),
      rawAmount: studentTotal,
    }

    if (!majorMap.has(majorName)) majorMap.set(majorName, [])
    majorMap.get(majorName)?.push(tableRow)
  }

  return Array.from(majorMap.entries()).map(([majorName, items]) => {
    const firstItem = studentsWithProject.find(
      (s) => s.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name === majorName
    )
    const project = getThesisProjectBySessionId(firstItem, thesisSessionId)
    const nguoiki = project?.thesisSession?.chief?.trim() || ""
    const dotXet = project?.thesisSession?.name || ""

    const tongTienSo = items.reduce((acc, curr) => {
      return acc + (Number(curr.rawAmount) || 0)
    }, 0)

    return {
      data: {
        ngay: now.format("DD"),
        thang: now.format("MM"),
        nam: now.format("YYYY"),
        khoa: firstItem?.fixedClass?.trainingCourse?.name || "",
        dotXet: dotXet,
        soQDBVLV: project?.thesisSession?.defenseDecisionNumber || "",
        chuyenNganh: majorName,
        khoaQuanLi: khoaquanli,
        tongTienBangSo: formatAmountWithComma(tongTienSo),
        nguoiki: nguoiki,
        tongTienBangChu: Number(tongTienSo).toVndWord("đồng"),
        data: items.map((item, index) => ({
          stt: index + 1,
          thongTinBaoVe: item.thongTinBaoVe,
          thongTinHoiDong: item.thongTinHoiDong,
          thongTinThanhToan: item.thongTinThanhToan,
          thongTinStk: item.thongTinStk,
          thongTinNganHang: item.thongTinNganHang,
          empty: "",
        })),
      },
    }
  })
}
export const exportDanhSachNopLuanVanThuVien = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách nộp luận văn thư viện")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để xuất danh sách nộp luận văn thư viện")
    return
  }
  const dataConvert = convertToDsnlvtvData(project)
  if (dataConvert.data.data.length === 0) {
    message.error("Chưa có dữ liệu để xuất danh sách nộp luận văn thư viện")
    return
  }
  try {
    showSpinner?.()
    //TODO : sửa lại payload
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "DanhSachNopLuanVanThuVien",
      path: "DanhSachNopLuanVanThuVien.xlsx",
      prefix: "mta/luan-van",
      payload: [dataConvert],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "DanhSachNopLuanVanThuVien.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    return
  } finally {
    hideSpinner?.()
  }
}
const convertToDsnlvtvData = (allStudentsInClasses: any[]): DsnlvtvData => {
  if (!allStudentsInClasses?.length) {
    return {
      data: {
        khoa: "",
        dotxet: "",
        nguoiki: "",
        data: [],
        tongSo: "0",
      },
    }
  }

  const firstProject = allStudentsInClasses.find((s) => s.thesisRegistrations?.[0]?.thesisProject)
    ?.thesisRegistrations[0].thesisProject

  const firstStudentWithProject = allStudentsInClasses.find(
    (s) => s?.thesisRegistrations?.[0]?.thesisProject
  )

  const tableData: DsnlvtvTable[] = []
  for (const student of allStudentsInClasses) {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    if (!project) continue

    const hoTen = student.userProfile?.fullname || ""
    const doiTuong = student?.fixedClass?.trainingCourse?.trainingObjectType?.name || ""
    const khoaHoc = student?.fixedClass?.trainingCourse?.name || ""
    const chuyenNganh =
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""

    const thongTinBaoVe = `${hoTen} \n ${doiTuong} - ${khoaHoc} - ${chuyenNganh}`

    const gvhd1 = (getSupervisorName(project.supervisor, false, true) as string) || ""
    const gvhd2 = (getSupervisorName(project.coSupervisor, false, true) as string) || ""

    let thongTinHuongDan = ""
    if (gvhd1 && gvhd2) {
      thongTinHuongDan = `1.${gvhd1};\n2.${gvhd2}.`
    } else {
      thongTinHuongDan = gvhd1 || gvhd2 || "Chưa có GVHD"
    }

    const thongTinDeTai = project.title || "Chưa có tên đề tài"

    //TODO: Thông tin Lưu trữ
    const lib = ""
    const thongTinLuuTru = lib

    tableData.push({
      stt: tableData.length + 1,
      thongTinBaoVe,
      thongTinHuongDan,
      thongTinDeTai,
      thongTinLuuTru,
    })
  }

  return {
    data: {
      nguoiki: firstProject?.thesisSession?.chief?.trim() || "",
      khoa:
        firstStudentWithProject?.fixedClass?.trainingCourse?.name ||
        allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name ||
        "",
      dotxet: firstProject?.thesisSession?.name || "",
      data: tableData,
      tongSo: tableData.length.toString(),
    },
  }
}
export const exportThongKeCbThamGiaHd = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
  defaultCouncilPayAmounts = [],
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất thống kê cán bộ tham gia HĐ")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để tạo thống kê cán bộ tham gia HĐ")
    return
  }
  try {
    showSpinner?.()
    const dataConvert = convertToThongKeCbThamGiaHdData(
      project,
      thesisSessionId,
      defaultCouncilPayAmounts
    )
    if (dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để xuất thống kê cán bộ tham gia HĐ")
      return
    }
    const items = dataConvert.map((item, idx) => ({
      ...item.data,
      tongThanhToan: formatAmountWithComma(Number(item.data.tongThanhToan || 0)),
      "ngắt trang": idx === dataConvert.length - 1 ? "" : "ngắt trang",
      data: item.data.data.map((row) => ({
        ...row,
        tong: row.tongSo,
        bank: row.tennganhang,
        thanhToan: formatAmountWithComma(Number(row.thanhToan || 0)),
      })),
    }))
    const response = await renderXlsxTemplate({
      templatePath: "ThongKeCanBoHoiDong.xlsx",
      prefix: "mta/luan-van",
      fileName: "ThongKeCbThamGiaHd.xlsx",
      mergeBlocksToOneSheet: true,
      sheets: items.map((item, idx) => ({
        data: item,
        pageBreakAfter: idx < items.length - 1,
      })),
    })
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    if (blob instanceof Blob) {
      downloadFile(blob, "ThongKeCbThamGiaHd.xlsx")
      message.success("Xuất file thành công")
    } else {
      message.error("Đã xảy ra lỗi khi tạo file Excel")
    }
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToThongKeCbThamGiaHdData = (
  allStudentsInClasses: any[],
  thesisSessionId?: string,
  defaultCouncilPayAmounts: DefaultCouncilPayAmountRow[] = []
): ThongKeCbThamGiaHdData[] => {
  if (!allStudentsInClasses || allStudentsInClasses.length === 0) return []

  const studentsWithProject = allStudentsInClasses.filter((student) =>
    Boolean(getThesisProjectWithCouncilBySessionId(student, thesisSessionId))
  )
  if (!studentsWithProject.length) {
    return []
  }

  const firstProject = getThesisProjectBySessionId(studentsWithProject[0], thesisSessionId)
  const councilDefaults = resolveCouncilPayAmountsForProject(firstProject, defaultCouncilPayAmounts)

  const expertStats = new Map<string, ThongKeCbThamGiaHdTable>()

  let totalParticipations = 0
  let totalCT = 0
  let totalTK = 0
  let totalUV = 0
  let totalPB1 = 0
  let totalPB2 = 0
  let totalThanhToan = 0

  studentsWithProject.forEach((student) => {
    const project = getThesisProjectBySessionId(student, thesisSessionId)
    if (!project?.council?.members?.length) return

    project.council.members.forEach((member: any) => {
      const expert = member.expert
      const name = (getSupervisorName(expert, false, false) as string) || ""
      const donViQuanLi = expert?.workplace || expert?.lecturer?.organization?.sTen || ""
      const stk =
        expert?.bankAccountNumber || expert?.lecturer?.userProfile?.bankAccountNumber || ""
      const tennganhang = expert?.bankName || expert?.lecturer?.userProfile?.bankName || ""
      if (!expert?.id) return
      const thanhtoan = resolveCouncilMemberPayAmount(member, expert, councilDefaults)

      if (!expertStats.has(expert.id)) {
        expertStats.set(expert.id, {
          stt: 0,
          tenThanhVien: name || "",
          donViQuanLi: donViQuanLi || "",
          thanhToan: 0,
          tongSo: 0,
          chuTich: 0,
          thuKi: 0,
          uyVien: 0,
          phanBien1: 0,
          phanBien2: 0,
          stk: stk || "",
          tennganhang: tennganhang || "",
        })
      }

      // biome-ignore lint/style/noNonNullAssertion: id của export luôn có
      const stats = expertStats.get(expert.id)!
      stats.thanhToan += thanhtoan
      totalThanhToan += thanhtoan
      stats.tongSo++
      totalParticipations++

      switch (member.role) {
        case CouncilRole.CHAIRMAN:
          stats.chuTich++
          totalCT++
          break
        case CouncilRole.SECRETARY:
          stats.thuKi++
          totalTK++
          break
        case CouncilRole.REVIEWER_1:
          stats.phanBien1++
          totalPB1++
          break
        case CouncilRole.REVIEWER_2:
          stats.phanBien2++
          totalPB2++
          break
        case CouncilRole.MEMBER:
          stats.uyVien++
          totalUV++
          break
      }
    })
  })

  const tableRows = Array.from(expertStats.values())
  if (tableRows.length === 0) {
    return []
  }
  tableRows.forEach((row, index) => {
    row.stt = index + 1
  })

  const firstStudentWithProject = studentsWithProject[0]
  if (!firstStudentWithProject) {
    return []
  }
  const headerProject = getThesisProjectBySessionId(firstStudentWithProject, thesisSessionId)

  const result: ThongKeCbThamGiaHdData[] = [
    {
      data: {
        trainingCourseTitle:
          firstStudentWithProject.fixedClass?.trainingCourse?.name?.toUpperCase() || "",
        trainingCourse: firstStudentWithProject.fixedClass?.trainingCourse?.name || "",
        chuyenNganh: "Tất cả chuyên ngành",
        dotXet: headerProject?.thesisSession?.name || "",
        tong: totalParticipations,
        tongChuTich: totalCT,
        tongThuky: totalTK,
        tongUyVien: totalUV,
        tongPhanBien1: totalPB1,
        tongPhanBien2: totalPB2,
        tongThanhToan: totalThanhToan,
        data: tableRows,
      },
    },
  ]

  return result
}
export const exportThanhToanHuongDanTrongHv = async ({
  allStudentsInClasses,
  studentIds,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  recreateAllPayments = false,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất thanh toán hướng dẫn")
    return []
  }
  if (!thesisSessionId) {
    message.warning("Vui lòng chọn đợt xét luận văn trước khi xuất.")
    return []
  }
  const scopeStudentIds = studentIds?.length
    ? studentIds
    : allStudentsInClasses.map((student) => student.id).filter(Boolean)
  try {
    showSpinner?.()
    const syncResponse = await syncThesisSupervisorPayments({
      thesisSessionId,
      studentIds: scopeStudentIds,
      recreateAll: recreateAllPayments,
    })
    if (syncResponse.status !== 200) {
      message.error(
        "message" in syncResponse.data
          ? syncResponse.data.message
          : "Đồng bộ thanh toán hướng dẫn thất bại"
      )
      return []
    }

    const exportResponse = await exportThesisSupervisorPayments({
      thesisSessionId,
      studentIds: scopeStudentIds,
    })
    if (exportResponse.status !== 200 || !(exportResponse.data instanceof Blob)) {
      message.error(
        exportResponse.data &&
          typeof exportResponse.data === "object" &&
          "message" in exportResponse.data
          ? String(exportResponse.data.message)
          : "Xuất file thanh toán hướng dẫn thất bại"
      )
      return []
    }
    downloadFile(exportResponse.data, "ThanhToanHuongDan.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToThanhToanHuongDanTrongHvData = async (
  allStudentsInClasses: any[],
  thesisSessionId?: string,
  ensureSupervisorPaymentsForExport?: (
    projects: any[],
    options?: { recreateAll?: boolean }
  ) => Promise<void>,
  defaultSupervisorPayAmounts: DefaultSupervisorPayAmountRow[] = [],
  recreateAllPayments = false
): Promise<{
  groups: ThanhToanHuongDanTrongHvData[]
  studentsInSession: number
  studentsWithSupervisor: number
}> => {
  if (!allStudentsInClasses?.length) {
    return { groups: [], studentsInSession: 0, studentsWithSupervisor: 0 }
  }
  const now = dayjs()
  const organizationMap = new Map<string, ThanhToanHuongDanTrongHvData>()
  const studentsWithProject = allStudentsInClasses.filter((student) => {
    return Boolean(getThesisProjectBySessionId(student, thesisSessionId))
  })
  if (!studentsWithProject.length) {
    return { groups: [], studentsInSession: 0, studentsWithSupervisor: 0 }
  }

  const projectsInSession = studentsWithProject
    .map((student) => getThesisProjectBySessionId(student, thesisSessionId))
    .filter((project): project is NonNullable<typeof project> => Boolean(project))

  if (ensureSupervisorPaymentsForExport) {
    await ensureSupervisorPaymentsForExport(projectsInSession, {
      recreateAll: recreateAllPayments,
    })
  }

  let studentsWithSupervisor = 0
  for (const student of studentsWithProject) {
    const project = getThesisProjectBySessionId(student, thesisSessionId)
    if (!project) continue

    const supervisorRows = buildSupervisorPaymentRows(project, defaultSupervisorPayAmounts)

    if (!supervisorRows.length) continue
    studentsWithSupervisor += 1

    const orgName = project.organization?.sTen || "Chưa có đơn vị"

    if (!organizationMap.has(orgName)) {
      organizationMap.set(orgName, {
        data: {
          ngay: now.format("DD"),
          thang: now.format("MM"),
          nam: now.format("YYYY"),
          khoa: student.fixedClass?.trainingCourse?.name || "",
          dotXet: project.thesisSession?.name || "",
          nguoiki: project.thesisSession?.chief?.trim() || "",
          khoaQuanLi: orgName,
          soHocVien: "0",
          tongTienSo: 0,
          tongTienChu: "",
          data: [],
        },
      })
    }

    // biome-ignore lint/style/noNonNullAssertion: orgName luôn có
    const currentGroup = organizationMap.get(orgName)!

    const qdNum = project.thesisSession?.decisionNumber || "...."
    const qdDate = project.thesisSession?.decisionDate
      ? dayjs(project.thesisSession.decisionDate).format("DD/MM/YYYY")
      : ".../.../...."

    const quyetDinh = `${qdNum} \n ngày ${qdDate}`

    const supervisorNames = supervisorRows.map(
      (item) => (getSupervisorName(item.expert, false, true) as string) || ""
    )
    let thongTinHuongDan = ""
    thongTinHuongDan =
      supervisorNames.length > 1
        ? supervisorNames.map((name, index) => `${index + 1}. ${name}`).join("\n")
        : (supervisorNames[0] ?? "Chưa có GVHD")

    const tenKhoa = student.fixedClass?.trainingCourse?.name || ""
    const thongTinKhoaStr = `${tenKhoa}`

    const amounts = supervisorRows.map((item) => item.amount)
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
    const tienThanhToan = totalAmount === 0 ? 0 : totalAmount
    const thongTinThanhToan =
      totalAmount === 0 ? "" : amounts.map((a) => formatAmountWithComma(a)).join("\n")
    const thongTinStk = supervisorRows.map((item) => item.bankAccountNumber).join("\n")
    const thongTinBank = supervisorRows.map((item) => item.bankName).join("\n")
    currentGroup.data.data.push({
      stt: currentGroup.data.data.length + 1,
      quyetDinh: quyetDinh,
      thongTinHuongDan: thongTinHuongDan,
      thongTinBaoVe: student.userProfile?.fullname || "",
      thongTinKhoa: thongTinKhoaStr,
      thongTinThanhToan: thongTinThanhToan,
      thongTinStk: thongTinStk,
      thongTinBank: thongTinBank,
      thongtinKyNhan: "",
      tienThanhToan: tienThanhToan,
    })

    currentGroup.data.soHocVien = currentGroup.data.data.length.toString()
    currentGroup.data.tongTienSo += tienThanhToan || 0
    currentGroup.data.tongTienChu = Number(currentGroup.data.tongTienSo).toVndWord("đồng")
  }

  return {
    groups: Array.from(organizationMap.values()),
    studentsInSession: studentsWithProject.length,
    studentsWithSupervisor,
  }
}
export const exportKetQuaBaoVeLuanVan = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất kết quả bảo vệ luan van")
    return []
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để xuất kết quả bảo vệ luan van")
    return []
  }
  try {
    showSpinner?.()
    const dataConvert = convertToKqbvlvData(project)

    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất kết quả bảo vệ luan van")
      return []
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "KetQuaBaoVeLuanVan",
      path: "KetQuaBaoVeLuanVan.xlsx",
      prefix: "mta/luan-van",
      payload: [dataConvert],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, "KetQuaBaoVeLuanVan.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToKqbvlvData = (allStudentsInClasses: any[]): KqbvlvData => {
  if (!allStudentsInClasses?.length) {
    return {
      data: {
        total: 0,
        totalXuatSac: 0,
        totalTyLeXuatSac: 0,
        totalGioi: 0,
        totalTyLeGioi: 0,
        totalKha: 0,
        totalTyLeKha: 0,
        totalTB: 0,
        totalTyLeTB: 0,
        data: [],
      },
    }
  }

  const majorMap = new Map<string, any>()

  allStudentsInClasses.forEach((student) => {
    const majorName =
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "Chưa xác định"
    const score = student?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore

    if (score === null || score === undefined) return

    if (!majorMap.has(majorName)) {
      majorMap.set(majorName, { xuatSac: 0, gioi: 0, kha: 0, trungBinh: 0, total: 0 })
    }

    const stats = majorMap.get(majorName)
    stats.total++

    const numScore = Number(score)
    if (numScore >= 9.0) stats.xuatSac++
    else if (numScore >= 8.0) stats.gioi++
    else if (numScore >= 7.0) stats.kha++
    else stats.trungBinh++
  })

  let globalTotal = 0
  let gXS = 0
  let gG = 0
  let gK = 0
  let gTB = 0

  const tableData: KqbvlvTable[] = Array.from(majorMap.entries()).map(([name, s], index) => {
    globalTotal += s.total

    gXS += s.xuatSac
    gG += s.gioi
    gK += s.kha
    gTB += s.trungBinh
    const tongSo = s.xuatSac + s.gioi + s.kha + s.trungBinh
    const tyLeXuatSac = Number(((s.xuatSac / tongSo) * 100).toFixed(2))
    const tyLeGioi = Number(((s.gioi / tongSo) * 100).toFixed(2))
    const tyLeKha = Number(((s.kha / tongSo) * 100).toFixed(2))
    const tyLeTB = Number(((s.trungBinh / tongSo) * 100).toFixed(2))

    return {
      stt: index + 1,
      chuyenNganh: name,
      tongSo: tongSo,
      soLuongXuatSac: s.xuatSac,
      tyLeXuatSac: tyLeXuatSac,
      soLuongGioi: s.gioi,
      tyLeGioi: tyLeGioi,
      soLuongKha: s.kha,
      tyLeKha: tyLeKha,
      soLuongTB: s.trungBinh,
      tyLeTB: tyLeTB,
    }
  })

  const getGlobalRate = (part: number) =>
    globalTotal > 0 ? Number(((part / globalTotal) * 100).toFixed(2)) : 0

  return {
    data: {
      total: globalTotal,
      totalXuatSac: gXS,
      totalTyLeXuatSac: getGlobalRate(gXS),
      totalGioi: gG,
      totalTyLeGioi: getGlobalRate(gG),
      totalKha: gK,
      totalTyLeKha: getGlobalRate(gK),
      totalTB: gTB,
      totalTyLeTB: getGlobalRate(gTB),
      data: tableData,
    },
  }
}
export const exportBanSaoHDDGLV = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
  signerName,
  isChief,
  signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất bản sao hội đồng bảo vệ luan van")
    return []
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  try {
    showSpinner?.()
    const dataConvert = convertToBanSaoHDDGLV(project, signerName, isChief, signingDate)

    if (!dataConvert || dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để xuất bản sao hội đồng bảo vệ luan van")
      return
    }
    const payload = {
      fileName: "BanSaoHoiDongDanhGiaLuanVan",
      path: "BanSaoHoiDongDanhGiaLuanVan.docx",
      prefix: "mta/luan-van",
      data: {
        items: dataConvert.map((item: banSaoHDDGLV) => item.data),
      },
    }
    const response = await docxTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, "BanSaoHoiDongDanhGiaLuanVan.docx")
    message.success("Xuất file thành công")
  } catch (error) {
    console.error("exportBanSaoHDDGLV error:", error)
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToBanSaoHDDGLV = (
  allStudentsInClasses: any[],
  signerName?: string,
  isChief?: boolean,
  signingDate?: Date | string
): banSaoHDDGLV[] => {
  if (!allStudentsInClasses?.length) return []

  const now = resolveSigningDate(signingDate)
  const currentDay = now.format("DD")
  const currentMonth = now.format("MM")
  const currentYear = now.format("YYYY")

  return allStudentsInClasses
    .filter((student) => student?.thesisRegistrations?.[0]?.thesisProject != null)
    .map((student) => {
      const project = student?.thesisRegistrations?.[0]?.thesisProject

      const session = project?.thesisSession
      const nguoikibvlv = project?.thesisSession?.defenseDecisionMaker?.trim() || ""
      const qddtKyTokens = nguoikibvlv.split(/\s+/).filter(Boolean)
      const chucVuNguoiKyQddt = qddtKyTokens[0] ?? ""
      const tenNguoiKyQddt = qddtKyTokens.slice(1).join(" ").trim()
      const members = project?.council?.members || []

      const findMember = (role: CouncilRole) => members.find((m: any) => m.role === role)

      const chairman = findMember(CouncilRole.CHAIRMAN)
      const secretary = findMember(CouncilRole.SECRETARY)
      const member = findMember(CouncilRole.MEMBER)
      const pb1 = findMember(CouncilRole.REVIEWER_1)
      const pb2 = findMember(CouncilRole.REVIEWER_2)
      const qdDate = session?.defenseDecisionDate ? dayjs(session.defenseDecisionDate) : null
      let gvhd1 = ""
      if (project?.supervisor) {
        gvhd1 = (getSupervisorName(project?.supervisor, false, false) as string) || ""
      }
      let gvhd2 = ""
      if (project?.coSupervisor) {
        gvhd2 = (getSupervisorName(project?.coSupervisor, false, false) as string) || ""
      }
      const loaiLuanVan = project?.type?.trim().toLowerCase() || ""
      const nganh =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
      const chuyenNganh =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
      const deTai = project?.title || ""
      const tenhocvien = student.userProfile?.fullname || ""
      const ngaysinh = formatBirthDate(student.userProfile?.dateOfBirth)
      const khoaHoc = student.fixedClass?.trainingCourse?.name || ""
      const nienkhoahoc = student.fixedClass?.trainingCourse?.academicYear || ""
      const gvhd = [gvhd1, gvhd2]
        .filter(Boolean)
        .map((v, i, arr) => (arr.length > 1 ? `${i + 1}. ${v}` : v))
        .join(", ")

      const { day: ngayTlVal, month: thangTlVal } = formatDocDate(session?.defenseDecisionDate)

      return {
        data: {
          text1: chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT. GIÁM ĐỐC",
          text2: chucVuNguoiKyQddt === "GĐ" ? "" : "PHÓ GIÁM ĐỐC",
          nguoiki1: tenNguoiKyQddt,
          text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          text4: isChief ? "" : "PHÓ TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          nguoiki2: signerName || "",

          soQd: session?.defenseDecisionNumber || "",
          ngayTl: ngayTlVal,
          thangTl: thangTlVal,
          namTl: qdDate ? qdDate.format("YYYY") : "",
          khoa: session?.trainingCourse?.name || "",
          dotXet: session?.name || "",
          loaiLuanVan: loaiLuanVan,
          councilReport: session?.councilReport || "",

          deTai: deTai,
          nganh: nganh,
          chuyenNganh: chuyenNganh,
          tenHocVien: tenhocvien,
          ngaySinh: ngaysinh,
          khoaHoc: khoaHoc,
          nienkhoahoc: nienkhoahoc,
          gvhd: gvhd,
          tenChuTich: (getSupervisorName(chairman?.expert, false, false) as string) || "",
          toChucChuTich: chairman?.expert?.workplace || "HVKTQS",

          tenThuKy: (getSupervisorName(secretary?.expert, false, false) as string) || "",
          toChucThuKy: secretary?.expert?.workplace || "HVKTQS",
          tenUyVien: (getSupervisorName(member?.expert, false, false) as string) || "",
          toChucUyVien: member?.expert?.workplace || "HVKTQS",
          tenPb1: (getSupervisorName(pb1?.expert, false, false) as string) || "",
          toChucPb1: pb1?.expert?.workplace || "HVKTQS",
          tenPb2: (getSupervisorName(pb2?.expert, false, false) as string) || "",
          toChucPb2: pb2?.expert?.workplace || "HVKTQS",
          ngay: currentDay,
          thang: currentMonth,
          nam: currentYear,
        },
      }
    })
}
export const exportPhuLucQdhdd = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất phụ lục QĐHĐ")
    return []
  }
  const project = allStudentsInClasses.map((student) => {
    const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
    if (!thesisProject) return null
    return {
      ...student,
      thesisRegistrations: [{ thesisProject }],
    }
  })
  try {
    showSpinner?.()
    const dataConvert = convertToPhuLucQdhdTemplateData(project)
    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất phụ lục QĐHĐ")
      return []
    }
    const payloadRows = dataConvert.data.flatMap((major: PhuLucQdhdData) =>
      major.data.data.map((row: PhuLucQdhdTable, rowIdx: number) => ({
        sttChuyenNganh: rowIdx === 0 ? major.data.sttChuyenNganh : "",
        tenChuyenNganh: rowIdx === 0 ? major.data.tenChuyenNganh : "",
        sttHoiDong: row.sttHoiDong,
        loaiLuanVan: row.loaiLuanVan,
        nganh: row.nganh,
        tenDeTai: row.tenDeTai,
        tenHocVien: row.tenHocVien,
        ngaySinh: row.ngaySinh,
        khoaHoc: row.khoaHoc,
        gvhd1: row.gvhd1,
        gvhd2: row.gvhd2,
        tenChuTich: row.tenChuTich,
        toChucChuTich: row.toChucChuTich,
        tenThuKy: row.tenThuKy,
        toChucThuKy: row.toChucThuKy,
        tenUyVien: row.tenUyVien,
        toChucUyVien: row.toChucUyVien,
        tenPb1: row.tenPb1,
        toChucPb1: row.toChucPb1,
        tenPb2: row.tenPb2,
        toChucPb2: row.toChucPb2,
      }))
    )
    const payload = {
      fileName: "PhuLucQdhd",
      path: "PhuLucQDHoiDong.docx",
      prefix: "mta/luan-van",
      data: {
        ...dataConvert.head.data,
        ...dataConvert.tail.data,
        items: payloadRows,
      },
    }
    const response = await docxTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, "PhuLucQdhd.docx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToPhuLucQdhdTemplateData = (allStudentsInClasses: any[]): PhuLucQdhdTemplateData => {
  if (!allStudentsInClasses?.length) {
    return {
      head: { data: { khoa: "", dotXet: "", soQd: "", ngayQd: "" } },
      tail: { data: { soHoiDong: "0" } },
      data: [],
    }
  }

  const firstStudent =
    allStudentsInClasses.find((student) => student?.thesisRegistrations?.[0]?.thesisProject) ||
    allStudentsInClasses[0]
  const firstProject = firstStudent?.thesisRegistrations?.[0]?.thesisProject
  const session = firstProject?.thesisSession

  const head: PhuLucQdhdHead = {
    data: {
      khoa: firstStudent?.fixedClass?.trainingCourse?.name || "",
      dotXet: session?.name || "",
      soQd: session?.defenseDecisionNumber || "",
      ngayQd: session?.defenseDecisionDate
        ? dayjs(session.defenseDecisionDate).format("DD/MM/YYYY")
        : "",
    },
  }

  const majorMap = new Map<string, any[]>()
  allStudentsInClasses.forEach((student) => {
    if (!student?.thesisRegistrations?.[0]?.thesisProject) return
    const majorName =
      student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "Chưa xác định"
    const trainingField =
      student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
    const groupName = trainingField || majorName
    const groupKey =
      trainingField && trainingField !== majorName
        ? `Ngành ${groupName} (CHUYÊN NGÀNH ${majorName.toUpperCase()})`
        : `Ngành ${groupName}`
    if (!majorMap.has(groupKey)) {
      majorMap.set(groupKey, [])
    }
    majorMap.get(groupKey)?.push(student)
  })

  let totalCouncils = 0
  const groupedData: PhuLucQdhdData[] = []
  let majorIndex = 1

  majorMap.forEach((students, groupKey) => {
    const validStudents = students.filter(
      (student) =>
        student?.thesisRegistrations?.[0]?.thesisProject &&
        student?.thesisRegistrations?.[0]?.thesisProject?.council
    )
    if (!validStudents.length) {
      return
    }
    const tableRows: PhuLucQdhdTable[] = validStudents.map((student, studentIdx) => {
      const project = student.thesisRegistrations?.[0]?.thesisProject
      const members = project?.council?.members || []
      totalCouncils++

      const getMember = (role: CouncilRole) => members.find((m: any) => m.role === role)

      const chairman = getMember(CouncilRole.CHAIRMAN)
      const secretary = getMember(CouncilRole.SECRETARY)
      const reviewer1 = getMember(CouncilRole.REVIEWER_1)
      const reviewer2 = getMember(CouncilRole.REVIEWER_2)
      const member = getMember(CouncilRole.MEMBER)
      const ngaySinhStr = formatBirthDate(student.userProfile?.dateOfBirth)
      const khoaHocStr = student.fixedClass?.trainingCourse?.name || ""
      const rawGvhd1 = (getSupervisorName(project?.supervisor, false, false) as string) || ""
      const rawGvhd2 = (getSupervisorName(project?.coSupervisor, false, false) as string) || ""
      const hasTwoGvhd = Boolean(rawGvhd1 && rawGvhd2)
      const gvhd1 = hasTwoGvhd ? `1. ${rawGvhd1}` : rawGvhd1
      const gvhd2 = hasTwoGvhd ? `2. ${rawGvhd2}` : rawGvhd2
      return {
        sttHoiDong: (studentIdx + 1).toString(),
        loaiLuanVan: project?.type?.trim().toLowerCase() || "luận văn",
        nganh: groupKey,
        tenDeTai: project?.title?.trim().replace(/\s+/g, " ") || "",
        tenHocVien: student.userProfile?.fullname || "",
        ngaySinh: ngaySinhStr,
        khoaHoc: khoaHocStr,
        gvhd1,
        gvhd2,

        tenChuTich: (getSupervisorName(chairman?.expert, false, false) as string) || "",
        toChucChuTich: chairman?.expert?.workplace || "Học viện KTQS",

        tenThuKy: (getSupervisorName(secretary?.expert, false, false) as string) || "",
        toChucThuKy: secretary?.expert?.workplace || "Học viện KTQS",

        tenUyVien: (getSupervisorName(member?.expert, false, false) as string) || "",
        toChucUyVien: member?.expert?.workplace || "Học viện KTQS",

        tenPb1: (getSupervisorName(reviewer1?.expert, false, false) as string) || "",
        toChucPb1: reviewer1?.expert?.workplace || "Học viện KTQS",

        tenPb2: (getSupervisorName(reviewer2?.expert, false, false) as string) || "",
        toChucPb2: reviewer2?.expert?.workplace || "Học viện KTQS",
      }
    })

    groupedData.push({
      data: {
        sttChuyenNganh: toRoman(majorIndex),
        tenChuyenNganh: `${groupKey.toUpperCase()} (${tableRows.length} HỘI ĐỒNG)`,
        data: tableRows,
      },
    })
    majorIndex++
  })

  return {
    head,
    tail: { data: { soHoiDong: totalCouncils.toString() } },
    data: groupedData,
  }
}
export const exportDsChuyenGia = async ({
  allStudentsInClasses,
  showSpinner,
  thesisSessionId,
  hideSpinner,
  message,
  moneyAmount,
  signingDate,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách chuyên gia")
    return []
  }
  try {
    const dataConvert = convertToDsChuyenGiaData(
      allStudentsInClasses,
      thesisSessionId,
      moneyAmount,
      signingDate
    )
    if (!dataConvert.length) {
      message.error("Chưa có dữ liệu để xuất danh sách chuyên gia")
      return []
    }
    showSpinner?.()
    const response = await renderXlsxTemplate({
      templatePath: "DanhSachChuyenGia.xlsx",
      prefix: "mta/luan-van",
      fileName: "DsChuyenGia.xlsx",
      mergeBlocksToOneSheet: true,
      sheets: dataConvert.map((item, idx) => ({
        data: item.data as Record<string, unknown>,
        pageBreakAfter: idx < dataConvert.length - 1,
      })),
    })
    if (response.status !== 200) {
      const errMsg =
        typeof response.data === "object" && response.data && "message" in response.data
          ? String((response.data as { message?: string }).message)
          : ""
      message.error(errMsg || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    downloadFile(response.data, "DsChuyenGia.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : ""
    message.error(errMsg || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToDsChuyenGiaData = (
  allStudentsInClasses: any[],
  thesisSessionId?: string,
  moneyAmount?: number,
  signingDate?: Date | string
): DsChuyenGiaData[] => {
  if (!allStudentsInClasses?.length) {
    return []
  }

  const slotGroups = new Map<
    string,
    { students: any[]; defenseDate: string; defenseTime: string; defenseRoom: string }
  >()
  const now = resolveSigningDate(signingDate)

  allStudentsInClasses.forEach((student) => {
    const project = student?.thesisRegistrations?.find(
      (reg: any) => reg?.thesisProject?.thesisSession?.id === thesisSessionId
    )?.thesisProject
    if (!project) return
    const defenseDate = project.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : ""
    const defenseTime = formatDefenseSessionClock(project.defenseSession?.startTime)
    const defenseRoom = project.room?.name || project.room?.code || project.roomId || ""
    const slotKey = `${defenseDate}|${defenseTime}|${defenseRoom}`
    if (!slotGroups.has(slotKey)) {
      slotGroups.set(slotKey, {
        students: [],
        defenseDate,
        defenseTime,
        defenseRoom,
      })
    }
    slotGroups.get(slotKey)?.students.push(student)
  })

  const sortedSlotGroups = Array.from(slotGroups.values()).sort((a, b) => {
    const aDate = a.defenseDate ? dayjs(a.defenseDate, "DD/MM/YYYY") : null
    const bDate = b.defenseDate ? dayjs(b.defenseDate, "DD/MM/YYYY") : null
    const nowStart = now.startOf("day")

    if (aDate && bDate) {
      const aDiff = Math.abs(aDate.startOf("day").diff(nowStart, "day"))
      const bDiff = Math.abs(bDate.startOf("day").diff(nowStart, "day"))
      if (aDiff !== bDiff) return aDiff - bDiff
      if (!aDate.isSame(bDate, "day")) return aDate.valueOf() - bDate.valueOf()
    } else if (aDate || bDate) {
      return aDate ? -1 : 1
    }

    if (a.defenseTime !== b.defenseTime) {
      return a.defenseTime.localeCompare(b.defenseTime)
    }

    return a.defenseRoom.localeCompare(b.defenseRoom)
  })

  return sortedSlotGroups.map(
    ({ defenseDate, defenseTime, defenseRoom, students: studentsInSlot }) => {
      const expertAggregator = new Map<string, any>()
      let nguoiki = ""

      studentsInSlot.forEach((student) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject
        if (!project) return
        const members = project.council?.members || []
        nguoiki = project.thesisSession?.chief?.trim() || nguoiki

        members.forEach((member: any) => {
          const expert = member.expert
          if (!expert || expert.lecturerId || expert.lecturer) return

          const expertId = expert.id
          const amount = Number(member.payment?.amount || 0)

          if (!expertAggregator.has(expertId)) {
            expertAggregator.set(expertId, {
              tenChuyenGia: (getSupervisorName(expert, false, false) as string) || "",
              chucVu: expert.position || expert.lecturer?.userProfile?.position || "",
              donViQuanLi: expert.organization || expert.workplace || "",
              soTienRaw: 0,
              stk: expert.bankAccountNumber || "",
              ngangHang: expert.bankName || "",
            })
          }

          const current = expertAggregator.get(expertId)
          current.soTienRaw += amount
        })
      })

      let totalSumFromData = 0
      const tableData: DsChuyenGiaTable[] = Array.from(expertAggregator.values()).map(
        (item, index) => {
          totalSumFromData += item.soTienRaw
          const guestAmount =
            typeof moneyAmount === "number" && Number.isFinite(moneyAmount) && moneyAmount > 0
              ? moneyAmount
              : item.soTienRaw
          return {
            stt: (index + 1).toString(),
            tenChuyenGia: item.tenChuyenGia,
            chucVu: item.chucVu,
            donViQuanLi: item.donViQuanLi,
            //todo: đổi định dạng tiền sang dấu phẩy ngăn cách hàng nghìn
            soTien: formatAmountWithComma(guestAmount),
            stk: item.stk,
            ngangHang: item.ngangHang,
            kiNhan: "",
          }
        }
      )
      const hasGuestAmount =
        typeof moneyAmount === "number" && Number.isFinite(moneyAmount) && moneyAmount > 0
      const totalSum = hasGuestAmount
        ? (moneyAmount as number) * tableData.length
        : totalSumFromData

      return {
        data: {
          nguoiki: nguoiki,
          ngay: now.format("DD"),
          thang: now.format("MM"),
          nam: now.format("YYYY"),
          diaDiem: defenseRoom,
          thoiGian: [defenseDate, defenseTime].filter(Boolean).join(" "),
          //todo: đổi định dạng tổng tiền sang dấu phẩy ngăn cách hàng nghìn
          tongTienSo: formatAmountWithComma(totalSum),
          soChuyenGia: tableData.length,
          tongTienChu: Number(totalSum).toVndWord("đồng"),
          data: tableData,
        },
      }
    }
  )
}
export const exportHDDanhGiaLuanVan = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách đánh giá luan van")
    return []
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  try {
    const dataConvert = convertToHDDanhGiaLuanVanTemplateData(project)
    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất danh sách đánh giá luan van")
      return []
    }
    if (!dataConvert.data.length) {
      message.error("Chưa có dữ liệu để xuất danh sách đánh giá luan van")
      return []
    }
    showSpinner?.()
    const payload: ExcelTemplateBody = {
      head: {
        data: {
          khoa: dataConvert.head.khoa,
          tenDonViQuanLi: dataConvert.head.tenDonViQuanLi,
        },
      },
      tail: { data: dataConvert.tail },
      fileName: "HDDanhGiaLuanVan",
      path: "DeNghiHDDanhGiaLuanVan.xlsx",
      prefix: "mta/luan-van",
      payload: dataConvert.data.map((org) => ({
        data: {
          tenDonViQuanLi: org.tenDonViQuanLi,
          data: org.data.map((row) => ({
            stt: row.stt,
            maHv: row.maHv,
            ngaySinh: row.ngaySinh,
            hocVienCanBoHuongDan: row.hocVienCanBoHuongDan,
            deTai: row.deTai,
            gioBaoVe: row.gioBaoVe,
            ngayBaoVe: row.ngayBaoVe,
            diaDiem: row.diaDiem,
            tenChuTich: row.tenChuTich,
            tenThuKi: row.tenThuKy,
            tenUyVien: row.tenUyVien,
            tenPb1: row.tenPb1,
            tenPb2: row.tenPb2,
          })),
        },
      })),
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, "DeNghiHDDanhGiaLuanVan.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToHDDanhGiaLuanVanTemplateData = (
  allStudentsInClasses: any[]
): HDDanhGiaLuanVanTemplateData => {
  if (!allStudentsInClasses?.length) {
    return {
      head: { khoa: "", tenDonViQuanLi: "" },
      tail: { tongSoHocVien: 0, ngay: "", thang: "", nam: "" },
      data: [],
    }
  }

  const now = dayjs()
  const orgMap = new Map<string, { code: string; name: string; students: any[] }>()

  allStudentsInClasses
    .filter((student) => student?.thesisRegistrations?.[0]?.thesisProject != null)
    .forEach((student) => {
      const project = student?.thesisRegistrations?.[0]?.thesisProject
      if (!project) return

      const organization = project.organization
      const orgId = organization?.Id || "no-id"
      const orgCode = organization?.sCode || "..."
      const orgName = organization?.sTen || "Chưa có đơn vị"

      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, {
          code: orgCode,
          name: orgName,
          students: [],
        })
      }

      const orgEntry = orgMap.get(orgId)
      if (!orgEntry) return
      orgEntry.students.push(student)
    })

  const groupedData: HDDanhGiaLuanVanData[] = Array.from(orgMap.values()).map((org, index) => {
    const validStudents = org.students.filter(
      (student) => student?.thesisRegistrations?.[0]?.thesisProject
    )
    const tableData: HDDanhGiaLuanVanTable[] = validStudents.map((student: any, sIdx: number) => {
      const project = student.thesisRegistrations?.[0]?.thesisProject
      const members = project?.council?.members || []

      const findMemberName = (role: CouncilRole) =>
        (getSupervisorName(
          members.find((m: any) => m.role === role)?.expert,
          false,
          true
        ) as string) || ""

      const gvhd1 = project?.supervisor
      const gvhd2 = project?.coSupervisor

      let hvCbhd = `Học viên: ${student.userProfile?.fullname || ""}`
      if (gvhd1) hvCbhd += `\nGVHD1: ${(getSupervisorName(gvhd1, false, true) as string) || ""}`
      if (gvhd2) hvCbhd += `\nGVHD2: ${(getSupervisorName(gvhd2, false, true) as string) || ""}`

      return {
        stt: sIdx + 1,
        maHv: student.userProfile?.code || "",
        ngaySinh: formatBirthDate(student.userProfile?.dateOfBirth),
        hocVienCanBoHuongDan: hvCbhd,
        deTai: project?.title || "",
        gioBaoVe: project?.defenseSession?.startTime
          ? dayjs(project.defenseSession.startTime).format("HH:mm")
          : "",
        ngayBaoVe: project?.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : "",

        diaDiem: project?.room?.name || "",
        tenChuTich: findMemberName(CouncilRole.CHAIRMAN),
        tenThuKy: findMemberName(CouncilRole.SECRETARY),
        tenUyVien: findMemberName(CouncilRole.MEMBER),
        tenPb1: findMemberName(CouncilRole.REVIEWER_1),
        tenPb2: findMemberName(CouncilRole.REVIEWER_2),
      }
    })

    return {
      tenDonViQuanLi: `${index + 1}. ${org.code}-${org.name}: ${org.students.length} học viên`,
      data: tableData,
    }
  })

  const rawKhoa = allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name || ""
  const khoaHead = rawKhoa.replace(/^\s*khóa\s+/i, "").trim() || rawKhoa

  return {
    head: {
      khoa: khoaHead,
      tenDonViQuanLi: groupedData.map((g) => g.tenDonViQuanLi).join("\n"),
    },
    tail: {
      tongSoHocVien: allStudentsInClasses.filter(
        (student) => student?.thesisRegistrations?.[0]?.thesisProject != null
      ).length,
      ngay: now.date().toString(),
      thang:
        now.month() + 1 === 1 || now.month() + 1 === 2
          ? (now.month() + 1).toString().padStart(2, "0")
          : (now.month() + 1).toString(),
      nam: now.format("YYYY"),
    },
    data: groupedData,
  }
}
interface ThongKeCoQuanDonViCanBoNgoaiHvData {
  khoa: string
  dotxet: string
  data: ThongKeCoQuanDonViCanBoNgoaiHvTable[]
}
interface ThongKeCoQuanDonViCanBoNgoaiHvTable {
  stt: number
  tenDonVi: string
  soLuongGVHD: number
  soLuongBV: number
  soLuongHDNC: number
  soLuongDGNC: number
  tongSoLuong: number
}
const convertToThongKeCoQuanDonViCanBoNgoaiHvData = (
  allStudentsInClasses: any[]
): ThongKeCoQuanDonViCanBoNgoaiHvData => {
  if (!allStudentsInClasses?.length) {
    return {
      khoa: "",
      dotxet: "",
      data: [],
    }
  }

  const firstProject = allStudentsInClasses
    .map(
      (student) =>
        student?.thesisRegistrations?.find((registration: any) => registration?.thesisProject)
          ?.thesisProject
    )
    .find(Boolean)

  const khoa =
    firstProject?.thesisSession?.trainingCourses?.map((c: any) => c.name).join(", ") ||
    allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name ||
    ""
  const dotxet = firstProject?.thesisSession?.name || ""

  const isOutsideExpert = (expert: any) => {
    if (!expert) return false
    return !(expert?.lecturer || expert?.lecturerId)
  }

  const getExpertKey = (expert: any, workplace: string) => {
    if (expert?.id) return String(expert.id)
    const fullName = getSupervisorName(expert, false, true) as string
    return `${fullName || "unknown"}-${workplace}`
  }

  const unitMap = new Map<
    string,
    {
      gvhd: Set<string>
      bv: Set<string>
      hdnc: Set<string>
      dgnc: Set<string>
    }
  >()

  const ensureUnit = (workplace: string) => {
    if (!unitMap.has(workplace)) {
      unitMap.set(workplace, {
        gvhd: new Set<string>(),
        bv: new Set<string>(),
        hdnc: new Set<string>(),
        dgnc: new Set<string>(),
      })
    }
    // biome-ignore lint/style/noNonNullAssertion: ensured by has/set above
    return unitMap.get(workplace)!
  }

  allStudentsInClasses.forEach((student) => {
    const project = student?.thesisRegistrations?.find(
      (registration: any) => registration?.thesisProject
    )?.thesisProject
    if (!project) return

    const supervisors = [project?.supervisor, project?.coSupervisor]
    supervisors.forEach((expert) => {
      if (!isOutsideExpert(expert)) return
      const workplace = expert?.workplace?.trim() || "Chưa có đơn vị"
      const unit = ensureUnit(workplace)
      unit.gvhd.add(getExpertKey(expert, workplace))
    })

    const members = project?.council?.members || []
    members.forEach((member: any) => {
      const expert = member?.expert
      if (!isOutsideExpert(expert)) return

      const workplace = expert?.workplace?.trim() || "Chưa có đơn vị"
      const unit = ensureUnit(workplace)
      const expertKey = getExpertKey(expert, workplace)

      unit.bv.add(expertKey)
    })
  })

  const data: ThongKeCoQuanDonViCanBoNgoaiHvTable[] = Array.from(unitMap.entries())
    .sort(([unitA], [unitB]) => unitA.localeCompare(unitB, "vi"))
    .map(([tenDonVi, stats], index) => {
      const soLuongGVHD = stats.gvhd.size
      const soLuongBV = stats.bv.size
      const soLuongHDNC = 0
      const soLuongDGNC = 0

      return {
        stt: index + 1,
        tenDonVi,
        soLuongGVHD,
        soLuongBV,
        soLuongHDNC,
        soLuongDGNC,
        tongSoLuong: soLuongGVHD + soLuongBV + soLuongHDNC + soLuongDGNC,
      }
    })

  return {
    khoa,
    dotxet,
    data,
  }
}
export const exportThongKeCoQuanDonViCanBoNgoaiHv = async ({
  allStudentsInClasses,
  thesisSessionId,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thống kê cán bộ tham gia HĐ ngoài HV")
    return
  }
  const project = allStudentsInClasses
    .map((student) => {
      const thesisProject = getThesisProjectBySessionId(student, thesisSessionId)
      if (!thesisProject) return null
      return {
        ...student,
        thesisRegistrations: [{ thesisProject }],
      }
    })
    .filter(Boolean)
  if (!project) {
    message.error("Không tìm thấy dữ liệu để tạo thống kê cán bộ tham gia HĐ ngoài HV")
    return
  }
  showSpinner()
  try {
    const data = convertToThongKeCoQuanDonViCanBoNgoaiHvData(project)
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "ThongKeCoQuanDonViCanBoNgoaiHv",
      path: "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx",
      prefix: "mta/luan-van",
      payload: [{ data: data }],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}

export interface UserProfile {
  fullname?: string | null
  dateOfBirth?: string | Date | null
  rank?: { sMa?: string | null } | null
  academicRankType?: { sMa?: string | null } | null
  level?: { sMa?: string | null } | null
  academicDegreeType?: { sMa?: string | null } | null
  positionCPV?: { sTen?: string | null } | null
}

export interface Lecturer {
  id: string
  userProfile?: UserProfile | null
  organization?: { sCode?: string | null; sTen?: string | null } | null
}

export interface StudentRegistration {
  student?: {
    code?: string | null
    userProfile?: UserProfile | null
    fixedClass?: {
      name?: string | null
      trainingCourse?: {
        name?: string | null
        trainingObjectType?: { type?: string | null } | null
      } | null
      curriculumVersion?: {
        curriculum?: {
          trainingMajor?: { name?: string | null } | null
        } | null
      } | null
    } | null
  } | null
}

export interface ThesisProjectExportData {
  id: string
  title?: string | null
  isLanguage?: boolean | null
  isProductProject?: boolean | null
  subjectClass?: {
    code?: string | null
    name?: string | null
  } | null
  thesisSession?: {
    decisionNumber?: string | null
    decisionDate?: string | Date | null
  } | null
  registrations?: StudentRegistration[] | null
  primarySupervisor?: Lecturer | null
  secondarySupervisor?: Lecturer | null
  thirdSupervisor?: {
    lecturer?: Lecturer | null
    name?: string | null
  } | null
}

export const exportPhuLucHuongDanDoAn = async ({
  projects,
  showSpinner,
  hideSpinner,
  message,
}: {
  projects: ThesisProjectExportData[]
  showSpinner: () => void
  hideSpinner: () => void
  message: any
}) => {
  if (!projects?.length) {
    message.error("Không có dữ liệu để xuất phụ lục hướng dẫn đồ án")
    return
  }

  showSpinner()
  try {
    const firstProj = projects[0]
    const firstStudent = firstProj?.registrations?.[0]?.student

    const dtType = (
      tenDoiTuong[
        firstStudent?.fixedClass?.trainingCourse?.trainingObjectType
          ?.type as keyof typeof tenDoiTuong
      ]?.fullname || "Quân sự"
    ).toUpperCase()

    const khoa = (firstStudent?.fixedClass?.trainingCourse?.name || "").toUpperCase()
    const chuyenNganh = (
      firstStudent?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    ).toUpperCase()

    const soQD = firstProj?.thesisSession?.decisionNumber || "......"
    const ngayQD = firstProj?.thesisSession?.decisionDate
      ? dayjs(firstProj.thesisSession.decisionDate).format("DD/MM/YYYY")
      : ".... / .... /...."

    const tableData: any[] = []
    let sttCounter = 1
    const mergeRanges: { startRow: number; endRow: number }[] = []
    let currentRowIndex = 8
    const rowHeightsMap = new Map<number, number>()
    const breakRows: number[] = []
    let currentPageHeight = 176 // Page 1 starts with header height (176 points)
    const maxPageHeight = 505 // Printable page budget for landscape A4 (approx 505 points)

    const estimateLines = (text: string, charsPerLine: number) => {
      if (!text) return 1
      const paragraphs = text.split("\n")
      let total = 0
      paragraphs.forEach((p) => {
        total += Math.max(1, Math.ceil(p.length / charsPerLine))
      })
      return total
    }

    projects.forEach((proj, idx) => {
      const studentName =
        proj.registrations
          ?.map((r: any) => r.student?.userProfile?.fullname)
          .filter(Boolean)
          .join(", ") || ""
      const title = proj.title || ""
      const note = proj.isLanguage
        ? "ĐA viết và bảo vệ bằng tiếng Anh"
        : proj.isProductProject
          ? "ĐA có sản phẩm"
          : ""

      interface FormattedSupervisor {
        supervisor: string
        position: string
        unit: string
      }

      const supervisorsList: FormattedSupervisor[] = []

      const formatSup = (supervisor: Lecturer | null | undefined, prefix: string) => {
        if (!supervisor) return null
        const profile = supervisor.userProfile
        const rank = profile?.rank?.sMa || ""
        const academicRank = profile?.academicRankType?.sMa || ""
        const level = profile?.level?.sMa || ""
        const academicDegree = profile?.academicDegreeType?.sMa || ""
        const fullname = profile?.fullname || ""

        const titleParts = [academicRank, level, academicDegree].filter(Boolean).join(".")
        const namePart = titleParts ? `${titleParts} ${fullname}` : fullname
        const formattedName = [rank, namePart].filter(Boolean).join(", ")

        return {
          supervisor: prefix + formattedName,
          position: profile?.positionCPV?.sTen || "",
          unit: supervisor.organization?.sTen || supervisor.organization?.sCode || "",
        }
      }

      const hd1 = formatSup(proj.primarySupervisor, "HD 1: ")
      const hd2 = formatSup(proj.secondarySupervisor, "HD 2: ")
      const hd3 = formatSup(proj.thirdSupervisor?.lecturer, "HD 3: ")

      if (hd1) supervisorsList.push(hd1)
      if (hd2) supervisorsList.push(hd2)
      if (hd3) supervisorsList.push(hd3)

      if (supervisorsList.length === 0) {
        tableData.push({
          stt: sttCounter,
          student: studentName,
          title,
          supervisor: "",
          position: "",
          unit: "",
          note,
        })
        const maxLines = Math.max(
          estimateLines(studentName, 18),
          estimateLines(title, 28),
          estimateLines(note, 15)
        )
        rowHeightsMap.set(currentRowIndex, 16 + maxLines * 14)
        sttCounter++
        currentRowIndex++
      } else {
        supervisorsList.forEach((sup, idx) => {
          tableData.push({
            stt: idx === 0 ? sttCounter : "",
            student: idx === 0 ? studentName : "",
            title: idx === 0 ? title : "",
            supervisor: sup.supervisor,
            position: sup.position,
            unit: sup.unit,
            note: idx === 0 ? note : "",
          })

          const supLines = estimateLines(sup.supervisor, 25)
          const posLines = estimateLines(sup.position, 15)
          const uniLines = estimateLines(sup.unit, 25)

          let maxLines = Math.max(supLines, posLines, uniLines)
          if (idx === 0) {
            maxLines = Math.max(maxLines, estimateLines(studentName, 18), estimateLines(title, 28))
          }

          rowHeightsMap.set(currentRowIndex + idx, 16 + maxLines * 14)
        })

        if (supervisorsList.length > 1) {
          mergeRanges.push({
            startRow: currentRowIndex,
            endRow: currentRowIndex + supervisorsList.length - 1,
          })
        }

        sttCounter++
        currentRowIndex += supervisorsList.length
      }

      // Track page breaks: dynamically calculate cumulative row heights to fit landscape A4
      let projectHeight = 0
      const totalRowsForProject = supervisorsList.length || 1
      for (let rOffset = 0; rOffset < totalRowsForProject; rOffset++) {
        projectHeight += rowHeightsMap.get(currentRowIndex - totalRowsForProject + rOffset) || 26
      }

      if (currentPageHeight + projectHeight > maxPageHeight && idx > 0) {
        const previousProjectEndRow = currentRowIndex - totalRowsForProject - 1
        breakRows.push(previousProjectEndRow)
        currentPageHeight = 64 // New page starts with repeated header (rows 6 & 7 = 64pt)
      }
      currentPageHeight += projectHeight
    })

    const dataPayload = {
      dtType,
      khoa,
      chuyenNganh,
      soQD,
      ngayQD,
      data: tableData,
    }

    const response = await renderXlsxTemplate({
      templatePath: "PhanCongHuongDanDoAn.xlsx",
      prefix: "mta/template",
      fileName: "PhanCongHuongDanDoAn.xlsx",
      mergeBlocksToOneSheet: false,
      sheets: [
        {
          data: dataPayload,
        },
      ],
    })

    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi khi tạo file Excel từ template")
      return
    }

    const renderedBlob = response.data
    if (renderedBlob instanceof Blob) {
      const arrayBuffer = await renderedBlob.arrayBuffer()
      const zip = new PizZip(arrayBuffer)
      const sheetPath = "xl/worksheets/sheet1.xml"
      const sheetFile = zip.file(sheetPath)
      if (sheetFile) {
        let sheetXml = sheetFile.asText()
        sheetXml = sheetXml.replace(/<row\b([^>]*)>/g, (match, attrs) => {
          const rMatch = attrs.match(/r="(\d+)"/)
          if (rMatch) {
            const rVal = parseInt(rMatch[1], 10)
            if (rowHeightsMap.has(rVal)) {
              const targetHeight = rowHeightsMap.get(rVal)
              let cleanedAttrs = attrs
                .replace(/\bht="[^"]*"/g, "")
                .replace(/\bcustomHeight="[^"]*"/g, "")
              return `<row${cleanedAttrs} ht="${targetHeight}" customHeight="1">`
            }
          }
          return match
        })

        // Inject merged cell tags dynamically for columns A, B, C, G
        if (mergeRanges.length > 0) {
          const mergeTags: string[] = []
          mergeRanges.forEach((range) => {
            mergeTags.push(`<mergeCell ref="A${range.startRow}:A${range.endRow}"/>`)
            mergeTags.push(`<mergeCell ref="B${range.startRow}:B${range.endRow}"/>`)
            mergeTags.push(`<mergeCell ref="C${range.startRow}:C${range.endRow}"/>`)
            mergeTags.push(`<mergeCell ref="G${range.startRow}:G${range.endRow}"/>`)
          })

          const mergeCellsMatch = sheetXml.match(/<mergeCells\b([^>]*)>([\s\S]*?)<\/mergeCells>/)
          if (mergeCellsMatch) {
            const attrs = mergeCellsMatch[1]
            const existingBody = mergeCellsMatch[2]
            const countMatch = attrs.match(/count="(\d+)"/)
            let newCount = mergeTags.length
            let newAttrs = attrs
            if (countMatch) {
              const currentCount = parseInt(countMatch[1], 10)
              newCount += currentCount
              newAttrs = attrs.replace(/count="\d+"/, `count="${newCount}"`)
            } else {
              newAttrs += ` count="${newCount}"`
            }
            const updatedMergeCells = `<mergeCells${newAttrs}>${existingBody}${mergeTags.join("")}</mergeCells>`
            sheetXml = sheetXml.replace(
              /<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>/,
              updatedMergeCells
            )
          } else {
            const mergeCellsTag = `<mergeCells count="${mergeTags.length}">${mergeTags.join("")}</mergeCells>`
            sheetXml = sheetXml.replace("</worksheet>", `${mergeCellsTag}</worksheet>`)
          }
        }

        // Inject rowBreaks dynamically
        if (breakRows.length > 0) {
          const brkTags = breakRows.map((rNum) => `<brk id="${rNum}" max="16383" man="1"/>`)
          const rowBreaksXml = `<rowBreaks count="${breakRows.length}" manualBreakCount="${breakRows.length}">${brkTags.join("")}</rowBreaks>`
          if (sheetXml.includes("</headerFooter>")) {
            sheetXml = sheetXml.replace("</headerFooter>", `</headerFooter>${rowBreaksXml}`)
          } else if (sheetXml.includes("<pageSetup")) {
            sheetXml = sheetXml.replace(/(<pageSetup[^>]*\/>)/, `$1${rowBreaksXml}`)
          } else {
            sheetXml = sheetXml.replace("</worksheet>", `${rowBreaksXml}</worksheet>`)
          }
        }

        zip.file(sheetPath, sheetXml)
      }

      const finalBuffer = zip.generate({ type: "arraybuffer" })
      const finalBlob = new Blob([finalBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      downloadFile(finalBlob, "PhanCongHuongDanDoAn.xlsx")
      message.success("Xuất file thành công")
    } else {
      message.error("Đã xảy ra lỗi khi tạo file Excel")
    }
  } catch (error) {
    console.error("Lỗi xuất file:", error)
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}

export interface ProgressReportTableRow {
  stt: number | string
  studentName: string
  thesisTitle: string
  progressPercent: string
  note: string
}

export interface ThesisProjectProgressExportItem {
  id?: string
  title?: string | null
  firstCheckProgress?: number | null
  secondCheckProgress?: number | null
  isLanguage?: boolean | null
  isProductProject?: boolean | null
  council?: ThesisCouncil | null
  subjectClass?: {
    subject?: {
      name?: string | null
      managementOrganization?: {
        sTen?: string | null
      } | null
    } | null
  } | null
  primarySupervisor?: {
    organization?: {
      sTen?: string | null
    } | null
  } | null
  registrations?: Array<{
    student?: {
      userProfile?: {
        fullname?: string | null
      } | null
      fixedClass?: {
        name?: string | null
        trainingMajor?: {
          name?: string | null
        } | null
        trainingCourse?: {
          name?: string | null
          trainingObjectType?: {
            name?: string | null
          } | null
        } | null
        curriculumVersion?: {
          curriculum?: {
            trainingMajor?: {
              name?: string | null
            } | null
          } | null
        } | null
      } | null
    } | null
  }> | null
}

export interface ExportBaoCaoTienDoOptions {
  projects: ThesisProjectProgressExportItem[]
  checkTimes: "1" | "2"
  showSpinner: () => void
  hideSpinner: () => void
  message: {
    error: (content: string) => void
    success: (content: string) => void
    info?: (content: string) => void
  }
}

export const exportBaoCaoTienDoDoAnTotNghiep = async ({
  projects,
  checkTimes,
  showSpinner,
  hideSpinner,
  message,
}: ExportBaoCaoTienDoOptions) => {
  if (!projects?.length) {
    message.error("Không có dữ liệu để xuất báo cáo tiến độ đồ án")
    return
  }

  showSpinner()
  try {
    const firstProj = projects[0]
    const firstStudent = firstProj?.registrations?.[0]?.student

    const khoaVienRaw =
      firstProj?.subjectClass?.subject?.managementOrganization?.sTen || "................"
    const khoaVien = khoaVienRaw.replace(/^(Khoa|Viện)\s+/i, "")

    const boMonRaw =
      firstProj?.primarySupervisor?.organization?.sTen ||
      firstProj?.subjectClass?.subject?.managementOrganization?.sTen ||
      "................"
    const boMon = boMonRaw.replace(/^Bộ môn\s+/i, "")
    let chuyenNganh = ""
    let khoa = ""

    for (const proj of projects) {
      if (!chuyenNganh) {
        chuyenNganh =
          proj.registrations?.[0]?.student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
          ""
      }
      if (!khoa) {
        khoa =
          proj.registrations?.[0]?.student?.fixedClass?.trainingCourse?.name ||
          proj.registrations?.[0]?.student?.fixedClass?.name ||
          ""
      }
      if (chuyenNganh && khoa) break
    }

    chuyenNganh = chuyenNganh.toUpperCase()
    khoa = khoa.toUpperCase()

    const table1Data: ProgressReportTableRow[] = []
    const table2Data: ProgressReportTableRow[] = []
    let stt1 = 1
    let stt2 = 1

    const threshold = checkTimes === "1" ? 50 : 90

    projects.forEach((proj) => {
      const studentName =
        proj.registrations
          ?.map((r) => r.student?.userProfile?.fullname)
          .filter(Boolean)
          .join(", ") || "Học viên"
      const rawTitle = proj.title || "Chưa có tên đề tài"
      const thesisTitle = rawTitle.replace(/\s*-\s*Sinh viên\s+.*$/gi, "").trim()
      const rawProgress =
        checkTimes === "1" ? proj.firstCheckProgress : proj.secondCheckProgress
      const progressVal = Number(rawProgress || 0)
      const progressPercent = `${progressVal}%`
      const note = proj.isLanguage
        ? "Tiếng Anh"
        : proj.isProductProject
          ? "Có sản phẩm"
          : ""

      const item = {
        studentName,
        thesisTitle,
        progressPercent,
        note,
      }

      if (progressVal >= threshold) {
        table1Data.push({ stt: `${stt1++}.`, ...item })
      } else {
        table2Data.push({ stt: `${stt2++}.`, ...item })
      }
    })

    const cleanKhoa = khoa.replace(/^Khó?a\s+/i, "").trim()
    const chuyenNganhVal = chuyenNganh && chuyenNganh.trim() ? chuyenNganh : "                                "
    const khoaVal = cleanKhoa ? cleanKhoa : "            "

    const tieuDePhu = `(CHUYÊN NGÀNH: ${chuyenNganhVal}, KHÓA: ${khoaVal})`

    const dataPayload = {
      khoaVien,
      boMon,
      checkTimes: checkTimes === "1" ? "1" : "2",
      tieuDePhu,
      chuyenNganh: chuyenNganhVal,
      khoa: khoaVal,
      table1:
        table1Data.length > 0
          ? table1Data
          : [{ stt: "", studentName: "-", thesisTitle: "-", progressPercent: "-", note: "" }],
      table2:
        table2Data.length > 0
          ? table2Data
          : [{ stt: "", studentName: "-", thesisTitle: "-", progressPercent: "-", note: "" }],
      kienNghi: "",
    }

    const response = await renderXlsxTemplate({
      templatePath: "BaoCaoTienDoDoAnTotNghiep.xlsx",
      prefix: "mta/luan-van",
      fileName: `BaoCaoTienDoDoAnTotNghiep_Lan${checkTimes}.xlsx`,
      mergeBlocksToOneSheet: false,
      sheets: [
        {
          data: dataPayload,
        },
      ],
    })

    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi khi tạo file Excel từ template (Mẫu 02)")
      return
    }

    const renderedBlob = response.data
    if (renderedBlob instanceof Blob) {
      downloadFile(renderedBlob, `BaoCaoTienDoDoAnTotNghiep_Lan${checkTimes}.xlsx`)
      message.success("Xuất báo cáo kiểm tra tiến độ thành công")
    } else {
      message.error("Đã xảy ra lỗi khi tạo file Excel")
    }
  } catch (error) {
    console.error("Lỗi xuất file Mẫu 02:", error)
    message.error("Đã xảy ra lỗi khi xuất báo cáo Mẫu 02")
  } finally {
    hideSpinner()
  }
}

export interface ThesisCouncilMemberProfile {
  fullname?: string | null
  rank?: { sTen?: string | null; name?: string | null; sMa?: string | null } | null
  academicDegreeType?: {
    sMa?: string | null
    abbreviation?: string | null
    name?: string | null
    sTen?: string | null
  } | null
  academicRankType?: {
    sMa?: string | null
    abbreviation?: string | null
    name?: string | null
    sTen?: string | null
  } | null
  positionCPV?: { sTen?: string | null; name?: string | null } | null
}

export interface ThesisCouncilMemberExpert {
  name?: string | null
  position?: string | null
  organization?: string | { sTen?: string | null; name?: string | null } | null
  lecturer?: {
    userProfile?: ThesisCouncilMemberProfile | null
    organization?: string | { sTen?: string | null; name?: string | null } | null
  } | null
}

export interface ThesisCouncilMember {
  role: string
  expert?: ThesisCouncilMemberExpert | null
}

export interface ThesisCouncil {
  id?: string | null
  name?: string | null
  members?: ThesisCouncilMember[] | null
}

export interface ExportDanhSachTieuBanOptions {
  projects: any[]
  showSpinner: () => void
  hideSpinner: () => void
  message: {
    error: (content: string) => void
    success: (content: string) => void
    info?: (content: string) => void
  }
}

export const exportDanhSachTieuBanChamDATN = async ({
  projects,
  showSpinner,
  hideSpinner,
  message,
}: ExportDanhSachTieuBanOptions) => {
  if (!projects?.length) {
    message.error("Không có dữ liệu để xuất danh sách tiểu ban")
    return
  }

  showSpinner()
  try {
    const firstProj = projects[0]

    const khoaVienRaw =
      firstProj?.subjectClass?.subject?.managementOrganization?.sTen || "................"
    const khoaVien = khoaVienRaw.replace(/^(Khoa|Viện)\s+/i, "")

    const boMonRaw =
      firstProj?.primarySupervisor?.organization?.sTen ||
      firstProj?.subjectClass?.subject?.managementOrganization?.sTen ||
      "................"
    const boMon = boMonRaw.replace(/^Bộ môn\s+/i, "")

    let khoa = ""
    let doiTuong = "KỸ SƯ QUÂN SỰ"

    for (const proj of projects) {
      if (!khoa) {
        khoa =
          proj.registrations?.[0]?.student?.fixedClass?.trainingCourse?.name ||
          proj.registrations?.[0]?.student?.fixedClass?.name ||
          ""
      }
      const objName = proj.registrations?.[0]?.student?.fixedClass?.trainingCourse?.trainingObjectType?.name
      if (objName) {
        doiTuong = objName.toUpperCase()
      }
      if (khoa) break
    }

    const majorMap = new Map<
      string,
      Map<string, { council?: ThesisCouncil | null; projects: ThesisProjectProgressExportItem[] }>
    >()

    projects.forEach((proj) => {
      const student = proj.registrations?.[0]?.student
      const majorName =
        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
        student?.fixedClass?.trainingMajor?.name ||
        proj.subjectClass?.subject?.name ||
        "..............."

      if (!majorMap.has(majorName)) {
        majorMap.set(majorName, new Map())
      }
      const councilMap = majorMap.get(majorName)!

      const councilId = proj.council?.id || "NO_COUNCIL"
      if (!councilMap.has(councilId)) {
        councilMap.set(councilId, {
          council: proj.council,
          projects: [],
        })
      }
      councilMap.get(councilId)!.projects.push(proj)
    })

    let majorStt = 1
    const tieuBans: Array<{
      majorTitle: string
      name: string
      truongTieuBan: string
      phoTruongTieuBan: string
      thuKy: string
      uyVien1: string
      uyVien2: string
    }> = []

    majorMap.forEach((councilMap, majorName) => {
      let majorStudentCount = 0
      let tieuBanStt = 1
      const tieuBanCount = councilMap.size

      councilMap.forEach(({ projects: projList }) => {
        const studentCountInCouncil = projList.reduce(
          (sum: number, p: ThesisProjectProgressExportItem) => sum + (p.registrations?.length || 0),
          0
        )
        majorStudentCount += studentCountInCouncil
      })

      const majorTitleStr = `${majorStt++}. Chuyên ngành ${majorName}: ${tieuBanCount.toString().padStart(2, "0")} tiểu ban (${majorStudentCount} học viên)`
      let isFirstSubcommitteeInMajor = true

      councilMap.forEach(({ council }) => {
        const tieuBanName = council?.name || `Tiểu ban ${tieuBanStt}`
        tieuBanStt++

        let truongTieuBan = ""
        let phoTruongTieuBan = ""
        let thuKy = ""
        let uyVien1 = ""
        let uyVien2 = ""

        if (council?.members?.length) {
          const roleOrder: Record<string, number> = {
            CHAIRMAN: 1,
            VICE_CHAIRMAN: 2,
            SECRETARY: 3,
            REVIEWER_1: 4,
            REVIEWER_2: 5,
            MEMBER: 6,
          }

          const sortedMembers = [...council.members].sort(
            (a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99)
          )

          const formatMember = (m: ThesisCouncilMember) => {
            const profile = m.expert?.lecturer?.userProfile
            const rank = profile?.rank?.sTen || profile?.rank?.name || profile?.rank?.sMa || ""
            let degree = profile?.academicDegreeType?.sMa || profile?.academicDegreeType?.abbreviation || profile?.academicDegreeType?.name || profile?.academicDegreeType?.sTen || ""
            let academicRank = profile?.academicRankType?.sMa || profile?.academicRankType?.abbreviation || profile?.academicRankType?.name || profile?.academicRankType?.sTen || ""
            const nameStr = profile?.fullname || m.expert?.name || "Chưa có tên"
            const posStr = profile?.positionCPV?.sTen || profile?.positionCPV?.name || m.expert?.position || "Giảng viên"
            const rawLecOrg = m.expert?.lecturer?.organization
            const rawExpOrg = m.expert?.organization
            const orgStr =
              typeof rawLecOrg === "string"
                ? rawLecOrg
                : rawLecOrg?.sTen ||
                  rawLecOrg?.name ||
                  (typeof rawExpOrg === "string" ? rawExpOrg : rawExpOrg?.sTen || rawExpOrg?.name) ||
                  "V2"

            if (academicRank && !academicRank.endsWith(".")) academicRank += "."
            if (degree && !degree.endsWith(".")) degree += "."

            const titleDegreeStr = [rank, academicRank, degree].filter(Boolean).join(", ")
            const fullTitleName = `${titleDegreeStr} ${nameStr}`.trim().replace(/\s+/g, " ")
            return `${fullTitleName} - ${posStr}/${orgStr}`
          }

          const chair = sortedMembers.find((m) => m.role === "CHAIRMAN")
          const viceChair = sortedMembers.find((m) => m.role === "VICE_CHAIRMAN" || m.role === "REVIEWER_1")
          const sec = sortedMembers.find((m) => m.role === "SECRETARY")

          if (chair) truongTieuBan = formatMember(chair)
          if (viceChair) phoTruongTieuBan = formatMember(viceChair)
          if (sec) thuKy = formatMember(sec)

          const remainingMembers = sortedMembers.filter(
            (m) => m !== chair && m !== viceChair && m !== sec
          )

          if (remainingMembers[0]) uyVien1 = formatMember(remainingMembers[0])
          if (remainingMembers[1]) uyVien2 = formatMember(remainingMembers[1])
        } else {
          truongTieuBan = "Chưa phân công hội đồng"
        }

        tieuBans.push({
          majorTitle: isFirstSubcommitteeInMajor ? majorTitleStr : "",
          name: tieuBanName,
          truongTieuBan,
          phoTruongTieuBan,
          thuKy,
          uyVien1,
          uyVien2,
        })

        isFirstSubcommitteeInMajor = false
      })
    })

    const items: Array<{ label: string; info: string }> = []
    const majorRowOffsets: number[] = []

    for (const tb of tieuBans) {
      if (tb.majorTitle) {
        majorRowOffsets.push(items.length)
        items.push({ label: tb.majorTitle, info: "" })
      }
      items.push({ label: `- ${tb.name}`, info: "" })
      if (tb.truongTieuBan) items.push({ label: "Trưởng Tiểu ban:", info: tb.truongTieuBan })
      if (tb.phoTruongTieuBan) items.push({ label: "Phó trưởng Tiểu ban:", info: tb.phoTruongTieuBan })
      if (tb.thuKy) items.push({ label: "Thư ký:", info: tb.thuKy })
      if (tb.uyVien1) items.push({ label: "Ủy viên:", info: tb.uyVien1 })
      if (tb.uyVien2) items.push({ label: "", info: tb.uyVien2 })
    }

    const majorRowIndices = majorRowOffsets.map((offset) => 9 + offset)

    const cleanKhoa = khoa.replace(/^Khó?a\s+/i, "").trim()

    const dataPayload = {
      khoaVien,
      boMon,
      khoa: cleanKhoa || "................",
      doiTuong: doiTuong || "KỸ SƯ QUÂN SỰ",
      items,
    }

    const response = await renderXlsxTemplate({
      templatePath: "DanhSachTieuBanChamDATN.xlsx",
      prefix: "mta/template",
      fileName: `DanhSachTieuBanChamDATN.xlsx`,
      mergeBlocksToOneSheet: true,
      sheets: [
        {
          data: dataPayload,
        },
      ],
    })

    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi khi tạo file Excel từ template (Mẫu 03)")
      return
    }

    const renderedBlob = response.data
    if (renderedBlob instanceof Blob) {
      if (majorRowIndices.length > 0) {
        try {
          const arrayBuffer = await renderedBlob.arrayBuffer()
          const zip = new PizZip(arrayBuffer)
          let sheetXml = zip.file("xl/worksheets/sheet1.xml")?.asText()

          if (sheetXml) {
            const mergeTags = majorRowIndices.map((r) => `<mergeCell ref="B${r}:C${r}"/>`).join("")
            if (sheetXml.includes("<mergeCells")) {
              sheetXml = sheetXml.replace(/<mergeCells count="(\d+)">/, (_m, countStr) => {
                const newCount = parseInt(countStr, 10) + majorRowIndices.length
                return `<mergeCells count="${newCount}">${mergeTags}`
              })
            } else {
              sheetXml = sheetXml.replace("</worksheet>", `<mergeCells count="${majorRowIndices.length}">${mergeTags}</mergeCells></worksheet>`)
            }

            let stylesXml = zip.file("xl/styles.xml")?.asText()
            if (stylesXml) {
              const boldFontTag = '<font><b/><sz val="12"/><name val="Times New Roman"/></font>'
              let newFontIndex = 0
              const fontCountMatch = stylesXml.match(/<fonts count="(\d+)"/)
              if (fontCountMatch) {
                newFontIndex = parseInt(fontCountMatch[1], 10)
                stylesXml = stylesXml.replace(/<fonts count="(\d+)"/, `<fonts count="${newFontIndex + 1}"`)
                stylesXml = stylesXml.replace("</fonts>", `${boldFontTag}</fonts>`)
              }

              const newXfTag = `<xf numFmtId="0" fontId="${newFontIndex}" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="left" vertical="center"/></xf>`
              let newStyleIndex = 0
              const xfCountMatch = stylesXml.match(/<cellXfs count="(\d+)"/)
              if (xfCountMatch) {
                newStyleIndex = parseInt(xfCountMatch[1], 10)
                stylesXml = stylesXml.replace(/<cellXfs count="(\d+)"/, `<cellXfs count="${newStyleIndex + 1}"`)
                stylesXml = stylesXml.replace("</cellXfs>", `${newXfTag}</cellXfs>`)
              }

              zip.file("xl/styles.xml", stylesXml)

              for (const rowIdx of majorRowIndices) {
                const cellBPattern = new RegExp(`<c r="B${rowIdx}"([^>]*)>`)
                const cellBMatch: RegExpMatchArray | null = sheetXml.match(cellBPattern)
                if (cellBMatch && cellBMatch[1] !== undefined) {
                  const oldAttrs: string = cellBMatch[1]
                  const newAttrs: string = oldAttrs.replace(/s="\d+"/, `s="${newStyleIndex}"`)
                  sheetXml = sheetXml.replace(cellBPattern, `<c r="B${rowIdx}"${oldAttrs.includes('s=') ? newAttrs : oldAttrs + ` s="${newStyleIndex}"`}>`)
                }
              }
            }
            zip.file("xl/worksheets/sheet1.xml", sheetXml)
            const modifiedBuffer = zip.generate({ type: "arraybuffer" })
            const outBlob = new Blob([modifiedBuffer], { type: renderedBlob.type })
            downloadFile(outBlob, `DanhSachTieuBanChamDATN.xlsx`)
            message.success("Xuất danh sách tiểu ban thành công")
            return
          }
        } catch (err) {
          console.error("Lỗi PizZip merge:", err)
        }
      }

      downloadFile(renderedBlob, `DanhSachTieuBanChamDATN.xlsx`)
      message.success("Xuất danh sách tiểu ban thành công")
    } else {
      message.error("Đã xảy ra lỗi khi tạo file Excel")
    }
  } catch (error) {
    console.error("Lỗi xuất file Mẫu 03:", error)
    message.error("Đã xảy ra lỗi khi xuất báo cáo Mẫu 03")
  } finally {
    hideSpinner()
  }
}


