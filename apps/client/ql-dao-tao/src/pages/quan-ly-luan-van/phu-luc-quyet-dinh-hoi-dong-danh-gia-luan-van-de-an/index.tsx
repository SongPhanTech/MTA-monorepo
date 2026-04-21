import DefaultLayout from "@layouts/default-layout"
import QuanLyLuanVan from "@components/pages/quan-ly-luan-van"
import { exportPhuLucQdhdd } from "@/utils/thesis-excel"

function PhuLucQuyetDinhHoiDongDanhGiaLuanVanDeAnPage() {
  return (
    <QuanLyLuanVan
      exportExcel={exportPhuLucQdhdd}
      showPhuLucTemplateColumns
      exportButtonLabel="Xuất phụ lục"
      addNewButtonLabel="Thêm phụ lục"
      putEditVariant="quyetDinh"
      templateColumnKeys={["dotXet", "soQd", "ngayQd", "tenChuTich", "tenThuKy"]}
      templateColumnAccess={{
        toChucChuTich: false,
        toChucPb1: false,
        toChucPb2: false,
        toChucThuKy: false,
        toChucUyVien: false,
        dotXet: false,
        sttChuyenNganh: false,
      }}
    />
  )
}

PhuLucQuyetDinhHoiDongDanhGiaLuanVanDeAnPage.getLayout = function getLayout(
  page: React.ReactElement
) {
  return <DefaultLayout>{page}</DefaultLayout>
}

export default PhuLucQuyetDinhHoiDongDanhGiaLuanVanDeAnPage
