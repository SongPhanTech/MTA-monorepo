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
    children: [
      {
        id: "gv-lop-quan-ly-ren-luyen",
        label: "Rèn luyện",
        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_REN_LUYEN,
      },
    ],
  },
  {
    id: "gv-lop-giang-day",
    label: "Lớp giảng dạy",
    icon: GraduationCap,
    children: [
      {
        id: "gv-ds-lop-giang-day",
        label: "Danh sách lớp giảng dạy",
        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DS_LOP_MON_HOC,
      },
      {
        id: "gv-tai-giang-day",
        label: "Tải giảng dạy",
        path: ROUTER_PATH.QL_DAO_TAO.LICH_KIEM_TRA_GIANG_DAY,
      },
    ],
  },
  {
    id: "gv-lop-tro-giang",
    label: "Lớp trợ giảng",
    icon: Briefcase,
    path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DS_LOP_MON_HOC,
  },
  {
    id: "gv-khao-sat",
    label: "Khảo sát",
    icon: ClipboardCheck,
    path: ROUTER_PATH.QL_DAO_TAO.KHAO_SAT,
  },
  {
    id: "gv-nghien-cuu",
    label: "Nghiên cứu",
    icon: BinocularsIcon,
    path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_CHUYEN_DE_NGHIEN_CUU,
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
        path: ROUTER_PATH.QL_DAO_TAO.HO_SO_CA_NHAN_THONG_TIN_CA_NHAN,
      },
    ],
  },
]
