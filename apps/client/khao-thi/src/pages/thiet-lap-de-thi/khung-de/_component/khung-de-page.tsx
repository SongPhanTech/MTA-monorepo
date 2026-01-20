import { useState } from 'react'
import type { Key } from 'react'
import { store } from '../index'
import { Button, Space, Typography, message, Flex, Input, Col, Row } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { QueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import type { FilterProps } from '@components/commons/typeFilter'
import {
    useCountExamFramework,
    useFindManyExamFramework,
    useUpdateExamFramework,
} from '@workspace/db/hooks'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Table from '@components/commons/table'
import CreateIcon from '@components/icons/create'
import EditIcon from '@components/icons/edit'
import DeleteIcon from '@components/icons/delete'

export default function KhungDeList() {
    const queryClient = new QueryClient()
    const examFrameworkId = useStore(store, (s) => s.examFrameworkId)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        evidenceName: '',
        name: '',
        subjectVersionIdString: '',
    })
    const semesterId = useStore(store, (s) => s.semesterId)

    const { onOpen: onOpenExamFramework } = useDisclosure<{ id: string }>({
        tag: 'ModalTaoKhungDe',
    })

    const { data: examFrameworkList = [] } = useFindManyExamFramework({
        where: {
            active: true,
            ...(semesterId ? { semesterId } : {}),
            ...(filters.name
                ? {
                      name: {
                          contains: filters.name,
                      },
                  }
                : {}),
            ...(filters.subjectVersionIdString
                ? { subjectVersionIdString: filters.subjectVersionIdString }
                : {}),
        },
        include: {
            subjectVersion: true,
            examMatrixs: {
                include: { knowledgeBlocks: true },
            },
        },
        take: numberOfPages, //phân trang
        skip: (currentPage - 1) * numberOfPages, //phân trang
        orderBy: { createdAt: 'desc' },
    })

    const { data: totalExamFramework } = useCountExamFramework({
        where: {
            deletedAt: null,
            ...(filters.name
                ? {
                      OR: [
                          {
                              ...(filters.name
                                  ? {
                                        name: {
                                            contains: filters.name,
                                        },
                                    }
                                  : {}),
                              ...(filters.subjectVersionIdString
                                  ? { subjectVersionIdString: filters.subjectVersionIdString }
                                  : {}),
                          },
                      ],
                  }
                : {}),
        },
    })

    const deleteExamFramework = useUpdateExamFramework({
        onSuccess: () => message.success('Đã xóa khung đề'),
        onError: () => message.error('Không thể xóa khung đề'),
    })

    const filteredList = examFrameworkList.filter((item) => {
        const keyword = filters.name?.trim().toLowerCase()

        if (!keyword) return true

        return (
            item.name.toLowerCase().includes(keyword) ||
            item.subjectVersion?.name.toLowerCase().includes(keyword)
        )
    })

    const handleDelete = async (id: string) => {
        try {
            await deleteExamFramework.mutateAsync({
                where: { id },
                data: {
                    active: false,
                    deletedAt: new Date(),
                },
            })

            message.success('Xóa khung đề thành công')

            // invalidate danh sách
            queryClient.invalidateQueries({ queryKey: ['examFramework'] })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng thử lại')
        }
    }

    return (
        <div>
            <Col className="mb-2">
                <Flex justify="space-between">
                    <Typography.Title level={4}>Danh sách khung đề</Typography.Title>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Tìm theo tên hoặc mã (Phiên bản môn học, Ngân hàng câu hỏi)"
                            value={filters.searchText}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, searchText: e.target.value }))
                            }
                            className="w-96 h-8"
                            allowClear
                        />

                        <Button
                            type="primary"
                            icon={<CreateIcon />}
                            onClick={() => onOpenExamFramework()}
                        >
                            Tạo khung đề
                        </Button>
                    </div>
                </Flex>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="id"
                    dataSource={filteredList}
                    filters={filters}
                    setFilters={setFilters}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: totalExamFramework,
                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${totalExamFramework} bản ghi`,
                    }}
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: [examFrameworkId as Key],
                        onChange: (selectedRowKeys) => {
                            store.setState((s) => ({
                                ...s,
                                examFrameworkId: selectedRowKeys[0] as string,
                            }))
                        },
                    }}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                store.setState((s) => ({
                                    ...s,
                                    examFrameworkId: record.id,
                                }))
                            },
                        }
                    }}
                    columns={[
                        {
                            title: 'STT',
                            width: '40px',
                            align: 'center',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Tên khung đề',
                            dataIndex: 'name',
                            type: 'input',
                            align: 'center',
                            render: (name) =>
                                examFrameworkList.length > 50 ? `${name.slice(0, 50)}...` : name,
                        },
                        {
                            title: 'Thời gian thi',
                            dataIndex: 'time',
                            type: 'input',
                            width: '120px',
                            align: 'center',
                            render: (time) => (
                                <Space>
                                    <ClockCircleOutlined />
                                    {time} phút
                                </Space>
                            ),
                        },
                        {
                            title: 'Môn học',
                            dataIndex: 'subjectVersion',
                            type: 'input',
                            align: 'center',
                            render: (_, record) => record?.subjectVersion?.name || '',
                        },
                        {
                            title: 'Thao tác',
                            align: 'center',
                            width: '70px',
                            fixed: 'right',
                            render: (record) => (
                                <Row className="justify-center gap-2">
                                    <EditIcon
                                        type="text"
                                        className="text-sm text-blue-700 cursor-pointer"
                                        onClick={() => onOpenExamFramework({ id: record.id })}
                                    />
                                    <DeleteIcon
                                        type="text"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(record.id)
                                        }}
                                    />
                                </Row>
                            ),
                        },
                    ]}
                />
            </Col>
        </div>
    )
}
