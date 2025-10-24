import DefaultLayout from '@layouts/default-layout'
import KeHoachMoLopMonHoc from '@pages/ke-hoach-giao-duc/ke-hoach-mo-lop-mon-hoc'
import type React from 'react'

export default function KeHoachMoLopMonHocLai() {
    return <KeHoachMoLopMonHoc hocLai />
}

KeHoachMoLopMonHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
