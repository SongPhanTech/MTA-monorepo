import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { QuyetDinhTotNghiepSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Input, Modal, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Eye, Search } from "lucide-react"
import { useMemo, useState } from "react"

interface TheDanhSachQuyetDinhTotNghiepProps {
  danhSach: QuyetDinhTotNghiepSinhVien[]
}

const TheDanhSachQuyetDinhTotNghiep = ({ danhSach }: TheDanhSachQuyetDinhTotNghiepProps) => {
  const [tuKhoa, setTuKhoa] = useState("")
  const [chiTiet, setChiTiet] = useState<QuyetDinhTotNghiepSinhVien | null>(null)

  const daLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    if (!q) return danhSach
    return danhSach.filter((item) =>
      [
        item.soQuyetDinh,
        item.loaiQuyetDinh,
        item.noiDung,
        item.nguoiKy,
        item.namHoc,
        item.hocKy,
        item.ghiChu,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [danhSach, tuKhoa])

  const columns: ColumnsType<QuyetDinhTotNghiepSinhVien> = [
    { title: "Năm học", dataIndex: "namHoc", width: 110 },
    { title: "Học kỳ", dataIndex: "hocKy", width: 120, ellipsis: true },
    { title: "Số QĐ", dataIndex: "soQuyetDinh", width: 140, ellipsis: true },
    { title: "Loại QĐ", dataIndex: "loaiQuyetDinh", width: 160, ellipsis: true },
    { title: "Nội dung", dataIndex: "noiDung", width: 120 },
    { title: "Người ký", dataIndex: "nguoiKy", width: 160, ellipsis: true },
    { title: "Ngày ký", dataIndex: "ngayKy", width: 110, align: "center" },
    {
      title: "",
      width: 48,
      align: "center",
      render: (_, record) => (
        <button
          type="button"
          className="inline-flex cursor-pointer border-0 bg-transparent p-1 text-cgv-green-dark"
          onClick={() => setChiTiet(record)}
          aria-label="Xem chi tiết"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <KhoiThongTin tieuDe="Danh sách quyết định tốt nghiệp">
      <div className="py-2">
        <Input
          allowClear
          size="small"
          prefix={<Search size={14} className="text-gray-400" />}
          placeholder="Tìm kiếm theo số quyết định, nội dung, người ký..."
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>

      {daLoc.length === 0 ? (
        <p className="m-0 py-4 text-sm text-gray-400">Chưa có quyết định tốt nghiệp.</p>
      ) : (
        <Table<QuyetDinhTotNghiepSinhVien>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={daLoc}
          pagination={false}
          scroll={{ x: 900 }}
        />
      )}

      <Modal
        title="Chi tiết quyết định tốt nghiệp"
        open={!!chiTiet}
        onCancel={() => setChiTiet(null)}
        footer={null}
        width={560}
      >
        {chiTiet ? (
          <dl className="m-0 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-400">Số quyết định</dt>
              <dd className="m-0 font-medium">{chiTiet.soQuyetDinh}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Loại quyết định</dt>
              <dd className="m-0">{chiTiet.loaiQuyetDinh}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Nội dung</dt>
              <dd className="m-0">{chiTiet.noiDung}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-gray-400">Năm học</dt>
                <dd className="m-0">{chiTiet.namHoc}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Đợt xét</dt>
                <dd className="m-0">{chiTiet.hocKy}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-gray-400">Người ký</dt>
                <dd className="m-0">{chiTiet.nguoiKy}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Ngày ký</dt>
                <dd className="m-0">{chiTiet.ngayKy}</dd>
              </div>
            </div>
            {chiTiet.ghiChu ? (
              <div>
                <dt className="text-gray-400">Ghi chú</dt>
                <dd className="m-0">{chiTiet.ghiChu}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Modal>
    </KhoiThongTin>
  )
}

export default TheDanhSachQuyetDinhTotNghiep
