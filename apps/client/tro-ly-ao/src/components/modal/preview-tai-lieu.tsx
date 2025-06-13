import { ArrowDownOutlined } from '@ant-design/icons'
import { FileUploadIcon } from '@components/commons/upload'
import { DOCUMENT_TYPE } from '@constants/constants'
import { formatDateReadable, formatNiceBytes } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import { useDeleteDocument, useFindFirstDocument } from '@workspace/db/hooks'
import { Button, Divider, Modal, Popconfirm, message } from 'antd'
import { Trash2 } from 'lucide-react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const PreviewTaiLieu = () => {
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PreviewTaiLieu.name,
    })

    const { data: selectedDocument } = useFindFirstDocument({
        where: { id },
        include: {
            uploadedBy: true,
        },
    })

    const { mutateAsync: deleteDocument } = useDeleteDocument()

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

    if (!selectedDocument) return null

    return (
        <Modal
            // title="Xem tài liệu"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            className="max-w-[500px] w-full "
        >
            <div className="relative">
                <div className="flex flex-col gap-4 items-center">
                    <FileUploadIcon
                        className="w-[120px] h-[120px]"
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
                        <p className="font-semibold">Loại tài liệu</p>
                        <p>
                            {
                                DOCUMENT_TYPE.find(
                                    (item) =>
                                        item.value === selectedDocument.type
                                )?.label
                            }
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">Kích thước</p>
                        <p>{formatNiceBytes(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Người đăng</p>
                        <p>{selectedDocument.uploadedBy.name}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Ngày đăng</p>
                        <p>{formatDateReadable(selectedDocument.createdAt)}</p>
                    </div>
                </div>

                <Divider />

                <div className="flex gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDownload(
                                getMinioUrl(selectedDocument.uri),
                                selectedDocument.title || selectedDocument.id
                            )
                        }}
                        className="bg-primary text-white flex-1 h-[40px]"
                    >
                        <ArrowDownOutlined />
                        Tải xuống
                    </Button>
                    {/* <Popconfirm
                        placement="topLeft"
                        title="Xác nhận xóa dữ liệu?"
                        description="Dữ liệu sẽ bị xóa vĩnh viễn"
                        okText="Đồng ý"
                        cancelText="Hủy"
                        onConfirm={async () => {
                            try {
                                await deleteDocument({
                                    where: { id: selectedDocument.id },
                                })
                                onClose()
                            } catch (error) {
                                message.error('Xóa tài liệu thất bại')
                            }
                        }}
                    >
                        <Button className="w-[40px] h-[40px] p-0">
                            <Trash2 className="w-full h-[24px]" />
                        </Button>
                    </Popconfirm> */}
                </div>
            </div>
        </Modal>
    )
}

export default PreviewTaiLieu
