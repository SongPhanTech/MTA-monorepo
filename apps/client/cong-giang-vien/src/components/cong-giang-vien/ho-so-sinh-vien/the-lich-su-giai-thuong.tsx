import KhoiThongTin from "@components/cong-giang-vien/ho-so-sinh-vien/khoi-thong-tin"
import type { GiaiThuongSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Button, Descriptions, Input, Modal, Select, Tag } from "antd"
import { Award, ChevronRight, Search } from "lucide-react"
import { useMemo, useState } from "react"

const SO_MUC_MAC_DINH = 5

interface TheLichSuGiaiThuongProps {
  danhSach: GiaiThuongSinhVien[]
}

const mauTrangThai = (color: string) => {
  if (color === "green") return "green"
  if (color === "blue") return "blue"
  if (color === "red") return "red"
  return "default"
}

const TheLichSuGiaiThuong = ({ danhSach }: TheLichSuGiaiThuongProps) => {
  const [tuKhoa, setTuKhoa] = useState("")
  const [namHoc, setNamHoc] = useState<string>()
  const [moRong, setMoRong] = useState(false)
  const [chiTiet, setChiTiet] = useState<GiaiThuongSinhVien | null>(null)

  const danhSachNamHoc = useMemo(
    () => [...new Set(danhSach.map((item) => item.namHoc).filter(Boolean))],
    [danhSach]
  )

  const daLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    return danhSach.filter((item) => {
      if (namHoc && item.namHoc !== namHoc) return false
      if (!q) return true
      return [item.tenGiaiThuong, item.thanhTich, item.soQuyetDinh, item.moTa]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [danhSach, namHoc, tuKhoa])

  const hienThi = moRong ? daLoc : daLoc.slice(0, SO_MUC_MAC_DINH)

  return (
    <KhoiThongTin tieuDe={`Lịch sử giải thưởng (${danhSach.length})`}>
      <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
        <Input
          allowClear
          size="small"
          prefix={<Search size={14} className="text-gray-400" />}
          placeholder="Tìm kiếm giải thưởng"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          allowClear
          size="small"
          placeholder="Năm học"
          value={namHoc}
          onChange={setNamHoc}
          options={danhSachNamHoc.map((nam) => ({ label: nam, value: nam }))}
          className="w-full sm:w-36"
        />
      </div>

      {daLoc.length === 0 ? (
        <p className="m-0 py-4 text-sm text-gray-400">Chưa có dữ liệu giải thưởng.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {hienThi.map((item) => (
            <div key={item.id} className="flex gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cgv-green/15 text-cgv-green-dark">
                <Award size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-xs text-gray-400">{item.ngay || "—"}</p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-gray-800">
                      {item.tenGiaiThuong}
                    </p>
                  </div>
                  <Tag color={mauTrangThai(item.trangThai.color)} className="m-0">
                    {item.trangThai.label}
                  </Tag>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <p className="m-0">
                    <span className="text-gray-400">Thành tích: </span>
                    {item.thanhTich}
                  </p>
                  <p className="m-0">
                    <span className="text-gray-400">Đơn vị trao: </span>
                    {item.donViTrao}
                  </p>
                  <p className="m-0">
                    <span className="text-gray-400">Số QĐ: </span>
                    {item.soQuyetDinh}
                  </p>
                  <p className="m-0">
                    <span className="text-gray-400">Điểm thưởng: </span>
                    <span className="font-medium text-cgv-green-dark">+{item.diemThuong}</span>
                  </p>
                </div>
              </div>
              <Button
                type="link"
                size="small"
                className="h-auto shrink-0 self-center p-0 text-cgv-green-dark"
                onClick={() => setChiTiet(item)}
              >
                Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      )}

      {daLoc.length > SO_MUC_MAC_DINH ? (
        <div className="border-t border-gray-100 pt-2 text-center">
          <Button
            type="link"
            size="small"
            className="h-auto p-0 text-cgv-green-dark"
            onClick={() => setMoRong((v) => !v)}
          >
            {moRong ? "Thu gọn" : "Xem thêm"}
            {!moRong ? <ChevronRight size={14} className="ml-0.5 inline" /> : null}
          </Button>
        </div>
      ) : null}

      <Modal
        title="Chi tiết giải thưởng"
        open={!!chiTiet}
        onCancel={() => setChiTiet(null)}
        footer={null}
        width={520}
      >
        {chiTiet ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Tên giải thưởng">{chiTiet.tenGiaiThuong}</Descriptions.Item>
            <Descriptions.Item label="Ngày nhận">{chiTiet.ngay || "—"}</Descriptions.Item>
            <Descriptions.Item label="Thành tích">{chiTiet.thanhTich}</Descriptions.Item>
            <Descriptions.Item label="Đơn vị trao">{chiTiet.donViTrao}</Descriptions.Item>
            <Descriptions.Item label="Số quyết định">{chiTiet.soQuyetDinh}</Descriptions.Item>
            <Descriptions.Item label="Điểm thưởng">+{chiTiet.diemThuong}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={mauTrangThai(chiTiet.trangThai.color)}>{chiTiet.trangThai.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">{chiTiet.moTa || "—"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </KhoiThongTin>
  )
}

export default TheLichSuGiaiThuong
