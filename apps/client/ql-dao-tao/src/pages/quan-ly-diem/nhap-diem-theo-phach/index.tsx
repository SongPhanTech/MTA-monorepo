import DefaultLayout from '@layouts/default-layout'
import QuanLyDiemLopMonHoc from '../ql-diem-lop-mon-hoc'

export default function DiemTheoPhach() {
    // biome-ignore lint/a11y/useValidAriaRole: <custom role>
    return <QuanLyDiemLopMonHoc role="P13" score="PHACH" />
}

DiemTheoPhach.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
