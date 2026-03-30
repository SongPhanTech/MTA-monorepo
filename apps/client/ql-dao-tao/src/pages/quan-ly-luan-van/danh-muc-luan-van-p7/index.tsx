import DefaultLayout from "@layouts/default-layout"
import DanhMucLuanVan, { type DanhMucLuanVanProps } from "../dm-luan-van"

export default function PostgraduateProjectP7() {
  const data: DanhMucLuanVanProps = {
    isManage: true,
    role: "P7",
  }
  return <DanhMucLuanVan {...data} />
}
PostgraduateProjectP7.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
