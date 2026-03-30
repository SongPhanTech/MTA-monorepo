import DefaultLayout from "@layouts/default-layout"
import KeHoachDaoTao from "@pages/ke-hoach-giao-duc"
import type React from "react"

export default function KeHoachThiLai() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <KeHoachDaoTao type="REEXAM" role="P2_KHCT" />
}

KeHoachThiLai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
