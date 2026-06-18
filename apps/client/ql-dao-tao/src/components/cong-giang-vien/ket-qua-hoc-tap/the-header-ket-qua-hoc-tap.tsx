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
  <div className="flex flex-col items-center px-2 py-2 text-center">
    <p className="m-0 text-xs text-gray-500">{nhan}</p>
    <div className="my-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-cgv-green-dark">
      {icon}
    </div>
    <p className="m-0 text-sm font-medium leading-snug text-gray-800">{giaTri}</p>
  </div>
)

const OThongKe = ({
  tieuDe,
  giaTri,
  phu,
  icon,
  mau = "blue",
}: {
  tieuDe: string
  giaTri: string
  phu?: string
  icon?: ReactNode
  mau?: "blue" | "green"
}) => (
  <OChiSoThongKe
    label={tieuDe}
    icon={icon}
    variant={mau === "green" ? "green" : "blue"}
    plain
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
  <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
    <Card
      className="flex-1 rounded-xl shadow-sm"
      styles={{ body: { padding: "20px 24px" } }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="flex shrink-0 gap-4 lg:w-[220px] lg:flex-col lg:items-center lg:text-center">
          <Avatar
            size={72}
            src={data.anhDaiDien}
            icon={<UserRound size={32} />}
            className="shrink-0 bg-cgv-green/15 text-cgv-green-dark"
          />
          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="m-0 text-lg font-bold text-cgv-green-dark">{data.hoVaTen}</p>
            <p className="m-0 mt-2 text-sm text-gray-600">
              <span className="text-gray-500">MSSV:</span>{" "}
              <span className="font-semibold text-gray-800">{data.maSinhVien}</span>
            </p>
            <p className="m-0 mt-1 text-sm text-gray-600">
              <span className="text-gray-500">Giới tính:</span>{" "}
              <span className="font-semibold text-gray-800">{data.gioiTinh}</span>
            </p>
            <p className="m-0 mt-1 text-sm text-gray-600">
              <span className="text-gray-500">Lớp:</span>{" "}
              <span className="font-semibold text-gray-800">{data.lop}</span>
            </p>
            <Tag color={data.trangThai.color} className="mt-2 rounded-full px-3">
              {data.trangThai.label}
            </Tag>
          </div>
        </div>

        <div className="hidden w-px shrink-0 bg-gray-200 lg:block" />

        <div className="min-w-0 flex-1 lg:max-w-[220px]">
          <HangThongTin icon={<Calendar size={15} />} nhan="Ngày sinh" giaTri={data.ngaySinh} />
          <HangThongTin icon={<Mail size={15} />} nhan="Email" giaTri={data.email} />
          <HangThongTin icon={<Phone size={15} />} nhan="SĐT liên hệ" giaTri={data.sdt} />
        </div>

        <div className="hidden w-px shrink-0 bg-gray-200 lg:block" />

        <div className="min-w-0 flex-1 lg:max-w-[240px]">
          <HangThongTin
            icon={<GraduationCap size={15} />}
            nhan="Khóa học"
            giaTri={data.khoaHoc}
          />
          <HangThongTin icon={<BookOpen size={15} />} nhan="Khoa" giaTri={data.khoa} />
          <HangThongTin
            icon={<BookOpen size={15} />}
            nhan="Chương trình đào tạo"
            giaTri={data.chuongTrinhDaoTao}
          />
        </div>

        <div className="hidden w-px shrink-0 bg-gray-200 lg:block" />

        <div className="min-w-0 flex-1 lg:max-w-[180px]">
          <HangThongTin
            icon={<Calendar size={15} />}
            nhan="Ngày vào trường"
            giaTri={data.ngayVaoTruong}
          />
        </div>
      </div>
    </Card>

    <Card
      className="w-full shrink-0 rounded-xl shadow-sm xl:w-[300px]"
      styles={{ body: { padding: 0 } }}
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
        <OThongKe
          tieuDe="GPA hiện tại"
          giaTri={data.gpaHienTai}
          phu="/ 4.00"
          icon={<Award size={18} />}
          mau="blue"
        />
        <OThongKe
          tieuDe="Tín chỉ tích lũy"
          giaTri={data.tinChiTichLuy}
          phu={`/ ${data.tinChiTong}`}
          icon={<GraduationCap size={18} />}
          mau="blue"
        />
        <OThongKe
          tieuDe="Điểm rèn luyện TB"
          giaTri={data.diemRenLuyenTb}
          phu="/ 100"
          icon={<Shield size={18} />}
          mau="green"
        />
        <OThongKe
          tieuDe="Xếp loại học lực"
          giaTri={data.xepLoaiHocLuc}
          icon={<Star size={18} />}
          mau="green"
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
