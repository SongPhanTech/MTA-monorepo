import TableCollapse from "@components/commons/tableCollapse"
import type {
  DongLichBangThang,
  DongLichCaNhan,
  NhomNgayLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import type { CheDoHienThiLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { CLASS_O_THU_BANG, taoOnCellThu } from "@components/cong-giang-vien/lich-cua-toi/utils"
import EditIcon from "@components/icons/edit"
import DeleteIcon from "@components/icons/delete"
import { Button, Input, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Filter, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface BangLichCaNhanProps {
  cheDoHienThi: CheDoHienThiLich
  danhSach: DongLichCaNhan[]
  danhSachNhom: NhomNgayLich[]
  danhSachBangThang: DongLichBangThang[]
  tuKhoa: string
  dangTai?: boolean
  onDoiTuKhoa: (value: string) => void
  onSua?: (id: string) => void
  onXoa?: (id: string) => void
  onXemChiTiet?: (id: string) => void
}

const CHIEU_CAO_HEADER_BANG = 39

const renderLoaiLich = (row: DongLichCaNhan) => {
  const mau = row.mauLoai ?? MAU_LOAI_MAC_DINH
  const ten = row.tenLoai && row.tenLoai !== "—" ? row.tenLoai : "Loại lịch"

  return (
    <span
      className="inline-block rounded border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: mau,
        color: mau,
        backgroundColor: `${mau}14`,
      }}
    >
      {ten}
    </span>
  )
}

const BangLichCaNhan = ({
  cheDoHienThi,
  danhSach,
  danhSachNhom,
  danhSachBangThang,
  tuKhoa,
  dangTai,
  onDoiTuKhoa,
  onSua,
  onXoa,
  onXemChiTiet,
}: BangLichCaNhanProps) => {
  const vungBangRef = useRef<HTMLDivElement>(null)
  const [chieuCaoBody, setChieuCaoBody] = useState(240)

  useEffect(() => {
    const el = vungBangRef.current
    if (!el) return

    const capNhatChieuCao = () => {
      setChieuCaoBody(Math.max(120, el.clientHeight - CHIEU_CAO_HEADER_BANG))
    }

    capNhatChieuCao()
    const observer = new ResizeObserver(capNhatChieuCao)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cotThaoTac: ColumnsType<DongLichCaNhan>[number] = {
    title: "Thao tác",
    key: "thaoTac",
    width: 88,
    align: "center",
    fixed: "right",
    render: (_, row) => (
      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        <EditIcon className="text-blue-600" title="Sửa" onClick={() => onSua?.(row.id)} />
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
  }

  const cotCoBan: ColumnsType<DongLichCaNhan> = [
    {
      title: "Thời gian",
      key: "thoiGian",
      width: 120,
      render: (_, row) => `${row.thoiGianBatDau} - ${row.thoiGianKetThuc}`,
    },
    {
      title: "Tiêu đề",
      key: "tieuDe",
      ellipsis: true,
      render: (_, row) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate" title={row.tieuDe}>
            {row.tieuDe}
          </span>
          {row.daHoanThanh ? (
            <span className="shrink-0 rounded bg-cgv-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-cgv-green-dark">
              Đã hoàn thành
            </span>
          ) : null}
        </div>
      ),
    },
    {
      title: "Loại lịch",
      key: "loaiLich",
      width: 110,
      render: (_, row) => renderLoaiLich(row),
    },
    {
      title: "Địa điểm / Nền tảng",
      dataIndex: "diaDiem",
      key: "diaDiem",
      width: 150,
      ellipsis: true,
    },
  ]

  const cotNgay: ColumnsType<DongLichCaNhan> = [
    ...cotCoBan,
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
    cotThaoTac,
  ]

  const cotThang: ColumnsType<DongLichBangThang> = [
    {
      title: "Thứ",
      dataIndex: "thu",
      key: "thu",
      width: 72,
      align: "center",
      onHeaderCell: () => ({ className: CLASS_O_THU_BANG }),
      onCell: (row) => taoOnCellThu(row.rowSpanThu),
    },
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 100,
      align: "center",
      onCell: (row) => ({ rowSpan: row.rowSpanNgay }),
    },
    ...(cotCoBan as ColumnsType<DongLichBangThang>),
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      key: "ghiChu",
      width: 120,
      ellipsis: true,
    },
    cotThaoTac as ColumnsType<DongLichBangThang>[number],
  ]

  const emptyText =
    cheDoHienThi === "thang"
      ? "Không có sự kiện trong tháng"
      : cheDoHienThi === "tuan"
        ? "Không có sự kiện trong tuần"
        : "Không có sự kiện trong ngày"

  const placeholderTimKiem =
    cheDoHienThi === "thang"
      ? "Tìm theo tiêu đề, địa điểm, ghi chú..."
      : "Tìm theo tiêu đề, địa điểm, nội dung, loại lịch..."

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Input
          value={tuKhoa}
          onChange={(e) => onDoiTuKhoa(e.target.value)}
          placeholder={placeholderTimKiem}
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          className="flex-1"
        />
        <Button type="default" icon={<Filter size={16} />} aria-label="Bộ lọc" />
      </div>

      <div ref={vungBangRef} className="min-h-0 flex-1 overflow-hidden">
        {cheDoHienThi === "thang" ? (
          <Table<DongLichBangThang>
            rowKey="id"
            columns={cotThang}
            dataSource={danhSachBangThang}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 980, y: chieuCaoBody }}
            bordered={true}
            // className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
            onRow={(row) => ({
              onClick: () => onXemChiTiet?.(row.id),
              style: { cursor: "pointer" },
            })}
          />
        ) : cheDoHienThi === "tuan" ? (
          <TableCollapse<NhomNgayLich, "suKien">
            rowKey="key"
            data={danhSachNhom}
            childrenFieldName="suKien"
            headerTitleKey="nhanNgay"
            headerRight={(record) => (
              <span className="text-xs font-normal text-gray-500">
                {record.suKien.length} sự kiện
              </span>
            )}
            columns={cotNgay}
            pagination={false}
            loading={dangTai}
            scrollable
            maxHeight={chieuCaoBody}
            defaultExpandAll
            bordered={true}
            // className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
            onRowClick={(row) => onXemChiTiet?.(row.id)}
          />
        ) : (
          <Table<DongLichCaNhan>
            rowKey="id"
            columns={cotNgay}
            dataSource={danhSach}
            loading={dangTai}
            pagination={false}
            size="small"
            scroll={{ x: 1036, y: chieuCaoBody }}
            bordered={true}
            // className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-gray-600 [&_.ant-table-thead>tr>th]:!border-b-gray-300 [&_.ant-table-thead>tr>th::before]:!bg-gray-400"
            locale={{ emptyText }}
            onRow={(row) => ({
              onClick: () => onXemChiTiet?.(row.id),
              style: { cursor: "pointer" },
            })}
          />
        )}
      </div>
    </div>
  )
}

export default BangLichCaNhan
