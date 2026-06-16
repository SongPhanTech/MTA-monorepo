import {
  CONG_GIANG_VIEN_LICH_CUA_TOI_PATH,
  CONG_GIANG_VIEN_THONG_BAO_PATH,
} from "@constants/cong-giang-vien-path"
import { ROUTER_PATH } from "@workspace/router"
import {
  Bell,
  BinocularsIcon,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  House,
  User,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type CongGiangVienMenuItem = {
  id: string
  label: string
  icon?: LucideIcon
  path?: string
  badge?: number
  children?: CongGiangVienMenuItem[]
}

export const CONG_GIANG_VIEN_MENU: CongGiangVienMenuItem[] = [
  {
    id: "gv-trang-chu",
    label: "Trang chủ",
    icon: House,
    path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN,
  },
  {
    id: "gv-lich-cua-toi",
    label: "Lịch của tôi",
    icon: CalendarDays,
    path: CONG_GIANG_VIEN_LICH_CUA_TOI_PATH,
  },
  {
    id: "gv-lop-quan-ly",
    label: "Lớp quản lý",
    icon: Users,
    path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_QUAN_LY,
  },
  {
    id: "gv-lop-giang-day",
    label: "Lớp giảng dạy",
    icon: GraduationCap,
    children: [
      {
        id: "gv-ds-lop-giang-day",
        label: "Danh sách lớp",
        path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY,
      },
      {
        id: "gv-tai-giang-day",
        label: "Tải giảng dạy",
        path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_GIANG_DAY_TAI_GIANG_VIEN,
      },
    ],
  },
  {
    id: "gv-lop-tro-giang",
    label: "Lớp trợ giảng",
    icon: Briefcase,
    path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_TRO_GIANG,
  },
  {
    id: "gv-khao-sat",
    label: "Khảo sát",
    icon: ClipboardCheck,
    path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_KHAO_SAT,
  },
  {
    id: "gv-nghien-cuu",
    label: "Nghiên cứu khoa học",
    icon: BinocularsIcon,
    path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_NGHIEN_CUU,
  },
  {
    id: "gv-thong-bao",
    label: "Thông báo",
    icon: Bell,
    path: CONG_GIANG_VIEN_THONG_BAO_PATH,
  },
  {
    id: "ho-so-ca-nhan",
    label: "Hồ sơ cá nhân",
    icon: User,
    children: [
      {
        id: "thong-tin-ca-nhan",
        label: "Thông tin cá nhân",
        path: ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_HO_SO_CA_NHAN_THONG_TIN_CA_NHAN,
      },
    ],
  },
]
