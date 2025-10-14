import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useFindFirstPlanTraining } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, message, Row } from 'antd'
import { Search } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface FilterProps {
    searchText: string | null
}

export default function MonDaLapKeHoach() {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(100)
    const { id: semesterId } = useSemesterStore()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: planTraining } = useFindFirstPlanTraining(
        {
            where: {
                semesterId: semesterId as string,
                trainingObjectTypeId,
            },
            include: {
                subjects: {
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
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
                },
                fixedClasses: true,
                _count: {
                    select: { subjects: true },
                },
            },
        },
        { enabled: !!semesterId && !!trainingObjectTypeId }
    )
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            return newFilters
        })
    }

    const handleSave = async () => {
        try {
            message.success('Gán lớp cố định thành công!')
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'SubjectClass'],
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra khi gán lớp!')
        }
    }

    return (
        <div>
            <Row gutter={[16, 16]} align="top" justify="space-between">
                <Col span={24}>
                    <Form.Item className="m-0" name="searchText">
                        <Input
                            id="search"
                            placeholder="Nhập tên môn..."
                            onChange={(e) => handleFilterChange('searchText', e.target.value)}
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
            </Row>
            <Table
                rowKey="id"
                id="fixed-class"
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
                data={planTraining?.subjects ?? []}
                columns={[
                    {
                        title: 'STT',
                        width: 35,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) =>
                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                    },
                    {
                        title: 'Mã MH',
                        dataIndex: 'code',
                        align: 'center',
                        width: 100,
                    },
                    {
                        title: 'Tên môn',
                        dataIndex: 'name',
                        width: 100,
                        align: 'center',
                    },
                ]}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: planTraining?._count.subjects ?? 0,
                    onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) {
                            setCurrentPage(page)
                        } else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                        }
                    },
                }}
            />
        </div>
    )
}
