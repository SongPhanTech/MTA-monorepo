import DefaultLayout from "@layouts/default-layout"
import QuanLyDiemLopMonHoc from "../ql-diem-lop-mon-hoc"

export default function QuanLyDiemP13() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <QuanLyDiemLopMonHoc role="P13" score="THI" />
}

QuanLyDiemP13.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
