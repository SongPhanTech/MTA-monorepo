import DefaultLayout from '@layouts/default-layout'
import { Flex, Form, Select, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import KeHoachMoLopMonHoc from './ke-hoach-mo-lop-mon-hoc'
import LapKeHoach from './lap-ke-hoach'
import PhanCongGiangDay from './phan-cong-giang-day'
import {
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function KeHoachDaoTao() {
    const [activeLeftTab, setActiveLeftTab] = useState('1')
    const tabs: TabItem[] = [
        {
            key: '1',
            label: 'Lập kế hoạch',
            content: <LapKeHoach />,
        },
        {
            key: '2',
            label: 'Kế hoạch mở lớp môn học',
            content: <KeHoachMoLopMonHoc />,
        },
        {
            key: '3',
            label: 'Phân công giảng dạy',
            content: <PhanCongGiangDay />,
        },
    ]

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
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
    return (
        <>
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
            <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
                {tabs.map((tab) => (
                    <Tabs.TabPane tab={tab.label} key={tab.key}>
                        {tab.content}
                    </Tabs.TabPane>
                ))}
            </Tabs>
        </>
    )
}

KeHoachDaoTao.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
