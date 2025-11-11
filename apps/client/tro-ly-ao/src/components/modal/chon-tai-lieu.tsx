import { FileTextOutlined } from '@ant-design/icons'
import { useFindManyDocument } from '@workspace/db/hooks'
import { Input, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface Document {
    id: string
    title?: string | null
    fileType?: string | null
    classification?: {
        name: string
    } | null
    topics?: {
        topic: {
            name: string
        }
    }[]
}

interface ChonTaiLieuInput {
    ids: string[]
    callback: (ids: string[]) => void
}

const ChonTaiLieu = () => {
    const { isOpen, onClose, input } = useDisclosure<ChonTaiLieuInput>({
        tag: 'ChonTaiLieu',
    })

    const selectedDocumentIds = input?.ids || []
    const callback = input?.callback

    const [searchText, setSearchText] = useState('')
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedDocumentIds)

    // Fetch approved documents only
    const { data: documents = [], isLoading } = useFindManyDocument(
        {
            where: {
                status: 'APPROVE',
                active: true,
            },
            include: {
                classification: true,
                topics: {
                    include: {
                        topic: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        },
        {
            enabled: isOpen,
        }
    )

    // Filter documents by search text
    const filteredDocuments = useMemo(() => {
        if (!searchText.trim()) return documents

        const lowerSearch = searchText.toLowerCase()
        return documents.filter((doc) => doc.title?.toLowerCase().includes(lowerSearch))
    }, [documents, searchText])

    const columns: ColumnsType<Document> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => (
                <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-primary" />
                    <span className="font-medium">{title || 'Không có tiêu đề'}</span>
                </div>
            ),
        },
        {
            title: 'Chủ đề',
            dataIndex: 'topics',
            key: 'topics',
            width: 250,
            render: (topics: Document['topics']) => (
                <div className="flex flex-wrap gap-1">
                    {topics && topics.length > 0 ? (
                        topics.map((t, idx) => (
                            <Tag key={idx} color="blue">
                                {t.topic.name}
                            </Tag>
                        ))
                    ) : (
                        <span className="text-gray-400">Không có</span>
                    )}
                </div>
            ),
        },
        {
            title: 'Phân loại',
            dataIndex: 'classification',
            key: 'classification',
            width: 150,
            render: (classification: Document['classification']) =>
                classification ? (
                    <Tag color="purple">{classification.name}</Tag>
                ) : (
                    <span className="text-gray-400">Không có</span>
                ),
        },
    ]

    const rowSelection = {
        selectedRowKeys: tempSelectedIds,
        onChange: (selectedRowKeys: React.Key[]) => {
            setTempSelectedIds(selectedRowKeys as string[])
        },
    }

    const handleOk = () => {
        callback?.(tempSelectedIds)
        onClose()
    }

    const handleCancel = () => {
        setTempSelectedIds(selectedDocumentIds)
        setSearchText('')
        onClose()
    }

    // Reset temp selection when modal opens
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useMemo(() => {
        if (isOpen) {
            setTempSelectedIds(selectedDocumentIds)
        }
    }, [isOpen])

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-primary" />
                    <span>Chọn tài liệu tham khảo</span>
                </div>
            }
            open={isOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            width={900}
            okText="Xác nhận"
            cancelText="Hủy"
            bodyStyle={{ padding: '16px' }}
        >
            <div className="mb-4">
                <Input.Search
                    placeholder="Tìm kiếm tài liệu theo tiêu đề..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <div className="mb-2">
                <span className="text-sm text-gray-600">
                    Đã chọn: <strong>{tempSelectedIds.length}</strong> tài liệu
                </span>
            </div>

            <Table
                rowSelection={{
                    type: 'checkbox',
                    ...rowSelection,
                }}
                columns={columns}
                dataSource={filteredDocuments}
                rowKey="id"
                loading={isLoading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total) => `Tổng ${total} tài liệu`,
                }}
                scroll={{ y: 400 }}
                onRow={(record) => ({
                    onClick: () => {
                        const isSelected = tempSelectedIds.includes(record.id)
                        if (isSelected) {
                            setTempSelectedIds(tempSelectedIds.filter((id) => id !== record.id))
                        } else {
                            setTempSelectedIds([...tempSelectedIds, record.id])
                        }
                    },
                    style: { cursor: 'pointer' },
                })}
            />
        </Modal>
    )
}

export default ChonTaiLieu
