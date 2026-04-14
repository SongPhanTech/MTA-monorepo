import { CouncilRole, ThesisType, TrainingObjectTypes } from "@workspace/db/client"
import { excelTemplate } from "@workspace/libs/api/model"
import type { ExcelTemplateBody } from "@workspace/libs/api/schemas"
import { exportFromTemplate, type TableRow } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { dayjs } from "@workspace/ui"
import { toRoman } from "./romans"
import { getSupervisorName } from "../pages/quan-ly-luan-van/dm-luan-van/index"
interface ExportOptions {
  allStudentsInClasses: any[]
  showSpinner: () => void
  hideSpinner: () => void
  message: any // Antd message instance
  inAcademy?: boolean
  /** Người ký (mẫu cần ký): họ tên và chức danh — thay thế placeholder trong template */
  signerName?: string
  isChief?: boolean
}
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
    nguoiki:string
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
    dieu1:string
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
    gvhd:string
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
    const organizationMap = new Map<string, any>()
    let dotxet = ""

    allStudentsInClasses.forEach((student) => {
      dotxet = dotxet || student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name || ""
      const thesisProject = student?.thesisRegistrations?.[0]?.thesisProject
      if (!thesisProject) return
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
      orgData.thesisProject.push({
        studentId: student.id || "",
        hovatenhocvien: student.userProfile?.fullname || "",
        ngaysinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        doituongdaotao: student?.fixedClass?.trainingCourse?.trainingObjectType?.name || "",
        khoa: student.fixedClass?.trainingCourse?.name || "",
        tendetai: thesisProject.title || "",
        gvhd1: getSupervisorName(thesisProject.supervisor ) || "",
        gvhd2: getSupervisorName(thesisProject.coSupervisor) || "",
        isThesis: thesisProject.thesisType === ThesisType.THESIS ? "Luận văn" : "Đồ án",
        language: thesisProject.language.trim(),
      })
    })
    const result = Array.from(organizationMap.values())
    if (result.length === 0) {
      message.error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
      hideSpinner()
      return
    }
    let count = 1
    const dataRows: TableRow[] = result.flatMap((item: any) => {
      const orgRow: TableRow = {
        cells: [
          {
            value: `${item.sCode} - ${item.sTen}`,
            border: true,
            align: "center",
            colSpan: 6,
            bold: true,
          },
        ],
      }
      const thesisRows: TableRow[] = item.thesisProject.map((thesis: any) => {
        return {
          cells: [
            { value: count++, border: true, align: "center" },
            {
              value: `${thesis.hovatenhocvien}\n${thesis.ngaysinh}\n${thesis.doituongdaotao}-${thesis.khoa}`,
              border: true,
              align: "left",
            },
            { value: `${thesis.tendetai}`, border: true, align: "left" },
            {
              value: `${thesis.gvhd1 ? `1. ${thesis.gvhd1}` : ""}\n${
                thesis.gvhd2 ? `2. ${thesis.gvhd2}` : ""
              }`,
              border: true,
              align: "left",
            },
            { value: `${thesis.isThesis}`, border: true, align: "center" },
            { value: `${thesis.language}`, border: true, align: "center" },
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
          value: `(Tổng số: ${count - 1} học viên)`,
          align: "center",
          colSpan: 6,
          border: false,
        },
      ],
    }
    await exportFromTemplate({
      templateUrl: getMinioUrl("mta/template/phulucluanvanthacsi.xlsx"),
      sheets: [
        {
          sheet: "phulucluanvanthacsi",
          rows: [...dataRows, gapRow, totalRow],
          tableStartCell: { row: 7, col: 1 },
          data: { dotxet: dotxet || "" },
        },
      ],
      fileName: "PhuLucDsLuanVan",
    })
    message.success("Xuất file thành công")
  } catch (error) {
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
        name: expert.name ?? "",
        sDonvi: expert.organization ?? "",
        stk: expert.bankAccountNumber ?? "",
        tennganhang: expert.bankName ?? "",
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

  const tenkhoa = ""
  const rows: TableRow[] = dataMapping?.map((item, index) => {
    return {
      cells: [
        { value: index + 1, border: true, align: "center" },
        { value: item.name, border: true, align: "center" },
        { value: item.sDonvi, border: true, align: "center" },
        {
          value: item.GVHD1Student + item.GVHD2Student || 0,
          border: true,
          align: "center",
        },
        { value: 0, border: true, align: "center" },
        { value: item.GVHD1Student, border: true, align: "center" },
        { value: item.GVHD2Student, border: true, align: "center" },
        { value: item.totalPayment, border: true, align: "center" },
        { value: item.stk, border: true, align: "center" },
        { value: item.tennganhang, border: true, align: "center" },
      ],
    }
  })
  const totalRow: TableRow = {
    cells: [
      { value: "", border: true, align: "center" },
      {
        value: "Tổng cộng",
        border: true,
        align: "right",
        colSpan: 2,
        bold: true,
      },
      {
        value: dataMapping?.reduce((acc, item) => acc + item.GVHD1Student + item.GVHD2Student, 0),
        border: true,
        align: "center",
        bold: true,
      },
      { value: 0, border: true, align: "center", bold: true },
      {
        value: dataMapping?.reduce((acc, item) => acc + item.GVHD1Student, 0),
        border: true,
        align: "center",
        bold: true,
      },
      {
        value: dataMapping?.reduce((acc, item) => acc + item.GVHD2Student, 0),
        border: true,
        align: "center",
        bold: true,
      },
      {
        value: dataMapping?.reduce((acc, item) => acc + item.totalPayment, 0),
        border: true,
        align: "center",
        bold: true,
      },
      { value: "", border: true, align: "center", bold: true },
      { value: "", border: true, align: "center", bold: true },
    ],
  }
  try {
    await exportFromTemplate({
      templateUrl: getMinioUrl("mta/template/ThongKeCanBoHuongDan.xlsx"),
      sheets: [
        {
          sheet: "ThongKeCanBoHuongDan",
          data: {
            tendot: tendot || "",
            tenkhoa: tenkhoa,
            ngay: ngay,
            thang: thang,
            nam: nam,
          },
          rows: [...rows, totalRow],
          tableStartCell: { row: 10, col: 1 },
        },
      ],
      fileName: "ThongKeCanBoHuongDan",
    })
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
    const data  = allStudentsInClasses?.map((student, index) => {
        return { stt: index + 1,
              chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
              dt: tenDoiTuong[student?.fixedClass?.trainingCourse?.trainingObjectType?.type as keyof typeof tenDoiTuong]?.shortname || "",
              lastname: student.userProfile?.lastName || "",
              firstname: student.userProfile?.firstName || "",
              empty:"",
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
        }
      )
    const dotxet =
      allStudentsInClasses?.length > 0
        ? allStudentsInClasses[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name
        : ""
    const soluonghocvien = allStudentsInClasses?.length
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "DanhSachBaoVe",
      path: "DanhSachBaoVe.xlsx",
      payload: [{ data:{
        dotxet: dotxet.trim().toUpperCase() || "",
        soluonghocvien: soluonghocvien,
        data: data,
      }}],
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
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner()
  }
}
export const exportHosobvlv = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo danh sách bảo vệ LV dán PBV")
    return
  }
  showSpinner()
  try {
    const allSheetOptions = allStudentsInClasses?.map((student) => {
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
      const nguoikiqddt =
          student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.defenseDecisionMaker?.trim() || ""
        const qddtKyTokens = nguoikiqddt.split(/\s+/).filter(Boolean)
        const chucVuNguoiKyQddt = qddtKyTokens[0] ?? ""
        const tenNguoiKyQddt = qddtKyTokens.slice(1).join(" ").trim()
        const text1 = chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT.GIÁM ĐỐC"
        const text2 = text1 === "GIÁM ĐỐC" ? "" : "PHÓ GIÁM ĐỐC"
      // const nguoiKi
      const data = {
        tenhocvien: student.userProfile?.fullname || "",
        type: student.thesisRegistrations?.[0]?.thesisProject?.type,
        khoa: student?.fixedClass?.trainingCourse?.name || "",
        chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
        nganh:
          student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
          "",
        detai: `Đề tài: "${student?.thesisRegistrations?.[0]?.thesisProject?.title || ""}"`,
        ngaybaove: student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
          ? dayjs(student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate).format(
              "DD/MM/YYYY"
            )
          : "",
        phanbien1: getSupervisorName(phanbien1?.expert) || "",
        phanbien2: getSupervisorName(phanbien2?.expert) || "",
        chutich: getSupervisorName(chutich?.expert) || "",
        thuky: getSupervisorName(thuky?.expert) || "",
        uyvien: getSupervisorName(uyvien?.expert) || "",
        nguoiki:tenNguoiKyQddt,
        text1: text1,
        text2: text2,
      }
      return {
        // sheet: `${student.userProfile?.code}`,
        data: data,
        // tableStartCell: { row: 104, col: 1 },
        // rows: [gapRow],
      }
    })
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "HoSoBVLVTN.",
      path: "HoSoBVLVTN.xlsx",
      payload: allSheetOptions?.filter((item) => item !== null) ?? [],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "Hosobvlv.xlsx")
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
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu đế tạo giấy mời HDLV")
    return
  }
  showSpinner()
  const presentDay = dayjs().format("DD/MM/YYYY")
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
        tenhuongdan: supervisor ? ` ${getSupervisorName(supervisor,false,true)}` : "",
        khoa: khoahoc,
        chuyennganh: student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
        tendetai:  `Tên đề tài: "${student?.thesisRegistrations?.[0]?.thesisProject?.title.trim()}"` || "",
        type: student?.thesisRegistrations?.[0]?.thesisProject?.type.trim().toLowerCase(),
        text1: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
        text2: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
        nguoiky1:signerName || "",
      }
      return {
        data: data,
      }
    })
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "GiayMoiHDLV",
      path: "GiayMoiHDLV.xlsx",
      payload: allSheetOptions?.filter((item) => item !== null) ?? [],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "GiayMoiHDLV.xlsx")
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
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu đế tạo sao QĐ HDLV")
    return
  }
  showSpinner()
  const presentDay = dayjs().format("DD/MM/YYYY")

  const ngayHT = presentDay.split("/")[0]
  const thangHT = presentDay.split("/")[1]
  const namHT = presentDay.split("/")[2]
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
        const ngayQD = thesisProject?.thesisSession?.decisionDate ? dayjs(thesisProject?.thesisSession?.decisionDate).format("DD") : ""
        const thangQD = thesisProject?.thesisSession?.decisionDate ? dayjs(thesisProject?.thesisSession?.decisionDate).format("MM") : ""
        const namQD = thesisProject?.thesisSession?.decisionDate ? dayjs(thesisProject?.thesisSession?.decisionDate).format("YYYY") : ""
        const canbohuongdan1 = `1. ${getSupervisorName(supervisor,false,true)}`
        const canbohuongdan2 = coSupervisor ? `2. ${getSupervisorName(coSupervisor,false,true)}` : ""
        const khoaquanli = thesisProject.organization?.sTen || ""
        const nguoikiqddt =
          student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.decisionMaker?.trim() || ""
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
            student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession
              ?.decisionNumber || "",
          ngayQD: ngayQD,
          thangQD: thangQD,
          namQD: namQD,
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          dieu1: dieu1,
          dieu2: dieu2,
          text1: text1,
          text2: text2,
          nguoiky1:tenNguoiKyQddt,
          text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT.TRƯỞNG PHÒNG SAU ĐẠI HỌC",
          text4: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
          nguoiki2:signerName,
          ngay: ngayHT,
          thang: thangHT,
          nam: namHT,
          data: [],
        }
        return {
          data: data,
        }
      })
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "BanSaoQDHuongDanLuanVan",
      path: "BanSaoQDHuongDanLuanVan.xlsx",
      payload: allSheetOptions?.filter((item) => item !== null) ?? [],
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "BanSaoQDHuongDanLuanVan.xlsx")
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
      const gvhd1 = getSupervisorName(thesisProject.supervisor) || ""
      const gvhd2 = getSupervisorName(thesisProject.coSupervisor) || ""
      const gvhdNames = [gvhd1, gvhd2].filter(Boolean)
      orgData.thesisProject.push({
        studentId: student.id || "",
        hovatenhocvien: student.userProfile?.fullname || "",
        ngaysinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        doituongdaotao: tenDoiTuong[student?.fixedClass?.trainingCourse?.trainingObjectType?.type as keyof typeof tenDoiTuong]?.shortname ||  "",
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
          {value:""},
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
            { value: index + 1, border: true, align: "center",fontSize:12 },
            {
              value: `${thesis.hovatenhocvien}\nĐT:${thesis.doituongdaotao}\nSố QĐ:${thesis.decisionNumber}\n${thesis.gvhd ? `CBHD:${thesis.gvhd}` : "CBHD"}`.trim(),
              border: true,
              align: "left",
              fontSize:12,
            },
            { value: `${thesis.tendetai}`, border: true, align: "left" },
            {
              value: "",
              border: true,
              align: "left",
              fontSize:12,
            },
            { value: "", border: true, align: "center",fontSize:12 },
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
          fontSize:12,
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
        { value: "(Ký và ghi rõ họ tên)", colSpan: 2, border: false, italic: true, align: "center" },
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
export const exportGiayMoiChamLvPb = async ({
  allStudentsInClasses,
  showSpinner,
  hideSpinner,
  message,
  signerName,
  isChief,
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để tạo giấy mời chấm LV PB")
    return
  }
  try {
    showSpinner?.()
    const dataConvert = convertToGmcLvPbData(allStudentsInClasses,signerName,isChief)
    if (dataConvert.length === 0) {
      message.error("Không có dữ liệu để tạo giấy mời chấm LV PB")
      return
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "GiayMoiChamLuanVan",
      path: "GiayMoiChamLuanVan.xlsx",
      payload: dataConvert,
      showGridLines: true,
    }
    const response = await excelTemplate(payload)

    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return
    }
    const blob = response.data
    downloadFile(blob, "GiayMoiChamLuanVan.xlsx")
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
const convertToGmcLvPbData = (allStudentsInClasses: any[],signerName?: string,isChief?: boolean): GmcLvPbData[] => {
  if (!allStudentsInClasses?.length) return []

  const expertMap = new Map<string, GmcLvPbData>()
  const expertStudentMap = new Map<string, Set<string>>()
  const expertProjectTypeMap = new Map<string, Set<"luận văn" | "đề án">>()

  const now = dayjs()
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
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""

    const members = project.council?.members || []
    members.forEach((member: any) => {
      const expert = member.expert
      if (!expert?.id) return

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
            nguoiki:signerName || "",
            tenThanhVien: getSupervisorName(expert,false,true) as string || "",
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

  return Array.from(expertMap.values())
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

  const majorMap = new Map<string, any[]>()
  let khoaquanli = ""

  allStudentsInClasses.forEach((student) => {
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
      const name = getSupervisorName(expert,false,true) as string || ""
      hdLines.push(`${rolePrefix}: ${name || ""}${org}${roleSuffix}`)

      const rawAmount = Number(m.payment?.amount || 0)
      studentTotal += rawAmount
      ttLines.push(rawAmount.toLocaleString("vi-VN").replace(/\./g, " "))
      const bankNumber = expert?.lecturer?.userProfile?.bankAccountNumber || expert?.bankAccountNumber || "Chưa có thông tin"
      stkLines.push(bankNumber || "")
      const bankName = expert?.lecturer?.userProfile?.bankName || expert?.bankName || "Chưa có thông tin"
        
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
    const firstItem = allStudentsInClasses.find(
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
        data: [],
        tongSo: "0",
      },
    }
  }

  const firstProject = allStudentsInClasses.find((s) => s.thesisRegistrations?.[0]?.thesisProject)
    ?.thesisRegistrations[0].thesisProject

  const tableData: DsnlvtvTable[] = allStudentsInClasses.map((student, index) => {
    const project = student?.thesisRegistrations?.[0]?.thesisProject

    const hoTen = student.userProfile?.fullname || ""
    const doiTuong = student?.fixedClass?.trainingCourse?.trainingObjectType?.name || ""
    const khoaHoc = student?.fixedClass?.trainingCourse?.name || ""
    const chuyenNganh =
      student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""

    const thongTinBaoVe = `${hoTen} \n ${doiTuong} - ${khoaHoc} - ${chuyenNganh}`

    const gvhd1 = project?.supervisor?.name
    const gvhd2 = project?.coSupervisor?.name

    let thongTinHuongDan = ""
    if (gvhd1 && gvhd2) {
      thongTinHuongDan = `1.${gvhd1};\n2.${gvhd2}.`
    } else {
      thongTinHuongDan = gvhd1 || gvhd2 || "Chưa có GVHD"
    }

    const thongTinDeTai = project?.title || "Chưa có tên đề tài"

    //TODO: Thông tin Lưu trữ
    const lib = ""
    const thongTinLuuTru = lib

    return {
      stt: index + 1,
      thongTinBaoVe,
      thongTinHuongDan,
      thongTinDeTai,
      thongTinLuuTru,
    }
  })

  return {
    data: {
      khoa: allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name || "",
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
    const expertStats = new Map<string, ThongKeCbThamGiaHdTable>()

    let totalParticipations = 0
    let totalCT = 0
    let totalTK = 0
    let totalUV = 0
    let totalPB1 = 0
    let totalPB2 = 0

    students.forEach((student) => {
      const project = student.thesisRegistrations?.[0]?.thesisProject
      if (!project || !project.council) return

      project.council.members.forEach((member: any) => {
        const expert = member.expert
        const name = expert.lecturer ? expert.lecturer.userProfile?.fullname : expert.name
        const donViQuanLi = expert.lecturer ? expert.lecturer.organization : expert.organization

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
    tableRows.forEach((row, index) => {
      row.stt = index + 1
    })

    const firstStudent = students[0]
    const project = firstStudent.thesisRegistrations?.[0]?.thesisProject

    result.push({
      data: {
        khoa: firstStudent.fixedClass?.trainingCourse?.name || "",
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
    const dataConvert = convertToThanhToanHuongDanTrongHvData(allStudentsInClasses,inAcademy)
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
      (item) => (getSupervisorName(item.expert, false, false) as string) || ""
    )
    let thongTinHuongDan = ""
    thongTinHuongDan =
      supervisorNames.length > 1
        ? supervisorNames.map((name, index) => `${index + 1}. ${name}`).join("\n")
        : (supervisorNames[0] ?? "Chưa có GVHD")

    // const loaiDoiTuong = student.fixedClass?.trainingCourse?.trainingObjectType?.type || ""
    // const shortDoiTuong = tenDoiTuong[loaiDoiTuong as keyof typeof tenDoiTuong]?.shortname || ""
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
}: ExportOptions) => {
  if (!allStudentsInClasses?.length) {
    message.error("Không có dữ liệu để xuất bản sao hội đồng bảo vệ luan van")
    return []
  }
  try {
    showSpinner?.()
    const dataConvert = convertToBanSaoHDDGLV(allStudentsInClasses,signerName,isChief)

    if (!dataConvert) {
      message.error("Chưa có dữ liệu để xuất bản sao hội đồng bảo vệ luan van")
      return
    }
    const payload: ExcelTemplateBody = {
      head: { data: null },
      tail: { data: null },
      fileName: "BanSaoHoiDongDanhGiaLuanVan",
      path: "BanSaoHoiDongDanhGiaLuanVan.xlsx",
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
    downloadFile(blob, "BanSaoHoiDongDanhGiaLuanVan.xlsx")
    message.success("Xuất file thành công")
  } catch (error) {
    message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  } finally {
    hideSpinner?.()
  }
}
const convertToBanSaoHDDGLV = (allStudentsInClasses: any[],signerName?: string,isChief?: boolean): banSaoHDDGLV[] => {
  if (!allStudentsInClasses?.length) return []

  const now = dayjs()
  const currentDay = now.format("DD")
  const currentMonth = now.format("MM")
  const currentYear = now.format("YYYY")

  return allStudentsInClasses.map((student) => {
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
      gvhd1 = getSupervisorName(project?.supervisor) as string || ""
    }
    let gvhd2 = ""
    if (project?.coSupervisor) {
      gvhd2 = getSupervisorName(project?.coSupervisor) as string || ""
    }
    const loaiLuanVan = project?.type.trim().toLowerCase() || ""
    const nganh = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
    const chuyenNganh = student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
    const deTai = project?.title || ""
    const tenhocvien = student.userProfile?.fullname || ""
    const ngaysinh = student.userProfile?.dateOfBirth ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY") : ""
    const khoaHoc = student.fixedClass?.trainingCourse?.name || ""
   const nienkhoahoc = student.fixedClass?.trainingCourse?.academicYear || ""
   const gvhd = [gvhd1, gvhd2].filter(Boolean).join("; ")
    return {
      data: {
        text1: chucVuNguoiKyQddt === "GĐ" ? "GIÁM ĐỐC" : "KT.GIÁM ĐỐC",
        text2: chucVuNguoiKyQddt === "GĐ" ? "" : "PHÓ GIÁM ĐỐC",
        nguoiki1:tenNguoiKyQddt,
        text3: isChief ? "TRƯỞNG PHÒNG SAU ĐẠI HỌC" : "KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC",
        text4: isChief ? "" : "PHÓ PHÒNG SAU ĐẠI HỌC",
        nguoiki2:signerName || "",
        
        soQd: session?.defenseDecisionNumber || "",
        ngayTl: qdDate ? qdDate.format("DD") : "",
        thangTl: qdDate ? qdDate.format("MM") : "",
        namTl: qdDate ? qdDate.format("YYYY") : "",
        khoa: session?.trainingCourse?.name || "",
        dotXet: session?.name || "",
        loaiLuanVan: loaiLuanVan,
        
        nganh: nganh,
        chuyenNganh: chuyenNganh,
        deTai: deTai,
        dieu1: `Điều 1. Thành lập hội đồng đánh giá ${loaiLuanVan} tốt nghiệp thạc sĩ ngành ${nganh} (${chuyenNganh}) về đề tài "${deTai}". \n     Học viên thực hiện: ${tenhocvien}, sinh ngày ${ngaysinh}, Khoá ${khoaHoc} (${nienkhoahoc}). \n     Cán bộ hướng dẫn: ${gvhd}.\n     Chỉ định và mời các đồng chí có tên sau đây tham gia hội đồng:
        `,
        tenHocVien: student.userProfile?.fullname || "",
        ngaySinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        khoaHoc: student.fixedClass?.trainingCourse?.name || "",
        gvhd: [gvhd1, gvhd2].filter(Boolean).join("; "),
        tenChuTich: getSupervisorName(chairman?.expert) as string || "",
        toChucChuTich:
          chairman?.expert?.workplace || "HVKTQS",
            
        tenThuKy: getSupervisorName(secretary?.expert) as string || "",
        toChucThuKy:
          secretary?.expert?.workplace || "HVKTQS",
        tenUyVien: getSupervisorName(member?.expert) as string || "",
        toChucUyVien:
          member?.expert?.workplace || "HVKTQS",
        tenPb1: getSupervisorName(pb1?.expert) as string || "",
        toChucPb1:
          pb1?.expert?.workplace || "HVKTQS",
        tenPb2: getSupervisorName(pb2?.expert) as string || "",
        toChucPb2:
          pb2?.expert?.workplace || "HVKTQS",
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
    console.log("dataConvert", dataConvert)
    const payload: ExcelTemplateBody = {
      head: { data: dataConvert.head.data },
      tail: { data: dataConvert.tail.data },
      fileName: "PhuLucQdhd",
      path: "PhuLucQDHoiDong.xlsx",
      payload: dataConvert.data,
      showGridLines: true,
      wrapText: true,
    }
    const response = await excelTemplate(payload)
    if (response.status !== 200) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
      return []
    }
    const blob = response.data
    downloadFile(blob, "PhuLucQdhd.xlsx")
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

  const firstStudent = allStudentsInClasses[0]
  const firstProject = firstStudent?.thesisRegistrations?.[0]?.thesisProject
  console.log("firstProject", firstProject)
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
    const majorName =
      student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "Chưa xác định"
    if (!majorMap.has(majorName)) {
      majorMap.set(majorName, [])
    }
    majorMap.get(majorName)?.push(student)
  })

  let totalCouncils = 0
  const groupedData: PhuLucQdhdData[] = []
  let majorIndex = 1

  majorMap.forEach((students, majorName) => {
    const tableRows: PhuLucQdhdTable[] = students.map((student, studentIdx) => {
      const project = student.thesisRegistrations?.[0]?.thesisProject
      const members = project?.council?.members || []
      totalCouncils++

      const getMember = (role: CouncilRole) => members.find((m: any) => m.role === role)

      const chairman = getMember(CouncilRole.CHAIRMAN)
      const secretary = getMember(CouncilRole.SECRETARY)
      const reviewer1 = getMember(CouncilRole.REVIEWER_1)
      const reviewer2 = getMember(CouncilRole.REVIEWER_2)
      const member = getMember(CouncilRole.MEMBER)

      return {
        sttHoiDong: (studentIdx + 1).toString(),
        contentDieu1: `${project?.type} tốt nghiệp thạc sĩ ngành ${student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""},Khóa: ${student.fixedClass?.trainingCourse?.name || ""} (${student.fixedClass?.trainingCourse?.academicYear || ""}), Đề tài: ${project?.title || ""}`,
        tenHocVien: student.userProfile?.fullname || "",
        ngaySinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        gvhd1: project?.supervisor?.name || "",
        gvhd2: project?.coSupervisor?.name || "",

        tenChuTich: chairman?.expert?.name || "Chưa có thông tin chủ tịch",
        toChucChuTich: chairman?.expert?.organization || "",

        tenThuKy: secretary?.expert?.name || "Chưa có thông tin thư ký",
        toChucThuKy: secretary?.expert?.organization || "",

        tenUyVien: member?.expert?.name || "Chưa có thông tin ủy viên",
        toChucUyVien: member?.expert?.organization || "",

        tenPb1: reviewer1?.expert?.name || "Chưa có thông tin PB1",
        toChucPb1: reviewer1?.expert?.organization || "",

        tenPb2: reviewer2?.expert?.name || "Chưa có thông tin PB2",
        toChucPb2: reviewer2?.expert?.organization || "",
      }
    })

    groupedData.push({
      data: {
        sttChuyenNganh: toRoman(majorIndex),
        tenChuyenNganh: majorName,
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
    const members = project?.council?.members || []
    nguoiki = project?.thesisSession?.chief?.trim() || ""
    members.forEach((member: any) => {
      const expert = member.expert
      if (!expert || expert.lecturerId || expert.lecturer) return

      const expertId = expert.id
      const amount = Number(member.payment?.amount || 0)

      if (!expertAggregator.has(expertId)) {
        expertAggregator.set(expertId, {
          tenChuyenGia: getSupervisorName(expert,false,false) as string || "",
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
      ngay: now.format("DD"),
      thang: now.format("MM"),
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
    showSpinner?.()
    const payload: ExcelTemplateBody = {
      head: { data: dataConvert.head },
      tail: { data: dataConvert.tail },
      fileName: "HDDanhGiaLuanVan",
      path: "DeNghiHDDanhGiaLuanVan.xlsx",
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
      head: { khoa: "" },
      tail: { tongSoHocVien: 0, ngay: "", thang: "", nam: "" },
      data: [],
    }
  }

  const now = dayjs()
  const orgMap = new Map<string, { code: string; name: string; students: any[] }>()

  allStudentsInClasses.forEach((student) => {
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

    orgMap.get(orgId)!.students.push(student)
  })

  const groupedData: HDDanhGiaLuanVanData[] = Array.from(orgMap.values()).map((org, index) => {
    const tableData: HDDanhGiaLuanVanTable[] = org.students.map((student: any, sIdx: number) => {
      const project = student?.thesisRegistrations?.[0]?.thesisProject
      const members = project?.council?.members || []

      const findMemberName = (role: CouncilRole) =>
        members.find((m: any) => m.role === role)?.expert?.name || ""

      const gvhd1 = project?.supervisor?.name
      const gvhd2 = project?.coSupervisor?.name

      let hvCbhd = `Học viên: ${student.userProfile?.fullname || ""}`
      if (gvhd1) hvCbhd += `\nGVHD1: ${gvhd1}`
      if (gvhd2) hvCbhd += `\nGVHD2: ${gvhd2}`

      return {
        stt: sIdx + 1,
        maHv: student.userProfile?.code || "",
        ngaySinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
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

  return {
    head: {
      khoa: allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name || "",
    },
    tail: {
      tongSoHocVien: allStudentsInClasses.length,
      ngay: now.format("DD"),
      thang: now.format("MM"),
      nam: now.format("YYYY"),
    },
    data: groupedData,
  }
}
