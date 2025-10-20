import DefaultLayout from '@layouts/default-layout'
import PhanCongGiangDay from '@pages/ke-hoach-giao-duc/quan-ly-lop-mon-hoc'
import type React from 'react'

export default function PhanCongGiangDayHocLai() {
    return <PhanCongGiangDay />
}

PhanCongGiangDayHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
