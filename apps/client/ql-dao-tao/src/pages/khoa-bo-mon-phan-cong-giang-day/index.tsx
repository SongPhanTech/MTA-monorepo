import DefaultLayout from '@layouts/default-layout'
import PhanCongGiangDay from '@pages/ke-hoach-giao-duc/phan-cong-giang-day'
import type React from 'react'

export default function KhaoBoMonPhanCongGiangDay() {
    return <PhanCongGiangDay khoaBoMon />
}

KhaoBoMonPhanCongGiangDay.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
