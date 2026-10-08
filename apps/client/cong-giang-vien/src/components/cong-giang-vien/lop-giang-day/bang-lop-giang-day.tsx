import type { LopGiangDayRow } from "@components/cong-giang-vien/lop-giang-day/types"
import { useMoDanhSachThi } from "@components/commons/print/xuat-danh-sach-thi"
import {
  chiTietMonHocGiangDayPath,
  diemDanhGiangDayPath,
  nhapDiemThiGiangDayPath,
  nhapDiemQuaTrinhGiangDayPath,
} from "@/utils/cong-giang-vien-path-helper"
import { diemLopMonHocStore } from "@/stores/diem-lop-mon-hoc"
import { $Enums } from "@workspace/db/client"
import { Button, Checkbox, Dropdown, Table, Tag, Tooltip, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { MenuProps } from "antd"
import dayjs from "dayjs"
import { CalendarPlus, Download, Ellipsis, Eye, PenLine } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

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
}

const BangLopGiangDay = ({ danhSach, loading, trang, soTrang }: BangLopGiangDayProps) => {
  const router = useRouter()
  const moDanhSachThi = useMoDanhSachThi()
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

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
    router.push(
      loai === "qua-trinh" ? nhapDiemQuaTrinhGiangDayPath(id) : nhapDiemThiGiangDayPath(id)
    )
  }

  const moDiemDanh = (id: string) => {
    router.push(diemDanhGiangDayPath(id))
  }

  const xuatDanhSachThi = (record: LopGiangDayRow) => {
    if (!record.canXuatDanhSachThi) {
      message.warning(
        "Chưa thể xuất danh sách thi. Phòng đào tạo cần lên kỳ thi và lấy điểm sinh viên trước."
      )
      return
    }
    moDanhSachThi(record.id, record.examId)
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
      render: (value: string | null) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
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
            key: "diem-danh",
            label: "Điểm danh",
            icon: <CalendarPlus size={14} />,
            onClick: () => moDiemDanh(record.id),
          },
          {
            key: "nhap-diem-qua-trinh",
            label: record.monMotDauDiem
              ? "Nhập điểm quá trình (môn 1 đầu điểm)"
              : "Nhập điểm quá trình",
            icon: <PenLine size={14} />,
            disabled: record.monMotDauDiem,
            onClick: () => moNhapDiem(record.id, "qua-trinh"),
          },
          {
            key: "nhap-diem-thi",
            label: "Nhập điểm thi",
            icon: <PenLine size={14} />,
            onClick: () => moNhapDiem(record.id, "thi"),
          },
          {
            key: "xuat-ds-thi",
            label: record.canXuatDanhSachThi
              ? "Xuất danh sách thi"
              : "Xuất danh sách thi (chưa lấy điểm SV)",
            icon: <Download size={14} />,
            disabled: !record.canXuatDanhSachThi,
            onClick: () => xuatDanhSachThi(record),
          },
        ]

        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<Eye size={16} />}
                onClick={() =>
                  router.push(chiTietMonHocGiangDayPath(record.subjectVersionId, record.id))
                }
                className="text-cgv-green-dark"
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
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden rounded-lg  bg-white">
      <Table<LopGiangDayRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered={true}
        // className="bang-lq-chi-tiet [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400 [&_.ant-table-cell-scrollbar]:!hidden"
      />
    </div>
  )
}

export default BangLopGiangDay
