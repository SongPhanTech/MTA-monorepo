import DefaultLayout from "@layouts/default-layout"
import PaymentConfigurationPage from "../../cau-hinh-thanh-toan/PaymentConfiguration"

export default function CauHinhThanhToanLuanVan() {
  return <PaymentConfigurationPage isThesis={true} />
}
CauHinhThanhToanLuanVan.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
