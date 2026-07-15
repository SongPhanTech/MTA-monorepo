import DefaultLayout from "@layouts/default-layout"
import dayjs from "dayjs"
import { useState } from "react"

dayjs.locale("vi")
export default function StudentScoreClassPage() {
  const [_filters, _setFilters] = useState({
    searchText: "",
  })
  return (
    <center>
      <b className="text-lg">{"Chưa có đợt khảo sát nào. Vui lòng quay lại sau!"}</b>
    </center>
  )
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Khảo sát" }]}>{page}</DefaultLayout>
}
