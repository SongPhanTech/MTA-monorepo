import type { LopGiangDayRow } from "@components/cong-giang-vien/lop-giang-day/types"
import { $Enums } from "@workspace/db/client"
import { Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 56

interface BangThongKeLopProps {
  danhSach: LopGiangDayRow[]
  loading?: boolean
  trang: number
  soTrang: number
}

const BangThongKeLop = ({ danhSach, loading, trang, soTrang }: BangThongKeLopProps) => {
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

  const columns: ColumnsType<LopGiangDayRow> = [
    {
      title: "STT",
      width: 65,
      align: "center",
      fixed: "left",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã lớp",
      dataIndex: "maLop",
      width: 140,
      align: "center",
      ellipsis: true,
    },
    {
      title: "Môn học",
      dataIndex: "tenMonHoc",
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
      title: "Số sinh viên",
      dataIndex: "soSinhVien",
      width: 140,
      align: "center",
      render: (value: number) => <span className="font-semibold text-cgv-green-dark">{value}</span>,
    },
    {
      title: "Hình thức thi",
      dataIndex: "hinhThucThi",
      width: 160,
      align: "center",
      render: (value: string) => value || "—",
    },
    {
      title: "Trạng thái nhập điểm",
      dataIndex: "trangThaiNhapDiem",
      width: 220,
      align: "center",
      render: (value: string, record) => {
        if (record.trangThaiNhapDiemColor === "red") {
          return <span className="text-red-500 font-medium">{value}</span>
        }
        if (record.trangThaiNhapDiemColor === "processing") {
          return <Tag color="processing">{value}</Tag>
        }
        if (record.trangThaiNhapDiemColor === "green") {
          return <span className="text-green-600 font-medium">{value}</span>
        }
        return <Tag>{value}</Tag>
      },
    },
  ]

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden rounded-lg bg-white">
      <Table<LopGiangDayRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered={true}
      />
    </div>
  )
}

export default BangThongKeLop
