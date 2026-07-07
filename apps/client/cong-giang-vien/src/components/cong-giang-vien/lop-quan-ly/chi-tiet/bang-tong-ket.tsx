import type { TongKetRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { dinhDangGpa, mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Button, Table, Tag, Tooltip } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Eye } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const CHIEU_CAO_HEADER_BANG = 48
const CHIEU_CAO_THANH_CUON_NGANG = 12

interface BangTongKetProps {
  danhSach: TongKetRow[]
  loading?: boolean
  trang: number
  soTrang: number
  theoKy: boolean
  onXemChiTiet: (id: string) => void
}

const BangTongKet = ({
  danhSach,
  loading,
  trang,
  soTrang,
  theoKy,
  onXemChiTiet,
}: BangTongKetProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(320)

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(
        Math.max(160, el.clientHeight - CHIEU_CAO_HEADER_BANG - CHIEU_CAO_THANH_CUON_NGANG)
      )
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

  const columns: ColumnsType<TongKetRow> = useMemo(() => {
    const cols: ColumnsType<TongKetRow> = [
      {
        title: "STT",
        width: 56,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => (trang - 1) * soTrang + index + 1,
      },
      {
        title: "Mã sinh viên",
        dataIndex: "maSinhVien",
        width: 120,
        align: "center",
        fixed: "left",
      },
      {
        title: "Họ và tên",
        dataIndex: "hoVaTen",
        width: 180,
        ellipsis: true,
        fixed: "left",
      },
      {
        title: "Ngày sinh",
        dataIndex: "ngaySinh",
        width: 110,
        align: "center",
        render: (value: string | null) => value ?? "—",
      },
      {
        title: "Lớp",
        dataIndex: "maLop",
        width: 100,
        align: "center",
        render: (value: string, record) => <Tooltip title={record.tenLop}>{value || "—"}</Tooltip>,
      },
      {
        title: "Năm học thứ...",
        dataIndex: "namHocThu",
        width: 100,
        align: "center",
        render: (value: number | null) => (value != null ? value : "—"),
      },
    ]

    if (theoKy) {
      cols.push({
        title: "Học kỳ thứ.../ toàn khóa",
        dataIndex: "hocKyThu",
        width: 120,
        align: "center",
        render: (value: number | null) => (value != null ? value : "—"),
      })
    }

    cols.push(
      {
        title: "Hệ số xét học bổng",
        dataIndex: "heSoXetHocBong",
        width: 110,
        align: "center",
        render: (value: string | null) => value ?? "—",
      },
      {
        title: "Trung bình hệ 4",
        dataIndex: "trungBinhHe4",
        width: 100,
        align: "center",
        render: (value: number | null) => dinhDangGpa(value),
      },
      {
        title: "Tích lũy hệ 4",
        dataIndex: "tichLuyHe4",
        width: 100,
        align: "center",
        render: (value: number | null) => dinhDangGpa(value),
      },
      {
        title: "Trung bình hệ 10",
        dataIndex: "trungBinhHe10",
        width: 100,
        align: "center",
        render: (value: number | null) => dinhDangGpa(value),
      },
      {
        title: "Tích lũy hệ 10",
        dataIndex: "tichLuyHe10",
        width: 100,
        align: "center",
        render: (value: number | null) => dinhDangGpa(value),
      },
      {
        title: "Xếp loại học lực",
        dataIndex: "xepLoai",
        width: 140,
        align: "center",
        render: (value: string | null) =>
          value ? <Tag color={mauXepLoaiHocLuc(value)}>{value}</Tag> : "—",
      },
      {
        title: "Điểm rèn luyện",
        dataIndex: "diemRenLuyen",
        width: 110,
        align: "center",
        render: (value: number | null) => dinhDangGpa(value),
      },
      {
        title: "Chi tiết",
        width: 90,
        align: "center",
        fixed: "right",
        render: (_value, record) => (
          <div className="flex items-center justify-center">
            <Button
              type="link"
              size="small"
              icon={<Eye size={14} className="block" />}
              className="inline-flex h-auto items-center justify-center gap-1 px-0 leading-none text-cgv-green-dark [&_.ant-btn-icon]:flex [&_.ant-btn-icon]:items-center"
              onClick={() => onXemChiTiet(record.id)}
            >
              Chi tiết
            </Button>
          </div>
        ),
      }
    )

    return cols
  }, [trang, soTrang, theoKy, onXemChiTiet])

  return (
    <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden px-4 pb-2 mt-2">
      <Table<TongKetRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content", y: chieuCaoBody }}
        bordered={true}
        className="bang-tong-ket"
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-50/80" : "")}
      />
    </div>
  )
}

export default BangTongKet
