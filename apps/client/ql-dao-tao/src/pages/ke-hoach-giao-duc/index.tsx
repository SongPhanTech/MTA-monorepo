import DefaultLayout from '@layouts/default-layout'
import { useFindManyFixedClass, useFindManyTrainingMajor } from '@workspace/db/hooks'
import {
    SelectTrainingCourse,
    useFixedClassStore,
    useTrainingMajorStore,
    useTrainingObjectTypeStore,
} from '@workspace/ui'
import { Flex, Form, Select, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import KeHoachMoLopMonHoc from './ke-hoach-mo-lop-mon-hoc'
import LapKeHoach from './lap-ke-hoach'
import PhanCongGiangDay from './phan-cong-giang-day'

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

    const { id: trainingMajorId, onSelect: onSelectTrainingMajor } = useTrainingMajorStore()
    const { id: fixedClassId, onSelect: onSelectFixedClass } = useFixedClassStore()

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
        where: {
            active: true,
            deletedAt: null,
        },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
        where: {
            deletedAt: null,
            active: true,
            trainingCourse: {
                trainingObjectTypeId,
            },
            curriculumVersion: {
                curriculum: {
                    trainingMajorId,
                },
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
                    <SelectTrainingCourse />
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
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input?.toLowerCase())
                        }
                        value={trainingMajorId}
                        onChange={onSelectTrainingMajor}
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
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input?.toLowerCase())
                        }
                        value={fixedClassId}
                        onChange={onSelectFixedClass}
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
