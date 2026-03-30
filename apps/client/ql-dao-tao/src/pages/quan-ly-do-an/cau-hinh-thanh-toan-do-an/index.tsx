import DefaultLayout from "@layouts/default-layout"
import PaymentConfigurationPage from "../../cau-hinh-thanh-toan/PaymentConfiguration"

export default function CauHinhThanhToanDoAn() {
  return <PaymentConfigurationPage isThesis={false} />
}
CauHinhThanhToanDoAn.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
