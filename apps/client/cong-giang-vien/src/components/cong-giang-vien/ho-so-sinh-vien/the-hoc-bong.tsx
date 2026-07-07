import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { HocBongSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Button, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { ChevronRight } from "lucide-react"
import { useState } from "react"

const SO_DONG_MAC_DINH = 5

interface TheHocBongProps {
  danhSach: HocBongSinhVien[]
  capNhatCuoi?: string
}

const mauTrangThai = (color: string) => {
  if (color === "green") return "green"
  return "default"
}

const TheHocBong = ({ danhSach, capNhatCuoi }: TheHocBongProps) => {
  const [moRong, setMoRong] = useState(false)
  const hienThi = moRong ? danhSach : danhSach.slice(0, SO_DONG_MAC_DINH)

  const columns: ColumnsType<HocBongSinhVien> = [
    {
      title: "Năm học",
      dataIndex: "namHoc",
      width: 120,
    },
    {
      title: "Học kỳ",
      dataIndex: "hocKy",
      width: 80,
      align: "center",
    },
    {
      title: "Loại học bổng",
      dataIndex: "loaiHocBong",
      ellipsis: true,
    },
    {
      title: "GPA tại thời điểm",
      dataIndex: "gpaTaiThoiDiem",
      width: 130,
      align: "center",
    },
    {
      title: "Giá trị (VNĐ)",
      dataIndex: "giaTri",
      width: 130,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 100,
      align: "center",
      render: (trangThai: HocBongSinhVien["trangThai"]) => (
        <Tag color={mauTrangThai(trangThai.color)} className="m-0">
          {trangThai.label}
        </Tag>
      ),
    },
    {
      title: "Ngày quyết định",
      dataIndex: "ngayQuyetDinh",
      width: 120,
      align: "center",
    },
  ]

  return (
    <KhoiThongTin tieuDe="Học bổng">
      <div className="flex items-start justify-between gap-2 py-2">
        <p className="m-0 text-xs text-gray-500">({danhSach.length} lần được xét)</p>
        {danhSach.length > SO_DONG_MAC_DINH ? (
          <Button
            type="link"
            size="small"
            className="h-auto p-0 text-cgv-green-dark"
            onClick={() => setMoRong((v) => !v)}
          >
            {moRong ? "Thu gọn" : "Xem tất cả"}
            {!moRong ? <ChevronRight size={14} className="ml-0.5 inline" /> : null}
          </Button>
        ) : null}
      </div>

      {danhSach.length === 0 ? (
        <p className="m-0 py-2 text-sm text-gray-400">Chưa có dữ liệu học bổng.</p>
      ) : (
        <Table<HocBongSinhVien>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={hienThi}
          pagination={false}
          scroll={{ x: 720 }}
        />
      )}

      <p className="m-0 mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
        Thông tin học bổng phản ánh kết quả xét học bổng theo quy định của Học viện.
        {capNhatCuoi ? ` Cập nhật lần cuối: ${capNhatCuoi}.` : null}
      </p>
    </KhoiThongTin>
  )
}

export default TheHocBong
