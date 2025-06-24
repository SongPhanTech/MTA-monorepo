import { Col, Flex, Form, Input, Row, Select } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import TableCollapse from '@components/commons/tableCollapse'
import type {
    TrainingCourse,
    TrainingField,
    TrainingObjectType,
} from '@workspace/db'
import {
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Search } from 'lucide-react'
dayjs.locale('vi')

const XetHocBong = () => {
    const fakeData = [
        {
            id: '1',
            code: 'lql_1',
            name: 'lớp quản lý 1',
            children: [
                {
                    id: '2',
                    code: 'sv_1',
                    name: 'sinh viên 1',
                    gpa: 3.32,
                    totalCredit: 15,
                },
                {
                    id: '3',
                    code: 'sv_2',
                    name: 'sinh viên 2',
                    gpa: 3.05,
                    totalCredit: 15,
                },
            ],
        },
        {
            id: '12',
            code: 'lql_2',
            name: 'lớp quản lý 2',
            children: [
                {
                    id: '22',
                    code: 'sv_3',
                    name: 'sinh viên 3',
                    gpa: 3.32,
                    totalCredit: 15,
                },
                {
                    id: '32',
                    code: 'sv_4',
                    name: 'sinh viên 4',
                    gpa: 3.05,
                    totalCredit: 15,
                },
            ],
        },
    ]

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: trainingFieldData = [] } = useFindManyTrainingField()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            // onChange={(e) =>
                                            //     handleFilterChange(
                                            //         'searchText',
                                            //         e.target.value
                                            //     )
                                            // }
                                            className="py-0"
                                            placeholder="Nhập tên học viên, lớp biên chế"
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingObjectId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingCourseId"
                                    >
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingCourse) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingCourseId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingMajorId"
                                    >
                                        <Select
                                            placeholder="Chọn ngành đào tạo"
                                            options={trainingFieldData.map(
                                                (i: TrainingField) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingMajorId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="name"
                        childrenFieldName="children"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: 'name',
                                width: 200,
                            },
                            {
                                title: 'Tổng số tín chỉ đăng ký',
                                dataIndex: 'totalCredit',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'GPA',
                                dataIndex: 'gpa',
                                width: 120,
                                align: 'center',
                            },
                        ]}
                        data={fakeData}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default XetHocBong
