import DatePicker from "@components/commons/date-picker"
import type { LopGiangDayRow } from "@components/cong-giang-vien/lop-giang-day/types"
import { diemDanhGiangDayPath } from "@constants/cong-giang-vien-path"
import { diemLopMonHocStore } from "@pages/quan-ly-diem/ql-diem-lop-mon-hoc"
import { $Enums } from "@workspace/db/client"
import { useUpdateSubjectClass } from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Button, Checkbox, Dropdown, Table, Tag, Tooltip, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { MenuProps } from "antd"
import dayjs from "dayjs"
import { CalendarPlus, Ellipsis, PenLine } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useRef, useState, type Key } from "react"

const CHIEU_CAO_HEADER_BANG = 56

const MAU_HAN = {
  red: "text-red-500",
  blue: "text-blue-600",
  gray: "text-gray-500",
  default: "",
} as const

interface BangLopGiangDayProps {
  danhSach: LopGiangDayRow[]
  loading?: boolean
  trang: number
  soTrang: number
  selectedRowKeys: Key[]
  onSelectRows: (keys: Key[]) => void
}

const BangLopGiangDay = ({
  danhSach,
  loading,
  trang,
  soTrang,
  selectedRowKeys,
  onSelectRows,
}: BangLopGiangDayProps) => {
  const router = useRouter()
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)
  const { mutateAsync: capNhatLopMonHoc } = useUpdateSubjectClass()

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const moNhapDiem = (id: string, loai: "qua-trinh" | "thi") => {
    diemLopMonHocStore.setState({ selectedSubjectClassId: id })
    router.push({
      pathname: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
      query: { loaiNhapDiem: loai },
    })
  }

  const moDiemDanh = (id: string) => {
    router.push(diemDanhGiangDayPath(id))
  }

  const doiNgayThi = async (id: string, value: dayjs.Dayjs | null) => {
    try {
      await capNhatLopMonHoc({
        where: { id },
        data: { examDate: value ? value.toISOString() : null },
      })
      message.success("Cập nhật ngày thi thành công")
    } catch {
      message.error("Không thể cập nhật ngày thi")
    }
  }

  const columns: ColumnsType<LopGiangDayRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã lớp",
      dataIndex: "maLop",
      width: 100,
      align: "center",
      ellipsis: true,
    },
    {
      title: "Môn học",
      dataIndex: "tenMonHoc",
      width: 220,
      ellipsis: true,
      render: (value: string, record) => (
        <span>
          {record.loaiLop === $Enums.SubjectClassType.RETAKE ? (
            <Tag color="blue" className="mr-1 px-1">
              Học lại
            </Tag>
          ) : record.loaiLop === $Enums.SubjectClassType.REEXAM ? (
            <Tag color="gold" className="mr-1 px-1">
              Thi lại
            </Tag>
          ) : null}
          {value}
          {record.soTinChi != null ? ` (${record.soTinChi} TC)` : ""}
        </span>
      ),
    },
    {
      title: "Hình thức thi",
      dataIndex: "hinhThucThi",
      width: 110,
      align: "center",
    },
    {
      title: "Trạng thái nhập điểm",
      dataIndex: "trangThaiNhapDiem",
      width: 170,
      align: "center",
      render: (value: string, record) => {
        if (record.trangThaiNhapDiemColor === "red") {
          return <span className="text-red-500">{value}</span>
        }
        if (record.trangThaiNhapDiemColor === "processing") {
          return <Tag color="processing">{value}</Tag>
        }
        if (record.trangThaiNhapDiemColor === "green") {
          return <span>{value}</span>
        }
        return <Tag>{value}</Tag>
      },
    },
    {
      title: <Tooltip title="Môn 1 đầu điểm">Môn 1 ĐĐ</Tooltip>,
      dataIndex: "monMotDauDiem",
      width: 90,
      align: "center",
      render: (value: boolean) => <Checkbox checked={value} disabled />,
    },
    {
      title: "Ngày NĐQT",
      dataIndex: "ngayNdqt",
      width: 110,
      align: "center",
    },
    {
      title: "Hạn NĐQT",
      dataIndex: "hanNdqt",
      width: 110,
      align: "center",
    },
    {
      title: "Hạn ĐQT",
      dataIndex: "hanDqt",
      width: 110,
      align: "center",
      render: (value: LopGiangDayRow["hanDqt"]) => (
        <span className={MAU_HAN[value.color]}>{value.label}</span>
      ),
    },
    {
      title: "Ngày thi",
      dataIndex: "ngayThi",
      width: 140,
      align: "center",
      render: (value: string | null, record) => (
        <DatePicker
          allowClear
          format="DD/MM/YYYY"
          value={value ? dayjs(value) : null}
          className="w-full"
          onChange={(date) => doiNgayThi(record.id, date)}
        />
      ),
    },
    {
      title: "Hạn NĐT",
      dataIndex: "hanNdt",
      width: 110,
      align: "center",
    },
    {
      title: "Hạn ĐT",
      dataIndex: "hanDt",
      width: 110,
      align: "center",
      render: (value: LopGiangDayRow["hanDt"]) => (
        <span className={MAU_HAN[value.color]}>{value.label}</span>
      ),
    },
    {
      title: "Giảng viên 1",
      dataIndex: "giangVien1",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Giảng viên 2",
      dataIndex: "giangVien2",
      width: 180,
      ellipsis: true,
      render: (value: string) => value || "—",
    },
    {
      title: "ĐV phụ trách",
      dataIndex: "donViPhuTrach",
      width: 100,
      align: "center",
    },
    {
      title: "Thao tác",
      width: 90,
      align: "center",
      fixed: "right",
      render: (_value, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "nhap-diem-qua-trinh",
            label: "Nhập điểm quá trình",
            icon: <PenLine size={14} />,
            onClick: () => moNhapDiem(record.id, "qua-trinh"),
          },
          {
            key: "nhap-diem-thi",
            label: "Nhập điểm thi",
            icon: <PenLine size={14} />,
            onClick: () => moNhapDiem(record.id, "thi"),
          },
        ]

        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip title="Điểm danh">
              <Button
                type="text"
                size="small"
                icon={<CalendarPlus size={16} />}
                className="text-cgv-green-dark"
                onClick={() => moDiemDanh(record.id)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<Ellipsis size={16} />}
                className="text-cgv-green-dark"
              />
            </Dropdown>
          </div>
        )
      },
    },
  ]

  return (
    <div
      ref={vungBangRef}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-white"
    >
      <Table<LopGiangDayRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectRows,
        }}
        scroll={{ x: 2200, y: chieuCaoBody }}
        className="bang-lq-chi-tiet [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default BangLopGiangDay
