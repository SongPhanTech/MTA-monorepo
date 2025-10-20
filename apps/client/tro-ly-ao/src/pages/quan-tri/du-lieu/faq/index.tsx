import { AuditOutlined, EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import DefaultLayout from '@layouts/default-layout'
import { cn, formatDateReadable } from '@lib/utils'
import { $Enums } from '@workspace/db'
import { useCountFAQ, useDeleteFAQ, useFindManyFAQ } from '@workspace/db/hooks'
import { Button, Input, message, Tag, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { deleteVectorRecordFAQ } from '@/api/chunking_and_vectorize'

function Page() {
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

    const { onOpen: openPheDuyetCauHoiThuongGap } = useDisclosure<string>({
        tag: 'PheDuyetCauHoiThuongGap',
    })

    const { onOpen: openPutCauHoi } = useDisclosure<string>({
        tag: 'PutCauHoi',
    })

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

    useEffect(() => {
        setFaqParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                total: totalCountFAQ,
            },
        }))
    }, [totalCountFAQ])

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

    return (
        <div className="h-full">
            <div className="flex gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-semibold text-gray-700">
                                Câu hỏi thường gặp
                            </span>
                        </div>
                        <Button onClick={() => openPutCauHoi()} type="primary">
                            Thêm mới
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
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Dữ liệu' }, { title: 'Câu hỏi thường gặp' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
