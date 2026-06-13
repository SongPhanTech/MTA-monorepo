import BangDanhSachSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-danh-sach-sinh-vien"
import BoLocSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-sinh-vien"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TinhNangPhatTrien from "@components/cong-giang-vien/tinh-nang-phat-trien"
import { ROUTER_PATH } from "@workspace/router"
import { Tabs } from "antd"
import { useRouter } from "next/router"
import { useDisclosure } from "react-hook-disclosure-modal"

interface TabDanhSachSinhVienProps {
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
}

const TabDanhSachSinhVien = ({
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
}: TabDanhSachSinhVienProps) => {
  const router = useRouter()
  const { onOpen: moHoSoSinhVien } = useDisclosure<string>({ tag: "ModalChiTietSinhVien" })

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
        layNhanTrangThai={layNhanTrangThai}
        onXemHoSo={moHoSoSinhVien}
        onXemKetQuaHocTap={(studentId) =>
          router.push(
            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace("[id]", studentId)
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
  tabProps: TabDanhSachSinhVienProps
}

const TabNoiDungLopQuanLy = ({ tabProps }: TabNoiDungLopQuanLyProps) => {
  return (
    <Tabs
      className="flex h-full min-h-0 flex-col [&_.ant-tabs-content]:min-h-0 [&_.ant-tabs-content]:flex-1 [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-cgv-green-dark [&_.ant-tabs-tab-btn]:font-medium [&_.ant-tabs-ink-bar]:!bg-cgv-green-dark"
      defaultActiveKey="danh-sach-sinh-vien"
      items={[
        {
          key: "danh-sach-sinh-vien",
          label: "Danh sách sinh viên",
          children: <TabDanhSachSinhVien {...tabProps} />,
        },
        {
          key: "diem-ren-luyen",
          label: "Điểm rèn luyện",
          children: (
            <div className="flex h-full min-h-[280px] items-center justify-center p-6">
              <TinhNangPhatTrien />
            </div>
          ),
        },
        {
          key: "tong-ket",
          label: "Tổng kết",
          children: (
            <div className="flex h-full min-h-[280px] items-center justify-center p-6">
              <TinhNangPhatTrien />
            </div>
          ),
        },
      ]}
    />
  )
}

export default TabNoiDungLopQuanLy
