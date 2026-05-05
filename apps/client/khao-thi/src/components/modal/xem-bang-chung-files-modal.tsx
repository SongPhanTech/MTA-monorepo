import { DownloadOutlined, EyeOutlined, PaperClipOutlined } from "@ant-design/icons"
import type { EvidenceFile } from "@workspace/db"
import { getMinioUrl, getRuntimeEnv } from "@workspace/libs/utils"
import { List, message, Modal, Tooltip } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

export type XemBangChungFilesInput = {
  files: EvidenceFile[]
  evidenceName: string
}

const XemBangChungFilesModal = () => {
  const { isOpen, onClose, input } = useDisclosure<XemBangChungFilesInput>({
    tag: "XemBangChungFilesModal",
  })

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const handleDownload = async (e: React.MouseEvent, file: EvidenceFile) => {
    e.stopPropagation()
    try {
      const url = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${file.path}`
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      message.error("Không thể tải file")
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      title={
        <div>
          <div className="font-semibold">{input?.evidenceName}</div>
          <div className="text-sm font-normal text-gray-500">
            Tổng cộng {input?.files?.length ?? 0} bằng chứng
          </div>
        </div>
      }
      destroyOnClose
    >
      <List
        dataSource={input?.files ?? []}
        renderItem={(file, index) => (
          <List.Item key={file.id}>
            <div className="flex items-center gap-3 w-full">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex items-center gap-1 border border-solid border-[#D1D5DB] rounded px-2 py-1 bg-white flex-1 min-w-0">
                <PaperClipOutlined className="text-gray-500 text-sm flex-shrink-0" />
                <Tooltip title={file.name}>
                  <span className="truncate text-sm flex-1">{file.name}</span>
                </Tooltip>
                <Tooltip title="Xem trước">
                  <EyeOutlined
                    className="text-blue-500 text-sm flex-shrink-0 cursor-pointer ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPreview({
                        uri: getMinioUrl(file.path),
                        name: file.name,
                        mimeType: file.name.split(".").pop() || file.mimeType,
                      })
                    }}
                  />
                </Tooltip>
                <Tooltip title="Tải xuống">
                  <DownloadOutlined
                    className="text-gray-500 text-sm flex-shrink-0 cursor-pointer ml-1"
                    onClick={(e) => handleDownload(e, file)}
                  />
                </Tooltip>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  )
}

export default XemBangChungFilesModal
