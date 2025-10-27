import DefaultLayout from '@layouts/default-layout'
import DangKyHoc from '@pages/dang-ky-hoc/dang-ky-hoc-offline'
import type React from 'react'

export default function DangKyHocLai() {
    return <DangKyHoc hocLai />
}

DangKyHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
