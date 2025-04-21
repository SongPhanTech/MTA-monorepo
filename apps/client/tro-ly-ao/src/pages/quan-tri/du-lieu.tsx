import { CardDocument } from '@components/commons/card-document'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import AddTaiLieu from '@components/modal/add-tai-lieu'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db'
import {
    useDeleteDocument,
    useFindManyDocument,
    useUpdateDocument,
} from '@workspace/db/hooks'
import { Tabs, type TabsProps, message } from 'antd'
import { FileUp } from 'lucide-react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function Page() {
    const { mutateAsync: update } = useUpdateDocument()
    const { onOpen: openAddTaiLieu } = useDisclosure({
        tag: AddTaiLieu.name,
    })
    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
        },
        where: {
            status: $Enums.DocumentStatus.APPROVE,
        },
    })

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

    const { mutateAsync: deleteDocument } = useDeleteDocument()

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Tài liệu',
            children: (
                <div className="bg-white p-4 rounded-md shadow-md">
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
                                        message.error('Xóa tài liệu thất bại')
                                    }
                                }}
                                {...item}
                            />
                        ))}
                    </div>
                    <div className="text-xl font-semibold text-gray-700 mt-4">
                        Tài liệu chờ duyệt
                    </div>
                    <Table
                        columns={[
                            {
                                title: 'Tên tài liệu',
                                dataIndex: 'title',
                                className: 'cursor-pointer',
                                onCell: (item) => {
                                    return {
                                        onClick: () => {
                                            window.open(
                                                getMinioUrl(item.uri),
                                                '_blank'
                                            )
                                        },
                                    }
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
                                render: (value) => formatNiceBytes(`${value}`),
                            },
                            {
                                title: 'Người tải lên',
                                dataIndex: 'uploadedBy',
                                render: (value) => value.name,
                            },
                            {
                                title: 'Ngày tải lên',
                                dataIndex: 'createdAt',
                                render: (value) => formatDateReadable(value),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                render: (value) => {
                                    if (
                                        value === $Enums.DocumentStatus.PENDING
                                    ) {
                                        return 'Chờ duyệt'
                                    }
                                    if (value === $Enums.DocumentStatus.DENY) {
                                        return 'Từ chối'
                                    }
                                    return 'Không xác định'
                                },
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    return (
                                        <div className="flex gap-4 justify-center">
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: async () => {
                                                        try {
                                                            await deleteDocument(
                                                                {
                                                                    where: {
                                                                        id: record.id,
                                                                    },
                                                                }
                                                            )
                                                        } catch (error) {
                                                            message.error(
                                                                'Xóa tài liệu thất bại'
                                                            )
                                                        }
                                                    },
                                                }}
                                            />
                                        </div>
                                    )
                                },
                            },
                        ]}
                        data={documentsPendingOrDeny}
                    />
                </div>
            ),
        },
        {
            key: '2',
            label: 'Câu hỏi thường gặp',
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
