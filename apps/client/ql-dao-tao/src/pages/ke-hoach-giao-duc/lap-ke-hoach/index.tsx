import DefaultLayout from '@layouts/default-layout'
import { useFindFirstPlanTrainingDelay } from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import MonCham from './_components/mon-cham'
import MonDaLapKeHoach from './_components/mon-da-lap-ke-hoach'
import MonKySau from './_components/mon-ky-sau'
import MonTheoKeHoachDuKien from './_components/mon-theo-ke-hoach-du-kien'
interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function PlanTraining() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: countDelay } = useFindFirstPlanTrainingDelay({
        where: { semesterId: semesterId as string, trainingObjectTypeId, deletedAt: null },
        select: {
            _count: {
                select: {
                    subjects: true,
                },
            },
        },
    })

    const leftTabs: TabItem[] = [
        {
            key: '1',
            label: 'Môn theo kế hoạch giảng dạy',
            content: <MonTheoKeHoachDuKien />,
        },
        {
            key: '2',
            label: `Môn học chậm tiến độ ${countDelay?._count?.subjects ? `(${countDelay?._count?.subjects})` : ''}`,
            content: <MonCham />,
        },
        {
            key: '3',
            label: 'Môn học kỳ sau',
            content: <MonKySau />,
        },
    ]

    const rightTabsMap: TabItem[] = [
        {
            key: '1',
            label: 'Môn học đã lập kế hoạch',
            content: <MonDaLapKeHoach />,
        },
    ]

    return (
        <Row gutter={[12, 0]} className="bg-white">
            <Col span={14}>
                <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
                    {leftTabs.map((tab) => (
                        <Tabs.TabPane tab={tab.label} key={tab.key}>
                            {tab.content}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </Col>
            <Col span={10}>
                <Tabs defaultActiveKey="1">
                    {rightTabsMap.map((tab) => (
                        <Tabs.TabPane tab={tab.label} key={tab.key}>
                            {tab.content}
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </Col>
        </Row>
    )
}

PlanTraining.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
