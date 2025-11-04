import DefaultLayout from '@layouts/default-layout'
import QuanLyDiemLopMonHoc from '../ql-diem-lop-mon-hoc'

export default function QuanLyDiemCCTT() {
    // biome-ignore lint/a11y/useValidAriaRole: <explanation>
    return <QuanLyDiemLopMonHoc role="GV" score="CC/TX" />
}

QuanLyDiemCCTT.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
