import { TimKiemTheoTuKhoa } from '@/api/tim-kiem-van-ban'
import { SearchOutlined } from '@ant-design/icons'
import { CardDocument } from '@components/commons/card-document'
import { FileUploadIcon } from '@components/commons/upload'
import { DOCUMENT_TYPE } from '@constants/constants'
import TimKiemVanBanLayout from '@layouts/tim-kiem-van-ban-layout'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db'
import { useFindManyDocument } from '@workspace/db/hooks'
import {
    Button,
    Divider,
    Empty,
    Input,
    message,
    Modal,
    Spin,
    Typography,
} from 'antd'
import { FileDown } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

const { Title } = Typography

export default function Page() {
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [results, setResults] = useState<string[]>([])
    const [selectedDocument, setSelectedDocument] =
        useState<(typeof documents)[0]>()

    const { data: documents = [] } = useFindManyDocument({
        include: {
            uploadedBy: true,
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
        } catch (error: unknown) {
            message.warning('Không tìm thấy kết quả nào')
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center pt-5 px-4">
            <Title level={2}>Tìm kiếm văn bản</Title>
            <Input.Search
                placeholder="Nhập từ khóa cần tìm..."
                enterButton={<SearchOutlined />}
                size="large"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 600, width: '100%', marginBottom: 30 }}
                loading={loading}
            />

            {loading ? (
                <Spin />
            ) : results.length > 0 ? (
                <div className="w-full max-w-[1200px] flex flex-wrap justify-center gap-4 overflow-y-auto max-h-[600px]">
                    {documents.map((item) => (
                        <div
                            className="hover:bg-primary hover:fill-white text-white transition-all rounded-lg cursor-pointer"
                            key={item.id}
                        >
                            <CardDocument
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDocument(item)
                                }}
                                {...item}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <Empty description="Không có kết quả" />
            )}

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
                                <p className="font-semibold text-gray-700">
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
                                <p className="font-semibold text-gray-700">
                                    Kích thước
                                </p>
                                <p>
                                    {formatNiceBytes(selectedDocument.fileSize)}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">
                                    Người đăng
                                </p>
                                <p>{selectedDocument.uploadedBy.name}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">
                                    Ngày đăng
                                </p>
                                <p>
                                    {formatDateReadable(
                                        selectedDocument.createdAt
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            className="bg-primary text-white w-full h-[36px] flex items-center justify-center gap-2" // Giảm chiều cao của button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDownload(
                                    getMinioUrl(selectedDocument.uri),
                                    selectedDocument.title ||
                                        selectedDocument.id
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
    return <TimKiemVanBanLayout>{page}</TimKiemVanBanLayout>
}
