import { AuditOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { FileUploadIcon } from '@components/commons/upload'
import DeleteIcon from '@components/icons/delete'
import DefaultLayout from '@layouts/default-layout'
import { cn, formatDateReadable, formatNiceBytes } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    useCountDocument,
    useCountFAQ,
    useDeleteDocument,
    useDeleteFAQ,
    useFindManyDocument,
    useFindManyFAQ,
} from '@workspace/db/hooks'
import { Button, Input, message, Tabs, type TabsProps, Tag, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { deleteVectorRecordFAQ, deleteVectorRecordHoiDap } from '@/api/chunking_and_vectorize'
import { useTopics } from '@/hooks/useTopics'

function Page() {
    const { topicOptions } = useTopics()
    const [filters, setFilters] = useState<{
        title: string
        status: $Enums.DocumentStatus
    }>({
        title: '',
        status: $Enums.DocumentStatus.APPROVE,
    })
    const [tableParams, setTableParams] = useState({
        pagination: { current: 1, pageSize: 10, total: 10 },
    })
    // FAQ pagination/filter states
    const [faqParams, setFaqParams] = useState({
        pagination: { current: 1, pageSize: 10, total: 10 },
    })
    const [faqFilter, setFaqFilter] = useState<{
        question: string
        status: $Enums.DocumentStatus
    }>({
        question: '',
        status: $Enums.DocumentStatus.APPROVE,
    })
    const { onOpen: openAddTaiLieu } = useDisclosure({
        tag: 'ThemTaiLieu',
    })

    const { onOpen: openPheDuyetTaiLieu } = useDisclosure<string>({
        tag: 'PheDuyetTaiLieu',
    })

    const { onOpen: openPheDuyetCauHoiThuongGap } = useDisclosure<string>({
        tag: 'PheDuyetCauHoiThuongGap',
    })

    const { onOpen: openPutCauHoi } = useDisclosure<string>({
        tag: 'PutCauHoi',
    })

    const { onOpen: openPreviewTaiLieu } = useDisclosure<string>({
        tag: 'PreviewTaiLieu',
    })

    const { onOpen: openSuaTaiLieu } = useDisclosure<string>({
        tag: 'SuaTaiLieu',
    })
    const { data: totalCountDocument = 0 } = useCountDocument()
    // Count pending documents
    const { data: totalPendingDocument = 0 } = useCountDocument({
        where: { status: $Enums.DocumentStatus.PENDING },
    })
    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
            topics: {
                include: {
                    topic: true,
                },
            },
            classification: true,
        },
        where: {
            status: filters.status,
            title: {
                contains: filters.title,
                mode: 'insensitive',
            },
        },
        skip: (tableParams.pagination.current - 1) * tableParams.pagination.pageSize,
        take: tableParams.pagination.pageSize,
    })
    useEffect(() => {
        setTableParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                total: totalCountDocument,
            },
        }))
    }, [totalCountDocument])
    const { data: totalCountFAQ = 0 } = useCountFAQ()
    const { data: totalPendingFAQ = 0 } = useCountFAQ({
        where: { status: $Enums.DocumentStatus.PENDING },
    })
    const { data: faqs = [] } = useFindManyFAQ({
        include: {
            uploadedBy: true,
            topic: true,
        },
        where: {
            status: faqFilter.status,
            question: {
                contains: faqFilter.question,
                mode: 'insensitive',
            },
        },
        skip: (faqParams.pagination.current - 1) * faqParams.pagination.pageSize,
        take: faqParams.pagination.pageSize,
    })
    const { mutateAsync: deleteDocument } = useDeleteDocument()
    const handleDeleteDocument = async (id: string) => {
        if (!id) return

        try {
            const vectorResult = await deleteVectorRecordHoiDap(id)

            if (vectorResult?.error === 'True') {
                message.error(vectorResult?.message || 'Đã xảy ra lỗi khi xoá vector tài liệu')
                return
            }

            await deleteDocument({ where: { id } })
            message.success('Xoá tài liệu thành công')
        } catch (_error) {
            message.error('Xoá tài liệu thất bại')
        }
    }

    const { mutateAsync: deleteFAQ } = useDeleteFAQ()
    const handleDeleteFAQ = async (id: string) => {
        if (!id) return
        try {
            const vectorResult = await deleteVectorRecordFAQ(id)
            if (vectorResult?.error === 'True') {
                message.error(vectorResult?.message || 'Đã xảy ra lỗi khi xoá vector câu hỏi')
                return
            }
            await deleteFAQ({ where: { id } })
            message.success('Xoá câu hỏi thành công')
        } catch (_error) {
            message.error('Xoá câu hỏi thất bại')
        }
    }
    useEffect(() => {
        setFaqParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                total: totalCountFAQ,
            },
        }))
    }, [totalCountFAQ])

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Tài liệu',
            children: (
                <div className="flex gap-4 h-full overflow-hidden">
                    <div className="flex-1 overflow-auto pr-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-semibold text-gray-700">
                                    Danh sách tài liệu
                                </span>
                            </div>
                            <Button onClick={openAddTaiLieu} type="primary">
                                Tải lên tài liệu
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Input
                                placeholder="Tìm theo tên tài liệu"
                                allowClear
                                onPressEnter={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        title: e.currentTarget.value,
                                    }))
                                }
                                style={{ width: 300 }}
                            />
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    filters.status === $Enums.DocumentStatus.APPROVE
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.APPROVE,
                                    }))
                                }
                            >
                                Đã duyệt
                            </Button>
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    filters.status === $Enums.DocumentStatus.PENDING
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.PENDING,
                                    }))
                                }
                            >
                                Chờ duyệt ({totalPendingDocument})
                            </Button>
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    filters.status === $Enums.DocumentStatus.DENY
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.DENY,
                                    }))
                                }
                            >
                                Từ chối
                            </Button>
                        </div>
                        <Table
                            rowKey="id"
                            scroll={{ x: 1200 }}
                            // onRow={(item) => ({
                            //     className: 'cursor-pointer hover:bg-gray-50',
                            //     onClick: () => openPreviewTaiLieu(item.id),
                            // })}
                            columns={[
                                {
                                    title: 'STT',
                                    dataIndex: 'index',
                                    width: 60,
                                    align: 'center',
                                    render: (_, __, index) =>
                                        (tableParams.pagination.current - 1) *
                                            tableParams.pagination.pageSize +
                                        index +
                                        1,
                                },
                                {
                                    title: 'Tên tài liệu',
                                    dataIndex: 'title',
                                    width: 400,
                                    render: (value, { fileType }) => (
                                        <span className="flex items-center gap-2">
                                            <FileUploadIcon
                                                fileType={fileType}
                                                className="w-[24px] h-[24px]"
                                            />
                                            {value}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Loại tài liệu',
                                    dataIndex: 'topics',
                                    width: 200,
                                    render: (topics: any[]) => {
                                        if (!topics || topics.length === 0) {
                                            return (
                                                <span className="text-gray-400">
                                                    Chưa phân loại
                                                </span>
                                            )
                                        }
                                        const maxDisplay = 1
                                        const displayTopics = topics.slice(0, maxDisplay)
                                        const remaining = topics.length - maxDisplay

                                        return (
                                            <div className="flex flex-wrap gap-1">
                                                {displayTopics.map((dt) => (
                                                    <Tag key={dt.id} color="blue">
                                                        {dt.topic?.name}
                                                    </Tag>
                                                ))}
                                                {remaining > 0 && (
                                                    <Tag color="default">+{remaining}</Tag>
                                                )}
                                            </div>
                                        )
                                    },
                                },
                                {
                                    title: 'Phân loại',
                                    dataIndex: 'classification',
                                    width: 160,
                                    align: 'center',
                                    render: (classification: any) => {
                                        if (!classification) {
                                            return <span className="text-gray-400">-</span>
                                        }
                                        return <Tag color="purple">{classification.name}</Tag>
                                    },
                                },
                                {
                                    title: 'Người tải lên',
                                    dataIndex: 'uploadedBy',
                                    width: 140,
                                    render: (value) => value.name,
                                },
                                {
                                    title: 'Kích thước',
                                    dataIndex: 'fileSize',
                                    align: 'center',
                                    width: 120,
                                    render: (value) => formatNiceBytes(`${value}`),
                                },
                                {
                                    title: 'Ngày tải lên',
                                    dataIndex: 'createdAt',
                                    width: 180,
                                    align: 'center',
                                    render: (value) => formatDateReadable(value),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    align: 'center',
                                    width: 120,
                                    render: (value: $Enums.DocumentStatus) => {
                                        const statusMap = {
                                            [$Enums.DocumentStatus.APPROVE]: {
                                                label: 'Đã duyệt',
                                                color: 'green',
                                            },
                                            [$Enums.DocumentStatus.PENDING]: {
                                                label: 'Chờ duyệt',
                                                color: 'gold',
                                            },
                                            [$Enums.DocumentStatus.DENY]: {
                                                label: 'Từ chối',
                                                color: 'red',
                                            },
                                        }
                                        const status = statusMap[value] || {
                                            label: 'Không xác định',
                                            color: 'default',
                                        }
                                        return (
                                            <Tag
                                                color={status.color}
                                                className="px-3 py-1 text-sm rounded"
                                            >
                                                {status.label}
                                            </Tag>
                                        )
                                    },
                                },
                                {
                                    title: 'Thao tác',
                                    key: 'action',
                                    align: 'center',
                                    width: 120,
                                    fixed: 'right',
                                    render: (_, record) => (
                                        <div className="flex items-center justify-center gap-2">
                                            {(record.status === $Enums.DocumentStatus.PENDING ||
                                                record.status === $Enums.DocumentStatus.DENY) && (
                                                <Tooltip title="Phê duyệt" placement="top">
                                                    <AuditOutlined
                                                        onClick={() =>
                                                            openPheDuyetTaiLieu(record.id)
                                                        }
                                                        className="text-green-600 cursor-pointer text-lg"
                                                    />
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Chỉnh sửa" placement="top">
                                                <EditOutlined
                                                    onClick={() => openSuaTaiLieu(record.id)}
                                                    className="text-orange-600 cursor-pointer text-lg"
                                                />
                                            </Tooltip>
                                            <Tooltip title="Xem chi tiết" placement="top">
                                                <EyeOutlined
                                                    onClick={() => openPreviewTaiLieu(record.id)}
                                                    className="text-blue-700 cursor-pointer text-lg"
                                                />
                                            </Tooltip>
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDeleteDocument(record.id),
                                                }}
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                            data={documents || []}
                            pagination={{
                                ...tableParams.pagination,
                                total: totalCountDocument,
                            }}
                            onChange={(pagination) =>
                                setTableParams({
                                    pagination: {
                                        current: pagination.current ?? 1,
                                        pageSize: pagination.pageSize ?? 10,
                                        total: pagination.total ?? 0,
                                    },
                                })
                            }
                        />
                    </div>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Câu hỏi thường gặp',
            children: (
                <div className="flex gap-1 h-full overflow-hidden">
                    <div className="flex-1 overflow-auto pr-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-semibold text-gray-700">
                                    Câu hỏi thường gặp
                                </span>
                            </div>
                            <Button onClick={() => openPutCauHoi()} type="primary">
                                Thêm câu hỏi
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Input
                                placeholder="Tìm theo nội dung câu hỏi"
                                allowClear
                                onPressEnter={(e) =>
                                    setFaqFilter((prev) => ({
                                        ...prev,
                                        question: e.currentTarget.value,
                                    }))
                                }
                                style={{ width: 300 }}
                            />
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    faqFilter.status === $Enums.DocumentStatus.APPROVE
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFaqFilter((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.APPROVE,
                                    }))
                                }
                            >
                                Đã duyệt
                            </Button>
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    faqFilter.status === $Enums.DocumentStatus.PENDING
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFaqFilter((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.PENDING,
                                    }))
                                }
                            >
                                Chờ duyệt ({totalPendingFAQ})
                            </Button>
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    faqFilter.status === $Enums.DocumentStatus.DENY
                                        ? 'bg-primary text-white border-primary'
                                        : 'text-primary border-primary'
                                )}
                                onClick={() =>
                                    setFaqFilter((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.DENY,
                                    }))
                                }
                            >
                                Từ chối
                            </Button>
                        </div>
                        <Table
                            scroll={{ x: 1200 }}
                            // onRow={(item) => {
                            //     return {
                            //         className: 'cursor-pointer',
                            //         onClick: () => openPutCauHoi(item.id),
                            //     }
                            // }}
                            columns={[
                                {
                                    title: 'STT',
                                    dataIndex: 'index',
                                    width: 60,
                                    align: 'center',
                                    render: (_, __, index) =>
                                        (faqParams.pagination.current - 1) *
                                            faqParams.pagination.pageSize +
                                        index +
                                        1,
                                },
                                {
                                    title: 'Câu hỏi',
                                    dataIndex: 'question',
                                    className: 'cursor-pointer',
                                    width: 300,
                                },
                                {
                                    title: 'Loại câu hỏi',
                                    dataIndex: 'topic',
                                    width: 200,
                                    align: 'center',
                                    render: (topic) => topic?.name || 'Chưa phân loại',
                                },
                                {
                                    title: 'Câu trả lời',
                                    dataIndex: 'answer',
                                    width: 400,
                                    render: (value: string) =>
                                        value?.length > 200 ? `${value.slice(0, 200)}...` : value,
                                },
                                {
                                    title: 'Người tải lên',
                                    dataIndex: 'uploadedBy',
                                    width: 140,
                                    render: (value) => value.name,
                                },
                                {
                                    title: 'Ngày tải lên',
                                    dataIndex: 'createdAt',
                                    width: 180,
                                    render: (value: string | Date) => formatDateReadable(value),
                                },
                                ...(faqFilter.status === $Enums.DocumentStatus.DENY
                                    ? [
                                          {
                                              title: 'Lý do từ chối',
                                              dataIndex: 'reason',
                                              width: 200,

                                              render: (value: any) => value,
                                          },
                                      ]
                                    : []),
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    align: 'center',
                                    width: 100,
                                    render: (value: $Enums.DocumentStatus) => {
                                        const statusMap = {
                                            [$Enums.DocumentStatus.APPROVE]: {
                                                label: 'Đã duyệt',
                                                color: 'green',
                                            },
                                            [$Enums.DocumentStatus.PENDING]: {
                                                label: 'Chờ duyệt',
                                                color: 'gold',
                                            },
                                            [$Enums.DocumentStatus.DENY]: {
                                                label: 'Từ chối',
                                                color: 'red',
                                            },
                                        }
                                        const status = statusMap[value] || {
                                            label: 'Không xác định',
                                            color: 'default',
                                        }
                                        return (
                                            <Tag
                                                color={status.color}
                                                className="px-3 py-1 text-sm rounded"
                                            >
                                                {status.label}
                                            </Tag>
                                        )
                                    },
                                },
                                {
                                    title: 'Thao tác',
                                    key: 'action',
                                    align: 'center',
                                    width: 100,
                                    fixed: 'right',
                                    render: (_, record) => (
                                        <div className="flex items-center justify-center gap-2">
                                            {(record.status === $Enums.DocumentStatus.PENDING ||
                                                record.status === $Enums.DocumentStatus.DENY) && (
                                                <Tooltip title="Phê duyệt" placement="top">
                                                    <AuditOutlined
                                                        onClick={() =>
                                                            openPheDuyetCauHoiThuongGap(record.id)
                                                        }
                                                        className="text-green-600 cursor-pointer text-lg"
                                                    />
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Xem chi tiết" placement="leftTop">
                                                <EyeOutlined
                                                    onClick={() => openPutCauHoi(record.id)}
                                                    className="text-blue-700 cursor-pointer text-lg"
                                                />
                                            </Tooltip>
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDeleteFAQ(record.id),
                                                }}
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                            data={faqs}
                            pagination={{
                                ...faqParams.pagination,
                                onChange: (page, pageSize) =>
                                    setFaqParams({
                                        pagination: {
                                            current: page,
                                            pageSize,
                                            total: faqParams.pagination.total,
                                        },
                                    }),
                            }}
                        />
                    </div>
                </div>
            ),
        },
    ]

    return (
        <div className="h-full">
            <Tabs
                defaultActiveKey="1"
                items={items}
                renderTabBar={(props, TabBar) => (
                    <TabBar {...props} className="bg-white px-4 rounded-md" />
                )}
            />
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Quản trị dữ liệu' }]}>{page}</DefaultLayout>
}

export default Page
