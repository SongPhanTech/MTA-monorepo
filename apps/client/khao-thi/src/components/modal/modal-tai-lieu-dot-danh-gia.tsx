import { queryClient } from "@api/index"
import {
  CloseOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  PaperClipOutlined,
} from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getRuntimeEnv } from "@workspace/libs/utils"
import {
  useCreateDocumentFile,
  useDeleteDocumentFile,
  useFindManyDocumentFile,
} from "@workspace/db/hooks"
import { Button, message, Modal, Popconfirm, Spin, Tooltip, Typography, Upload } from "antd"
import axios from "axios"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Dragger } = Upload
const { Link } = Typography

export type ModalTaiLieuDotDanhGiaInput = {
  periodId: string
  periodName?: string
}

const ModalTaiLieuDotDanhGia = () => {
  const [uploading, setUploading] = useState(false)
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<ModalTaiLieuDotDanhGiaInput>({
    tag: "ModalTaiLieuDotDanhGia",
  })

  const periodId = input?.periodId || ""

  const {
    data: documentFiles = [],
    isLoading,
    refetch,
  } = useFindManyDocumentFile(
    {
      where: { evaluationPeriodId: periodId },
      orderBy: { createdAt: "asc" },
    },
    { enabled: isOpen && !!periodId }
  )

  const { mutateAsync: createDocumentFile } = useCreateDocumentFile()
  const { mutateAsync: deleteDocumentFile } = useDeleteDocumentFile()

  async function handleUpload(file: File) {
    try {
      setUploading(true)
      const extension = file.name.split(".").pop() || ""
      const res = await generatePresignedUrl({
        path: "tai-lieu-ctdt",
        extension,
      })

      await axios.put(res.data.url, file)

      await createDocumentFile({
        data: {
          name: file.name,
          path: res.data.fileName,
          size: BigInt(file.size),
          mimeType: file.type,
          evaluationPeriod: { connect: { id: periodId } },
        },
      })

      await refetch()
      queryClient.invalidateQueries({ queryKey: ["DocumentFile"] })
      queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      message.success(`Tải lên "${file.name}" thành công`)
    } catch {
      message.error(`Không thể tải lên "${file.name}"`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await deleteDocumentFile({ where: { id } })
      await refetch()
      queryClient.invalidateQueries({ queryKey: ["DocumentFile"] })
      queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      message.success("Xóa tài liệu thành công")
    } catch {
      message.error("Xóa tài liệu thất bại")
    } finally {
      hideSpinner()
    }
  }

  function handleDownload(path: string, name: string) {
    const fileUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${path}`
    const a = document.createElement("a")
    a.href = fileUrl
    a.download = name
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={`Tài liệu đợt đánh giá${input?.periodName ? `: ${input.periodName}` : ""}`}
      footer={null}
      width={640}
    >
      <div className="flex flex-col gap-4">
        <Dragger
          multiple
          accept=".doc,.docx"
          showUploadList={false}
          beforeUpload={(file) => {
            const isLt50M = file.size / 1024 / 1024 < 50
            if (!isLt50M) {
              message.error(`${file.name} vượt quá 50MB`)
              return Upload.LIST_IGNORE
            }
            handleUpload(file)
            return false
          }}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined style={{ color: "#52c41a" }} />
          </p>
          <p className="ant-upload-text text-[#111827] text-base font-normal">
            <Link className="text-[#2563EB] font-medium">Chọn tệp</Link> hoặc kéo và thả tệp vào đây
          </p>
          <span className="text-[#4B5563] text-sm font-normal">
            Định dạng DOC, DOCX (tối đa 50MB)
          </span>
        </Dragger>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spin size="small" />
            <span>Đang tải lên...</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spin />
            </div>
          ) : documentFiles.length === 0 ? (
            <p className="text-center text-gray-400 py-4">Chưa có tài liệu nào</p>
          ) : (
            documentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center border border-solid border-[#D1D5DB] rounded p-2 hover:bg-gray-50"
              >
                <PaperClipOutlined style={{ marginRight: 8, color: "#595959", fontSize: 16 }} />
                <Tooltip title={file.name}>
                  <span
                    className="flex-1 text-sm"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 400,
                    }}
                  >
                    {file.name}
                  </span>
                </Tooltip>
                <Tooltip title="Tải xuống">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(file.path, file.name)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Xác nhận xóa tài liệu này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => handleDelete(file.id)}
                >
                  <Tooltip title="Xóa">
                    <Button type="text" size="small" danger icon={<CloseOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ModalTaiLieuDotDanhGia
