import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tabs, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import TabPane from 'antd/es/tabs/TabPane'
import { useFindManyFixedClass } from '@workspace/db/hooks'
// const { Option } = Select;

interface FilterProps {
    searchText: string | null
}

export default function FixedClass() {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data: fixedClassData, refetch } = useFindManyFixedClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      name: {
                          contains: filters.searchText,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        },
        include: {
            trainingCourse: true,
            students: true,
        },
    })

    // console.log(fixedClassData);

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

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
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'searchText',
                                            e.target.value
                                        )
                                    }
                                    style={{ height: 32 }}
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
                id="fixed-class"
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                dataSource={fixedClassData}
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) =>
                            index +
                            1 +
                            (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Tên lớp QL',
                        dataIndex: 'name',
                        align: 'center',
                        width: 150,
                    },
                    {
                        title: 'Khoá học',
                        dataIndex: 'trainingCourse',
                        width: 150,
                        render: (record) => (record.name ? record.name : ''),
                    },
                    {
                        title: 'Chuyên ngành',
                        dataIndex: 'cn',
                        width: 240,
                    },
                    {
                        title: 'Số HV, SV',
                        dataIndex: 'students',
                        align: 'center',
                        width: 120,
                        render: (record) => (record ? record.length : ''),
                    },
                ]}
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
