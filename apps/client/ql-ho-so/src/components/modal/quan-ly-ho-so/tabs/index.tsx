import { Tabs, type TabsProps } from "antd"
import type { TabQuanLyHoSoProps } from "../type"
import KeKhaiTaiSanTab from "./ke-khai-tai-san"
import KhenThuongKyLuatTab from "./khen-thuong-ky-luat"
import ThanNhanTab from "./tab-danh-sach-than-nhan"
import DoiTuongChinhSachTab from "./tab-doi-tuong-chinh-sach"
import HocHamHocViTab from "./tab-hoc-ham-hoc-vi"
import QuaTrinhCongTacTab from "./tab-qua-trinh-cong-tac"
import QuaTrinhDaoTaoTab from "./tab-qua-trinh-dao-tao"
import ThongTinCaNhanTab from "./tab-thong-tin-ca-nhan"
import TrinhDoChungChiTab from "./tab-trinh-do-chung-chi"

export default function TabQuanLyHoSo({
  activeKey,
  setActiveKey,
  id,
  type,
  avatar,
  setAvatar,
}: TabQuanLyHoSoProps) {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Thông tin cá nhân",
      children: <ThongTinCaNhanTab id={id} type={type} />,
      forceRender: true,
    },
    {
      key: "2",
      label: "Học hàm, học vị",
      children: <HocHamHocViTab />,
      forceRender: true,
    },
    {
      key: "3",
      label: "Trình độ, chứng chỉ",
      children: <TrinhDoChungChiTab />,
      forceRender: true,
    },
    {
      key: "4",
      label: "Quá trình công tác",
      children: <QuaTrinhCongTacTab />,
      forceRender: true,
    },
    {
      key: "5",
      label: "Quá trình đào tạo",
      children: <QuaTrinhDaoTaoTab />,
      forceRender: true,
    },
    {
      key: "6",
      label: "Khen thưởng - kỷ luật",
      children: <KhenThuongKyLuatTab />,
      forceRender: true,
    },
    {
      key: "7",
      label: "Đối tượng chính sách",
      children: <DoiTuongChinhSachTab />,
      forceRender: true,
    },
    {
      key: "8",
      label: "Kê khai tài sản",
      children: <KeKhaiTaiSanTab />,
      forceRender: true,
    },
    {
      key: "9",
      label: "Thân nhân",
      children: <ThanNhanTab />,
      forceRender: true,
    },
  ]

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      items={items}
      tabBarStyle={{
        display: "none",
      }}
    />
  )
}
