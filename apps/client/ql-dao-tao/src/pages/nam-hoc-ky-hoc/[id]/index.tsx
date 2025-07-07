import Tabs from '@components/commons/tabar'
import DiemTrungBinhKyHoc from '@components/sub-pages/diem-trung-binh-ky-hoc'
import XetCanhCaoHocDuong from '@components/sub-pages/xet-canh-cao-hoc-duong'
import XetCanhCaoHocTap from '@components/sub-pages/xet-canh-cao-hoc-tap'
import XetHocBong from '@components/sub-pages/xet-hoc-bong'
import XetLuuBan from '@components/sub-pages/xet-luu-ban'
import XetThoiHoc from '@components/sub-pages/xet-thoi-hoc'
import DefaultLayout from '@layouts/default-layout'
import { useFindUniqueSemester } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Divider } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'

interface FilterProps {
    searchText: string | null
    managementOrganizationId: string | undefined
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
    subjectCode: string | undefined
    examTypes: string | undefined
}

export default function CanhCaoHocBong() {
    const router = useRouter()
    const semesterId = router.query.id as string
    const { data: initialValue } = useFindUniqueSemester(
        {
            where: { id: semesterId },
            include: {
                schoolYear: true,
            },
        },
        { enabled: !!semesterId }
    )

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {initialValue?.code} - {initialValue?.name} - {initialValue?.schoolYear?.name}
            </Divider>
            <Tabs
                items={[
                    {
                        key: '1',
                        label: 'Điểm trung bình kỳ học',
                        children: <DiemTrungBinhKyHoc semesterId={semesterId} />,
                    },
                    {
                        key: '2',
                        label: 'Xét học bổng',
                        children: <XetHocBong semesterId={semesterId} />,
                    },
                    {
                        key: '3',
                        label: 'Xét cảnh cáo học đường',
                        children: <XetCanhCaoHocDuong />,
                    },
                    {
                        key: '4',
                        label: 'Xét cảnh cáo học tập',
                        children: <XetCanhCaoHocTap />,
                    },
                    {
                        key: '5',
                        label: 'Xét thôi học',
                        children: <XetThoiHoc />,
                    },
                    {
                        key: '6',
                        label: 'Xét lưu ban',
                        children: <XetLuuBan />,
                    },
                ]}
            />
        </div>
    )
}

CanhCaoHocBong.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Năm học kỳ học', href: ROUTER_PATH.QL_DAO_TAO.NAM_HOC_KY_HOC },
                {
                    title: 'Cảnh cáo học tập, xét học bổng',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
