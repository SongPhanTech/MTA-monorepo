import TabBieuDoHocTap from "@components/cong-giang-vien/ket-qua-hoc-tap/tab-bieu-do-hoc-tap"
import TinhNangPhatTrien from "@components/cong-giang-vien/tinh-nang-phat-trien"
import type { KetQuaKyBieuDo } from "@hooks/use-bieu-do-hoc-tap-lop-quan-ly"
import { Card, Select, Table, Tabs, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
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
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

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
          className="bang-lq-chi-tiet [&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark"
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
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                <TinhNangPhatTrien />
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
