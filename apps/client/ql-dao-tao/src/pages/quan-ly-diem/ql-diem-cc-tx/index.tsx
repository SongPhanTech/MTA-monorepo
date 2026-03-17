import DefaultLayout from '@layouts/default-layout'
import QuanLyDiemLopMonHoc from '../ql-diem-lop-mon-hoc'

export default function QuanLyDiemCCTX() {
    // biome-ignore lint/a11y/useValidAriaRole: <custom attr>
    return <QuanLyDiemLopMonHoc role="GV" score="TX/ĐK" />
}

QuanLyDiemCCTX.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
