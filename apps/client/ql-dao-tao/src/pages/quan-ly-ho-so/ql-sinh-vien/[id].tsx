import ModalChiTietSinhVien from '@components/modal/modal-chi-tiet-sinh-vien'
import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'

export default function StudentDetailPage() {
    const router = useRouter()
    const studentId = router.query.id as string

    return (
        <div>
            <ModalChiTietSinhVien studentId={studentId} />
        </div>
    )
}

StudentDetailPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý hồ sơ' },
                {
                    title: 'Quản lý hồ sơ sinh viên',
                    href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN,
                },
                { title: 'Chi tiết sinh viên' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
