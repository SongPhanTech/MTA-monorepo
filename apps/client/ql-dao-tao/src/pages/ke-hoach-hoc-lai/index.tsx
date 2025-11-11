import DefaultLayout from '@layouts/default-layout'
import KeHoachDaoTao from '@pages/ke-hoach-giao-duc'
import type React from 'react'

export default function KeHoachHocLai() {
    return <KeHoachDaoTao hocLai/>
}

KeHoachHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
