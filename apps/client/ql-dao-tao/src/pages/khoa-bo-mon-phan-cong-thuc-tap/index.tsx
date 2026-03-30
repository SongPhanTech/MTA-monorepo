import DefaultLayout from "@layouts/default-layout"
import ThucTap from "@pages/quan-ly-diem/thuc-tap"
import type React from "react"

export default function KhoaBoMonPhanCongThucTap() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <ThucTap role="KHOA_BO_MON" />
}

KhoaBoMonPhanCongThucTap.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
