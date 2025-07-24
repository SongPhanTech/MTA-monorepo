import Tabs from '@components/commons/tabar'
import DiemTrungBinhKyHoc from '@components/sub-pages/diem-trung-binh-ky-hoc'
import XetCanhCaoHocDuong from '@components/sub-pages/xet-canh-cao-hoc-duong'
import XetCanhCaoHocTap from '@components/sub-pages/xet-canh-cao-hoc-tap'
import XetHocBong from '@components/sub-pages/xet-hoc-bong'
import XetXuLyHocTap from '@components/sub-pages/xet-xu-ly-hoc-tap'
import DefaultLayout from '@layouts/default-layout'
import { AcademicActionType } from '@workspace/db'
import { useFindUniqueSemester } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Divider } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'

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
            <Divider
                orientation="left"
                orientationMargin={0}
                className="bg-white rounded-lg shadow-sm p-4 mt-2"
            >
                {[initialValue?.code, initialValue?.name, initialValue?.schoolYear?.name]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Tabs
                items={[
                    {
                        key: '1',
                        label: 'Điểm trung bình kỳ học',
                        children: <DiemTrungBinhKyHoc semesterId={semesterId} />,
                    },
                    ...(initialValue?.semesterType
                        ? [
                              {
                                  key: '2',
                                  label: 'Xét học bổng',
                                  children: <XetHocBong semesterId={semesterId} />,
                              },
                          ]
                        : []),
                    {
                        key: '3',
                        label: 'Xét cảnh cáo học tập',
                        children: <XetCanhCaoHocTap semesterId={semesterId} />,
                    },
                    {
                        key: '4',
                        label: 'Xét cảnh cáo học đường',
                        children: <XetCanhCaoHocDuong semesterId={semesterId} />,
                    },
                    {
                        key: '5',
                        label: 'Xét thôi học',
                        children: (
                            <XetXuLyHocTap
                                semesterId={semesterId}
                                actionTaken={AcademicActionType.EXPULSION}
                            />
                        ),
                    },
                    {
                        key: '6',
                        label: 'Xét lưu ban',
                        children: (
                            <XetXuLyHocTap
                                semesterId={semesterId}
                                actionTaken={AcademicActionType.REPEAT_YEAR}
                            />
                        ),
                    },
                    {
                        key: '7',
                        label: 'Xét đình chỉ',
                        children: (
                            <XetXuLyHocTap
                                semesterId={semesterId}
                                actionTaken={AcademicActionType.SUSPENSION}
                            />
                        ),
                    },
                ]}
                className="custom-tab-bar"
                tabBarStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    paddingInline: '16px',
                    paddingBlock: '8px',
                    marginBottom: '0',
                }}
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
            unLayout={true}
        >
            {page}
        </DefaultLayout>
    )
}
