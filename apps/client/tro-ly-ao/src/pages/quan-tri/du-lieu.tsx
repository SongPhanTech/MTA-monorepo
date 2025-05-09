import { CloseCircleOutlined } from '@ant-design/icons'
import { CardDocument } from '@components/commons/card-document'
import Table from '@components/commons/table'
import { FileUploadIcon } from '@components/commons/upload'
import { PheDuyetTaiLieu, PutCauHoi } from '@components/modal'
import PheDuyetCauHoiThuongGap from '@components/modal/phe-duyet-cau-hoi-thuong-gap'
import ThemTaiLieu from '@components/modal/them-tai-lieu'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db'
import {
    useDeleteDocument,
    useDeleteFAQ,
    useFindManyDocument,
    useFindManyFAQ,
    useUpdateDocument,
} from '@workspace/db/hooks'
import {
    Button,
    Divider,
    Popconfirm,
    Tabs,
    type TabsProps,
    message,
} from 'antd'
import { EditIcon, FileDown, FileUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function Page() {
    const { mutateAsync: update } = useUpdateDocument()
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

    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
        },
        where: {
            status: $Enums.DocumentStatus.APPROVE,
        },
    })

    const { data: faqs = [] } = useFindManyFAQ({
        include: {
            uploadedBy: true,
        },
        where: {
            status: $Enums.DocumentStatus.APPROVE,
        },
    })

    const [selectedDocument, setSelectedDocument] =
        useState<(typeof documents)[0]>()

    const [selectedFAQ, setSelectedFAQ] = useState<(typeof faqs)[0]>()

    const { data: documentsPendingOrDeny = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
        },
        where: {
            status: {
                in: [$Enums.DocumentStatus.PENDING, $Enums.DocumentStatus.DENY],
            },
        },
    })

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

    const onDownload = async (url: string, fileName: string) => {
        const response = await fetch(url)
        if (!response.ok) return message.error('Lỗi khi tải file')
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
    }
    const { mutateAsync: deleteDocument } = useDeleteDocument()
    const { mutateAsync: deleteFAQ } = useDeleteFAQ()

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Tài liệu',
            children: (
                <div className="flex gap-1">
                    <div className="bg-white p-4 rounded-md shadow-md flex-1">
                        <span className="text-xl font-semibold text-gray-700">
                            Tài liệu
                        </span>
                        <div className="flex flex-wrap gap-4 max-h-[100vh] overflow-y-scroll mt-4">
                            <div
                                onClick={openAddTaiLieu}
                                className="text-primary border-2 border-dashed border-primary rounded-lg w-[150px] h-[150px] gap-4 flex flex-col justify-center items-center cursor-pointer hover:bg-primary/10"
                            >
                                <FileUp size={40} strokeWidth={1} />
                                <span>Tải lên</span>
                            </div>
                            {documents.map((item) => (
                                <CardDocument
                                    key={item.id}
                                    onDelete={async () => {
                                        try {
                                            await update({
                                                where: { id: item.id },
                                                data: {
                                                    deletedAt: new Date(),
                                                },
                                            })
                                        } catch (error) {
                                            message.error(
                                                'Xóa tài liệu thất bại'
                                            )
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedDocument(item)
                                    }}
                                    {...item}
                                />
                            ))}
                        </div>
                        <div className="text-xl font-semibold text-gray-700 mt-4">
                            Tài liệu chờ duyệt
                        </div>
                        <Table
                            onRow={(item) => {
                                return {
                                    className: 'cursor-pointer',
                                    onClick: (e) => {
                                        e.stopPropagation()
                                        setSelectedDocument(item)
                                    },
                                }
                            }}
                            columns={[
                                {
                                    title: 'Tên tài liệu',
                                    dataIndex: 'title',
                                    className: 'cursor-pointer',
                                    render: (value, { fileType }) => {
                                        return (
                                            <span className="flex items-center gap-2">
                                                <FileUploadIcon
                                                    fileType={fileType}
                                                    className="w-[24px] h-[24px]"
                                                />
                                                {value}
                                            </span>
                                        )
                                    },
                                },
                                {
                                    title: 'Loại tài liệu',
                                    dataIndex: 'type',
                                    render: (value) => {
                                        return DOCUMENT_TYPE.find(
                                            (item) => item.value === value
                                        )?.label
                                    },
                                },
                                {
                                    title: 'Kích thước',
                                    dataIndex: 'fileSize',
                                    render: (value) =>
                                        formatNiceBytes(`${value}`),
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
                                            openPheDuyetTaiLieu(record.id)
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
                            data={documentsPendingOrDeny}
                        />
                    </div>
                    {!!selectedDocument && (
                        <div className="min-w-[460px] bg-white p-4 rounded-md shadow-md h-min-[100vh] relative">
                            <div
                                onClick={() => setSelectedDocument(undefined)}
                                className="absolute top-4 right-4 cursor-pointer"
                            >
                                <CloseCircleOutlined className="text-lg" />
                            </div>
                            <div className="flex flex-col gap-4 items-center">
                                <FileUploadIcon
                                    className="w-[180px] h-[180px]"
                                    fileType={selectedDocument.fileType}
                                />
                                <span className="font-bold text-lg">
                                    {selectedDocument.title}
                                </span>
                            </div>
                            <Divider />
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
                                                    selectedDocument.type
                                            )?.label
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold">Kích thước</p>
                                    <p>
                                        {formatNiceBytes(
                                            selectedDocument.fileSize
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold">Người đăng</p>
                                    <p>{selectedDocument.uploadedBy.name}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Ngày đăng</p>
                                    <p>
                                        {formatDateReadable(
                                            selectedDocument.createdAt
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Divider />
                            <div className="flex gap-2">
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDownload(
                                            getMinioUrl(selectedDocument.uri),
                                            selectedDocument.title ||
                                                selectedDocument.id
                                        )
                                    }}
                                    className="bg-primary text-white flex-1 h-[40px]"
                                >
                                    <FileDown />
                                    Tải xuống
                                </Button>
                                <Popconfirm
                                    placement="topLeft"
                                    title="Xác nhận xóa dữ liệu?"
                                    description="Dữ liệu sẽ bị xóa vĩnh viễn"
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                    onConfirm={async () => {
                                        try {
                                            await deleteDocument({
                                                where: {
                                                    id: selectedDocument.id,
                                                },
                                            })
                                            setSelectedDocument(undefined)
                                        } catch (error) {
                                            message.error(
                                                'Xóa tài liệu thất bại'
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
                    )}
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
        <div>
            <Tabs
                defaultActiveKey="1"
                items={items}
                renderTabBar={(props, TabBar) => (
                    <TabBar
                        {...props}
                        className="bg-white shadow-lg px-4 rounded-md"
                    />
                )}
            />
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
