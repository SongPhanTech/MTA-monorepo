import Select from '@components/commons/select'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindFirstPlanTrainingDelay,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import HSSVChuaDat from './_components/hssv-chua-dat'
import MonCham from './_components/mon-cham'
import MonCoHVSVChuaDat from './_components/mon-co-hvsv-chua-dat'
import MonDaLapKeHoach from './_components/mon-da-lap-ke-hoach'
import MonKySau from './_components/mon-ky-sau'
import MonTheoKeHoachDuKien from './_components/mon-theo-ke-hoach-du-kien'


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

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
        where: {
            deletedAt: null,
            active: true,
            trainingCourse: {
                trainingObjectTypeId,
            },
        },
    })

    const leftTabs: TabItem[] = hocLai
        ? [
              {
                  key: '1',
                  label: 'Môn có SV/HV chưa đạt',
                  content: <MonCoHVSVChuaDat setSubjectVersionId={setSubjectVersionId} />,
              },
              {
                  key: '2',
                  label: 'Môn học lại đã lập kế hoạch',
                  content: <MonDaLapKeHoach hocLai />,
              },
          ]
        : [
              {
                  key: '1',
                  label: 'Môn theo kế hoạch giảng dạy',
                  content: <MonTheoKeHoachDuKien />,
              },
              {
                  key: '2',
                  label: `Môn học chậm tiến độ ${countDelay?._count?.planTrainingDelaySubjects ? `(${countDelay?._count?.planTrainingDelaySubjects})` : ''}`,
                  content: <MonCham />,
              },
              {
                  key: '3',
                  label: 'Môn học kỳ sau',
                  content: <MonKySau />,
              },
          ]

    const rightTabsMap: TabItem[] = hocLai
        ? [
              {
                  key: '1',
                  label: 'SV/HV chưa đạt',
                  content: <HSSVChuaDat subjectVersionId={subjectVersionId} />,
              },
          ]
        : [
              {
                  key: '1',
                  label: 'Môn học đã lập kế hoạch',
                  content: <MonDaLapKeHoach />,
              },
          ]

    return (
        <Row gutter={[12, 0]} className="bg-white">
            <Col span={24}>
                <Flex gap={8}>
                    <Form.Item
                        className="m-0"
                        name="trainingCourseId"
                        label="Khóa đào tạo"
                        labelAlign="left"
                    >
                        <Select
                            placeholder="Khoá đào tạo"
                            options={trainingCourseData.map((i) => ({
                                value: i.id,
                                label: i.name,
                            }))}
                            dropdownStyle={{
                                minWidth: 350,
                            }}
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item
                        className="m-0"
                        name="trainingMajorId"
                        label="Chuyên ngành đào tạo"
                        labelAlign="left"
                    >
                        <Select
                            placeholder="Chọn chuyên ngành đào tạo"
                            options={trainingMajorData.map((i) => ({
                                value: i.id,
                                label: i.name,
                            }))}
                            dropdownStyle={{
                                minWidth: 350,
                            }}
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item
                        className="m-0"
                        name="fixedClassId"
                        label="Lớp quản lý"
                        labelAlign="left"
                    >
                        <Select
                            placeholder="Chọn lớp quản lý"
                            options={fixedClassData.map((i) => ({
                                value: i.id,
                                label: [i.code, i.name].filter(Boolean).join(' - '),
                            }))}
                            dropdownStyle={{
                                minWidth: 600,
                            }}
                            allowClear
                        />
                    </Form.Item>
                </Flex>
            </Col>
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

LapKeHoach.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
