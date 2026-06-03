import { type MenuItem, ROUTER_PATH } from "@workspace/router"
import { CalendarDays, GraduationCap, House, Users } from "lucide-react"

const P = ROUTER_PATH.QL_DAO_TAO

// Trang chủ của Cổng Giảng viên (route /giang-vien). Sau khi chạy `pnpm generate:router`
// có thể thay bằng ROUTER_PATH.QL_DAO_TAO.GIANG_VIEN
export const GIANG_VIEN_HOME = "/giang-vien"

// Menu cố định cho Cổng Giảng viên, trỏ tới các trang đã tồn tại trong ql-dao-tao
export const GIANG_VIEN_MENU: MenuItem[] = [
  {
    id: "gv-trang-chu",
    label: "Trang chủ",
    icon: House,
    path: GIANG_VIEN_HOME,
  },
  {
    id: "gv-lich-giang-day",
    label: "Lịch giảng dạy",
    icon: CalendarDays,
    path: P.LICH_TUAN_THANG,
  },
  {
    id: "gv-quan-ly-lop",
    label: "Quản lý lớp quản lý",
    icon: Users,
    children: [
      {
        id: "gv-ho-so-sv",
        label: "Hồ sơ sinh viên / học viên",
        path: P.QUAN_LY_HO_SO_QL_SINH_VIEN,
      },
      {
        id: "gv-ren-luyen-ky",
        label: "Điểm rèn luyện học kỳ",
        path: P.QUAN_LY_DIEM_QL_REN_LUYEN,
      },
      {
        id: "gv-ren-luyen-nam",
        label: "Điểm rèn luyện năm học",
        path: P.QUAN_LY_DIEM_QL_REN_LUYEN_THEO_NAM,
      },
      {
        id: "gv-tong-ket-ky",
        label: "Tổng kết học kỳ",
        path: P.QUAN_LY_DIEM_TONG_KET_KY_HOC,
      },
      {
        id: "gv-tong-ket-nam",
        label: "Tổng kết năm học",
        path: P.QUAN_LY_DIEM_TONG_KET_NAM_HOC,
      },
    ],
  },
  {
    id: "gv-giang-day",
    label: "Giảng dạy",
    icon: GraduationCap,
    children: [
      {
        id: "gv-diem-danh",
        label: "Điểm danh",
        path: P.QUAN_LY_DIEM_DIEM_DANH,
      },
      {
        id: "gv-nhap-diem-qt",
        label: "Nhập điểm quá trình",
        path: P.QUAN_LY_DIEM_QL_DIEM_CC_TX,
      },
      {
        id: "gv-nhap-diem-thi",
        label: "Nhập điểm thi",
        path: P.QUAN_LY_DIEM_QL_DIEM_THI,
      },
    ],
  },
]
