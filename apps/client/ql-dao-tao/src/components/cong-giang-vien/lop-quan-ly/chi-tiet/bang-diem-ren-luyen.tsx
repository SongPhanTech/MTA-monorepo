import type { DiemRenLuyenRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { useStudentTrainingTypeOptions } from "@hooks/studentTrainingType"
import { Button, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Eye } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 48

interface BangDiemRenLuyenProps {
  danhSach: DiemRenLuyenRow[]
  loading?: boolean
  trang: number
  soTrang: number
  onXemChiTiet: (id: string) => void
}

const BangDiemRenLuyen = ({
  danhSach,
  loading,
  trang,
  soTrang,
  onXemChiTiet,
}: BangDiemRenLuyenProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)
  const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
    useStudentTrainingTypeOptions()

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    window.addEventListener("resize", capNhatChieuCao)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", capNhatChieuCao)
    }
  }, [danhSach.length, loading])

  const columns: ColumnsType<DiemRenLuyenRow> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
    },
    {
      title: "Mã sinh viên",
      dataIndex: "maSinhVien",
      width: 130,
      align: "center",
    },
    {
      title: "Họ và tên",
      dataIndex: "hoVaTen",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Điểm SV đạt",
      dataIndex: "diem",
      width: 110,
      align: "center",
      render: (value: number | null) => (value != null ? value : "—"),
    },
    {
      title: "Xếp loại",
      dataIndex: "xepLoai",
      width: 140,
      align: "center",
      render: (value: DiemRenLuyenRow["xepLoai"]) =>
        value ? (
          <Tag color={getStudentTrainingTypeColor(value)}>{getStudentTrainingTypeLabel(value)}</Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      width: 140,
      ellipsis: true,
      render: (value: string) => value || "—",
    },
    {
      title: "Chi tiết",
      width: 90,
      align: "center",
      render: (_value, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          className="inline-flex items-center gap-1 px-0 text-cgv-green-dark"
          onClick={() => onXemChiTiet(record.id)}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pb-2">
      <Table<DiemRenLuyenRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: 900, y: chieuCaoBody }}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
        className="bang-lq-chi-tiet [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-cgv-green-dark"
      />
    </div>
  )
}

export default BangDiemRenLuyen
