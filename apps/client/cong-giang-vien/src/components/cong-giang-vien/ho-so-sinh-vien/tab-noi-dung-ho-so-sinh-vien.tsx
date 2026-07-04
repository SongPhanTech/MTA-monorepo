import TabDieuKienTotNghiep from "@components/cong-giang-vien/ho-so-sinh-vien/tab-dieu-kien-tot-nghiep"
import TabGiaiThuong from "@components/cong-giang-vien/ho-so-sinh-vien/tab-giai-thuong"
import TabQuyetDinhTotNghiep from "@components/cong-giang-vien/ho-so-sinh-vien/tab-quyet-dinh-tot-nghiep"
import TabThongTinCoBan from "@components/cong-giang-vien/ho-so-sinh-vien/tab-thong-tin-co-ban"
import TabTinhTrangHocTap from "@components/cong-giang-vien/ho-so-sinh-vien/tab-tinh-trang-hoc-tap"
import type { HoSoSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Tabs } from "antd"
import { Award, BarChart3, FileText, GraduationCap, User } from "lucide-react"
import type { ReactNode } from "react"

interface TabNoiDungHoSoSinhVienProps {
  hoSo: HoSoSinhVien
}

const TAB_CLASS =
  "[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-cgv-green-dark [&_.ant-tabs-tab-btn]:font-medium [&_.ant-tabs-ink-bar]:!bg-cgv-green-dark"

const TabLabel = ({ so, icon, text }: { so: number; icon: ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-2">
    <span className="text-cgv-green-dark/70">{icon}</span>
    <span>
      {so}. {text}
    </span>
  </span>
)

const TabNoiDungHoSoSinhVien = ({ hoSo }: TabNoiDungHoSoSinhVienProps) => (
  <Tabs
    className={TAB_CLASS}
    defaultActiveKey="thong-tin-co-ban"
    items={[
      {
        key: "thong-tin-co-ban",
        label: <TabLabel so={1} icon={<User size={16} />} text="Thông tin cơ bản" />,
        children: <TabThongTinCoBan hoSo={hoSo} />,
      },
      {
        key: "dieu-kien-tot-nghiep",
        label: <TabLabel so={2} icon={<GraduationCap size={16} />} text="Điều kiện tốt nghiệp" />,
        children: <TabDieuKienTotNghiep data={hoSo.dieuKienTotNghiep} />,
      },
      {
        key: "tinh-trang-hoc-tap",
        label: <TabLabel so={3} icon={<BarChart3 size={16} />} text="Tình trạng học tập" />,
        children: <TabTinhTrangHocTap data={hoSo.tinhTrangHocTap} />,
      },
      {
        key: "giai-thuong",
        label: <TabLabel so={4} icon={<Award size={16} />} text="Giải thưởng" />,
        children: <TabGiaiThuong danhSach={hoSo.giaiThuong} />,
      },
      {
        key: "quyet-dinh-tot-nghiep",
        label: <TabLabel so={5} icon={<FileText size={16} />} text="Quyết định tốt nghiệp" />,
        children: <TabQuyetDinhTotNghiep danhSach={hoSo.quyetDinhTotNghiep} />,
      },
    ]}
  />
)

export default TabNoiDungHoSoSinhVien
