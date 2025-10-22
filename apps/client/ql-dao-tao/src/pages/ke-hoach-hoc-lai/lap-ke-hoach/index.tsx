import DefaultLayout from '@layouts/default-layout'
import LapKeHoach from '@pages/ke-hoach-giao-duc/lap-ke-hoach'
import type React from 'react'

export default function LapKeHoachHocLai() {
    return <LapKeHoach hocLai />
}

LapKeHoachHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
