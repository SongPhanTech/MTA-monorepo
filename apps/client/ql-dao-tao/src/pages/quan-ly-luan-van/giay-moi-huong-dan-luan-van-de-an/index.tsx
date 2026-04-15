import DefaultLayout from "@layouts/default-layout"
import QuanLyLuanVan from "@components/pages/quan-ly-luan-van"
import { exportGiayMoiHdlv } from "@/utils/thesis-excel"

function GiayMoiHuongDanLuanVanDeAnPage() {
  return <QuanLyLuanVan exportExcel={exportGiayMoiHdlv} />
}

GiayMoiHuongDanLuanVanDeAnPage.getLayout = function getLayout(
  page: React.ReactElement
) {
  return <DefaultLayout>{page}</DefaultLayout>
}

export default GiayMoiHuongDanLuanVanDeAnPage
