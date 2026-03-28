import DefaultLayout from "@layouts/default-layout"
import QuanLyDiemLopMonHoc from "../ql-diem-lop-mon-hoc"

export default function QuanLyDiemThi() {
  // biome-ignore lint/a11y/useValidAriaRole: <explanation>
  return <QuanLyDiemLopMonHoc role="GV" score="THI" />
}

QuanLyDiemThi.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
