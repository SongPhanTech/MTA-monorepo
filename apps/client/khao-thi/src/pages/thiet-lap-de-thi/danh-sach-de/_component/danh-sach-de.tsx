import { Button, Input, Space, Flex, Row, message } from 'antd'
import { PlusOutlined, SearchOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useStore } from '@tanstack/react-store'

import { useMemo, useState } from 'react'
import { store } from '../index'
import dayjs from 'dayjs'
import { useCountExamBank, useFindManyExamBank, useUpdateExamBank } from '@workspace/db/hooks'
import EditIcon from '@components/icons/edit'
import DeleteIcon from '@components/icons/delete'
import Table from '@components/commons/table'
import { formatDate } from '@lib/utils'
import PrintIcon from '@components/icons/print'
import DownloadIcon from '@components/icons/download'

export default function ExamListPage() {
    const { onOpen: onOpenExamList } = useDisclosure<{
        id?: string | null
        subjectVersionId?: string
    }>({
        tag: 'SinhDeThuCongModal',
    })

    const { onOpen: onOpenExamImport } = useDisclosure({
        tag: 'ExamImportModal',
        onClose: () => {
            setCurrentPage(1)
            refetchExams()
            refetchCount()
        },
    })

    const [filters, setFilters] = useState<any>({
        examCode: '',
        name: '',
        exam: '',
        examType: undefined,
        questions: undefined,
        examDay: undefined,
        createdAt: undefined,
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const selectedExamId = useStore(store, (state) => state.selectedExamId)
    const subjectVersionId = useStore(store, (state) => state.subjectVersionId)
    const where = useMemo(() => {
        return {
            examId: selectedExamId,
            ...(filters.exam &&
                filters.exam !== '' && {
                    OR: [
                        {
                            examCode: {
                                contains: filters?.exam || '',
                            },
                        },
                        // {
                        //   exam: {
                        //     semester: {
                        //       name: {
                        //         contains: filters.name,
                        //       },
                        //     },
                        //   },
                        // },
                    ],
                }),
            ...(filters.examCode &&
                filters.examCode !== '' && {
                    examCode: {
                        contains: filters?.examCode || '',
                    },
                }),
            ...(filters.name &&
                filters.name !== '' && {
                    exam: {
                        semester: {
                            name: {
                                contains: filters.name,
                            },
                        },
                    },
                }),
            ...(filters.examType && {
                examType: {
                    in: filters.examType,
                },
            }),
            ...(filters?.examDay?.length === 2
                ? {
                      examDay: {
                          gte: dayjs(filters.examDay?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examDay?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters?.createdAt?.length === 2
                ? {
                      createdAt: {
                          gte: dayjs(filters.createdAt?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.createdAt?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }
    }, [selectedExamId, filters])

    const { onOpen: printExamBank } = useDisclosure<{
        id: string
    }>({
        tag: 'PrintExamBank',
    })

    const { onOpen: printExplanation } = useDisclosure<{
        id: string
        timestamp?: number
    }>({
        tag: 'PrintExplanation',
    })

    const { onOpen: printBatchExamBank } = useDisclosure<{
        ids: string[]
    }>({
        tag: 'PrintBatchExamBank',
    })

    const { onOpen: printBatchExplanation } = useDisclosure<{
        ids: string[]
    }>({
        tag: 'PrintBatchExplanation',
    })

    const { data: exams = [], refetch: refetchExams } = useFindManyExamBank(
        {
            where: {
                ...where,
                deletedAt: null,
            },
            include: {
                exam: {
                    include: {
                        semester: true,
                    },
                },
                questions: {
                    include: {
                        question: true,
                    },
                },
                _count: {
                    select: { questions: true },
                },
            },
            orderBy: [
                ...(filters?.questions
                    ? [
                          {
                              questions: {
                                  _count: filters?.questions,
                              },
                          },
                      ]
                    : []),
                {
                    createdAt: 'desc',
                },
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!selectedExamId,
        }
    )

    const { data: count, refetch: refetchCount } = useCountExamBank(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        {
            enabled: !!selectedExamId,
        }
    )
    const { mutateAsync: update } = useUpdateExamBank()
    const { onOpen: onOpenExamListAuto } = useDisclosure<{ id?: string | null }>({
        tag: 'SinhDeModal',
        onClose: () => {
            setCurrentPage(1)
            refetchExams()
            refetchCount()
        },
    })

    async function handleDelete(id: string) {
        try {
            await update({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
        if (!searchText) return <>{text}</>

        const parts = text.split(new RegExp(`(${searchText})`, 'gi'))

        return (
            <>
                {parts.map((part) =>
                    part.toLowerCase() === searchText.toLocaleLowerCase() ? (
                        <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </>
        )
    }

    return (
        <div>
            {/* Search + Buttons */}
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm kiếm"
                    prefix={<SearchOutlined />}
                    style={{ width: 260 }}
                    value={filters.exam}
                    onChange={(e) => {
                        setFilters({
                            ...filters,
                            exam: e.target.value,
                        })
                    }}
                />

                <Space>
                    <Button
                        type="primary"
                        disabled={selectedRowKeys.length === 0}
                        onClick={() => {
                            printBatchExamBank({
                                ids: selectedRowKeys,
                            })
                        }}
                    >
                        Tải, In đề hàng loạt
                    </Button>
                    <Button
                        type="primary"
                        disabled={selectedRowKeys.length === 0}
                        onClick={() => {
                            printBatchExplanation({
                                ids: selectedRowKeys,
                            })
                        }}
                    >
                        Tải, In đáp án hàng loạt
                    </Button>
                    <Button type="primary" onClick={onOpenExamImport}>
                        Import đề thi
                    </Button>
                    <Button
                        onClick={() => onOpenExamList({ id: null, subjectVersionId })}
                        type="primary"
                        icon={<PlusOutlined />}
                    >
                        Tạo đề thủ công
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenExamListAuto({ id: null })
                        }}
                        icon={<DatabaseOutlined />}
                    >
                        Sinh đề
                    </Button>
                </Space>
            </Flex>

            {/* Table */}
            <Table
                rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys,
                    onChange: (selectedKeys) => {
                        setSelectedRowKeys(selectedKeys as string[])
                    },
                }}
                filters={filters}
                setFilters={(value) => {
                    setFilters(value)
                    setCurrentPage(1)
                }}
                columns={[
                    {
                        title: 'STT',
                        dataIndex: 'index',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => {
                            return (currentPage - 1) * numberOfPages + index + 1
                        },
                    },
                    {
                        title: 'Mã đề',
                        dataIndex: 'examCode',
                        width: 150,
                        type: 'input',
                        render: (__, record) => {
                            return (
                                <div className="text-left">
                                    <HighlightText
                                        text={record?.examCode || ''}
                                        searchText={filters.exam}
                                    />
                                </div>
                            )
                        },
                    },
                    {
                        title: 'Kỳ thi',
                        dataIndex: 'name',
                        type: 'input',
                        render: (__, record) => {
                            return <span>{record?.exam?.semester?.name || ''}</span>
                        },
                    },
                    {
                        title: 'Hình thức thi',
                        dataIndex: 'examType',
                        width: 150,
                        type: 'select',
                        options: [
                            {
                                label: 'Thi viết',
                                value: 'OfflineWritten',
                            },
                            {
                                label: 'Thi vấn đáp',
                                value: 'Oral',
                            },
                        ],
                        align: 'center' as const,
                        render: (__, record) => {
                            return record?.examType
                                ? record?.examType === 'OfflineWritten'
                                    ? 'Thi viết'
                                    : 'Thi vấn đáp'
                                : ''
                        },
                    },
                    {
                        title: 'Ngày thi',
                        dataIndex: 'examDay',
                        width: 150,
                        type: 'date',
                        align: 'center' as const,
                        render: (_, record) => {
                            return record?.examDay ? formatDate(record?.examDay) : ''
                        },
                    },
                    {
                        title: 'Ngày tạo đề',
                        dataIndex: 'createdAt',
                        width: 150,
                        type: 'date',
                        align: 'center' as const,
                        render: (_, record) => {
                            return record?.createdAt ? formatDate(record?.createdAt) : ''
                        },
                    },
                    {
                        title: 'Số câu hỏi trong đề',
                        dataIndex: 'questions',
                        width: 200,
                        type: 'order',
                        align: 'center' as const,
                        render: (_, record) => {
                            return record?.questions?.length || 0
                        },
                    },
                    {
                        title: 'Lớp môn học',
                        align: 'center',
                        width: 150,
                        render: (_, record) => {
                            return record?.subjectClass || ''
                        },
                    },
                    {
                        title: 'Thao tác',
                        dataIndex: 'actions',
                        align: 'center',
                        width: 140,
                        render: (_, record) => {
                            return (
                                <Row className="justify-center gap-2">
                                    <PrintIcon
                                        title="Tải đề thi"
                                        onClick={() =>
                                            printExamBank({
                                                id: record.id,
                                            })
                                        }
                                    />
                                    <DownloadIcon
                                        title="Tải đáp án"
                                        onClick={() =>
                                            printExplanation({
                                                id: record.id,
                                            })
                                        }
                                    />
                                    <EditIcon
                                        onClick={() =>
                                            onOpenExamList({ id: record.id, subjectVersionId })
                                        }
                                        disabled={record.isLock}
                                    />
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () => handleDelete(record.id),
                                        }}
                                        disabled={record.isLock}
                                    />
                                </Row>
                            )
                        },
                    },
                ]}
                dataSource={exams}
                locale={{ emptyText: 'Không có dữ liệu' }}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: count,
                    onChange: (page, pageSize) => {
                        if (numberOfPages === pageSize) {
                            setCurrentPage(page)
                        } else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                        }
                    },
                    showTotal: (total, range) =>
                        `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                }}
                bordered={false}
                scroll={{ x: 'max-content' }}
                rowKey="id"
            />
        </div>
    )
}
