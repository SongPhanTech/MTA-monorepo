import DefaultLayout from "@layouts/default-layout"
import DiemTheoPhach from "../nhap-diem-theo-phach"

export default function DanhPhach() {
  // biome-ignore lint/a11y/useValidAriaRole: <custom role>
  return <DiemTheoPhach type="DANH_PHACH" />
}

DanhPhach.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
