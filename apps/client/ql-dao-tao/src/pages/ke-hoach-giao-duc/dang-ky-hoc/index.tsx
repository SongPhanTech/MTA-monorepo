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

const dataFake2 = [
    {
        id: 1,
        class: 'ANHTTT56',
        kh: 'An ninh phần cứng',
        cn: 'An ninh hệ thống thông tin',
        sv: 40,
    },
    {
        id: 1,
        class: 'ANHTTT57',
        kh: 'An ninh phần cứng 1',
        cn: 'An ninh hệ thống thông tin 2',
        sv: 50,
    },
]

export default function RegisterClass() {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Flex gap={8}>
                        <Col span={14}>
                            <Tabs defaultActiveKey="1">
                                <TabPane
                                    tab="Đăng ký học cho lớp quản lý"
                                    key="1"
                                >
                                    <Row
                                        gutter={[16, 16]}
                                        align="top"
                                        justify="space-between"
                                    >
                                        <Col span={24}>
                                            <Flex>
                                                <Col span={12}>
                                                    <Form.Item name="searchText">
                                                        <Input
                                                            id="search"
                                                            // onChange={(e) =>
                                                            //     handleFilterChange('searchText', e.target.value)
                                                            // }
                                                            placeholder="Nhập tên lớp..."
                                                            style={{
                                                                height: 32,
                                                            }}
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
                                                    index +
                                                    1 +
                                                    (currentPage - 1) *
                                                        DEFAULT_PAGINATE_SIZE,
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
                                    />
                                </TabPane>
                                <TabPane tab="Đăng ký học cho cá nhân" key="2">
                                    <p>Nội dung</p>
                                </TabPane>
                                <TabPane
                                    tab="Kết quả đăng ký học lớp quản lý"
                                    key="3"
                                >
                                    <p>Nội dung</p>
                                </TabPane>
                            </Tabs>
                        </Col>
                        <Col span={10}>
                            <Tabs defaultActiveKey="1">
                                <TabPane tab="Lớp có môn theo KHGD" key="1">
                                    <Row
                                        gutter={[16, 16]}
                                        align="top"
                                        justify="space-between"
                                    >
                                        <Col span={24}>
                                            <Flex>
                                                <Col span={12}>
                                                    <Form.Item name="searchText">
                                                        <Input
                                                            id="search"
                                                            // onChange={(e) =>
                                                            //     handleFilterChange('searchText', e.target.value)
                                                            // }
                                                            placeholder="Nhập tên lớp..."
                                                            style={{
                                                                height: 32,
                                                            }}
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
                                            </Flex>
                                        </Col>
                                    </Row>
                                    <Table
                                        rowKey="id"
                                        id="training-block"
                                        rowSelection={{
                                            selectedRowKeys,
                                            onChange: (selectedKeys) =>
                                                setSelectedRowKeys(
                                                    selectedKeys
                                                ),
                                        }}
                                        columns={[
                                            {
                                                title: 'STT',
                                                width: 60,
                                                align: 'center',
                                                fixed: 'left',
                                                render: (_, __, index) =>
                                                    index +
                                                    1 +
                                                    (currentPage - 1) *
                                                        DEFAULT_PAGINATE_SIZE,
                                            },
                                            {
                                                title: 'Tên lớp QL',
                                                dataIndex: 'class',
                                                align: 'center',
                                                width: 150,
                                            },
                                            {
                                                title: 'Khoá học',
                                                dataIndex: 'kh',
                                                width: 150,
                                            },
                                            {
                                                title: 'Chulớp',
                                                dataIndex: 'cn',
                                                width: 240,
                                            },
                                            {
                                                title: 'Số HV, SV',
                                                dataIndex: 'sv',
                                                align: 'center',
                                                width: 120,
                                            },
                                        ]}
                                        dataSource={dataFake2}
                                    />
                                    {/* TODO: handle save */}
                                    <Flex justify="end">
                                        <Button
                                            type="primary"
                                            className="h-[32px] px-4 right-0"
                                        >
                                            Lưu
                                        </Button>
                                    </Flex>
                                </TabPane>
                                <TabPane tab="Lớp đăng ký thiếu" key="2">
                                    <p>Lớp đăng ký thiếu</p>
                                </TabPane>
                            </Tabs>
                        </Col>
                    </Flex>
                </Col>
            </Row>
        </div>
    )
}

RegisterClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
