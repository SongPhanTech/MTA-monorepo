import NhanTrangThai from "@components/cong-giang-vien/ho-so-sinh-vien/nhan-trang-thai"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { Avatar, Card } from "antd"
import {
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Mail,
  Phone,
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
  <div className="flex min-w-0 items-center gap-2.5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-cgv-green-dark">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="m-0 text-[11px] leading-tight text-gray-500">{nhan}</p>
      <p className="m-0 mt-0.5 line-clamp-2 break-words text-xs font-semibold leading-snug text-gray-800">
        {giaTri || "—"}
      </p>
    </div>
  </div>
)

const OThongKe = ({
  tieuDe,
  giaTri,
  phu,
  mau = "blue",
}: {
  tieuDe: string
  giaTri: string
  phu?: string
  mau?: "blue" | "green"
}) => (
  <div className="flex h-full flex-col items-center justify-center px-3 py-4 text-center">
    <p className="m-0 text-[11px] leading-tight text-gray-500">{tieuDe}</p>
    <p
      className={`m-0 mt-1.5 text-lg font-bold leading-tight ${
        mau === "green" ? "text-cgv-green-dark" : "text-blue-600"
      }`}
    >
      {giaTri}
      {phu ? <span className="text-sm font-semibold text-gray-400"> {phu}</span> : null}
    </p>
  </div>
)

const CotThongTin = ({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={`flex min-w-0 flex-col justify-start gap-2.5 border-gray-200 py-1 xl:h-full xl:border-l xl:px-5 ${className}`}
  >
    {children}
  </div>
)

const TheHeaderKetQuaHocTap = ({ data }: { data: DuLieuHeaderKetQuaHocTap }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
    <Card
      className="min-w-0 flex-1 rounded-xl border border-gray-200 shadow-sm"
      styles={{ body: { padding: "18px 22px" } }}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4 xl:items-stretch xl:gap-0">
        <div className="flex min-w-0 items-center gap-4 xl:pr-2">
          <Avatar
            size={88}
            src={data.anhDaiDien}
            icon={<UserRound size={36} />}
            className="shrink-0 bg-cgv-green/15 text-cgv-green-dark"
          />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-base font-bold leading-tight text-cgv-green-dark">
              {data.hoVaTen}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
              <span>
                <span className="text-gray-500">MSSV:</span>{" "}
                <span className="font-semibold text-gray-800">{data.maSinhVien}</span>
              </span>
              <span className="hidden h-3 w-px bg-gray-200 sm:block" />
              <span>
                <span className="text-gray-500">Giới tính:</span>{" "}
                <span className="font-semibold text-gray-800">{data.gioiTinh}</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span>
                <span className="text-gray-500">Lớp:</span>{" "}
                <span className="font-semibold text-gray-800">{data.lop}</span>
              </span>
              <NhanTrangThai label={data.trangThai.label} />
            </div>
          </div>
        </div>

        <CotThongTin>
          <HangThongTin icon={<Calendar size={16} />} nhan="Ngày sinh" giaTri={data.ngaySinh} />
          <HangThongTin icon={<Mail size={16} />} nhan="Email" giaTri={data.email} />
          <HangThongTin icon={<Phone size={16} />} nhan="SĐT liên hệ" giaTri={data.sdt} />
        </CotThongTin>

        <CotThongTin>
          <HangThongTin
            icon={<GraduationCap size={16} />}
            nhan="Khóa học"
            giaTri={data.khoaHoc}
          />
          <HangThongTin icon={<BookOpen size={16} />} nhan="Khoa" giaTri={data.khoa} />
          <HangThongTin
            icon={<FileText size={16} />}
            nhan="Chương trình đào tạo"
            giaTri={data.chuongTrinhDaoTao}
          />
        </CotThongTin>

        <CotThongTin>
          <HangThongTin
            icon={<Calendar size={16} />}
            nhan="Ngày vào trường"
            giaTri={data.ngayVaoTruong}
          />
        </CotThongTin>
      </div>
    </Card>

    <Card
      className="w-full shrink-0 rounded-xl border border-gray-200 shadow-sm lg:w-[260px]"
      styles={{ body: { padding: 0 } }}
    >
      <div className="grid h-full grid-cols-2 divide-x divide-y divide-gray-100">
        <OThongKe
          tieuDe="CPA hiện tại"
          giaTri={data.gpaHienTai}
          phu="/ 4.00"
          mau="blue"
        />
        <OThongKe
          tieuDe="Tín chỉ tích lũy"
          giaTri={data.tinChiTichLuy}
          phu={`/ ${data.tinChiTong}`}
          mau="blue"
        />
        <OThongKe
          tieuDe="Điểm rèn luyện TB"
          giaTri={data.diemRenLuyenTb}
          phu="/ 100"
          mau="green"
        />
        <OThongKe tieuDe="Xếp loại học lực" giaTri={data.xepLoaiHocLuc} mau="green" />
      </div>
    </Card>
  </div>
)

export const layNhanTrangThaiSinhVien = (status: string) => {
  const meta = FIXED_CLASS_STUDENT_STATUS[status as keyof typeof FIXED_CLASS_STUDENT_STATUS]
  return meta ?? { label: status, color: "default" }
}

export default TheHeaderKetQuaHocTap
