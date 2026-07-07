import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import OChiSoThongKe from "@components/cong-giang-vien/o-chi-so-thong-ke"
import { Avatar, Card, Tag } from "antd"
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Shield,
  Star,
  UserRound,
} from "lucide-react"
import type { ReactNode } from "react"

export type DuLieuHeaderKetQuaHocTap = {
  anhDaiDien?: string
  hoVaTen: string
  maSinhVien: string
  gioiTinh: string
  lop: string
  trangThai: { label: string; color: string }
  ngaySinh: string
  email: string
  sdt: string
  khoaHoc: string
  khoa: string
  chuongTrinhDaoTao: string
  ngayVaoTruong: string
  gpaHienTai: string
  tinChiTichLuy: string
  tinChiTong: string
  diemRenLuyenTb: string
  xepLoaiHocLuc: string
}

const HangThongTin = ({
  icon,
  nhan,
  giaTri,
}: {
  icon: ReactNode
  nhan: string
  giaTri: string
}) => (
  <div className="flex min-w-0 items-center gap-2">
    <span className="shrink-0 text-cgv-green-dark/70">{icon}</span>
    <p className="m-0 min-w-0 truncate text-xs leading-snug text-gray-600">
      <span className="text-gray-400">{nhan}:</span>{" "}
      <span className="font-medium text-gray-800">{giaTri || "—"}</span>
    </p>
  </div>
)

const OThongKe = ({
  tieuDe,
  giaTri,
  phu,
  icon,
  mau = "blue",
  compact = false,
}: {
  tieuDe: string
  giaTri: string
  phu?: string
  icon?: ReactNode
  mau?: "blue" | "green"
  compact?: boolean
}) => (
  <OChiSoThongKe
    label={tieuDe}
    icon={icon}
    variant={mau === "green" ? "green" : "blue"}
    plain
    compact={compact}
    value={
      <>
        {giaTri}
        {phu ? <span className="text-sm font-normal text-gray-400"> {phu}</span> : null}
      </>
    }
    valueClassName={mau === "green" ? "text-cgv-green-dark" : "text-blue-600"}
  />
)

const TheHeaderKetQuaHocTap = ({ data }: { data: DuLieuHeaderKetQuaHocTap }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
    <Card className="min-w-0 flex-1 rounded-xl shadow-sm" styles={{ body: { padding: "14px 18px" } }}>
      <div className="flex items-start gap-5">
        <div className="shrink-0 rounded-full bg-cgv-green/10 p-1 ring-1 ring-cgv-green-dark/10">
          <Avatar
            size={64}
            src={data.anhDaiDien}
            icon={<UserRound size={28} />}
            className="bg-cgv-green/15 text-cgv-green-dark"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="m-0 text-sm font-bold text-cgv-green-dark">{data.hoVaTen}</p>
            <Tag color={data.trangThai.color} className="m-0 rounded-full px-2 py-0 text-[11px] leading-5">
              {data.trangThai.label}
            </Tag>
            <span className="hidden h-3 w-px shrink-0 bg-gray-200 sm:block" />
            <p className="m-0 text-xs text-gray-600">
              <span className="text-gray-400">MSSV</span>{" "}
              <span className="font-semibold text-gray-800">{data.maSinhVien}</span>
            </p>
            <span className="hidden h-3 w-px shrink-0 bg-gray-200 sm:block" />
            <p className="m-0 text-xs text-gray-600">
              <span className="text-gray-400">Giới tính</span>{" "}
              <span className="font-medium text-gray-800">{data.gioiTinh}</span>
            </p>
            <span className="hidden h-3 w-px shrink-0 bg-gray-200 md:block" />
            <p className="m-0 min-w-0 truncate text-xs text-gray-600">
              <span className="text-gray-400">Lớp</span>{" "}
              <span className="font-medium text-gray-800">{data.lop}</span>
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <HangThongTin icon={<Calendar size={13} />} nhan="Ngày sinh" giaTri={data.ngaySinh} />
            <HangThongTin icon={<Mail size={13} />} nhan="Email" giaTri={data.email} />
            <HangThongTin icon={<Phone size={13} />} nhan="SĐT" giaTri={data.sdt} />
            <HangThongTin icon={<GraduationCap size={13} />} nhan="Khóa học" giaTri={data.khoaHoc} />
            <HangThongTin icon={<BookOpen size={13} />} nhan="Khoa" giaTri={data.khoa} />
            <HangThongTin
              icon={<BookOpen size={13} />}
              nhan="CTĐT"
              giaTri={data.chuongTrinhDaoTao}
            />
            <HangThongTin
              icon={<Calendar size={13} />}
              nhan="Ngày vào trường"
              giaTri={data.ngayVaoTruong}
            />
          </div>
        </div>
      </div>
    </Card>

    <Card
      className="w-full shrink-0 rounded-xl shadow-sm lg:w-[272px]"
      styles={{ body: { padding: 0 } }}
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
        <OThongKe
          tieuDe="GPA hiện tại"
          giaTri={data.gpaHienTai}
          phu="/ 4.00"
          icon={<Award size={16} />}
          mau="blue"
          compact
        />
        <OThongKe
          tieuDe="Tín chỉ tích lũy"
          giaTri={data.tinChiTichLuy}
          phu={`/ ${data.tinChiTong}`}
          icon={<GraduationCap size={16} />}
          mau="blue"
          compact
        />
        <OThongKe
          tieuDe="Điểm rèn luyện TB"
          giaTri={data.diemRenLuyenTb}
          phu="/ 100"
          icon={<Shield size={16} />}
          mau="green"
          compact
        />
        <OThongKe
          tieuDe="Xếp loại học lực"
          giaTri={data.xepLoaiHocLuc}
          icon={<Star size={16} />}
          mau="green"
          compact
        />
      </div>
    </Card>
  </div>
)

export const layNhanTrangThaiSinhVien = (status: string) => {
  const meta = FIXED_CLASS_STUDENT_STATUS[status as keyof typeof FIXED_CLASS_STUDENT_STATUS]
  return meta ?? { label: status, color: "default" }
}

export default TheHeaderKetQuaHocTap
