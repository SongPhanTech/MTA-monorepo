import { formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons"
import { Button, Input, InputNumber, Modal, Select, Space, Spin, message } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { customTrainingFetch } from "@workspace/libs/api/custom-instance"
import { saveAs } from "file-saver"

dayjs.locale("vi")

export type ModalPrintBangDiemDuKhoaInput = {
  studentIds: string[]
  fixedClassId?: string
  initialStudentId?: string
  onExportExcel?: () => void
}

export type BdcnDuKhoaMonHoc = {
  stt: number
  tenMonHoc: string
  maMH?: string
  soTC: number
  diemhe10: number | null
  diemhe4: number | null
  diemchu: string
  ghichu: string
  baoLuu: boolean
}

export type BdcnDuKhoaStudent = {
  studentId: string
  fullname: string
  dateOfBirth: string
  maSV: string
  quocTich: string
  lop: string
  khoa: string
  thoiGianDaoTao: string
  hinhThucDaoTao: string
  namHoc: string
  signatureDate: string
  monHocs: BdcnDuKhoaMonHoc[]
  summary: {
    tongTinChi: number
    gpa10: number | null
    gpa4: number | null
    xepLoai: string
  }
}

export type BdcnDuKhoaPrintSettings = {
  fontFamily: string
  bodyFontSize: number
  headerFontSize: number
  infoFontSize: number
  titleFontSize: number
  columnHeaderHeight: number
  rowHeight: number
  marginTopMm: number
  marginBottomMm: number
  marginLeftMm: number
  marginRightMm: number
  signerTitle1: string
  signerTitle2: string
  signerName: string
  headerLeftLine1: string
  headerLeftLine2: string
  headerRightLine1: string
  headerRightLine2: string
}

const SETTINGS_KEY = "bdcn-du-khoa-html-print-settings-v1"
const EMPTY_STUDENT_IDS: string[] = []

const DEFAULT_SETTINGS: BdcnDuKhoaPrintSettings = {
  fontFamily: "Times New Roman",
  bodyFontSize: 11,
  headerFontSize: 10,
  infoFontSize: 11,
  titleFontSize: 14,
  columnHeaderHeight: 48,
  rowHeight: 22,
  marginTopMm: 12,
  marginBottomMm: 12,
  marginLeftMm: 15,
  marginRightMm: 10,
  signerTitle1: "KT. TRƯỞNG PHÒNG",
  signerTitle2: "PHÓ TRƯỞNG PHÒNG",
  signerName: "Đại tá, TS Nguyễn Văn Bình",
  headerLeftLine1: "BỘ QUỐC PHÒNG",
  headerLeftLine2: "HỌC VIỆN KỸ THUẬT QUÂN SỰ",
  headerRightLine1: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
  headerRightLine2: "Độc lập - Tự do - Hạnh phúc",
}

function loadSettings(): BdcnDuKhoaPrintSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: BdcnDuKhoaPrintSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function formatScore(val: number | null | undefined): string {
  if (val == null || !Number.isFinite(val)) return ""
  return Number(val).toFixed(1)
}

export default function ModalPrintBangDiemDuKhoa() {
  const printRef = useRef<HTMLDivElement>(null)
  const { isOpen, onClose, input } = useDisclosure<ModalPrintBangDiemDuKhoaInput>({
    tag: "ModalPrintBangDiemDuKhoa",
  })
  const onCloseRef = useRef(onClose)

  const [loading, setLoading] = useState(false)
  const [studentsData, setStudentsData] = useState<BdcnDuKhoaStudent[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [settings, setSettings] = useState<BdcnDuKhoaPrintSettings>(DEFAULT_SETTINGS)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const studentIds = input?.studentIds ?? EMPTY_STUDENT_IDS
  const studentIdsKey = studentIds.join(",")
  const initialStudentId = input?.initialStudentId

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    setSettings(loadSettings())
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !studentIds.length) {
      setStudentsData([])
      setSelectedStudentIds([])
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    ;(async () => {
      try {
        const res = await customTrainingFetch<{
          status: number
          data: { data: BdcnDuKhoaStudent[] }
        }>("/api/student-result/data-bang-diem-du-khoa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds }),
        })

        if (!isMounted) return

        if (res.status === 200 && Array.isArray(res.data?.data)) {
          const list = res.data.data
          setStudentsData(list)
          if (initialStudentId && list.some((s) => s.studentId === initialStudentId)) {
            setSelectedStudentIds([initialStudentId])
          } else {
            setSelectedStudentIds(list.map((s) => s.studentId))
          }
        } else {
          message.error("Không lấy được dữ liệu bảng điểm dự khóa")
          onCloseRef.current()
        }
      } catch (err: any) {
        if (!isMounted) return
        const msg = err?.response?.data?.message || err?.message || "Lỗi tải dữ liệu bảng điểm"
        message.warning(msg)
        onCloseRef.current()
      } finally {
        if (isMounted) setLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [isOpen, studentIdsKey, initialStudentId])

  const selectedStudents = useMemo(() => {
    const set = new Set(selectedStudentIds)
    return studentsData.filter((s) => set.has(s.studentId))
  }, [studentsData, selectedStudentIds])

  const updateSetting = <K extends keyof BdcnDuKhoaPrintSettings>(
    key: K,
    val: BdcnDuKhoaPrintSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: val }
      saveSettings(next)
      return next
    })
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `BĐCN_Dự_Khóa_${dayjs().format("YYYYMMDD")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: ${settings.marginTopMm}mm ${settings.marginRightMm}mm ${settings.marginBottomMm}mm ${settings.marginLeftMm}mm;
      }
      @media print {
        html, body {
          width: 210mm;
          margin: 0;
          padding: 0;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bdcn-page-root {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .bdcn-single-student {
          page-break-after: always;
          break-after: page;
        }
        .bdcn-single-student:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: avoid !important;
        }
        tr {
          page-break-inside: avoid !important;
        }
      }
    `,
  })

  const handleExportExcel = async () => {
    if (!studentsData.length) return
    setIsExportingExcel(true)
    try {
      const targetIds = selectedStudentIds.length ? selectedStudentIds : studentsData.map((s) => s.studentId)
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-ca-nhan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: targetIds,
          plannedSemesters: [1, 2],
          signatureDate: defaultDateStr,
          signerTitle1: settings.signerTitle1,
          signerTitle2: settings.signerTitle2,
          signerName: settings.signerName,
          headerLeftLine1: settings.headerLeftLine1,
          headerLeftLine2: settings.headerLeftLine2,
          headerRightLine1: settings.headerRightLine1,
          headerRightLine2: settings.headerRightLine2,
        }),
      })

      if (res.status === 200 && res.data instanceof Blob) {
        const fileName =
          selectedStudents.length === 1
            ? `BDCN-DuKhoa-${selectedStudents[0].maSV}-${selectedStudents[0].fullname}.xlsx`
            : "BDCN-DuKhoa.xlsx"
        saveAs(res.data, fileName)
        message.success("Xuất file Excel thành công")
      } else {
        message.error("Xuất file Excel thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi khi xuất file Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  const resetDefaultSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }

  const studentSelectOptions = useMemo(
    () =>
      studentsData.map((s, index) => ({
        value: s.studentId,
        label: `${index + 1}. ${s.maSV} — ${s.fullname}`,
      })),
    [studentsData]
  )

  const defaultDateStr = useMemo(() => {
    const today = nowVn()
    return `Hà Nội, ngày ${formatNgayIn(today.date())} tháng ${formatThangIn(today.month() + 1)} năm ${today.year()}`
  }, [])

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="min(96vw, 1400px)"
      style={{ top: 16 }}
      styles={{ body: { paddingTop: 8, paddingBottom: 12 } }}
      title={
        <div className="flex w-[98%] flex-wrap items-center justify-between gap-2 pr-6">
          <span className="font-semibold text-base text-gray-800">
            In bảng điểm cá nhân — Đối tượng dự khóa
            {studentsData.length > 0 && (
              <span className="ml-2 font-normal text-sm text-gray-500">
                · {selectedStudents.length}/{studentsData.length} người
              </span>
            )}
          </span>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={isExportingExcel}
              disabled={loading || !studentsData.length}
            >
              Xuất Excel
            </Button>
            <Button
              type="primary"
              className="bg-[#028850] hover:bg-[#027042]"
              icon={<PrinterOutlined />}
              onClick={() => handlePrint()}
              disabled={loading || !selectedStudents.length}
            >
              In
            </Button>
          </Space>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spin tip="Đang tải dữ liệu bảng điểm dự khóa..." size="large" />
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: "calc(100vh - 130px)", minHeight: 520 }}>
          {/* Panel Trái: Control Panel */}
          <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded border border-gray-200 bg-gray-50/70">
            <div className="shrink-0 border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
              <span>
                Cấu hình in <span className="text-xs font-normal text-gray-400">(lưu trình duyệt)</span>
              </span>
              <Button size="small" type="link" onClick={resetDefaultSettings} className="px-0 text-xs">
                Mặc định
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 space-y-3">
              {/* Chọn học viên */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    Chọn học viên in ({selectedStudentIds.length}/{studentsData.length})
                  </span>
                  <Space size="small">
                    <Button
                      size="small"
                      type="link"
                      className="px-0 text-xs"
                      onClick={() => setSelectedStudentIds(studentsData.map((s) => s.studentId))}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      className="px-0 text-xs"
                      onClick={() => setSelectedStudentIds([])}
                    >
                      Bỏ chọn
                    </Button>
                  </Space>
                </div>
                <Select
                  mode="multiple"
                  className="w-full"
                  placeholder="Chọn học viên cần in"
                  allowClear
                  maxTagCount="responsive"
                  value={selectedStudentIds}
                  options={studentSelectOptions}
                  onChange={(ids) => setSelectedStudentIds(ids)}
                />
              </div>

              {/* Phông chữ & Cỡ chữ */}
              <div className="border-t border-gray-200 pt-2">
                <div className="mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Phông chữ & Cỡ chữ (pt)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <div className="mb-1 text-xs text-gray-500">Phông chữ</div>
                    <Input
                      value={settings.fontFamily}
                      onChange={(e) => updateSetting("fontFamily", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Cỡ chữ bảng điểm</div>
                    <InputNumber
                      className="w-full"
                      min={8}
                      max={18}
                      step={0.5}
                      value={settings.bodyFontSize}
                      onChange={(v) => updateSetting("bodyFontSize", Number(v) || 11)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Cỡ chữ tiêu đề cột</div>
                    <InputNumber
                      className="w-full"
                      min={8}
                      max={18}
                      step={0.5}
                      value={settings.headerFontSize}
                      onChange={(v) => updateSetting("headerFontSize", Number(v) || 10)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Cỡ chữ thông tin SV</div>
                    <InputNumber
                      className="w-full"
                      min={8}
                      max={18}
                      step={0.5}
                      value={settings.infoFontSize}
                      onChange={(v) => updateSetting("infoFontSize", Number(v) || 11)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Cỡ chữ tiêu đề</div>
                    <InputNumber
                      className="w-full"
                      min={10}
                      max={24}
                      step={0.5}
                      value={settings.titleFontSize}
                      onChange={(v) => updateSetting("titleFontSize", Number(v) || 14)}
                    />
                  </div>
                </div>
              </div>

              {/* Hàng môn học & Lề trang */}
              <div className="border-t border-gray-200 pt-2">
                <div className="mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Kích thước bảng & Lề trang
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Cao tiêu đề cột (pt)</div>
                    <InputNumber
                      className="w-full"
                      min={28}
                      max={90}
                      step={1}
                      value={settings.columnHeaderHeight}
                      onChange={(v) => updateSetting("columnHeaderHeight", Number(v) || 48)}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="mb-1 text-xs text-gray-500">Chiều cao hàng môn học (pt)</div>
                    <InputNumber
                      className="w-full"
                      min={14}
                      max={40}
                      step={1}
                      value={settings.rowHeight}
                      onChange={(v) => updateSetting("rowHeight", Number(v) || 22)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Lề trên (mm)</div>
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={50}
                      value={settings.marginTopMm}
                      onChange={(v) => updateSetting("marginTopMm", Number(v) || 0)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Lề dưới (mm)</div>
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={50}
                      value={settings.marginBottomMm}
                      onChange={(v) => updateSetting("marginBottomMm", Number(v) || 0)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Lề trái (mm)</div>
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={50}
                      value={settings.marginLeftMm}
                      onChange={(v) => updateSetting("marginLeftMm", Number(v) || 0)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Lề phải (mm)</div>
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={50}
                      value={settings.marginRightMm}
                      onChange={(v) => updateSetting("marginRightMm", Number(v) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Chữ ký & Người ký */}
              <div className="border-t border-gray-200 pt-2">
                <div className="mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Chữ ký & Người ký
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Chức danh 1</div>
                    <Input
                      value={settings.signerTitle1}
                      onChange={(e) => updateSetting("signerTitle1", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Chức danh 2</div>
                    <Input
                      value={settings.signerTitle2}
                      onChange={(e) => updateSetting("signerTitle2", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Người ký</div>
                    <Input
                      value={settings.signerName}
                      onChange={(e) => updateSetting("signerName", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Panel Phải: Vùng xem trước (Preview) */}
          <main className="min-h-0 flex-1 overflow-auto rounded border border-gray-200 bg-gray-200/50 p-4">
            <div ref={printRef} className="bdcn-page-root mx-auto flex flex-col items-center">
              {selectedStudents.length === 0 ? (
                <div className="py-24 text-gray-500">Chưa có học viên nào được chọn để in</div>
              ) : (
                selectedStudents.map((student) => {
                  const signatureDateText = student.signatureDate || defaultDateStr

                  return (
                    <div
                      key={student.studentId}
                      className="bdcn-single-student bg-white shadow-md mb-6 box-border"
                      style={{
                        width: "210mm",
                        minHeight: "297mm",
                        padding: `${settings.marginTopMm}mm ${settings.marginRightMm}mm ${settings.marginBottomMm}mm ${settings.marginLeftMm}mm`,
                        fontFamily: settings.fontFamily,
                        color: "#000",
                      }}
                    >
                      {/* Mẫu bảng điểm: hai khối quốc hiệu và đơn vị, canh như phôi in */}
                      <div className="flex justify-between items-start leading-tight" style={{ padding: "0 4mm" }}>
                        {/* Bên trái: BỘ QUỐC PHÒNG / HỌC VIỆN KỸ THUẬT QUÂN SỰ */}
                        <div className="flex flex-col items-center text-center font-bold" style={{ fontSize: `${settings.headerFontSize}pt` }}>
                          <div>{settings.headerLeftLine1}</div>
                          <div className="mt-0.5">
                            <span style={{ borderBottom: "1px solid #000", paddingBottom: "2px" }}>
                              {settings.headerLeftLine2}
                            </span>
                          </div>
                        </div>

                        {/* Bên phải: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc */}
                        <div className="flex flex-col items-center text-center font-bold" style={{ fontSize: `${settings.headerFontSize}pt` }}>
                          <div>{settings.headerRightLine1}</div>
                          <div className="mt-0.5 font-bold">
                            <span style={{ borderBottom: "1px solid #000", paddingBottom: "2px" }}>
                              {settings.headerRightLine2}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Tiêu đề chính */}
                      <div className="text-center mt-5">
                        <div
                          className="font-bold tracking-wide uppercase"
                          style={{ fontSize: `${settings.titleFontSize}pt` }}
                        >
                          KẾT QUẢ HỌC TẬP
                        </div>
                        {student.namHoc && (
                          <div
                            className="italic mt-1"
                            style={{ fontSize: `${settings.infoFontSize}pt` }}
                          >
                            (Năm học {student.namHoc})
                          </div>
                        )}
                      </div>

                      {/* 3. Thông tin học viên (2 cột song song) */}
                      <div
                        className="grid grid-cols-2 gap-x-8 mt-4 leading-[1.45]"
                        style={{ fontSize: `${settings.infoFontSize}pt` }}
                      >
                        {/* Cột trái */}
                        <div className="space-y-1">
                          <div>
                            <span className="inline-block w-24">Họ và tên:</span>
                            <span className="font-bold uppercase">{student.fullname}</span>
                          </div>
                          <div>
                            <span className="inline-block w-24">Mã SV:</span>
                            <span className="font-normal">{student.maSV}</span>
                          </div>
                          <div>
                            <span className="inline-block w-24">Lớp:</span>
                            <span>{student.lop}</span>
                          </div>
                          <div>
                            <span className="inline-block w-24">Khóa:</span>
                            <span>{student.khoa}</span>
                          </div>
                        </div>

                        {/* Cột phải */}
                        <div className="space-y-1">
                          <div>
                            <span className="inline-block w-36">Ngày sinh:</span>
                            <span>{student.dateOfBirth}</span>
                          </div>
                          <div>
                            <span className="inline-block w-36">Quốc tịch:</span>
                            <span>{student.quocTich || "—"}</span>
                          </div>
                          <div>
                            <span className="inline-block w-36">Thời gian đào tạo:</span>
                            <span>{student.thoiGianDaoTao}</span>
                          </div>
                          <div>
                            <span className="inline-block w-36">Hình thức đào tạo:</span>
                            <span>{student.hinhThucDaoTao}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bảng kết quả: viền ngoài đậm, đường kẻ ô mảnh như mẫu phôi */}
                      <div className="mt-4">
                        <style>{`
                          .bdcn-score-table {
                            border-collapse: collapse !important;
                            border: 1.5pt solid #000 !important;
                          }
                          .bdcn-score-table th,
                          .bdcn-score-table td {
                            box-sizing: border-box !important;
                          }
                          /* Tiêu đề thead */
                          .bdcn-score-table thead th {
                            border: 1.5pt solid #000 !important;
                            color: #000 !important;
                            font-weight: 800 !important;
                          }
                          /* Cột TT: ĐẬM HẾT CÁC CẠNH (bao gồm bên phải và bên dưới) */
                          .bdcn-score-table thead th.bdcn-col-tt,
                          .bdcn-score-table tbody td.bdcn-col-tt {
                            border: 1.5pt solid #000 !important;
                            color: #000 !important;
                          }
                          /* Cột Tên học phần: 2 vách bên đậm 1.5pt, đường kẻ giữa các môn là nét mảnh 0.6pt */
                          .bdcn-score-table tbody td.bdcn-col-thin-name {
                            border-left: 1.5pt solid #000 !important;
                            border-right: 1.5pt solid #000 !important;
                            border-top: 0.6pt solid #000 !important;
                            border-bottom: 0.6pt solid #000 !important;
                            color: #000 !important;
                          }
                          /* Cột in đậm (Số tín chỉ, Điểm học phần, Ghi chú): ĐỒNG ĐỀU 1 KÍCH CỠ 1.5pt */
                          .bdcn-score-table thead th.bdcn-col-bold,
                          .bdcn-score-table tbody td.bdcn-col-bold {
                            border: 1.5pt solid #000 !important;
                            color: #000 !important;
                          }
                          /* Đường viền đáy bảng luôn là nét đậm 1.5pt cho toàn bộ các cột */
                          .bdcn-score-table tbody tr:last-child td {
                            border-bottom: 1.5pt solid #000 !important;
                          }
                        `}</style>
                        <table
                          className="bdcn-score-table w-full"
                          style={{
                            fontSize: `${settings.bodyFontSize}pt`,
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                background: "#fff",
                                fontWeight: 700,
                                height: `${Math.round(settings.columnHeaderHeight * 0.45)}pt`,
                              }}
                            >
                              <th
                                rowSpan={2}
                                className="px-1 py-1 text-center align-middle bdcn-col-tt"
                                style={{ width: "38px", lineHeight: 1.1 }}
                              >
                                TT
                              </th>
                              <th
                                rowSpan={2}
                                className="px-2 py-1 text-center align-middle"
                                style={{ lineHeight: 1.1 }}
                              >
                                Tên học phần
                              </th>
                              <th
                                rowSpan={2}
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ width: "55px", lineHeight: 1.1 }}
                              >
                                Số tín chỉ
                              </th>
                              <th
                                colSpan={3}
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ lineHeight: 1.1 }}
                              >
                                Điểm học phần
                              </th>
                              <th
                                rowSpan={2}
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ width: "80px", lineHeight: 1.1 }}
                              >
                                Ghi chú
                              </th>
                            </tr>
                            <tr
                              style={{
                                background: "#fff",
                                fontWeight: 700,
                                height: `${Math.round(settings.columnHeaderHeight * 0.55)}pt`,
                              }}
                            >
                              <th
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ width: "75px", lineHeight: 1.1 }}
                              >
                                Thang điểm 10
                              </th>
                              <th
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ width: "75px", lineHeight: 1.1 }}
                              >
                                Thang điểm 4
                              </th>
                              <th
                                className="px-1 py-1 text-center align-middle bdcn-col-bold"
                                style={{ width: "75px", lineHeight: 1.1 }}
                              >
                                Thang điểm chữ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {student.monHocs.map((mon, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  height: `${settings.rowHeight}pt`,
                                  background: "#fff",
                                }}
                              >
                                <td className="px-1 py-0.5 text-center bdcn-col-tt">
                                  {mon.stt}
                                </td>
                                <td className="px-2 py-0.5 bdcn-col-thin-name">
                                  {mon.tenMonHoc}
                                </td>
                                <td className="px-1 py-0.5 text-center bdcn-col-bold">
                                  {mon.soTC}
                                </td>
                                <td className="px-1 py-0.5 text-center bdcn-col-bold">
                                  {formatScore(mon.diemhe10)}
                                </td>
                                <td className="px-1 py-0.5 text-center bdcn-col-bold">
                                  {formatScore(mon.diemhe4)}
                                </td>
                                <td className="px-1 py-0.5 text-center bdcn-col-bold">
                                  {mon.diemchu || ""}
                                </td>
                                <td className="px-1 py-0.5 text-left text-xs bdcn-col-bold">
                                  {mon.ghichu || ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 5. Khối tổng kết (dưới bảng) */}
                      <div
                        className="mt-4 space-y-1 leading-normal"
                        style={{ fontSize: `${settings.infoFontSize}pt` }}
                      >
                        <div>
                          <span>Tổng tín chỉ: </span>
                          <span className="font-bold">{student.summary.tongTinChi}</span>
                        </div>
                        <div>
                          <span>Điểm trung bình chung tích lũy (hệ 10): </span>
                          <span className="font-bold">{formatScore(student.summary.gpa10)}</span>
                        </div>
                        <div>
                          <span>Điểm trung bình chung tích lũy (hệ 4): </span>
                          <span className="font-bold">{formatScore(student.summary.gpa4)}</span>
                        </div>
                        <div>
                          <span>Xếp hạng: </span>
                          <span className="font-bold">{student.summary.xepLoai}</span>
                        </div>
                      </div>

                      {/* 6. Khối chữ ký */}
                      <div className="flex justify-end mt-6">
                        <div
                          className="flex flex-col items-center text-center"
                          style={{
                            width: "280px",
                            fontSize: `${settings.infoFontSize}pt`,
                          }}
                        >
                          <div className="italic">{signatureDateText}</div>
                          {settings.signerTitle1 && (
                            <div className="font-bold mt-0.5">{settings.signerTitle1}</div>
                          )}
                          {settings.signerTitle2 && (
                            <div className="font-bold">{settings.signerTitle2}</div>
                          )}
                          <div style={{ height: "65px" }} />
                          {settings.signerName && (
                            <div className="font-bold">{settings.signerName}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </main>
        </div>
      )}
    </Modal>
  )
}

