import DefaultLayout from "@layouts/default-layout"
import KeHoachDaoTao from "@pages/ke-hoach-giao-duc"
import type React from "react"

export default function P2KeHoachHocLai() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <KeHoachDaoTao type="RETAKE" role="P2_QLDT" />
}

P2KeHoachHocLai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
