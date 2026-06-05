import { type MenuItem, ROUTER_PATH } from "@workspace/router"
import { CalendarDays, ChartLine, GraduationCap, House, Users } from "lucide-react"

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
    id: "gv-khao-sat",
    label: "Khảo sát",
    icon: ChartLine,
    path: P.KHAO_SAT,
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
