import DefaultLayout from "@layouts/default-layout"
import DanhMucLuanVan, { type DanhMucLuanVanProps } from "../dm-luan-van"

export default function PostgraduateProjectKhoa() {
  const data: DanhMucLuanVanProps = {
    role: "P7",
  }
  return <DanhMucLuanVan {...data} />
}
PostgraduateProjectKhoa.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
