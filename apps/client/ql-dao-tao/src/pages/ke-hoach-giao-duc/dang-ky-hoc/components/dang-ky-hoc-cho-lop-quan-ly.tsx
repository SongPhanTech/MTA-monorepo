import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tabs, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useState } from 'react'
import TabPane from 'antd/es/tabs/TabPane'
// const { Option } = Select;

interface FilterProps {
    searchText: string | null
    trainingCourseId: string | null
}

const dataFake1 = [
    {
        id: 1,
        class: 'LMH1',
        time: '10/02/2025',
        kh: 'Sáng',
        gv1: 'Đặng Lê Đình Trang',
        credit: 4,
        svMax: 50,
        svReg: 47,
        lqlđk: 'L11',
    },
    {
        id: 2,
        class: 'LMH12',
        time: '09/02/2025',
        kh: 'Sáng',
        gv1: 'Đàm Quang Sang',
        credit: 3,
        svMax: 53,
        svReg: 40,
        lqlđk: 'L12',
    },
]

export default function RegisterClassManager() {
    const [currentPage, setCurrentPage] = useState(1)


    return (
        <div>
            <Row gutter={[16, 16]} align="top" justify="space-between">
                <Col span={24}>
                    <Flex>
                        <Col span={12}>
                            <Form.Item name="searchText">
                                <Input
                                    id="search"
                                    placeholder="Nhập tên lớp..."
                                    style={{ height: 32 }}
                                    prefix={
                                        <Search
                                            size={15}
                                            style={{ color: 'rgba(0, 0, 0, 0.25)' }}
                                        />
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Flex>
                </Col>
            </Row>
            <Table
                rowKey="id"
                id="training-block"
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) =>
                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Lớp môn học',
                        dataIndex: 'class',
                        align: 'center',
                        width: 150,
                    },
                    {
                        title: 'Thời gian học',
                        dataIndex: 'time',
                        width: 150,
                    },
                    {
                        title: 'Kíp học',
                        dataIndex: 'kh',
                        width: 150,
                    },
                    {
                        title: 'Giảng viên 1',
                        dataIndex: 'gv1',
                        width: 180,
                    },
                    {
                        title: 'Số tín chỉ',
                        dataIndex: 'credit',
                        align: 'center',
                        width: 120,
                    },
                    {
                        title: 'Số SV max',
                        dataIndex: 'svMax',
                        align: 'center',
                        width: 120,
                    },
                    {
                        title: 'Số SV đã ĐK',
                        dataIndex: 'svReg',
                        align: 'center',
                        width: 100,
                    },
                    {
                        title: 'Lớp QL đã ĐK',
                        align: 'center',
                        dataIndex: 'lqlđk',
                        width: 150,
                    },
                ]}
                dataSource={dataFake1}
                pagination={{
                    current: currentPage,
                    onChange: setCurrentPage,
                }}
            />
        </div>
    )
}