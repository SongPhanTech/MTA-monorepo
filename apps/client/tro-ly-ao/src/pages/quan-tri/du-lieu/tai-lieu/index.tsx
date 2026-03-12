// Trong code này có code sv: do cả khi upload và download lúc lư

import {
    AuditOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import DocumentSidebar from '@components/commons/document-sidebar'
import Table from '@components/commons/table'
import { FileUploadIcon } from '@components/commons/upload'
import DeleteIcon from '@components/icons/delete'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    useCountDocument,
    useDeleteDocument,
    useDeleteManyDocumentTopic,
    useFindManyDocument,
    useFindManyDocumentClassification,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { TRO_LY_AO_PERMISSION } from '@workspace/router'
import { Button, Input, message, Select, Tabs, Tag, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { deleteVectorRecordHoiDap, reloadBM25 } from '@/api/chunking_and_vectorize'
import { useTopics } from '@/hooks/useTopics'
import { fetchPresignedGetObject } from '@/lib/api/common/commonComponents'

function Page() {
    const { can } = useAbility()
    const [filters, setFilters] = useState<{
        title: string
        status: $Enums.DocumentStatus
        topicId?: string
        classificationId?: string
    }>({
        title: '',
        status: $Enums.DocumentStatus.APPROVE,
    })
    const [tableParams, setTableParams] = useState({
        pagination: { current: 1, pageSize: 10, total: 10 },
    })
    const [isReloading, setIsReloading] = useState(false)
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

    const { onOpen: openAddTaiLieu } = useDisclosure({
        tag: 'ThemTaiLieu',
    })

    const { onOpen: openPheDuyetTaiLieu } = useDisclosure<string>({
        tag: 'PheDuyetTaiLieu',
    })

    const { onOpen: openSuaTaiLieu } = useDisclosure<string>({
        tag: 'SuaTaiLieu',
    })

    const { data: totalPendingDocument = 0 } = useCountDocument({
        where: { status: $Enums.DocumentStatus.PENDING },
    })

    const { selectableTopicOptions } = useTopics()
    const { data: classifications = [] } = useFindManyDocumentClassification({})

    const buildWhereClause = () => {
        const where: any = {
            status: filters.status,
            title: {
                contains: filters.title,
                mode: 'insensitive',
            },
        }

        if (filters.topicId) {
            where.topics = {
                some: {
                    topicId: filters.topicId,
                },
            }
        }

        if (filters.classificationId) {
            where.classificationId = filters.classificationId
        }

        return where
    }

    const { data: totalFilteredDocument = 0 } = useCountDocument({
        where: buildWhereClause(),
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
        where: buildWhereClause(),
        skip: (tableParams.pagination.current - 1) * tableParams.pagination.pageSize,
        take: tableParams.pagination.pageSize,
    })

    useEffect(() => {
        setTableParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                total: totalFilteredDocument,
            },
        }))
    }, [totalFilteredDocument])

    useEffect(() => {
        setTableParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                current: 1,
            },
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.title, filters.topicId, filters.classificationId])

    const { mutateAsync: deleteDocument } = useDeleteDocument()
    const { mutateAsync: deleteManyDocumentTopic } = useDeleteManyDocumentTopic()

    const onDownload = async (objectName: string, fileName: string) => {
        try {
            // Kiểm tra nếu uri là blob URL (dữ liệu cũ bị lỗi)
            if (objectName.startsWith('blob:')) {
                message.error('Tài liệu này không thể tải xuống. Vui lòng xóa và tải lên lại.')
                return
            }

            // Loại bỏ bucket name prefix nếu có (fix duplicate mta/mta)
            let cleanObjectName = objectName
            if (objectName.startsWith('mta/')) {
                cleanObjectName = objectName.substring(4) // Bỏ "mta/"
            }

            // Lấy presigned URL từ API MinIO
            const result = await fetchPresignedGetObject({
                queryParams: { objectName: cleanObjectName },
            })

            const presignedUrl = result.url
            if (!presignedUrl) {
                message.error('Không thể lấy đường dẫn tải file')
                return
            }

            // Tải file từ presigned URL
            const response = await fetch(presignedUrl)
            if (!response.ok) {
                message.error('Lỗi khi tải file')
                return
            }
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (_error) {
            message.error('Lỗi khi tải file')
        }
    }

    const handleDeleteDocument = async (id: string) => {
        if (!id) return

        try {
            const vectorResult = await deleteVectorRecordHoiDap(id)

            if (vectorResult?.error === 'True') {
                message.error(vectorResult?.message || 'Đã xảy ra lỗi khi xoá vector tài liệu')
                return
            }

            // xóa các DocumentTopic liên quan trước
            await deleteManyDocumentTopic({ where: { documentId: id } })

            // sau đó xóa Document
            await deleteDocument({ where: { id } })
            message.success('Xoá tài liệu thành công')
        } catch (_error) {
            message.error('Xoá tài liệu thất bại')
        }
    }

    const handleReloadBM25 = async () => {
        setIsReloading(true)
        try {
            const result = await reloadBM25('')

            if (result?.error === 'True') {
                message.error(result?.message || 'Đã xảy ra lỗi khi reload BM25')
                return
            }

            message.success('Reload BM25 thành công')
        } catch (_error) {
            message.error('Reload BM25 thất bại')
        } finally {
            setIsReloading(false)
        }
    }

    return (
        <div className="h-full">
            <div className="flex gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-semibold text-gray-700">
                                Danh sách tài liệu
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleReloadBM25}
                                loading={isReloading}
                            >
                                Làm mới
                            </Button>
                            {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU, 'THEM') && (
                                <Button onClick={openAddTaiLieu} type="primary">
                                    Thêm mới
                                </Button>
                            )}
                        </div>
                    </div>
                    <Tabs
                        activeKey={filters.status}
                        onChange={(key) =>
                            setFilters((prev) => ({
                                ...prev,
                                status: key as $Enums.DocumentStatus,
                            }))
                        }
                        items={[
                            {
                                key: $Enums.DocumentStatus.APPROVE,
                                label: 'Đã duyệt',
                            },
                            {
                                key: $Enums.DocumentStatus.PENDING,
                                label: `Chờ duyệt (${totalPendingDocument})`,
                            },
                            {
                                key: $Enums.DocumentStatus.DENY,
                                label: 'Từ chối',
                            },
                        ]}
                    />
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                        <Select
                            placeholder="Loại tài liệu"
                            allowClear
                            style={{ width: 200 }}
                            value={filters.topicId}
                            onChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    topicId: value,
                                }))
                            }
                            options={selectableTopicOptions.map((topic) => ({
                                label: topic.name,
                                value: topic.id,
                            }))}
                        />
                        <Select
                            placeholder="Phân loại"
                            allowClear
                            style={{ width: 200 }}
                            value={filters.classificationId}
                            onChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    classificationId: value,
                                }))
                            }
                            options={classifications.map((classification) => ({
                                label: classification.name,
                                value: classification.id,
                            }))}
                        />
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
                                        return <span className="text-gray-400">Chưa phân loại</span>
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
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU, 'DUYET') &&
                                            (record.status === $Enums.DocumentStatus.PENDING ||
                                                record.status === $Enums.DocumentStatus.DENY) && (
                                                <Tooltip title="Phê duyệt" placement="top">
                                                    <AuditOutlined
                                                        onClick={() => openPheDuyetTaiLieu(record.id)}
                                                        className="text-green-600 cursor-pointer text-lg"
                                                    />
                                                </Tooltip>
                                            )}
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU, 'TAI_TEP') &&
                                            record.uri && (
                                                <Tooltip title="Tải xuống" placement="top">
                                                    <DownloadOutlined
                                                        onClick={() =>
                                                            onDownload(
                                                                record.uri!,
                                                                record.title || record.id
                                                            )
                                                        }
                                                        className="text-cyan-600 cursor-pointer text-lg"
                                                    />
                                                </Tooltip>
                                            )}
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU, 'SUA') && (
                                            <Tooltip title="Chỉnh sửa" placement="top">
                                                <EditOutlined
                                                    onClick={() => openSuaTaiLieu(record.id)}
                                                    className="text-orange-600 cursor-pointer text-lg"
                                                />
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Xem chi tiết" placement="top">
                                            <EyeOutlined
                                                onClick={() => {
                                                    setSelectedDocumentId(record.id)
                                                }}
                                                className="text-blue-700 cursor-pointer text-lg"
                                            />
                                        </Tooltip>
                                        {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_DU_LIEU_TAI_LIEU, 'XOA') && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDeleteDocument(record.id),
                                                }}
                                            />
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                        data={documents || []}
                        pagination={{
                            ...tableParams.pagination,
                            total: totalFilteredDocument,
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
            <DocumentSidebar
                documentId={selectedDocumentId}
                citationContent={null}
                onClose={() => setSelectedDocumentId(null)}
            />
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Dữ liệu' }, { title: 'Tài liệu' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
