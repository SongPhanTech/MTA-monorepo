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

const dataFake2 = [
    {
        id: 1,
        class: 'ANHTTT56',
        kh: 'An ninh phần cứng',
        cn: 'An ninh hệ thống thông tin',
        sv: 40,
    },
    {
        id: 2,
        class: 'ANHTTT57',
        kh: 'An ninh phần cứng 1',
        cn: 'An ninh hệ thống thông tin 2',
        sv: 50,
    },
]

export default function FixedClass() {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

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
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
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
                        title: 'Chuyên ngành',
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
                pagination={{
                    current: currentPage,
                    onChange: setCurrentPage,
                }}
            />
            <Flex justify="end" style={{ marginTop: 16 }}>
                <Button type="primary" className="h-[32px] px-4">
                    Lưu
                </Button>
            </Flex>
        </div>
    )
}