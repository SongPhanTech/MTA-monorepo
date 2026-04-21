import DefaultLayout from "@layouts/default-layout"
import DefenseScheduleConfigurationPage from "../../cau-hinh-thoi-gian/DefenseScheduleConfiguration"

export default function CauHinhThoiGianBaoVe() {
  return <DefenseScheduleConfigurationPage isThesis={false} />
}
CauHinhThoiGianBaoVe.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
