import { FileUploadIcon } from '@components/commons/upload'
import ChatLayout from '@layouts/chat-layout'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db'
import { useFindManyDocument } from '@workspace/db/hooks'
import { Button, Divider, Empty, Input, Modal, message, Spin, Tag, Typography } from 'antd'
import { FileDown } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { TimKiemTheoTuKhoa } from '@/api/tim-kiem-van-ban'

const { Title } = Typography

export default function Page() {
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [results, setResults] = useState<string[]>([])
    const [selectedDocument, setSelectedDocument] = useState<(typeof documents)[0]>()

    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
            topic: true,
        },
        where: {
            status: $Enums.DocumentStatus.APPROVE,
            id: {
                in: results,
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

    const handleSearch = async () => {
        if (!input.trim()) {
            setResults([])
            return
        }

        setLoading(true)
        try {
            const response = await TimKiemTheoTuKhoa(input)
            setResults(response?.success_detail || [])
        } catch (_error: unknown) {
            message.warning('Không tìm thấy kết quả nào')
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Search Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="max-w-6xl mx-auto">
                    <div className="w-full">
                        <Input.Search
                            placeholder="Nhập từ khóa cần tìm..."
                            size="large"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onSearch={handleSearch}
                            loading={loading}
                            style={
                                {
                                    '--ant-color-primary': '#028850',
                                } as any
                            }
                            className="[&_.ant-input-search-button]:!bg-[#028850] [&_.ant-input-search-button]:!border-[#028850] [&_.ant-input-search-button_.anticon]:!text-white"
                        />
                    </div>
                    {results.length > 0 && (
                        <div className="text-center mt-3">
                            <span className="text-sm text-gray-600">
                                Tìm thấy {documents.length} tài liệu cho "{input}"
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6">
                    <div className="max-w-6xl mx-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin size="large" tip="Đang tìm kiếm tài liệu..." />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4">
                                {documents.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white p-5 rounded-lg border border-gray-200 hover:border-[#028850] hover:bg-[#D9EDE4] hover:shadow-md transition-all duration-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedDocument(item)
                                        }}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <FileUploadIcon
                                                    className="w-12 h-12 sm:w-14 sm:h-14"
                                                    fileType={item.fileType}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                                                    {item.title || 'Không có tiêu đề'}
                                                </h3>
                                                <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                                                    {item.topic?.name && (
                                                        <div>
                                                            <Tag
                                                                color="#028850"
                                                                className="border-0 m-0"
                                                            >
                                                                {item.topic.name}
                                                            </Tag>
                                                        </div>
                                                    )}
                                                    <span>•</span>
                                                    <span className="font-medium">
                                                        {formatNiceBytes(item.fileSize)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {formatDateReadable(item.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : input.trim() ? (
                            <div className="flex justify-center items-center h-64">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Không tìm thấy tài liệu phù hợp"
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-64">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Nhập từ khóa để tìm kiếm tài liệu"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                open={!!selectedDocument}
                onCancel={() => setSelectedDocument(undefined)}
                footer={null}
                width={400}
                centered
                destroyOnClose
            >
                {selectedDocument && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-4">
                            <FileUploadIcon
                                className="w-[80px] h-[80px]"
                                fileType={selectedDocument.fileType}
                            />
                            <span className="font-semibold text-base text-center">
                                {selectedDocument.title}
                            </span>
                        </div>
                        <Divider style={{ margin: '2px 0' }} />{' '}
                        <div className="space-y-2 text-sm">
                            {' '}
                            <div>
                                <p className="font-semibold text-gray-700">Loại tài liệu</p>
                                <p>{selectedDocument.topic?.name || 'Chưa phân loại'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">Kích thước</p>
                                <p>{formatNiceBytes(selectedDocument.fileSize)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">Người đăng</p>
                                <p>{selectedDocument.uploadedBy.code || 'Chưa xác định'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">Ngày đăng</p>
                                <p>{formatDateReadable(selectedDocument.createdAt)}</p>
                            </div>
                        </div>
                        <Button
                            className="w-full h-9 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#028850',
                                borderColor: '#028850',
                                color: 'white',
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                onDownload(
                                    getMinioUrl(selectedDocument.uri),
                                    selectedDocument.title || selectedDocument.id
                                )
                            }}
                        >
                            <FileDown />
                            Tải xuống
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout showSiderChat={false}>{page}</ChatLayout>
}
