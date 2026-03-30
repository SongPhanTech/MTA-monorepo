import DefaultLayout from "@layouts/default-layout"
import ChuyenDeNghienCuu from "@pages/quan-ly-diem/chuyen-de-nghien-cuu"
import type React from "react"

export default function KhaoBoMonPhanCongChuyenDeNghienCuu() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <ChuyenDeNghienCuu role="KHOA_BO_MON" />
}

KhaoBoMonPhanCongChuyenDeNghienCuu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
