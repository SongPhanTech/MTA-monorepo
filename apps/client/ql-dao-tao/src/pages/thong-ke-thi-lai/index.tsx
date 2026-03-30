import DefaultLayout from "@layouts/default-layout"
import KeHoachDaoTao from "@pages/ke-hoach-giao-duc"
import type React from "react"

export default function P2ThongKeThiLai() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <KeHoachDaoTao type="REEXAM" role="P2_QLDT" />
}

P2ThongKeThiLai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
