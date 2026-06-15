import type { ThongTinBuoiHoc } from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"
import { Input } from "antd"

interface ThongTinBuoiHocCardProps {
  thongTin: ThongTinBuoiHoc | null
  ghiChuBuoiHoc: string
  onDoiGhiChu: (value: string) => void
}

const HangThongTin = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
)

const ThongTinBuoiHocCard = ({
  thongTin,
  ghiChuBuoiHoc,
  onDoiGhiChu,
}: ThongTinBuoiHocCardProps) => (
  <div className="rounded-lg border border-gray-100 bg-white p-4">
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cgv-green-dark">
      Thông tin buổi học
    </p>

    <HangThongTin label="Ngày học:" value={thongTin?.ngayHoc ?? "—"} />
    <HangThongTin label="Tiết học:" value={thongTin?.tietHoc ?? "—"} />
    <HangThongTin label="Phòng học:" value={thongTin?.phongHoc ?? "—"} />
    <HangThongTin label="Sĩ số:" value={thongTin?.siSo ?? 0} />

    <div className="mt-3">
      <p className="mb-1 text-sm text-gray-500">Ghi chú buổi học:</p>
      <Input.TextArea
        rows={3}
        placeholder="Nhập ghi chú..."
        value={ghiChuBuoiHoc}
        onChange={(e) => onDoiGhiChu(e.target.value)}
      />
    </div>
  </div>
)

export default ThongTinBuoiHocCard
