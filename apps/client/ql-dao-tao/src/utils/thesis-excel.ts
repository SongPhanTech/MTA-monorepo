import { CouncilRole, ThesisType, TrainingObjectTypes } from "@workspace/db/client"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { excelTemplate } from "@workspace/libs/api/model"
import type { ExcelTemplateBody } from "@workspace/libs/api/schemas"
import { exportFromTemplate, type TableRow } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { dayjs } from "@workspace/ui"
import { toRoman } from "./romans"
import { getSupervisorName } from "../pages/quan-ly-luan-van/dm-luan-van/index"
import { docxTemplate } from "./docx-template"
interface ExportOptions {
  allStudentsInClasses: any[]
  showSpinner: () => void
  hideSpinner: () => void
  message: any // Antd message instance
  inAcademy?: boolean
  /** Người ký (mẫu cần ký): họ tên và chức danh — thay thế placeholder trong template */
  signerName?: string
  isChief?: boolean
  signingDate?: Date | string
}

const resolveSigningDate = (signingDate?: Date | string) =>
  signingDate ? dayjs(signingDate) : dayjs()

// Format ngày tháng theo quy tắc Tháng 1, 2 ghi 01, 02; từ tháng 3 trở đi thì 1 số (3, 4... 12).
const formatThesisDate = (date?: Date | string | null) => {
  if (!date) return ""
  const d = dayjs(date)
  const day = d.date() 
  const month = d.month() + 1 
  const year = d.year()

  const dayStr = day.toString()
  const monthStr = (month === 1 || month === 2) ? month.toString().padStart(2, "0") : month.toString()

  return `${dayStr}/${monthStr}/${year}`
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
    tongTienBangSo: number
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
    khoa: string
    khoaTitle: string
    chuyenNganh: string
    dotXet: string
    tong: number
    tongChuTich: number
    tongThuky: number
    tongUyVien: number
    tongPhanBien1: number
    tongPhanBien2: number
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
    soQd: string
    ngayTl: string
    dieu1: string
    thangTl: string
    namTl: string
    khoa: string
    dotXet: string
    loaiLuanVan: string
    nganh: string
    chuyenNganh: string
    deTai: string
    tenHocVien: string
    ngaySinh: string
    khoaHoc: string
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
  contentDieu1: string
  tenHocVien: string
  ngaySinh: string
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
  /** Sheet `Head` `${tenDonViQuanLi}` — gộp nhiều đơn vị bằng xuống dòng */
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

export const exportPhuLucDsLuanVan = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  showSpinner()
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
    hideSpinner()
    return
  }

  try {
    const majorMap = new Map<string, any>()
    let dotxet = ""
    let soQD = ""
    let ngayQD = ""
    allStudentsInClasses.forEach((student) => {
      dotxet = dotxet || student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name || ""
      const thesisProject = student?.thesisRegistrations?.[0]?.thesisProject
      soQD =
        soQD ||
        student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionNumber ||
        ""
      ngayQD =
        ngayQD || student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionDate
          ? dayjs(
              student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionDate
            ).format("DD/MM/YYYY")
          : ""
      if (!thesisProject) return
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
    // const tableBodyStartRow = 7
    // const tableHeaderThinBorder = { top: 5, left: 1, bottom: 6, right: 6 } as const
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
      templateUrl: getMinioUrl("mta/template/PhuLucDanhSachLuanVan.xlsx"),
      sheets: [
        {
          sheet: "PhuLucDanhSachLuanVan",
          rows: [...dataRows, gapRow, totalRow],
          tableStartCell: { row: 7, col: 1 },
          // tableStartCell: { row: tableBodyStartRow, col: 1 },
          // thinBorderRange: tableHeaderThinBorder,
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
    console.log("error", error)
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

  const updateStats = (expert: any, amount: any, role: "GVHD1" | "GVHD2") => {
    if (!expert) return

    const expertId = expert.id
    const paymentAmount = Number(amount?.toString()) || 0

    let stats = expertStatsMap.get(expertId)
    if (!stats) {
      stats = {
        expertId: expertId,
        name: (getSupervisorName(expert, false, true) as string) || "",
        sDonvi: expert?.workplace || expert?.lecturer?.organization?.sMa || "",
        stk: expert?.bankAccountNumber || expert?.lecturer?.userProfile?.bankAccountNumber || "",
        tennganhang: expert?.bankName || expert?.lecturer?.userProfile?.bankName || "",
        GVHD1Student: 0,
        GVHD2Student: 0,
        totalPayment: 0,
      }
      expertStatsMap.set(expertId, stats)
    }

    stats.totalPayment += paymentAmount

    if (role === "GVHD1") {
      stats.GVHD1Student += 1
    } else {
      stats.GVHD2Student += 1
    }
  }
  for (const student of allStudentsInClasses) {
    for (const registration of student.thesisRegistrations) {
      const project = registration.thesisProject
      if (!project) continue

      if (project.supervisor) {
        updateStats(project.supervisor, project.supervisorPayment?.amount, "GVHD1")
      }

      if (project.coSupervisor) {
        updateStats(project.coSupervisor, project.coSupervisorPayment?.amount, "GVHD2")
      }
    }
  }

  return Array.from(expertStatsMap.values())
}
export const exportThongKeCbHdlv = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thống kê cán bộ hướng dẫn LV")
    return
  }
  showSpinner()
  const dataMapping = getExpertSupervisionStats(allStudentsInClasses)
  const ngayhientai = dayjs().format("DD/MM/YYYY")
  const ngay = ngayhientai.split("/")[0]
  const thang = ngayhientai.split("/")[1]
  const nam = ngayhientai.split("/")[2]
  const tendot =
    allStudentsInClasses?.length > 0
      ? allStudentsInClasses[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name
      : ""

  const tenkhoa =
    allStudentsInClasses?.length > 0
      ? allStudentsInClasses[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession
          ?.trainingCourse?.name
      : ""
  const data = dataMapping?.map((item, index) => {
    return {
      stt: index + 1,
      gvhd: item.name,
      donvi: item.sDonvi,
      tongsohv: item.GVHD1Student + item.GVHD2Student || 0,
      doclap: 0,
      gvhd1: item.GVHD1Student,
      gvhd2: item.GVHD2Student,
      thanhtoan: item.totalPayment,
      stk: item.stk,
      bank: item.tennganhang,
    }
  })
  try {
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "ThongKeCanBoHuongDan",
      path: "ThongKeCanBoHuongDan.xlsx",
      payload: [
        {
          data: {
            tendot: tendot || "",
            tenkhoa: tenkhoa,
            ngay: ngay,
            thang: thang,
            nam: nam,
            tongsohocvien: dataMapping?.reduce(
              (acc, item) => acc + item.GVHD1Student + item.GVHD2Student,
              0
            ),
            tongsohd1: dataMapping?.reduce((acc, item) => acc + item.GVHD1Student, 0),
            tongsohd2: dataMapping?.reduce((acc, item) => acc + item.GVHD2Student, 0),
            tongsotien: dataMapping?.reduce((acc, item) => acc + item.totalPayment, 0),
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
    downloadFile(blob, "ThongKeCanBoHuongDan.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const exportDanhSachBaoVe = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo danh sách bảo vệ LV")
    return
  }
  showSpinner()
  try {
    let index = 0
    const data = allStudentsInClasses
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
    // console.log("allStudentsInClasses",allStudentsInClasses)
    const dotxet =
      allStudentsInClasses
        ?.map((student) =>
          student?.thesisRegistrations
            ?.find((registration: any) => registration?.thesisProject?.thesisSession?.name)
            ?.thesisProject?.thesisSession?.name?.trim()
        )
        .find(Boolean) || "CHƯA CÓ ĐỢT XÉT"
    const normalizedDotxet = dotxet?.trim()?.toUpperCase()
    const soluonghocvien =
      allStudentsInClasses?.filter((student) =>
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
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách bảo vệ dán ngoài phòng")
    return []
  }
  showSpinner?.()
  try {
    const results = convertToDanhSachBaoVeDanNgoaiPhongData(allStudentsInClasses)
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
  showSpinner()
  try {
    const allSheetOptions = allStudentsInClasses?.map((student) => {
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
      const text2 = isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC"
      const ngayQDBV =
        student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.defenseDecisionDate
      const soQDBV =
        student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.defenseDecisionNumber
      const dotxetBV = student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name
      const ngaysinh = formatThesisDate(student?.userProfile?.dateOfBirth)
      const khoas = student?.fixedClass?.trainingCourse?.name || ""
      // const nguoiKi
      const data = {
        tenhocvien: student.userProfile?.fullname || "",
        soQD: soQDBV || "",
        ngayQD: formatThesisDate(ngayQDBV),
        dotxet: dotxetBV || "",
        type: student.thesisRegistrations?.[0]?.thesisProject?.type?.trim().toLowerCase() || "luận văn",
        khoa: `Ngày sinh: ${ngaysinh || ""}, ${khoas || ""}`,
        chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
        nganh:
          student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
          "",
        detai: `Đề tài: "${student?.thesisRegistrations?.[0]?.thesisProject?.title || ""}"`,
        ngaybaove: formatThesisDate(student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate),
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
  showSpinner()
  const presentDay = resolveSigningDate(signingDate).format("DD/MM/YYYY")
  const ngay = presentDay.split("/")[0]
  const thang = presentDay.split("/")[1]
  const nam = presentDay.split("/")[2]
  try {
    const allSheetOptions = allStudentsInClasses?.map((student) => {
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
        tendetai:
          `Tên đề tài: "${student?.thesisRegistrations?.[0]?.thesisProject?.title.trim()}"` || "",
        type: student?.thesisRegistrations?.[0]?.thesisProject?.type.trim().toLowerCase(),
        text1: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
        text2: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
        nguoiky1: signerName || "",
      }
      return {
        data: data,
      }
    })
    const payload = {
      fileName: "GiayMoiHDLV",
      path: "GiayMoiHDLV.docx",
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
  showSpinner()
  const now = resolveSigningDate(signingDate)
  const ngayHT = now.format("DD")
  const thangHT = now.format("M")
  const namHT = now.format("YYYY")
  try {
    const allSheetOptions = allStudentsInClasses
      ?.filter((s) => s?.thesisRegistrations?.[0]?.thesisProject)
      .map((student) => {
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
        const ngayQD = thesisProject?.thesisSession?.decisionDate
          ? dayjs(thesisProject?.thesisSession?.decisionDate).format("DD")
          : ""
        const thangQD = thesisProject?.thesisSession?.decisionDate
          ? dayjs(thesisProject?.thesisSession?.decisionDate).format("M")
          : ""
        const namQD = thesisProject?.thesisSession?.decisionDate
          ? dayjs(thesisProject?.thesisSession?.decisionDate).format("YYYY")
          : ""
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
        const text1 = chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT.GIÁM ĐỐC"
        const text2 = text1 === "GIÁM ĐỐC" ? "" : "PHÓ GIÁM ĐỐC"
        const dieu1 = `Điều 1: Giao đề tài ${type} tốt nghiệp và cán hộ hướng dẫn ngành ${nganh} (${chuyennganh}) về đề tài "${detai}".
        Học viên thực hiện: ${hoten}, ${khoa.name}(${khoa.academicYear}). 
        Cán bộ hướng dẫn: ${canbohuongdan1} 
                              ${canbohuongdan2}`
        const dieu2 = `Điều 2: ${khoaquanli} tổ chức triển khai cho cán bộ hướng dẫn và học viên thực hiện theo quy định.`
        const data = {
          soQD:
            student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionNumber || "",
          ngayQD: ngayQD,
          thangQD: thangQD,
          namQD: namQD,
          type: type || "",
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          dieu1: dieu1,
          dieu2: dieu2,
          text1: text1,
          text2: text2,
          nguoiky1: tenNguoiKyQddt,
          text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT.TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          text4: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
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
    const validItems = allSheetOptions?.filter((item) => item !== null) ?? []
    if (validItems.length === 0) {
      message.error("Không có học viên hợp lệ để xuất")
      return
    }

    const payload = {
      fileName: "BanSaoQDHuongDanLuanVan.docx",
      path: "BanSaoQDHuongDanLuanVan.docx",
      data: {
        items: validItems.map((item) => item!.data),
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
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo kiểm tra tiến độ")
    return
  }
  showSpinner()
  try {
    const organizationMap = new Map<string, any>()
    let dotxet = ""

    allStudentsInClasses.forEach((student) => {
      dotxet = dotxet || student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name || ""
      const thesisProject = student?.thesisRegistrations?.[0]?.thesisProject
      if (!thesisProject || !thesisProject.supervisor) return
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

    const dotXet = project.thesisSession?.trainingCourse?.name || ""
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
            text2: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
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
  try {
    showSpinner?.()
    const dataTrongHv = convertToGmcLvPbData(
      allStudentsInClasses,
      signerName,
      isChief,
      signingDate,
      "inAcademy"
    )
    const dataNgoaiHv = convertToGmcLvPbData(
      allStudentsInClasses,
      signerName,
      isChief,
      signingDate,
      "outsideAcademy"
    )
    if (dataTrongHv.length === 0 && dataNgoaiHv.length === 0) {
      message.error("Không có dữ liệu để tạo giấy mời chấm LV PB")
      return
    }
    const sheets = [
      ...(dataTrongHv.length > 0
        ? [{ sheetName: "Can bo trong hoc vien", payload: dataTrongHv }]
        : []),
      ...(dataNgoaiHv.length > 0
        ? [{ sheetName: "Can bo ngoai hoc vien", payload: dataNgoaiHv }]
        : []),
    ]
    const items = [...dataTrongHv, ...dataNgoaiHv].map((item) => item.data)
    const payload = {
      fileName: "GiayMoiChamLuanVan",
      path: "GiayMoiChamLuanVan.docx",
      data: {
        items: items,
      },
    }
    const response = await docxTemplate(payload)

    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "GiayMoiChamLuanVan.docx")
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
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thanh toán hội đồng bảo vệ")
    return
  }
  try {
    showSpinner?.()
    const dataConvert = convertToTthdbvData(allStudentsInClasses)
    if (dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để tạo thanh toán hội đồng bảo vệ")
      return
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "ThanhToanHoiDongBaoVe",
      path: "ThanhToanHoiDongBV.xlsx",
      payload: dataConvert,
      showGridLines: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "ThanhToanHoiDongBaoVe.xlsx")
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
const convertToTthdbvData = (allStudentsInClasses: any[]): TthdbvData[] => {
  if (!allStudentsInClasses?.length) return []

  const now = dayjs()
  const studentsWithProject = allStudentsInClasses.filter((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    return Boolean(project?.council?.members?.length)
  })
  if (!studentsWithProject.length) return []

  const majorMap = new Map<string, any[]>()
  let khoaquanli = ""

  studentsWithProject.forEach((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    const council = project?.council?.members
    if (!project || !council?.length) return

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

    sortedMembers.forEach((m: any) => {
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

      const rawAmount = Number(m.payment?.amount || 0)
      studentTotal += rawAmount
      ttLines.push(rawAmount.toLocaleString("vi-VN").replace(/\./g, " "))
      const bankNumber =
        expert?.lecturer?.userProfile?.bankAccountNumber ||
        expert?.bankAccountNumber ||
        "Chưa có thông tin"
      stkLines.push(bankNumber || "")
      const bankName =
        expert?.lecturer?.userProfile?.bankName || expert?.bankName || "Chưa có thông tin"

      nhLines.push(bankName || "")
    })

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
  })

  return Array.from(majorMap.entries()).map(([majorName, items]) => {
    const firstItem = studentsWithProject.find(
      (s) => s.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name === majorName
    )
    const project = firstItem?.thesisRegistrations?.[0]?.thesisProject
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
        chuyenNganh: majorName,
        khoaQuanLi: khoaquanli,
        tongTienBangSo: tongTienSo,
        nguoiki: nguoiki,
        tongTienBangChu: Number(tongTienSo).toVndWord("đồng"),
        data: items.map((item, index) => ({
          stt: index + 1,
          thongTinBaoVe: item.thongTinBaoVe,
          thongTinHoiDong: item.thongTinHoiDong,
          thongTinThanhToan: item.thongTinThanhToan,
          thongTinStk: item.thongTinStk,
          thongTinNganHang: item.thongTinNganHang,
        })),
      },
    }
  })
}
export const exportDanhSachNopLuanVanThuVien = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách nộp luận văn thư viện")
    return
  }
  const dataConvert = convertToDsnlvtvData(allStudentsInClasses)
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
      payload: [dataConvert],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
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
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất thống kê cán bộ tham gia HĐ")
    return
  }
  try {
    showSpinner?.()
    const dataConvert = convertToThongKeCbThamGiaHdData(allStudentsInClasses)
    if (dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để xuất thống kê cán bộ tham gia HĐ")
      return
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "ThongKeCbThamGiaHd",
      path: "ThongKeCanBoHoiDong.xlsx",
      payload: dataConvert,
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "ThongKeCbThamGiaHd.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToThongKeCbThamGiaHdData = (allStudentsInClasses: any[]): ThongKeCbThamGiaHdData[] => {
  if (!allStudentsInClasses || allStudentsInClasses.length === 0) return []

  const majorMap = new Map<string, any[]>()
  allStudentsInClasses.forEach((student) => {
    const majorName =
      student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "Chưa xác định"
    if (!majorMap.has(majorName)) {
      majorMap.set(majorName, [])
    }
    majorMap.get(majorName)?.push(student)
  })

  const result: ThongKeCbThamGiaHdData[] = []

  majorMap.forEach((students, majorName) => {
    const studentsWithProject = students.filter(
      (student) => student?.thesisRegistrations?.[0]?.thesisProject?.council
    )
    if (!studentsWithProject.length) {
      return
    }

    const expertStats = new Map<string, ThongKeCbThamGiaHdTable>()

    let totalParticipations = 0
    let totalCT = 0
    let totalTK = 0
    let totalUV = 0
    let totalPB1 = 0
    let totalPB2 = 0

    studentsWithProject.forEach((student) => {
      const project = student.thesisRegistrations?.[0]?.thesisProject
      if (!project || !project.council) return

      project.council.members.forEach((member: any) => {
        const expert = member.expert
        const name = (getSupervisorName(expert, false, true) as string) || ""
        const donViQuanLi = expert?.workplace || expert?.lecturer?.organization?.sMa || ""

        if (!expert?.id) return

        if (!expertStats.has(expert.id)) {
          expertStats.set(expert.id, {
            stt: 0,
            tenThanhVien: name || "",
            donViQuanLi: donViQuanLi || "",
            tongSo: 0,
            chuTich: 0,
            thuKi: 0,
            uyVien: 0,
            phanBien1: 0,
            phanBien2: 0,
          })
        }

        // biome-ignore lint/style/noNonNullAssertion: id của export luôn có
        const stats = expertStats.get(expert.id)!
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
      // Bỏ qua chuyên ngành không có cán bộ nào tham gia hội đồng.
      return
    }
    tableRows.forEach((row, index) => {
      row.stt = index + 1
    })

    const firstStudentWithProject = studentsWithProject[0]
    if (!firstStudentWithProject) {
      return
    }
    const project = firstStudentWithProject.thesisRegistrations?.[0]?.thesisProject

    result.push({
      data: {
        khoaTitle: firstStudentWithProject.fixedClass?.trainingCourse?.name?.toUpperCase() || "",
        khoa: firstStudentWithProject.fixedClass?.trainingCourse?.name || "",
        chuyenNganh: majorName,
        dotXet: project?.thesisSession?.name || "",
        tong: totalParticipations,
        tongChuTich: totalCT,
        tongThuky: totalTK,
        tongUyVien: totalUV,
        tongPhanBien1: totalPB1,
        tongPhanBien2: totalPB2,
        data: tableRows,
      },
    })
  })

  return result
}
export const exportThanhToanHuongDanTrongHv = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
  inAcademy,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất thanh toán hướng dẫn")
    return []
  }
  try {
    showSpinner?.()
    const dataConvert = convertToThanhToanHuongDanTrongHvData(allStudentsInClasses, inAcademy)
    if (dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để xuất thanh toán hướng dẫn")
      return []
    }
    const fileName = inAcademy ? "ThanhToanHuongDanTrongHv" : "ThanhToanHuongDanNgoaiHV"
    const path = inAcademy ? "ThanhToanHuongDanTrongHV.xlsx" : "ThanhToanHuongDanNgoaiHV.xlsx"
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: fileName,
      path: path,
      payload: dataConvert,
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, `${fileName}.xlsx`)
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToThanhToanHuongDanTrongHvData = (
  allStudentsInClasses: any[],
  inAcademy?: boolean
): ThanhToanHuongDanTrongHvData[] => {
  if (!allStudentsInClasses?.length) {
    return []
  }

  const now = dayjs()
  const organizationMap = new Map<string, ThanhToanHuongDanTrongHvData>()

  allStudentsInClasses.forEach((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    if (!project) return

    const isMatchInAcademy = (expert: any) => {
      const hasLecturer = !!(expert?.lecturer || expert?.lecturerId)
      if (inAcademy === true) return hasLecturer
      if (inAcademy === false) return !hasLecturer
      return true
    }

    const supervisorRows = [
      {
        expert: project.supervisor,
        amount: Number(project.supervisorPayment?.amount || 0),
        bankAccountNumber: project.supervisor?.bankAccountNumber || "",
        bankName: project.supervisor?.bankName || "",
      },
      {
        expert: project.coSupervisor,
        amount: Number(project.coSupervisorPayment?.amount || 0),
        bankAccountNumber: project.coSupervisor?.bankAccountNumber || "",
        bankName: project.coSupervisor?.bankName || "",
      },
    ].filter((item) => item.expert && isMatchInAcademy(item.expert))

    if (!supervisorRows.length) return

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
    const thongTinThanhToan = totalAmount === 0 ? "" : amounts.join("\n")
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
  })

  return Array.from(organizationMap.values())
}
export const exportKetQuaBaoVeLuanVan = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất kết quả bảo vệ luan van")
    return []
  }
  try {
    showSpinner?.()
    const dataConvert = convertToKqbvlvData(allStudentsInClasses)

    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất kết quả bảo vệ luan van")
      return []
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "KetQuaBaoVeLuanVan",
      path: "KetQuaBaoVeLuanVan.xlsx",
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
  try {
    showSpinner?.()
    const dataConvert = convertToBanSaoHDDGLV(
      allStudentsInClasses,
      signerName,
      isChief,
      signingDate
    )

    if (!dataConvert || dataConvert.length === 0) {
      message.error("Chưa có dữ liệu để xuất bản sao hội đồng bảo vệ luan van")
      return
    }
    const payload = {
      fileName: "BanSaoHoiDongDanhGiaLuanVan",
      path: "BanSaoHoiDongDanhGiaLuanVan.docx",
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
        gvhd1 = (getSupervisorName(project?.supervisor, false, true) as string) || ""
      }
      let gvhd2 = ""
      if (project?.coSupervisor) {
        gvhd2 = (getSupervisorName(project?.coSupervisor, false, true) as string) || ""
      }
      const loaiLuanVan = project?.type.trim().toLowerCase() || ""
      const nganh =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
      const chuyenNganh =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
      const deTai = project?.title || ""
      const tenhocvien = student.userProfile?.fullname || ""
      const ngaysinh = formatThesisDate(student.userProfile?.dateOfBirth)
      const khoaHoc = student.fixedClass?.trainingCourse?.name || ""
      const nienkhoahoc = student.fixedClass?.trainingCourse?.academicYear || ""
      const gvhd = [gvhd1, gvhd2].filter(Boolean).join("; ")

      const m = qdDate ? qdDate.month() + 1 : null
      const thangTlVal = m ? ((m === 1 || m === 2) ? m.toString().padStart(2, "0") : m.toString()) : ""

      return {
        data: {
          text1: chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT.GIÁM ĐỐC",
          text2: chucVuNguoiKyQddt === "GĐ" ? "" : "PHÓ GIÁM ĐỐC",
          nguoiki1: tenNguoiKyQddt,
          text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          text4: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
          nguoiki2: signerName || "",

          soQd: session?.defenseDecisionNumber || "",
          ngayTl: qdDate ? qdDate.date().toString() : "",
          thangTl: thangTlVal,
          namTl: qdDate ? qdDate.format("YYYY") : "",
          khoa: session?.trainingCourse?.name || "",
          dotXet: session?.name || "",
          loaiLuanVan: loaiLuanVan,
          councilReport: session?.councilReport || "",

          nganh: nganh,
          chuyenNganh: chuyenNganh,
          deTai: deTai,
          dieu1: `Điều 1. Thành lập hội đồng đánh giá ${loaiLuanVan} tốt nghiệp thạc sĩ ngành ${nganh} (${chuyenNganh}) về đề tài "${deTai}". \n     Học viên thực hiện: ${tenhocvien}, sinh ngày ${ngaysinh}, ${khoaHoc}). \n     Cán bộ hướng dẫn: ${gvhd}.\n     Danh sách các thành viên tham gia Hội đồng:
        `,
          tenHocVien: student.userProfile?.fullname || "",
          ngaySinh: student.userProfile?.dateOfBirth
            ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "",
          khoaHoc: student.fixedClass?.trainingCourse?.name || "",
          gvhd: [gvhd1, gvhd2].filter(Boolean).join("; "),
          tenChuTich: (getSupervisorName(chairman?.expert, false, true) as string) || "",
          toChucChuTich: chairman?.expert?.workplace || "HVKTQS",

          tenThuKy: (getSupervisorName(secretary?.expert, false, true) as string) || "",
          toChucThuKy: secretary?.expert?.workplace || "HVKTQS",
          tenUyVien: (getSupervisorName(member?.expert, false, true) as string) || "",
          toChucUyVien: member?.expert?.workplace || "HVKTQS",
          tenPb1: (getSupervisorName(pb1?.expert, false, true) as string) || "",
          toChucPb1: pb1?.expert?.workplace || "HVKTQS",
          tenPb2: (getSupervisorName(pb2?.expert, false, true) as string) || "",
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
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất phụ lục QĐHĐ")
    return []
  }
  try {
    showSpinner?.()
    const dataConvert = convertToPhuLucQdhdTemplateData(allStudentsInClasses)
    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất phụ lục QĐHĐ")
      return []
    }
    const payloadRows = dataConvert.data.flatMap((major: PhuLucQdhdData) =>
      major.data.data.map((row: PhuLucQdhdTable, rowIdx: number) => ({
        sttChuyenNganh: rowIdx === 0 ? major.data.sttChuyenNganh : "",
        tenChuyenNganh: rowIdx === 0 ? major.data.tenChuyenNganh : "",
        sttHoiDong: row.sttHoiDong,
        contentDieu1: row.contentDieu1,
        tenHocVien: row.tenHocVien,
        ngaySinh: row.ngaySinh,
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
    const groupKey = `Ngành ${trainingField} (${majorName})`
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
      const ngaysinh = formatThesisDate(student.userProfile?.dateOfBirth)
      return {
        sttHoiDong: (studentIdx + 1).toString(),
        contentDieu1: `${project?.type} tốt nghiệp thạc sĩ ngành ${groupKey}, Đề tài: ${project?.title.trim().replace(/\s+/g, " ") || ""}`,
        tenHocVien: student.userProfile?.fullname || "",
        ngaySinh: `${ngaysinh}, ${student.fixedClass?.trainingCourse?.name || ""} (${student.fixedClass?.trainingCourse?.academicYear || ""})`,
        gvhd1: (getSupervisorName(project?.supervisor, false, true) as string) || "",
        gvhd2: (getSupervisorName(project?.coSupervisor, false, true) as string) || "",

        tenChuTich: (getSupervisorName(chairman?.expert, false, true) as string) || "",
        toChucChuTich: chairman?.expert?.workplace || "Học viện KTQS",

        tenThuKy: (getSupervisorName(secretary?.expert, false, true) as string) || "",
        toChucThuKy: secretary?.expert?.workplace || "Học viện KTQS",

        tenUyVien: (getSupervisorName(member?.expert, false, true) as string) || "",
        toChucUyVien: member?.expert?.workplace || "Học viện KTQS",

        tenPb1: (getSupervisorName(reviewer1?.expert, false, true) as string) || "",
        toChucPb1: reviewer1?.expert?.workplace || "Học viện KTQS",

        tenPb2: (getSupervisorName(reviewer2?.expert, false, true) as string) || "",
        toChucPb2: reviewer2?.expert?.workplace || "Học viện KTQS",
      }
    })

    groupedData.push({
      data: {
        sttChuyenNganh: toRoman(majorIndex),
        tenChuyenNganh: groupKey,
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
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách chuyên gia")
    return []
  }
  try {
    const dataConvert = convertToDsChuyenGiaData(allStudentsInClasses)
    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất danh sách chuyên gia")
      return []
    }
    showSpinner?.()
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "DsChuyenGia",
      path: "DanhSachChuyenGia.xlsx",
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
    downloadFile(blob, "DsChuyenGia.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToDsChuyenGiaData = (allStudentsInClasses: any[]): DsChuyenGiaData => {
  if (!allStudentsInClasses?.length) {
    return {
      data: {
        ngay: "",
        thang: "",
        nam: "",
        diaDiem: "",
        thoiGian: "",
        tongTienSo: "0",
        soChuyenGia: 0,
        tongTienChu: "0",
        nguoiki: "",
        data: [],
      },
    }
  }

  const expertAggregator = new Map<string, any>()
  const now = dayjs()
  let nguoiki = ""

  allStudentsInClasses.forEach((student) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject
    if (!project) return

    const members = project.council?.members || []
    nguoiki = project.thesisSession?.chief?.trim() || ""
    members.forEach((member: any) => {
      const expert = member.expert
      if (!expert || expert.lecturerId || expert.lecturer) return

      const expertId = expert.id
      const amount = Number(member.payment?.amount || 0)

      if (!expertAggregator.has(expertId)) {
        expertAggregator.set(expertId, {
          tenChuyenGia: (getSupervisorName(expert, false, true) as string) || "",
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

  let totalSum = 0
  const tableData: DsChuyenGiaTable[] = Array.from(expertAggregator.values()).map((item, index) => {
    totalSum += item.soTienRaw
    return {
      stt: (index + 1).toString(),
      tenChuyenGia: item.tenChuyenGia,
      chucVu: item.chucVu,
      donViQuanLi: item.donViQuanLi,
      soTien: item.soTienRaw.toLocaleString("vi-VN"),
      stk: item.stk,
      ngangHang: item.ngangHang,
      kiNhan: "",
    }
  })

  return {
    data: {
      nguoiki: nguoiki,
      ngay: now.date().toString(),
      thang: (now.month() + 1 === 1 || now.month() + 1 === 2) ? (now.month() + 1).toString().padStart(2, "0") : (now.month() + 1).toString(),
      nam: now.format("YYYY"),
      diaDiem: "",
      // thoiGian: `Ngày ${now.format("DD")} tháng ${now.format("MM")} năm ${now.format("YYYY")}`,
      thoiGian: "",
      tongTienSo: totalSum.toLocaleString("vi-VN"),
      soChuyenGia: tableData.length,
      tongTienChu: Number(totalSum).toVndWord("đồng"),
      data: tableData,
    },
  }
}
export const exportHDDanhGiaLuanVan = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất danh sách đánh giá luan van")
    return []
  }
  try {
    const dataConvert = convertToHDDanhGiaLuanVanTemplateData(allStudentsInClasses)
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
        ngaySinh: formatThesisDate(student.userProfile?.dateOfBirth),
        hocVienCanBoHuongDan: hvCbhd,
        deTai: project?.title || "",
        gioBaoVe: project?.defenseSession?.startTime
          ? dayjs(project.defenseSession.startTime).format("HH:mm")
          : "",
        ngayBaoVe: formatThesisDate(project?.defenseDate),
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
      thang: (now.month() + 1 === 1 || now.month() + 1 === 2) ? (now.month() + 1).toString().padStart(2, "0") : (now.month() + 1).toString(),
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
    firstProject?.thesisSession?.trainingCourse?.name ||
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
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo thống kê cán bộ tham gia HĐ ngoài HV")
    return
  }
  showSpinner()
  try {
    const data = convertToThongKeCoQuanDonViCanBoNgoaiHvData(allStudentsInClasses)
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "ThongKeCoQuanDonViCanBoNgoaiHv",
      path: "ThongKeCoQuanDonViCanBoNgoaiHv.xlsx",
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
