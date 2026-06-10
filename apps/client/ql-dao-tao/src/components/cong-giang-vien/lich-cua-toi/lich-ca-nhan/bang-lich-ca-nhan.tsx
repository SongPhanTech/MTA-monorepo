import { META_LOAI_LICH_CA_NHAN } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import type { DongLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import EditIcon from "@components/icons/edit"
import DeleteIcon from "@components/icons/delete"
import { Button, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Filter, Search } from "lucide-react"

interface BangLichCaNhanProps {
  danhSach: DongLichCaNhan[]
  tuKhoa: string
  dangTai?: boolean
  onDoiTuKhoa: (value: string) => void
  onSua?: (id: string) => void
  onXoa?: (id: string) => void
}

const BangLichCaNhan = ({
  danhSach,
  tuKhoa,
  dangTai,
  onDoiTuKhoa,
  onSua,
  onXoa,
}: BangLichCaNhanProps) => {
  const cot: ColumnsType<DongLichCaNhan> = [
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 120,
      render: (_, row) => `${row.thoiGianBatDau} - ${row.thoiGianKetThuc}`,
    },
    {
      title: "Tiêu đề",
      dataIndex: "tieuDe",
      key: "tieuDe",
      ellipsis: true,
    },
    {
      title: "Loại lịch",
      key: "loaiLich",
      width: 110,
      render: (_, row) => {
        const meta = META_LOAI_LICH_CA_NHAN[row.nhomLoai]
        if (row.mauLoai) {
          return (
            <span
              className="inline-block rounded border px-2 py-0.5 text-xs font-medium"
              style={{
                borderColor: row.mauLoai,
                color: row.mauLoai,
                backgroundColor: `${row.mauLoai}14`,
              }}
            >
              {row.tenLoai || meta.label}
            </span>
          )
        }
        return (
          <span
            className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${meta.tagClass}`}
          >
            {row.tenLoai || meta.label}
          </span>
        )
      },
    },
    {
      title: "Địa điểm / Nền tảng",
      dataIndex: "diaDiem",
      key: "diaDiem",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Nội dung",
      dataIndex: "noiDung",
      key: "noiDung",
      ellipsis: true,
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      key: "ghiChu",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "thaoTac",
      width: 88,
      align: "center",
      fixed: "right",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <EditIcon
            className="text-blue-600"
            title="Sửa"
            onClick={() => onSua?.(row.id)}
          />
          <DeleteIcon
            title="Xóa"
            popConfirm={{
              title: "Xóa lịch này?",
              okText: "Xóa",
              cancelText: "Hủy",
              onConfirm: () => onXoa?.(row.id),
            }}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          value={tuKhoa}
          onChange={(e) => onDoiTuKhoa(e.target.value)}
          placeholder="Tìm theo tiêu đề, địa điểm, nội dung, loại lịch..."
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          className="flex-1"
        />
        <Button type="default" icon={<Filter size={16} />} aria-label="Bộ lọc" />
      </div>

      <Table<DongLichCaNhan>
        rowKey="id"
        columns={cot}
        dataSource={danhSach}
        loading={dangTai}
        pagination={false}
        size="small"
        scroll={{ x: 1036 }}
        className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600"
        locale={{ emptyText: "Không có sự kiện trong ngày" }}
      />
    </div>
  )
}

export default BangLichCaNhan
