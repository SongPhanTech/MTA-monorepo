import BangDanhSachSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-danh-sach-sinh-vien"
import BoLocSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-sinh-vien"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TabDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/tab-diem-ren-luyen"
import TabTongKet from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/tab-tong-ket"
import { hoSoSinhVienLopQuanLyPath } from "@constants/cong-giang-vien-path"
import { ROUTER_PATH } from "@workspace/router"
import { Tabs } from "antd"
import { useRouter } from "next/router"
import { useState } from "react"

interface TabDanhSachSinhVienProps {
  fixedClassId: string
  boLoc: Parameters<typeof BoLocSinhVien>[0]["boLoc"]
  capNhatBoLoc: Parameters<typeof BoLocSinhVien>[0]["onChange"]
  timKiem: () => void
  doiBoLocNgay: Parameters<typeof BoLocSinhVien>[0]["onDoiBoLocNgay"]
  danhSachSinhVien: Parameters<typeof BangDanhSachSinhVien>[0]["danhSach"]
  dangTaiSinhVien?: boolean
  trang: number
  soTrang: number
  tongSinhVien: number
  setTrang: (trang: number) => void
  setSoTrang: (soTrang: number) => void
  layNhanTrangThai: Parameters<typeof BangDanhSachSinhVien>[0]["layNhanTrangThai"]
  visible?: boolean
}

const TabDanhSachSinhVien = ({
  fixedClassId,
  boLoc,
  capNhatBoLoc,
  timKiem,
  doiBoLocNgay,
  danhSachSinhVien,
  dangTaiSinhVien,
  trang,
  soTrang,
  tongSinhVien,
  setTrang,
  setSoTrang,
  layNhanTrangThai,
  visible = true,
}: TabDanhSachSinhVienProps) => {
  const router = useRouter()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoLocSinhVien
        boLoc={boLoc}
        onChange={capNhatBoLoc}
        onDoiBoLocNgay={doiBoLocNgay}
        onTimKiem={timKiem}
      />
      <BangDanhSachSinhVien
        danhSach={danhSachSinhVien}
        loading={dangTaiSinhVien}
        trang={trang}
        soTrang={soTrang}
        visible={visible}
        layNhanTrangThai={layNhanTrangThai}
        onXemHoSo={(studentId) => router.push(hoSoSinhVienLopQuanLyPath(fixedClassId, studentId))}
        onXemKetQuaHocTap={(studentId) =>
          router.push(
            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
              "[id]",
              studentId
            )
          )
        }
      />
      <PhanTrangSinhVien
        trang={trang}
        soTrang={soTrang}
        tongSo={tongSinhVien}
        onDoiTrang={setTrang}
        onDoiSoTrang={setSoTrang}
      />
    </div>
  )
}

interface TabNoiDungLopQuanLyProps {
  fixedClassId: string
  coQuyenXem: boolean
  tabProps: Omit<TabDanhSachSinhVienProps, "fixedClassId">
}

const TAB_CLASS =
  "flex h-full min-h-0 flex-col overflow-hidden [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:shrink-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-content-holder]:flex [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:flex-col [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-content]:min-h-0 [&_.ant-tabs-tabpane]:h-full [&_.ant-tabs-tabpane-active]:!flex [&_.ant-tabs-tabpane-active]:!min-h-0 [&_.ant-tabs-tabpane-active]:!flex-1 [&_.ant-tabs-tabpane-active]:!flex-col [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-cgv-green-dark [&_.ant-tabs-tab-btn]:font-medium [&_.ant-tabs-ink-bar]:!bg-cgv-green-dark"

const TabNoiDungLopQuanLy = ({ fixedClassId, coQuyenXem, tabProps }: TabNoiDungLopQuanLyProps) => {
  const [tabActive, setTabActive] = useState("danh-sach-sinh-vien")

  return (
    <Tabs
      className={TAB_CLASS}
      activeKey={tabActive}
      onChange={setTabActive}
      items={[
        {
          key: "danh-sach-sinh-vien",
          label: "Danh sách sinh viên",
          children: (
            <TabDanhSachSinhVien
              fixedClassId={fixedClassId}
              visible={tabActive === "danh-sach-sinh-vien"}
              {...tabProps}
            />
          ),
        },
        {
          key: "diem-ren-luyen",
          label: "Điểm rèn luyện",
          children: (
            <TabDiemRenLuyen
              fixedClassId={fixedClassId}
              enabled={coQuyenXem && tabActive === "diem-ren-luyen"}
            />
          ),
        },
        {
          key: "tong-ket",
          label: "Tổng kết",
          children: (
            <TabTongKet
              fixedClassId={fixedClassId}
              enabled={coQuyenXem && tabActive === "tong-ket"}
            />
          ),
        },
      ]}
    />
  )
}

export default TabNoiDungLopQuanLy
