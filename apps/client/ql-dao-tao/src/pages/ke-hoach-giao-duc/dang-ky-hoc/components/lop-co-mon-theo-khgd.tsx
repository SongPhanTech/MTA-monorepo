import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
    enrollFixedClassOnSubjectClass,
    useFixedClassBySubjectClassSemester,
} from '@workspace/libs/api/training'
import { QueryClient } from '@tanstack/react-query'
import type { FixedClassBySubjectClassSemester } from '@workspace/libs/api/schemas/fixedClassBySubjectClassSemester'
// const { Option } = Select;

interface FilterProps {
    searchText: string | null
}

interface FixedClassProps {
    semesterId?: string | null
    subjectClassId?: string | null
}

export default function FixedClass({
    semesterId,
    subjectClassId,
}: FixedClassProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const queryClient = new QueryClient()

    const { data: fixedClass } = useFixedClassBySubjectClassSemester(
        {
            semesterId: semesterId || '',
            subjectClassId: subjectClassId || '',
            search: filters.searchText || '',
            page: '1',
            pageSize: '10',
        },
        {
            query: {
                enabled: !!semesterId && !!subjectClassId,
            },
        },
        queryClient
    )

    useEffect(() => {
        if (fixedClass?.data?.data) {
            const selectedKeys = fixedClass.data.data
                .filter(
                    (item: FixedClassBySubjectClassSemester) => item.checked
                )
                .map((item: FixedClassBySubjectClassSemester) => item.id)
            setSelectedRowKeys(selectedKeys)
        }
    }, [fixedClass?.data?.data])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            return newFilters
        })
    }

    const handleSave = async () => {
        if (!subjectClassId) return

        try {
            await enrollFixedClassOnSubjectClass({
                fixedClassIds: selectedRowKeys as string[],
                subjectClassId,
            })
            message.success('Gán lớp cố định thành công!')
            queryClient.invalidateQueries()
        } catch (error) {
            message.error('Có lỗi xảy ra khi gán lớp!')
        }
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
                dataSource={fixedClass?.data?.data}
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
                        dataIndex: ['_count', 'students'],
                        align: 'center',
                        width: 120,
                    },
                ]}
                pagination={{
                    current: currentPage,
                    onChange: setCurrentPage,
                }}
            />
            <Flex justify="end" style={{ marginTop: 16 }}>
                <Button
                    type="primary"
                    className="h-[32px] px-4"
                    onClick={handleSave}
                >
                    Lưu
                </Button>
            </Flex>
        </div>
    )
}
