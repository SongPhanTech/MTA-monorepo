import DefaultLayout from '@layouts/default-layout'
import { useFindFirstPlanTrainingDelay } from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function LapKeHoach({ hocLai = false }: { hocLai?: boolean }) {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [subjectVersionId, setSubjectVersionId] = useState<string>('')
    const { data: countDelay } = useFindFirstPlanTrainingDelay({
        where: { trainingObjectTypeId, deletedAt: null },
        select: {
            _count: {
                select: {
                    planTrainingDelaySubjects: true,
                },
            },
        },
    })

    const tabs: TabItem[] = [
        {
            key: '1',
            label: 'Lập kế hoạch',
            content: <></>,
        },
        {
            key: '2',
            label: 'Kế hoạch mở lớp môn học',
            content: <></>,
        },
        {
            key: '3',
            label: 'Phân công giảng dạy',
            content: <></>,
        },
        {
            key: '4',
            label: 'Đăng ký học',
            content: <></>,
        },
    ]

    return (
        <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
            {tabs.map((tab) => (
                <Tabs.TabPane tab={tab.label} key={tab.key}>
                    {tab.content}
                </Tabs.TabPane>
            ))}
        </Tabs>
    )
}

LapKeHoach.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
