import TabBieuDoHocTap from "@components/cong-giang-vien/ket-qua-hoc-tap/tab-bieu-do-hoc-tap"
import type { KetQuaKyBieuDo } from "@hooks/use-bieu-do-hoc-tap-lop-quan-ly"
import { useFindManyStudentSubjectScore } from "@workspace/db/hooks"
import { $Enums } from "@workspace/db/client"
import { Button, Card, Input, Select, Table, Tabs, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { ChevronDown, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 80

export type DiemHocKyRow = {
  id: string
  maHocPhan: string
  tenHocPhan: string
  tinChi: number
  cc: number | null
  dk: number | null
  diemThi: number | null
  diemHp: number | null
  diemChu: string
  ketQuaDat: boolean | null
}

type HocKyOption = {
  semesterId: string
  schoolYearId: string
  schoolYearName: string
  semesterName: string
}

interface BangDiemHocKyProps {
  studentId: string
  fixedClassId: string
  ketQuaTheoKy: KetQuaKyBieuDo[]
  hocKyOptions: HocKyOption[]
  semesterId?: string
  onDoiHocKy: (semesterId: string) => void
  rows: DiemHocKyRow[]
  loading?: boolean
  tongHocPhan: number
  tongTinChi: number
  gpaHocKy: string
  xepLoaiHocLuc: string
}

const TAB_CLASS =
  "flex h-full min-h-0 flex-1 flex-col overflow-hidden [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:shrink-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-content-holder]:flex [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:flex-col [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-content]:min-h-0 [&_.ant-tabs-tabpane]:h-full [&_.ant-tabs-tabpane-active]:!flex [&_.ant-tabs-tabpane-active]:!min-h-0 [&_.ant-tabs-tabpane-active]:!flex-1 [&_.ant-tabs-tabpane-active]:!flex-col [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-cgv-green-dark [&_.ant-tabs-tab-btn]:font-medium [&_.ant-tabs-ink-bar]:!bg-cgv-green-dark"

const dinhDangDiem = (value: number | null | undefined) =>
  value == null ? "—" : Number(value).toFixed(1)

const layDiemHe4 = (diem10: number | null | undefined) => {
  if (diem10 == null) return null
  if (diem10 >= 8.5) return 4
  if (diem10 >= 8.0) return 3.5
  if (diem10 >= 7.0) return 3
  if (diem10 >= 6.5) return 2.5
  if (diem10 >= 5.5) return 2
  if (diem10 >= 5.0) return 1.5
  if (diem10 >= 4.0) return 1
  return 0
}

const layDiemChu = (diem10: number | null | undefined) => {
  if (diem10 == null) return "—"
  if (diem10 >= 8.5) return "A+"
  if (diem10 >= 8.0) return "A"
  if (diem10 >= 7.0) return "B+"
  if (diem10 >= 6.5) return "B"
  if (diem10 >= 5.5) return "C+"
  if (diem10 >= 5.0) return "C"
  if (diem10 >= 4.0) return "D"
  return "F"
}

const columns: ColumnsType<DiemHocKyRow> = [
  {
    title: "STT",
    width: 56,
    align: "center",
    render: (_value, _record, index) => index + 1,
  },
  {
    title: "Mã học phần",
    dataIndex: "maHocPhan",
    width: 110,
    align: "center",
  },
  {
    title: "Tên học phần",
    dataIndex: "tenHocPhan",
    width: 260,
    ellipsis: true,
  },
  {
    title: "TC",
    dataIndex: "tinChi",
    width: 56,
    align: "center",
  },
  {
    title: "Điểm quá trình",
    align: "center",
    children: [
      {
        title: "CC",
        dataIndex: "cc",
        width: 72,
        align: "center",
        render: (value: number | null) => dinhDangDiem(value),
      },
      {
        title: "ĐK",
        dataIndex: "dk",
        width: 72,
        align: "center",
        render: (value: number | null) => dinhDangDiem(value),
      },
    ],
  },
  {
    title: "Điểm thi",
    dataIndex: "diemThi",
    width: 88,
    align: "center",
    render: (value: number | null) => dinhDangDiem(value),
  },
  {
    title: "Điểm HP",
    dataIndex: "diemHp",
    width: 88,
    align: "center",
    render: (value: number | null) => dinhDangDiem(value),
  },
  {
    title: "Điểm chữ",
    dataIndex: "diemChu",
    width: 88,
    align: "center",
  },
  {
    title: "Kết quả",
    dataIndex: "ketQuaDat",
    width: 96,
    align: "center",
    render: (value: boolean | null) =>
      value == null ? (
        "—"
      ) : (
        <Tag
          color={value ? "success" : "error"}
          className="m-0 rounded-full border-0 px-3 py-0.5 text-xs font-medium"
        >
          {value ? "Đạt" : "Không đạt"}
        </Tag>
      ),
  },
]

const BangDiemHocKy = ({
  studentId,
  fixedClassId,
  ketQuaTheoKy,
  hocKyOptions,
  semesterId,
  onDoiHocKy,
  rows,
  loading,
  tongHocPhan,
  tongTinChi,
  gpaHocKy,
  xepLoaiHocLuc,
}: BangDiemHocKyProps) => {
  const [tabActive, setTabActive] = useState("bang-diem-hoc-ky")
  const [schoolYearId, setSchoolYearId] = useState<string>()
  const [semesterNhap, setSemesterNhap] = useState<string>()
  const [hienThi, setHienThi] = useState("tat_ca")
  const [tuKhoaToanKhoa, setTuKhoaToanKhoa] = useState("")
  const [expandTatCa, setExpandTatCa] = useState(true)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

  const { data: diemToanKhoaRaw = [], isLoading: dangTaiToanKhoa } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId,
        subjectClass: { cancelled: false },
      },
      include: {
        subjectClass: {
          select: {
            type: true,
            subject: {
              select: {
                code: true,
                name: true,
                credit: true,
              },
            },
            semester: {
              select: {
                id: true,
                code: true,
                name: true,
                startDate: true,
                schoolYear: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ subjectClass: { semester: { startDate: "desc" } } }],
    },
    { enabled: tabActive === "tong-hop-toan-khoa" && !!studentId }
  )

  useEffect(() => {
    const el = vungBangRef.current
    if (!el || tabActive !== "bang-diem-hoc-ky") return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const raf = requestAnimationFrame(capNhatChieuCao)
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    window.addEventListener("resize", capNhatChieuCao)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("resize", capNhatChieuCao)
    }
  }, [tabActive, rows.length, loading])

  const schoolYearOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of hocKyOptions) {
      map.set(item.schoolYearId, item.schoolYearName)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [hocKyOptions])

  const semesterOptions = useMemo(
    () => hocKyOptions.filter((item) => item.schoolYearId === schoolYearId),
    [hocKyOptions, schoolYearId]
  )

  useEffect(() => {
    if (!semesterId || hocKyOptions.length === 0) return
    const current = hocKyOptions.find((item) => item.semesterId === semesterId)
    if (!current) return
    setSchoolYearId(current.schoolYearId)
    setSemesterNhap(current.semesterId)
  }, [semesterId, hocKyOptions])

  const handleChangeSchoolYear = (yearId: string) => {
    setSchoolYearId(yearId)
    const first = hocKyOptions.find((item) => item.schoolYearId === yearId)
    if (first) {
      setSemesterNhap(first.semesterId)
      onDoiHocKy(first.semesterId)
    }
  }

  const handleChangeSemester = (id: string) => {
    setSemesterNhap(id)
    onDoiHocKy(id)
  }

  const dsToanKhoa = useMemo(() => {
    const q = tuKhoaToanKhoa.trim().toLowerCase()
    const locLoai = (type?: $Enums.SubjectClassType) => {
      if (hienThi === "hoc_lai") return type === $Enums.SubjectClassType.RETAKE
      if (hienThi === "thi_lai") return type === $Enums.SubjectClassType.REEXAM
      return true
    }

    const map = new Map<
      string,
      {
        key: string
        title: string
        tbtl10: number | null
        tbtl4: number | null
        rows: Array<{
          id: string
          maMonHoc: string
          tenMonHoc: string
          diemTx: number | null
          diemDk: number | null
          diemThi: number | null
          diemCong: number
          diemTd: string
          stc: number
          diemHe10: number | null
          diemHe4: number | null
          diemChu: string
          ketQuaDat: boolean | null
        }>
      }
    >()

    for (const item of diemToanKhoaRaw) {
      const semester = item.subjectClass?.semester
      if (!semester?.id) continue
      if (!locLoai(item.subjectClass?.type)) continue

      const maMonHoc = item.subjectClass?.subject?.code ?? ""
      const tenMonHoc = item.subjectClass?.subject?.name ?? ""
      if (
        q &&
        !maMonHoc.toLowerCase().includes(q) &&
        !tenMonHoc.toLowerCase().includes(q) &&
        !layDiemChu(item.finalScore != null ? Number(item.finalScore) : null)
          .toLowerCase()
          .includes(q)
      ) {
        continue
      }

      const key = semester.id
      const tenHocKy = [semester.code, semester.name, semester.schoolYear?.name]
        .filter(Boolean)
        .join(" - ")
      if (!map.has(key)) {
        const kqKy = ketQuaTheoKy.find((x) => x.semesterId === key)
        map.set(key, {
          key,
          title: tenHocKy,
          tbtl10: kqKy?.cumulativeGpaBase4 != null ? Number(kqKy.cumulativeGpaBase4) * 2.5 : null,
          tbtl4: kqKy?.cumulativeGpaBase4 != null ? Number(kqKy.cumulativeGpaBase4) : null,
          rows: [],
        })
      }

      const diemHe10 =
        item.manualFinalScore != null ? Number(item.manualFinalScore) : Number(item.finalScore)
      map.get(key)?.rows.push({
        id: item.id,
        maMonHoc,
        tenMonHoc,
        diemTx: item.attendanceScore ?? null,
        diemDk: item.midtermScore ?? null,
        diemThi: item.examScore ?? null,
        diemCong: 0,
        diemTd: "—",
        stc: item.subjectClass?.subject?.credit ?? 0,
        diemHe10: Number.isFinite(diemHe10) ? diemHe10 : null,
        diemHe4: layDiemHe4(diemHe10),
        diemChu: layDiemChu(Number.isFinite(diemHe10) ? diemHe10 : null),
        ketQuaDat:
          (Number.isFinite(diemHe10) ? diemHe10 : null) != null
            ? diemHe10 >= 4
              ? true
              : false
            : null,
      })
    }

    return Array.from(map.values())
  }, [diemToanKhoaRaw, hienThi, ketQuaTheoKy, tuKhoaToanKhoa])

  const tongKetToanKhoa = useMemo(() => {
    const allRows = dsToanKhoa.flatMap((group) => group.rows)
    const tongTinChiAll = allRows.reduce((acc, row) => acc + row.stc, 0)
    const latest = ketQuaTheoKy[0]
    return {
      tongHocPhan: allRows.length,
      tongTinChiTichLuy: latest?.accumulatedCredits ?? tongTinChiAll,
      tongTinChiChuongTrinh: latest?.totalCreditsByCurriculum ?? tongTinChiAll,
      cpaTichLuy: latest?.cumulativeGpaBase4 != null ? Number(latest.cumulativeGpaBase4) : null,
      xepLoaiTichLuy: latest?.rank?.classification ?? "—",
    }
  }, [dsToanKhoa, ketQuaTheoKy])

  const cotToanKhoa: ColumnsType<(typeof dsToanKhoa)[number]["rows"][number]> = [
    { title: "STT", width: 52, align: "center", render: (_v, _r, i) => i + 1 },
    { title: "Mã môn học", dataIndex: "maMonHoc", width: 90, align: "center" },
    { title: "Tên môn học", dataIndex: "tenMonHoc", width: 240 },
    {
      title: "Điểm TX",
      dataIndex: "diemTx",
      width: 76,
      align: "center",
      render: (v) => dinhDangDiem(v),
    },
    {
      title: "Điểm ĐK",
      dataIndex: "diemDk",
      width: 76,
      align: "center",
      render: (v) => dinhDangDiem(v),
    },
    {
      title: "Điểm thi",
      dataIndex: "diemThi",
      width: 76,
      align: "center",
      render: (v) => dinhDangDiem(v),
    },
    { title: "Điểm cộng", dataIndex: "diemCong", width: 76, align: "center" },
    { title: "Điểm TĐ", dataIndex: "diemTd", width: 76, align: "center" },
    { title: "STC", dataIndex: "stc", width: 64, align: "center" },
    {
      title: "Điểm hệ 10",
      dataIndex: "diemHe10",
      width: 90,
      align: "center",
      render: (v) => dinhDangDiem(v),
    },
    {
      title: "Điểm hệ 4",
      dataIndex: "diemHe4",
      width: 88,
      align: "center",
      render: (v) => dinhDangDiem(v),
    },
    { title: "Điểm chữ", dataIndex: "diemChu", width: 88, align: "center" },
    {
      title: "Kết quả",
      dataIndex: "ketQuaDat",
      width: 88,
      align: "center",
      render: (value) =>
        value == null ? (
          "—"
        ) : (
          <span className={value ? "text-cgv-green-dark" : "text-red-500"}>
            {value ? "Đạt" : "Không đạt"}
          </span>
        ),
    },
  ]

  type ToanKhoaBangRow =
    | {
        key: string
        rowType: "semester"
        semesterKey: string
        title: string
        tbtl10: number | null
        tbtl4: number | null
      }
    | ({
        key: string
        rowType: "subject"
        semesterKey: string
        stt: number
      } & (typeof dsToanKhoa)[number]["rows"][number])

  const duLieuBangToanKhoa = useMemo<ToanKhoaBangRow[]>(() => {
    const rows: ToanKhoaBangRow[] = []
    for (const group of dsToanKhoa) {
      rows.push({
        key: `sem-${group.key}`,
        rowType: "semester",
        semesterKey: group.key,
        title: group.title,
        tbtl10: group.tbtl10,
        tbtl4: group.tbtl4,
      })
      if (expandedKeys.includes(group.key)) {
        group.rows.forEach((item, index) => {
          rows.push({
            ...item,
            key: item.id,
            rowType: "subject",
            semesterKey: group.key,
            stt: index + 1,
          })
        })
      }
    }
    return rows
  }, [dsToanKhoa, expandedKeys])

  const cotBangToanKhoa: ColumnsType<ToanKhoaBangRow> = [
    {
      title: "STT",
      width: 52,
      align: "center",
      render: (_v, record) => {
        if (record.rowType === "semester") {
          return {
            children: (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform ${
                      expandedKeys.includes(record.semesterKey) ? "" : "-rotate-90"
                    }`}
                  />
                  <span className="text-sm font-semibold text-cgv-green-dark">{record.title}</span>
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  TBTL10: {record.tbtl10 != null ? record.tbtl10.toFixed(2) : "—"} | TBTL4:{" "}
                  {record.tbtl4 != null ? record.tbtl4.toFixed(2) : "—"}
                </span>
              </div>
            ),
            props: { colSpan: 13 },
          }
        }
        return record.stt
      },
      onCell: (record) =>
        record.rowType === "semester"
          ? { className: "bg-gray-50", style: { paddingTop: 8, paddingBottom: 8 } }
          : {},
    },
    {
      title: "Mã môn học",
      dataIndex: "maMonHoc",
      width: 90,
      align: "center",
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "Tên môn học",
      dataIndex: "tenMonHoc",
      width: 240,
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "Điểm TX",
      dataIndex: "diemTx",
      width: 76,
      align: "center",
      render: (v, r) =>
        r.rowType === "subject"
          ? dinhDangDiem(v as number | null)
          : { children: null, props: { colSpan: 0 } },
    },
    {
      title: "Điểm ĐK",
      dataIndex: "diemDk",
      width: 76,
      align: "center",
      render: (v, r) =>
        r.rowType === "subject"
          ? dinhDangDiem(v as number | null)
          : { children: null, props: { colSpan: 0 } },
    },
    {
      title: "Điểm thi",
      dataIndex: "diemThi",
      width: 76,
      align: "center",
      render: (v, r) =>
        r.rowType === "subject"
          ? dinhDangDiem(v as number | null)
          : { children: null, props: { colSpan: 0 } },
    },
    {
      title: "Điểm cộng",
      dataIndex: "diemCong",
      width: 76,
      align: "center",
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "Điểm TĐ",
      dataIndex: "diemTd",
      width: 76,
      align: "center",
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "STC",
      dataIndex: "stc",
      width: 64,
      align: "center",
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "Điểm hệ 10",
      dataIndex: "diemHe10",
      width: 90,
      align: "center",
      render: (v, r) =>
        r.rowType === "subject"
          ? dinhDangDiem(v as number | null)
          : { children: null, props: { colSpan: 0 } },
    },
    {
      title: "Điểm hệ 4",
      dataIndex: "diemHe4",
      width: 88,
      align: "center",
      render: (v, r) =>
        r.rowType === "subject"
          ? dinhDangDiem(v as number | null)
          : { children: null, props: { colSpan: 0 } },
    },
    {
      title: "Điểm chữ",
      dataIndex: "diemChu",
      width: 88,
      align: "center",
      render: (v, r) => (r.rowType === "subject" ? v : { children: null, props: { colSpan: 0 } }),
    },
    {
      title: "Kết quả",
      dataIndex: "ketQuaDat",
      width: 88,
      align: "center",
      render: (value, r) => {
        if (r.rowType !== "subject") return { children: null, props: { colSpan: 0 } }
        return value == null ? (
          "—"
        ) : (
          <span className={value ? "text-cgv-green-dark" : "text-red-500"}>
            {value ? "Đạt" : "Không đạt"}
          </span>
        )
      },
    },
  ]

  useEffect(() => {
    if (dsToanKhoa.length === 0) {
      setExpandedKeys([])
      return
    }
    if (expandTatCa) {
      setExpandedKeys(dsToanKhoa.map((group) => group.key))
      return
    }
    setExpandedKeys((prev) => prev.filter((key) => dsToanKhoa.some((group) => group.key === key)))
  }, [dsToanKhoa, expandTatCa])

  const noiDungBang = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Năm học</span>
          <Select
            className="min-w-[150px]"
            placeholder="Chọn năm học"
            value={schoolYearId}
            onChange={handleChangeSchoolYear}
            options={schoolYearOptions.map((item) => ({ value: item.id, label: item.name }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Học kỳ</span>
          <Select
            className="min-w-[140px]"
            placeholder="Chọn học kỳ"
            value={semesterNhap}
            onChange={handleChangeSemester}
            options={semesterOptions.map((item) => ({
              value: item.semesterId,
              label: item.semesterName,
            }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <Select
            className="min-w-[170px]"
            value={hienThi}
            onChange={setHienThi}
            options={[{ value: "tat_ca", label: "Tất cả học phần" }]}
          />
        </div>
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pt-3">
        <Table<DiemHocKyRow>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          scroll={{ x: 1040, y: chieuCaoBody }}
          bordered
          className="bang-lq-chi-tiet [&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-2 border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
        <span>
          Tổng số học phần: <b className="text-cgv-green-dark">{tongHocPhan}</b>
        </span>
        <span>
          Tổng số tín chỉ: <b className="text-cgv-green-dark">{tongTinChi}</b>
        </span>
        <span>
          GPA học kỳ: <b className="text-blue-600">{gpaHocKy}</b>
        </span>
        <span>
          Xếp loại học lực: <b className="text-cgv-green-dark">{xepLoaiHocLuc}</b>
        </span>
      </div>
    </div>
  )

  return (
    <Card
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl shadow-sm [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-1 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden"
      styles={{ body: { padding: 0 } }}
    >
      <Tabs
        className={TAB_CLASS}
        activeKey={tabActive}
        onChange={setTabActive}
        items={[
          {
            key: "bang-diem-hoc-ky",
            label: "Bảng điểm học kỳ",
            children: noiDungBang,
          },
          {
            key: "tong-hop-toan-khoa",
            label: "Tổng hợp toàn khóa",
            children: (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
                <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type={hienThi === "tat_ca" ? "primary" : "default"}
                      onClick={() => setHienThi("tat_ca")}
                    >
                      Tất cả
                    </Button>
                    <Button
                      type={hienThi === "hoc_lai" ? "primary" : "default"}
                      onClick={() => setHienThi("hoc_lai")}
                    >
                      Học lại
                    </Button>
                    <Button
                      type={hienThi === "thi_lai" ? "primary" : "default"}
                      onClick={() => setHienThi("thi_lai")}
                    >
                      Thi lại
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={tuKhoaToanKhoa}
                      onChange={(e) => setTuKhoaToanKhoa(e.target.value)}
                      placeholder="Tìm kiếm học phần..."
                      prefix={<Search size={14} className="text-gray-400" />}
                      className="w-[220px]"
                      allowClear
                    />
                    <Button
                      onClick={() =>
                        setExpandTatCa((v) => {
                          const next = !v
                          setExpandedKeys(next ? dsToanKhoa.map((group) => group.key) : [])
                          return next
                        })
                      }
                    >
                      {expandTatCa ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                    </Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {dangTaiToanKhoa ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      Đang tải dữ liệu...
                    </div>
                  ) : dsToanKhoa.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu học phần toàn khóa.
                    </div>
                  ) : (
                    <Table<ToanKhoaBangRow>
                      rowKey="key"
                      size="small"
                      columns={cotBangToanKhoa}
                      dataSource={duLieuBangToanKhoa}
                      pagination={false}
                      scroll={{ x: 1200 }}
                      onRow={(record) =>
                        record.rowType === "semester"
                          ? {
                              onClick: () => {
                                const existed = expandedKeys.includes(record.semesterKey)
                                const next = existed
                                  ? expandedKeys.filter((k) => k !== record.semesterKey)
                                  : [...expandedKeys, record.semesterKey]
                                setExpandedKeys(next)
                                setExpandTatCa(
                                  next.length === dsToanKhoa.length && dsToanKhoa.length > 0
                                )
                              },
                              className: "cursor-pointer",
                            }
                          : {}
                      }
                      className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold"
                    />
                  )}
                </div>

                <div className="mt-2 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="m-0 text-xs text-gray-500">Tổng số học phần</p>
                    <p className="m-0 mt-1 text-2xl font-bold text-cgv-green-dark">
                      {tongKetToanKhoa.tongHocPhan}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="m-0 text-xs text-gray-500">Tổng số tín chỉ tích lũy</p>
                    <p className="m-0 mt-1 text-2xl font-bold text-cgv-green-dark">
                      {tongKetToanKhoa.tongTinChiTichLuy}
                      <span className="ml-1 text-sm font-medium text-gray-500">
                        / {tongKetToanKhoa.tongTinChiChuongTrinh}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="m-0 text-xs text-gray-500">CPA tích lũy</p>
                    <p className="m-0 mt-1 text-2xl font-bold text-blue-600">
                      {tongKetToanKhoa.cpaTichLuy != null
                        ? tongKetToanKhoa.cpaTichLuy.toFixed(2)
                        : "—"}
                      <span className="ml-1 text-sm font-medium text-gray-500">/ 4.00</span>
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="m-0 text-xs text-gray-500">Xếp loại tích lũy</p>
                    <p className="m-0 mt-1 text-2xl font-bold text-cgv-green-dark">
                      {tongKetToanKhoa.xepLoaiTichLuy}
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "bieu-do-hoc-tap",
            label: "Biểu đồ học tập",
            children: (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TabBieuDoHocTap
                  studentId={studentId}
                  fixedClassId={fixedClassId}
                  ketQuaTheoKy={ketQuaTheoKy}
                  enabled={tabActive === "bieu-do-hoc-tap"}
                />
              </div>
            ),
          },
        ]}
      />
    </Card>
  )
}

export default BangDiemHocKy
