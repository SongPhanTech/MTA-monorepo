import HangNhan from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan"
import type { TomTatSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Avatar, Button, Card, Tag } from "antd"
import { Printer, UserRound } from "lucide-react"

interface TheTomTatSinhVienProps {
  data: TomTatSinhVien
  onXemAnhGoc?: () => void
  onInHoSo?: () => void
}

const TheTomTatSinhVien = ({ data, onXemAnhGoc, onInHoSo }: TheTomTatSinhVienProps) => (
  <Card size="small" className="h-full shadow-sm" styles={{ body: { padding: 16 } }}>
    <div className="flex flex-col items-center text-center">
      <Avatar
        size={72}
        src={data.anhDaiDien}
        icon={<UserRound size={32} />}
        className="mb-3 bg-cgv-green/20 text-cgv-green-dark"
      />
      <p className="m-0 text-base font-bold text-gray-800">{data.hoVaTen}</p>
      <Tag color={data.trangThai.color} className="mt-2">
        {data.trangThai.label}
      </Tag>
    </div>

    <div className="mt-4 border-t border-gray-100 pt-3">
      <HangNhan label="MSSV" value={data.maSinhVien} />
      <HangNhan label="Lớp" value={data.lop} />
      <HangNhan label="Khóa" value={data.khoa} />
      <HangNhan label="Khoa" value={data.khoaVien} />
    </div>

    <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
      {data.anhDaiDien ? (
        <Button type="link" size="small" className="h-auto p-0 text-cgv-green-dark" onClick={onXemAnhGoc}>
          Xem ảnh hồ sơ gốc
        </Button>
      ) : null}
      <Button
        type="default"
        size="small"
        icon={<Printer size={14} />}
        className="inline-flex items-center justify-center gap-1 border-cgv-green-dark text-cgv-green-dark"
        onClick={onInHoSo}
      >
        In hồ sơ
      </Button>
    </div>
  </Card>
)

export default TheTomTatSinhVien
