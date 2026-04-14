import {
  BookOutlined,
  FileOutlined,
  MessageOutlined,
  PieChartOutlined,
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon"
import {
  AwardIcon,
  BarChart3,
  BinocularsIcon,
  BookOpenCheck,
  BookUser,
  CalendarRange,
  ClipboardCheck,
  FileCheck2,
  FolderOpen,
  GraduationCap,
  House,
  Landmark,
  Library,
  ListTree,
  type LucideProps,
  ScrollText,
  Settings,
  User2Icon,
} from "lucide-react"
import { DANG_KY_HOC_PERMISSION } from "../generated/dang-ky-hoc"
import { KHAO_THI_PERMISSION } from "../generated/khao-thi"
import { QL_DAO_TAO_PERMISSION } from "../generated/ql-dao-tao"
import { QL_HO_SO_PERMISSION } from "../generated/ql-ho-so"
import ROUTER_PATH from "../generated/router"
import { TRO_LY_AO_PERMISSION } from "../generated/tro-ly-ao"
import "./index.css"

interface MenuItem {
  id: string
  label: React.ReactNode
  icon?:
    | React.ForwardRefExoticComponent<
        Omit<AntdIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>
      >
    | React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
  path?: string
  children?: MenuItem[]
  description?: string
  type?: string
}

type NavigationType = Record<
  keyof typeof ROUTER_PATH,
  {
    menus: MenuItem[]
    label: string
  }
>

const NAVIGATION: NavigationType = {
  DANG_KY_HOC: {
    label: "Cổng thông tin sinh viên",
    menus: [
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_HOME,
        label: "Trang chủ",
        icon: House,
        path: ROUTER_PATH.DANG_KY_HOC.HOME,
        description: "Thông tin thời khoá biểu, lịch thi, thông báo...",
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_HO_SO_CA_NHAN,
        label: "Hồ sơ cá nhân",
        icon: User2Icon,
        path: ROUTER_PATH.DANG_KY_HOC.HO_SO_CA_NHAN,
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_THOI_KHOA_BIEU,
        label: "Lịch thi",
        icon: CalendarRange,
        path: ROUTER_PATH.DANG_KY_HOC.THOI_KHOA_BIEU,
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_CHUONG_TRINH_DAO_TAO,
        label: "Chương trình đào tạo",
        icon: Library,
        path: ROUTER_PATH.DANG_KY_HOC.CHUONG_TRINH_DAO_TAO,
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_KET_QUA_HOC_TAP,
        label: "Kết quả học tập",
        icon: AwardIcon,
        path: ROUTER_PATH.DANG_KY_HOC.KET_QUA_HOC_TAP,
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_DANG_KY_HOC,
        label: "Đăng ký học",
        icon: CalendarRange,
        path: ROUTER_PATH.DANG_KY_HOC.DANG_KY_HOC,
      },
      {
        id: DANG_KY_HOC_PERMISSION.DANG_KY_HOC_KHAO_SAT,
        label: "Khảo sát",
        icon: BinocularsIcon,
        path: ROUTER_PATH.DANG_KY_HOC.KHAO_SAT,
      },
    ],
  },
  QL_DAO_TAO: {
    menus: [
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_HOME,
        label: "Trang chủ",
        icon: House,
        path: ROUTER_PATH.QL_DAO_TAO.HOME,
        description: "Thông tin trang chủ",
      },
      {
        id: "chuong-trinh-dao-tao",
        label: "Chương trình đào tạo",
        icon: Library,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
            label: "Quản lý CTĐT",
            path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
            description: "Quản lý CTĐT",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
            label: "Khối kiến thức CTĐT",
            path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
            description: "Khối kiến thức CTĐT",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
            label: "Danh sách môn học",
            path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
            description: "Danh sách môn học",
          },
        
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
            label: "QL ràng buộc môn học",
            path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
            description: "QL ràng buộc môn học",
          },
        ],
      },
      {
        id: "ke-hoach-giang-day",
        label: "Kế hoạch",
        icon: CalendarRange,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
            label: "Kế hoạch giảng dạy dự kiến",
            path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HOC_LAI,
            label: "Kế hoạch học lại",
            path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_HOC_LAI,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_THI_LAI,
            label: "Kế hoạch thi lại",
            path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_THI_LAI,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN,
            label: "Kế hoạch huấn luyện",
            path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_HUAN_LUYEN,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_KE_HOC_LAI,
            label: "Thống kê học lại",
            path: ROUTER_PATH.QL_DAO_TAO.THONG_KE_HOC_LAI,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_KE_THI_LAI,
            label: "Thống kê thi lại",
            path: ROUTER_PATH.QL_DAO_TAO.THONG_KE_THI_LAI,
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DS_LOP_MON_HOC,
            label: "Danh sách lớp môn học",
            path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DS_LOP_MON_HOC,
            description: "Danh sách lớp môn học",
          },
        ],
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
        label: "Phân công giảng dạy",
        icon: BookUser,
        path: ROUTER_PATH.QL_DAO_TAO.KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_CHUYEN_DE_NGHIEN_CU,
        label: "Phân công CĐNC",
        icon: ClipboardCheck,
        path: ROUTER_PATH.QL_DAO_TAO.KHOA_BO_MON_PHAN_CONG_CHUYEN_DE_NGHIEN_CU,
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_THUC_TAP,
        label: "Phân công Thực tập",
        icon: ClipboardCheck,
        path: ROUTER_PATH.QL_DAO_TAO.KHOA_BO_MON_PHAN_CONG_THUC_TAP,
      },
      {
        id: "dang-ky-hoc",
        label: "Đăng ký học",
        icon: CalendarRange,
        description: "Đăng ký học",
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DANG_KY_HOC_OFFLINE,
            label: "Đăng ký học offline",
            path: ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DANG_KY_HOC_OFFLINE,
            description: "Đăng ký học offline",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
            label: "Đợt đăng ký học online",
            path: ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
            description: "Đợt đăng ký học online",
          },
        ],
      },
      {
        id: "lop-mon-hoc",
        label: "Quản lý điểm",
        icon: BarChart3,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
            label: "Hạn nhập điểm",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DS_LOP_MON_HOC,
            description: "Hạn nhập điểm",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
            label: "Điểm lớp môn học",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
            description: "Điểm lớp môn học",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
            label: "Điểm lớp môn học (P13)",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
            description: "Điểm lớp môn học (P13)",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_DANH,
            label: "Điểm danh",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_DANH,
            description: "Điểm danh",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_LIEN_KET,
            label: "Điểm liên kết",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_LIEN_KET,
            description: "Điểm liên kết",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DANH_PHACH,
            label: "Đánh phách",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DANH_PHACH,
            description: "Đánh phách",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_NHAP_DIEM_THEO_PHACH,
            label: "Nhập điểm theo phách",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_NHAP_DIEM_THEO_PHACH,
            description: "Nhập điểm theo phách",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX,
            label: "Nhập điểm quá trình",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CC_TX,
            description: "Nhập điểm quá trình",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI,
            label: "Nhập điểm thi",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_THI,
            description: "Nhập điểm thi",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_TONG_KET_KY_HOC,
            label: "Tổng kết học kỳ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_TONG_KET_KY_HOC,
            description: "Tổng kết học kỳ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_TONG_KET_NAM_HOC,
            label: "Tổng kết năm học",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_TONG_KET_NAM_HOC,
            description: "Tổng kết năm học",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC,
            label: "Điểm giải thưởng",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_OLYMPIC,
            description: "Điểm giải thưởng",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_CHUNG_CHI,
            label: "Điểm chứng chỉ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DIEM_CHUNG_CHI,
            description: "Điểm chứng chỉ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_SUA_DIEM,
            label: "Sửa điểm",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_SUA_DIEM,
            description: "Sửa điểm",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
            label: "SV/HV chuyển trường",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
            description: "SV/HV chuyển trường",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_CHUYEN_DE_NGHIEN_CUU,
            label: "Chuyên đề nghiên cứu",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_CHUYEN_DE_NGHIEN_CUU,
            description: "Chuyên đề nghiên cứu",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_THUC_TAP,
            label: "Thực tập",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_THUC_TAP,
            description: "Thực tập",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN,
            label: "QL điểm rèn luyện học kỳ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_REN_LUYEN,
            description: "QL điểm rèn luyện theo học kỳ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM,
            label: "QL điểm rèn luyện năm học",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM,
            description: "QL điểm rèn luyện theo năm",
          },
        ],
      },
      {
        id: "to-chuc-thi",
        label: "Tổ chức thi",
        icon: FileOutlined,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_TO_CHUC_THI_LAP_DANH_SANH_THI,
            label: "Lập danh sách thi",
            path: ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_LAP_DANH_SANH_THI,
            description: "Lập danh sách thi",
          },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_TO_CHUC_THI_KY_THI,
          //     label: 'Kỳ thi',
          //     path: ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_KY_THI,
          //     description: 'Quản lý kỳ thi',
          // },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_TO_CHUC_THI_DANH_SACH_THI,
          //     label: 'Danh sách thi',
          //     path: ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_DANH_SACH_THI,
          //     description: 'Danh sách thi',
          // },
        ],
      },

      {
        id: "category",
        label: "Danh mục",
        icon: ListTree,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
            label: "Lớp quản lý",
            icon: TeamOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
            description: "Lớp quản lý",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC,
            label: "Năm học kỳ học",
            icon: BookOpenCheck,
            path: ROUTER_PATH.QL_DAO_TAO.NAM_HOC_KY_HOC,
            description: "Thông tin năm học, kỳ học",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH,
            label: "Ngành",
            icon: PieChartOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_NGANH,
            description: "Danh mục ngành",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_NGANH,
            label: "Chuyên ngành",
            icon: PieChartOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUYEN_NGANH,
            description: "Chuyên ngành",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
            label: "Khoá đào tạo",
            icon: BookOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_KHOA_HUAN_LUYEN,
            description: "Danh mục khoá đào tạo",
          },
          {
            label: "Đào tạo",
            id: "danh-muc-dao-tao",
            children: [
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_PHONG_HOC,
                label: "Khu vực đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC,
                description: "Danh mục khu vực đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_THOI_GIAN_DAO_TAO,
                label: "Thời gian đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_THOI_GIAN_DAO_TAO,
                description: "Danh mục thời gian đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                label: "Quỹ thời gian đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                description: "Quỹ thời gian đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_HINH_THUC_HUAN_LUYEN,
                label: "Hình thức huấn luyện",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_HINH_THUC_HUAN_LUYEN,
                description: "Danh mục hình thức huấn luyện",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_MOC_HUAN_LUYEN,
                label: "Mốc huấn luyện",
                path: ROUTER_PATH.QL_DAO_TAO.MOC_HUAN_LUYEN,
                description: "Thông tin năm học, kỳ học",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DOI_TUONG_DAO_TAO,
                label: "Đối tượng đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DOI_TUONG_DAO_TAO,
                description: "Đối tượng đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOAI_HINH_DAO_TAO,
                label: "Loại hình đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOAI_HINH_DAO_TAO,
                description: "Loại hình đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_TRINH_DO_DAO_TAO,
                label: "Bậc đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_TRINH_DO_DAO_TAO,
                description: "Bậc đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_NGON_NGU_DAO_TAO,
                label: "Ngôn ngữ đào tạo",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_NGON_NGU_DAO_TAO,
                description: "Ngôn ngữ đào tạo",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_NOI_DUNG_TINH_TAI,
                label: "Nội dung tính tải",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_NOI_DUNG_TINH_TAI,
                description: "Nội dung tính tải",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUA_TRINH_REN_LUYEN,
                label: "Quá trình rèn luyện",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_QUA_TRINH_REN_LUYEN,
                description: "Danh mục quá trình rèn luyện",
              },
            ],
          },
          {
            label: "Điểm và Xếp loại",
            id: "danh-muc-diem",
            children: [
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                label: "Quản lý điểm cộng",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_QL_DIEM_CONG,
                description: "Quản lý điểm cộng",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                label: "Bảng chuyển đổi điểm",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                description: "Bảng chuyển đổi điểm",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_HOC_LUC,
                label: "Xếp loại học lực",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_XEP_LOAI_HOC_LUC,
                description: "Xếp loại học lực",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_XEP_LOAI_TOT_NGHIEP,
                label: "Xếp loại tốt nghiệp",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_XEP_LOAI_TOT_NGHIEP,
                description: "Xếp loại tốt nghiệp",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                label: "Học bổng",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_HOC_BONG,
                description: "Học bổng",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_TAP,
                label: "Cảnh cáo học tập",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CANH_CAO_HOC_TAP,
                description: "Danh mục cảnh cáo học tập",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                label: "Cảnh cáo học đường",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                description: "Danh mục cảnh cáo học đường",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_XU_LY_HOC_TAP,
                label: "Xử lý học tập",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_XU_LY_HOC_TAP,
                description: "Danh mục xử lý học tập",
              },
              {
                id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_CHUAN_DAU_RA,
                label: "Chuẩn đầu ra",
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUAN_DAU_RA,
                description: "Danh mục chuẩn đầu ra",
              },
            ],
          },
        ],
      },
      {
        id: "ql-do-an",
        label: "Quản lý đồ án",
        icon: FileCheck2,
        children: [
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
          //     label: 'Đợt xét đồ án',
          //     path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN,
          //     description: 'Đợt xét đồ án',
          // },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DM_DO_AN,
            label: "Quản lý đồ án",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DM_DO_AN,
            description: "Quản lý đồ án",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
            label: "Danh sách chuyên gia",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
            description: "Danh sách chuyên gia",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_CAU_HINH_THOI_GIAN_BAO_VE,
            label: "Thời gian bảo vệ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_CAU_HINH_THOI_GIAN_BAO_VE,
            description: "Cấu hình thời gian bảo vệ",
          },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
          //     label: 'Danh sách thanh toán',
          //     path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN,
          //     description: 'Danh sách thanh toán',
          // },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
          //     label: 'Danh sách thanh toán GVHD',
          //     path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_SACH_THANH_TOAN_GVHD,
          //     description: 'Danh sách thanh toán GVHD',
          // },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_THONG_KE,
          //     label: 'Thống kê kết quả bảo vệ',
          //     path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_THONG_KE,
          //     description: 'Thống kê kết quả bảo vệ',
          // },
          // {
          //     id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_CAU_HINH_THANH_TOAN_DO_AN,
          //     label: 'Cấu hình thanh toán',
          //     path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_CAU_HINH_THANH_TOAN_DO_AN,
          //     description: 'Cấu hình thanh toán',
          // },
        ],
      },
      {
        id: "ql-luan-van-de-an",
        label: "Luận văn/đề án",
        icon: FileCheck2,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
            label: "Đợt xét luận văn/đề án",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
            description: "Đợt xét luận văn",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN_KHOA,
            label: "Quản lý luận văn/đề án",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN_KHOA,
            description: "Quản lý luận văn/đề án",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN_P7,
            label: "Quản lý luận văn/đề án",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN_P7,
            description: "Quản lý luận văn/đề án",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_CHUYEN_GIA,
            label: "Danh sách chuyên gia",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_SACH_CHUYEN_GIA,
            description: "Danh sách chuyên gia",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_LUAN_VAN_THU_VIEN,
            label: "Danh sách luận văn thư viện",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_SACH_LUAN_VAN_THU_VIEN,
            description: "Danh sách luận văn thư viện",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN,
            label: "Thanh toán hội đồng bảo vệ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN,
            description: "Thanh toán hội đồng bảo vệ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN_GVHD,
            label: "Danh sách thanh toán GVHD",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_SACH_THANH_TOAN_GVHD,
            description: "Danh sách thanh toán GVHD",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_THONG_KE,
            label: "Thống kê kết quả bảo vệ",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_THONG_KE,
            description: "Thống kê kết quả bảo vệ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_CAU_HINH_THANH_TOAN_DO_AN,
            label: "Cấu hình thanh toán",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_CAU_HINH_THANH_TOAN_DO_AN,
            description: "Cấu hình thanh toán",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_GIAY_MOI_HUONG_DAN_LUAN_VAN_DO_AN,
            label: "Giấy mời hướng dẫn luận văn/đồ án",
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_GIAY_MOI_HUONG_DAN_LUAN_VAN_DO_AN,
            description: "Giấy mời hướng dẫn luận văn/đồ án",
          },
        ],
      },
      {
        id: "ql-xet-tot-nghiep",
        label: "Xét tốt nghiệp",
        icon: GraduationCap,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
            label: "Đợt xét tốt nghiệp",
            path: ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
            description: "Đợt xét tốt nghiệp",
          },

          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_XET_TOT_NGHIEP_PHU_LUC_VAN_BANG,
            label: "In phụ lục văn bằng, phôi bằng tốt nghiệp",
            path: ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_PHU_LUC_VAN_BANG,
            description: "In phụ lục văn bằng, phôi bằng tốt nghiệp",
          },
        ],
      },

      {
        id: "quan-ly-van-bang",
        label: "Quản lý văn bằng",
        icon: ScrollText,
        description: "Quản lý văn bằng",
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DANH_MUC_VAN_BANG,
            label: "Danh mục văn bằng",
            path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DANH_MUC_VAN_BANG,
            description: "Danh mục văn bằng",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_TRA_CUU_VAN_BANG,
            label: "Tra cứu văn bằng chứng chỉ",
            path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_TRA_CUU_VAN_BANG,
            description: "Tra cứu văn bằng chứng chỉ",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DON_DANG_KY_XAC_MINH,
            label: "Đơn đăng ký xác minh",
            path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DON_DANG_KY_XAC_MINH,
            description: "Đơn đăng ký xác minh",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_QL_DON_DANG_KY_XAC_MINH,
            label: "Quản lý đơn đăng ký xác minh",
            path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_QL_DON_DANG_KY_XAC_MINH,
            description: "Quản lý đơn đăng ký xác minh",
          },
        ],
      },
      {
        id: "ql-ho-so",
        label: "Quản lý hồ sơ",
        icon: FolderOpen,
        children: [
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
            label: "QL sinh viên, học viên",
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN,
            description: "QL sinh viên, học viên",
          },
          {
            id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
            label: "QL giảng viên",
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
            description: "QL giảng viên",
          },
        ],
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_THONG_BAO,
        label: "Thông báo",
        icon: MessageOutlined,
        path: ROUTER_PATH.QL_DAO_TAO.THONG_BAO,
        description: "Quản lý thông báo đào tạo",
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_TUAN_THANG,
        label: "Lịch tuần tháng",
        icon: CalendarRange,
        path: ROUTER_PATH.QL_DAO_TAO.LICH_TUAN_THANG,
        description: "Quản lý lịch tuần tháng",
      },
      {
        id: QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY,
        label: "Lịch kiểm tra giảng dạy",
        icon: CalendarRange,
        path: ROUTER_PATH.QL_DAO_TAO.LICH_KIEM_TRA_GIANG_DAY,
        description: "Quản lý lịch kiểm tra giảng dạy",
      },
    ],
    label: "Quản lý đào tạo",
  },
  TRO_LY_AO: {
    label: "Trợ lý ảo",
    menus: [
      {
        id: "danh-muc",
        label: "Danh mục",
        icon: ListTree,
        children: [
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_CHU_DE,
            label: "Chủ đề",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DANH_MUC_CHU_DE,
          },
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DANH_MUC_LOAI_TAI_LIEU,
            label: "Loại tài liệu",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DANH_MUC_LOAI_TAI_LIEU,
          },
        ],
      },
      {
        id: "cau-hinh",
        label: "Cấu hình",
        icon: SettingOutlined,
        children: [
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_THAM_SO,
            label: "Tham số",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_THAM_SO,
          },
          // {
          //     id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMT,
          //     label: 'Prompt',
          //     path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_PROMT,
          // },
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMPT_HOI_DAP,
            label: "Prompt Hỏi đáp",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_PROMPT_HOI_DAP,
          },
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMPT_CHUC_NANG,
            label: "Prompt Chức năng",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_PROMPT_CHUC_NANG,
          },
        ],
      },
      {
        id: "du-lieu",
        label: "Dữ liệu",
        icon: BookOutlined,
        children: [
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU,
            label: "Tài liệu",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_TAI_LIEU,
          },
          {
            id: TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_FAQ,
            label: "Câu hỏi thường gặp",
            path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU_FAQ,
          },
        ],
      },
      {
        id: "tro-ly-ao",
        label: "Trợ lý ảo",
        icon: MessageOutlined,
        path: ROUTER_PATH.TRO_LY_AO.TRO_LY_AO,
      },
    ],
  },
  KHAO_THI: {
    label: "Khảo thí",
    menus: [
      // {
      //     id: KHAO_THI_PERMISSION.KHAO_THI_HOME,
      //     label: 'Trang chủ',
      //     icon: House,
      //     path: ROUTER_PATH.KHAO_THI.HOME,
      //     description: 'Thông tin trang chủ',
      // },
      {
        id: "thiet-lap-de-thi",
        label: "Thiết lập đề thi",
        icon: Landmark,
        children: [
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
            label: "Ngân hàng câu hỏi",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
            label: "Khung đề",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_KHUNG_DE,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
            label: "Danh sách đề thi",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DANH_SACH_DE,
          },
        ],
      },
      // {
      //     id: 'category',
      //     label: 'Danh mục',
      //     icon: ListTree,
      //     children: [
      //         {
      //             id: KHAO_THI_PERMISSION.KHAO_THI_DANH_MUC_DANH_MUC_CHUONG_MUC,
      //             label: 'Chuẩn đầu ra',
      //             path: ROUTER_PATH.KHAO_THI.DANH_MUC_DANH_MUC_CHUONG_MUC,
      //         },
      //         {
      //             id: KHAO_THI_PERMISSION.KHAO_THI_DANH_MUC_MUC_DO_KHO,
      //             label: 'Mức độ khó',
      //             path: ROUTER_PATH.KHAO_THI.DANH_MUC_MUC_DO_KHO,
      //         },
      //     ],
      // },
      {
        id: "thiet-lap-khao-sat",
        label: "Thiết lập khảo sát",
        icon: Settings,
        children: [
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
            label: "Thiết lập chung",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
          },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
          //     label: 'Câu hỏi khảo sát',
          //     path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
          // },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
            label: "Khảo sát chung",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
            label: "Khảo sát giảng viên",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_KHAO_SAT_CUM,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_BAO_CAO_KHAO_SAT_GIANG_VIEN,
            label: "Báo cáo khảo sát giảng viên",
            path: ROUTER_PATH.KHAO_THI.BAO_CAO_KHAO_SAT_GIANG_VIEN,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DANH_SACH_KHAO_SAT,
            label: "Khảo sát của tôi",
            path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_DANH_SACH_KHAO_SAT,
          },
        ],
      },
      {
        id: "ql-danh-gia-ctdt",
        label: "QL tự đánh giá CTĐT",
        icon: ClipboardCheck,
        children: [
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
            label: "Tiêu chuẩn, tiêu chí",
            path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
          },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_THANG_DIEM,
          //     label: 'Danh mục thang điểm',
          //     path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_THANG_DIEM,
          // },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
            label: "Quản lý minh chứng",
            path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
          },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
          //     label: 'Hội đồng đánh giá',
          //     path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
          // },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
            label: "Quản lý đợt tự đánh giá",
            path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
          },
          {
            id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
            label: "Phiếu phân tích và đánh giá",
            icon: FolderOpen,
            path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_VA_DANH_GIA,
            description: "Phiếu phân tích và đánh giá",
          },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
          //     label: 'Phiếu phân tích tiêu chí',
          //     icon: FolderOpen,
          //     path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_PHAN_TICH_TIEU_CHI,
          //     description: 'Phiếu phân tích tiêu chí',
          // },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
          //     label: 'Phiếu đánh giá tiêu chí',
          //     icon: FolderOpen,
          //     path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI,
          //     description: 'Phiếu đánh giá tiêu chí',
          // },
          // {
          //     id: KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
          //     label: 'Hội đồng thư ký',
          //     path: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
          // },
        ],
      },
    ],
  },
  QL_HO_SO: {
    label: "Quản lý hồ sơ",
    menus: [
      {
        id: QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO_ME,
        label: "Hồ sơ của tôi",
        icon: House,
        path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO_ME,
        description: "Hồ sơ của tôi",
      },
      {
        id: QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO,
        label: "Quản lý hồ sơ",
        icon: BookUser,
        path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
        description: "Quản lý hồ sơ",
      },
      // {
      //     id: QL_HO_SO_PERMISSION.QL_HO_SO_QL_GIANG_VIEN,
      //     label: 'Quản lý giảng viên',
      //     icon: UserRoundPen,
      //     path: ROUTER_PATH.QL_HO_SO.QL_GIANG_VIEN,
      //     description: 'Quản lý giảng viên',
      // },
      // {
      //     id: QL_HO_SO_PERMISSION.QL_HO_SO_QL_CAN_BO,
      //     label: 'Quản lý cán bộ nhân viên',
      //     icon: UserCog,
      //     path: ROUTER_PATH.QL_HO_SO.QL_CAN_BO,
      //     description: 'Quản lý cán bộ nhân viên',
      // },
      {
        id: QL_HO_SO_PERMISSION.QL_HO_SO_DANH_MUC_HO_SO,
        label: "Danh mục hồ sơ",
        icon: ReadOutlined,
        path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO,
        description: "Danh mục hồ sơ",
      },
    ],
  },
}

const PUBLIC_ROUTER = [ROUTER_PATH.KHAO_THI.LAM_KHAO_SAT_ID.replace("[id]", "")]
export {
  DANG_KY_HOC_PERMISSION,
  KHAO_THI_PERMISSION,
  PUBLIC_ROUTER,
  QL_DAO_TAO_PERMISSION,
  QL_HO_SO_PERMISSION,
  ROUTER_PATH,
  TRO_LY_AO_PERMISSION,
}
export type { MenuItem, NavigationType }
export default NAVIGATION
