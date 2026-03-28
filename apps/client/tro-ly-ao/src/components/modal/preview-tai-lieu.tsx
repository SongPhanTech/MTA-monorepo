import { ArrowDownOutlined } from "@ant-design/icons"
import { FileUploadIcon } from "@components/commons/upload"
import { formatDateReadable, formatNiceBytes } from "@lib/utils"
import { useDeleteDocument, useFindFirstDocument } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Divider, Modal, message, Tag } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const PreviewTaiLieu = () => {
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PreviewTaiLieu",
  })

  const { data: selectedDocument } = useFindFirstDocument({
    where: { id },
    include: {
      uploadedBy: true,
      topics: {
        include: {
          topic: true,
        },
      },
      classification: true,
    },
  })

  const { mutateAsync: deleteDocument } = useDeleteDocument()

  const onDownload = async (url: string, fileName: string) => {
    const response = await fetch(url)
    if (!response.ok) return message.error("Lỗi khi tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", fileName)
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
          <FileUploadIcon className="w-[120px] h-[120px]" fileType={selectedDocument.fileType} />
          <span className="font-bold text-lg">{selectedDocument.title}</span>
        </div>

        <Divider />

        <div className="flex flex-col gap-2">
          <span className="font-semibold text-base">Thông tin về tài liệu</span>
          <div>
            <p className="font-semibold">Loại tài liệu</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedDocument.topics && selectedDocument.topics.length > 0 ? (
                selectedDocument.topics.map((dt) => (
                  <Tag key={dt.id} color="blue">
                    {dt.topic?.name}
                  </Tag>
                ))
              ) : (
                <span className="text-gray-400">Chưa phân loại</span>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold">Phân loại</p>
            {selectedDocument.classification ? (
              <Tag color="purple">{selectedDocument.classification.name}</Tag>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
          <div>
            <p className="font-semibold">Kích thước</p>
            <p>{formatNiceBytes(selectedDocument.fileSize)}</p>
          </div>
          <div>
            <p className="font-semibold">Người đăng</p>
            <p>{selectedDocument.uploadedBy.code || "Chưa xác định"}</p>
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
