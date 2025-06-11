import { CloseCircleOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { FileUploadIcon } from '@components/commons/upload'
import { PheDuyetTaiLieu, PreviewTaiLieu, PutCauHoi } from '@components/modal'
import PheDuyetCauHoiThuongGap from '@components/modal/phe-duyet-cau-hoi-thuong-gap'
import ThemTaiLieu from '@components/modal/them-tai-lieu'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable, formatNiceBytes, cn } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    useCountDocument,
    useDeleteFAQ,
    useFindManyDocument,
    useFindManyFAQ,
    useUpdateDocument,
} from '@workspace/db/hooks'
import {
    Button,
    Divider,
    Input,
    Popconfirm,
    Select,
    Tabs,
    type TabsProps,
    message,
} from 'antd'
import { EditIcon, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function Page() {
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
    const { onOpen: openAddTaiLieu } = useDisclosure({
        tag: ThemTaiLieu.name,
    })

    const { onOpen: openPheDuyetTaiLieu } = useDisclosure<string>({
        tag: PheDuyetTaiLieu.name,
    })

    const { onOpen: openPheDuyetCauHoiThuongGap } = useDisclosure<string>({
        tag: PheDuyetCauHoiThuongGap.name,
    })

    const { onOpen: openPutCauHoi } = useDisclosure<string>({
        tag: PutCauHoi.name,
    })

    const { onOpen: openPreviewTaiLieu } = useDisclosure<string>({
        tag: PreviewTaiLieu.name,
    })
    const { data: totalCountDocument = 0 } = useCountDocument()
    // Đếm số tài liệu chờ duyệt
    const { data: pendingCount = 0 } = useCountDocument({
        where: { status: $Enums.DocumentStatus.PENDING },
    })
    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
        },
        where: {
            status: filters.status,
            title: {
                contains: filters.title,
                mode: 'insensitive',
            },
        },
        skip:
            (tableParams.pagination.current - 1) *
            tableParams.pagination.pageSize,
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

    const { data: faqs = [] } = useFindManyFAQ({
        include: {
            uploadedBy: true,
        },
        where: {
            status: $Enums.DocumentStatus.APPROVE,
        },
    })

    const [selectedFAQ, setSelectedFAQ] = useState<(typeof faqs)[0]>()

    const { data: faqsPendingOrDeny = [] } = useFindManyFAQ({
        include: {
            uploadedBy: true,
        },
        where: {
            status: {
                in: [$Enums.DocumentStatus.PENDING, $Enums.DocumentStatus.DENY],
            },
        },
    })

    const { mutateAsync: deleteFAQ } = useDeleteFAQ()

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
                                    filters.status ===
                                        $Enums.DocumentStatus.APPROVE
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
                                    'border rounded px-4 py-1 font-medium flex items-center gap-2',
                                    filters.status ===
                                        $Enums.DocumentStatus.PENDING
                                        ? 'bg-[#f8ba00] text-white border-[#f8ba00]'
                                        : 'text-[#f8ba00] border-[#f8ba00]'
                                )}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: $Enums.DocumentStatus.PENDING,
                                    }))
                                }
                            >
                                Chờ duyệt
                                {/* <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                    {pendingCount}
                                </span> */}
                            </Button>
                            <Button
                                className={cn(
                                    'border rounded px-4 py-1 font-medium',
                                    filters.status ===
                                        $Enums.DocumentStatus.DENY
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'text-red-500 border-red-500'
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
                            onRow={(item) => ({
                                className: 'cursor-pointer hover:bg-gray-50',
                                onClick: (e) => {
                                    e.stopPropagation()
                                    // setSelectedDocument(item)
                                    openPreviewTaiLieu(item.id)
                                },
                            })}
                            columns={[
                                {
                                    title: 'STT',
                                    dataIndex: 'index',
                                    width: 40,
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
                                    dataIndex: 'type',
                                    render: (value) =>
                                        DOCUMENT_TYPE.find(
                                            (item) => item.value === value
                                        )?.label,
                                },
                                {
                                    title: 'Người tải lên',
                                    dataIndex: 'uploadedBy',
                                    render: (value) => value.name,
                                },
                                {
                                    title: 'Kích thước',
                                    dataIndex: 'fileSize',
                                    align: 'center',
                                    width: 120,
                                    render: (value) =>
                                        formatNiceBytes(`${value}`),
                                },
                                {
                                    title: 'Ngày tải lên',
                                    dataIndex: 'createdAt',
                                    width: 180,
                                    align: 'center',
                                    render: (value) =>
                                        formatDateReadable(value),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    width: 120,
                                    className:
                                        'text-center justify-center flex',
                                    onCell: (record) => ({
                                        onClick: (e) => {
                                            e.stopPropagation()
                                            if (
                                                record.status ===
                                                    $Enums.DocumentStatus
                                                        .PENDING ||
                                                record.status ===
                                                    $Enums.DocumentStatus.DENY
                                            ) {
                                                openPheDuyetTaiLieu(record.id)
                                            }
                                        },
                                    }),
                                    render: (value: $Enums.DocumentStatus) => {
                                        const statusMap: Record<
                                            $Enums.DocumentStatus,
                                            {
                                                label: string
                                                textColor: string
                                                bgColor: string
                                                borderColor: string
                                            }
                                        > = {
                                            [$Enums.DocumentStatus.APPROVE]: {
                                                label: 'Đã duyệt',
                                                textColor: 'text-white',
                                                bgColor: 'bg-primary',
                                                borderColor: 'border-primary',
                                            },
                                            [$Enums.DocumentStatus.PENDING]: {
                                                label: 'Chờ duyệt',
                                                textColor: 'text-white',
                                                bgColor: 'bg-[#f8ba00]',
                                                borderColor: 'border-[#f8ba00]',
                                            },
                                            [$Enums.DocumentStatus.DENY]: {
                                                label: 'Từ chối',
                                                textColor: 'text-white',
                                                bgColor: 'bg-red-500',
                                                borderColor: 'border-red-500',
                                            },
                                        }

                                        const status = statusMap[value] || {
                                            label: 'Không xác định',
                                            textColor: 'text-gray-700',
                                            bgColor: 'bg-gray-100',
                                            borderColor: 'border-gray-300',
                                        }

                                        return (
                                            <div
                                                className={`${status.textColor} ${status.bgColor} ${status.borderColor} border rounded-md px-2 py-1 w-fit`}
                                            >
                                                {status.label}
                                            </div>
                                        )
                                    },
                                },
                            ]}
                            data={documents || []}
                            pagination={tableParams.pagination}
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
                <div className="flex gap-1">
                    <div className="bg-white p-4 rounded-md shadow-md flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-semibold text-gray-700">
                                Câu hỏi thường gặp
                            </span>
                            <Button
                                onClick={() => openPutCauHoi()}
                                type="primary"
                            >
                                Thêm câu hỏi
                            </Button>
                        </div>
                        <Table
                            onRow={(item) => {
                                return {
                                    className: 'cursor-pointer',
                                    onClick: (e) => {
                                        e.stopPropagation()
                                        setSelectedFAQ(item)
                                    },
                                }
                            }}
                            columns={[
                                {
                                    title: 'Câu hỏi',
                                    dataIndex: 'question',
                                    className: 'cursor-pointer',
                                },
                                {
                                    title: 'Loại câu hỏi',
                                    dataIndex: 'type',
                                    render: (value) => {
                                        return DOCUMENT_TYPE.find(
                                            (item) => item.value === value
                                        )?.label
                                    },
                                },
                                {
                                    title: 'Câu trả lời',
                                    dataIndex: 'answer',
                                },
                                {
                                    title: 'Người tải lên',
                                    dataIndex: 'uploadedBy',
                                    render: (value) => value.name,
                                },
                                {
                                    title: 'Ngày tải lên',
                                    dataIndex: 'createdAt',
                                    render: (value) =>
                                        formatDateReadable(value),
                                },
                            ]}
                            data={faqs}
                        />
                        <div className="text-xl font-semibold text-gray-700 mt-4">
                            Câu hỏi chờ duyệt
                        </div>
                        <Table
                            onRow={(item) => {
                                return {
                                    className: 'cursor-pointer',
                                    onClick: (e) => {
                                        e.stopPropagation()
                                        setSelectedFAQ(item)
                                    },
                                }
                            }}
                            columns={[
                                {
                                    title: 'Câu hỏi',
                                    dataIndex: 'question',
                                    className: 'cursor-pointer',
                                },
                                {
                                    title: 'Loại câu hỏi',
                                    dataIndex: 'type',
                                    render: (value) => {
                                        return DOCUMENT_TYPE.find(
                                            (item) => item.value === value
                                        )?.label
                                    },
                                },
                                {
                                    title: 'Câu trả lời',
                                    dataIndex: 'answer',
                                },
                                {
                                    title: 'Người tải lên',
                                    dataIndex: 'uploadedBy',
                                    render: (value) => value.name,
                                },
                                {
                                    title: 'Ngày tải lên',
                                    dataIndex: 'createdAt',
                                    render: (value) =>
                                        formatDateReadable(value),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    width: 120,
                                    className:
                                        'text-center justify-center flex',
                                    onCell: (record) => ({
                                        onClick: (e) => {
                                            e.stopPropagation()
                                            openPheDuyetCauHoiThuongGap(
                                                record.id
                                            )
                                        },
                                    }),
                                    render: (value) => {
                                        if (
                                            value ===
                                            $Enums.DocumentStatus.PENDING
                                        ) {
                                            return (
                                                <div className="text-warning-600 bg-warning-100 rounded-md px-2 py-1 w-fit">
                                                    Chờ duyệt
                                                </div>
                                            )
                                        }
                                        if (
                                            value === $Enums.DocumentStatus.DENY
                                        ) {
                                            return (
                                                <div className="text-danger-600 bg-danger-100 rounded-md px-2 py-1 w-fit">
                                                    Từ chối
                                                </div>
                                            )
                                        }
                                        return 'Không xác định'
                                    },
                                },
                            ]}
                            data={faqsPendingOrDeny}
                        />
                    </div>
                    {!!selectedFAQ && (
                        <div className="min-w-[460px] bg-white p-4 rounded-md shadow-md h-min-[100vh] relative">
                            <div
                                onClick={() => setSelectedFAQ(undefined)}
                                className="absolute top-4 right-4 cursor-pointer"
                            >
                                <CloseCircleOutlined className="text-lg" />
                            </div>
                            <div className="flex flex-col justify-between h-full">
                                <div className="flex flex-col gap-2">
                                    <span className="font-semibold text-base">
                                        Thông tin về tài liệu
                                    </span>
                                    <div>
                                        <p className="font-semibold">
                                            Loại tài liệu
                                        </p>
                                        <p>
                                            {
                                                DOCUMENT_TYPE.find(
                                                    (item) =>
                                                        item.value ===
                                                        selectedFAQ.type
                                                )?.label
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Câu hỏi</p>
                                        <p>{selectedFAQ.question}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            Câu trả lời
                                        </p>
                                        <p>{selectedFAQ.answer}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            Ngày đăng
                                        </p>
                                        <p>
                                            {formatDateReadable(
                                                selectedFAQ.createdAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <Divider />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                openPutCauHoi(selectedFAQ.id)
                                            }}
                                            className="bg-primary text-white flex-1 h-[40px]"
                                        >
                                            <EditIcon />
                                            Chỉnh sửa
                                        </Button>
                                        <Popconfirm
                                            placement="topLeft"
                                            title="Xác nhận xóa dữ liệu?"
                                            description="Dữ liệu sẽ bị xóa vĩnh viễn"
                                            okText="Đồng ý"
                                            cancelText="Hủy"
                                            onConfirm={async () => {
                                                try {
                                                    await deleteFAQ({
                                                        where: {
                                                            id: selectedFAQ.id,
                                                        },
                                                    })
                                                    setSelectedFAQ(undefined)
                                                } catch (error) {
                                                    message.error(
                                                        'Xóa tài câu hỏi bại'
                                                    )
                                                }
                                            }}
                                        >
                                            <Button className="w-[40px] h-[40px] p-0">
                                                <Trash2 className="w-full h-[24px]" />
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
    ]

    return (
        <div className="h-full overflow-hidden">
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
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
