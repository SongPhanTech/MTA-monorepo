import { CloseOutlined, UploadOutlined } from "@ant-design/icons"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { Button, message, Tag, Tooltip, Upload } from "antd"
import type { FormInstance } from "antd/es/form"
import type { NamePath } from "antd/es/form/interface"
import axios from "axios"
import { useRef, useState } from "react"

export interface UploadedFile {
  name: string
  path: string
  size: bigint
  mimeType?: string
}

interface FileUploadButtonProps {
  form: FormInstance
  fieldName: NamePath
  multiple?: boolean
  accept?: string
  maxSizeMB?: number
}

/**
 * Component upload file gọn nhẹ - chỉ có button chọn file,
 * hiển thị tên file dạng Tag có thể xoá.
 * Upload lên MinIO qua presigned URL và set giá trị vào form field.
 */
const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  form,
  fieldName,
  multiple = true,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSizeMB = 50,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const uploadRef = useRef<HTMLDivElement>(null)

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)

      const extension = file.name.split(".").pop() || ""
      const resPresignedUrl = await generatePresignedUrl({
        path: "tai-lieu-ctdt",
        extension,
      })

      if (resPresignedUrl.status !== 200) {
        throw new Error(
          "message" in resPresignedUrl.data
            ? resPresignedUrl.data.message
            : "Không thể tạo presigned URL"
        )
      }

      const { url, fileName } = resPresignedUrl.data

      await axios.put(url, file, {})

      const newFile: UploadedFile = {
        name: file.name,
        path: fileName,
        size: BigInt(file.size || 0),
        mimeType: file.type,
      }

      setFiles((prev) => {
        const updated = multiple ? [...prev, newFile] : [newFile]
        form.setFieldValue(fieldName, updated)
        return updated
      })
    } catch (err) {
      console.error(err)
      message.error(`Không thể upload ${file.name}.`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== index)
      form.setFieldValue(fieldName, updated)
      return updated
    })
  }

  const handleClickUpload = () => {
    const input = uploadRef.current?.querySelector('input[type="file"]') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {files.length > 0 ? (
        // Hiển thị danh sách file, ẩn button chọn file
        <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
          {files.map((file, idx) => (
            <Tag
              key={`${file.path}-${idx}`}
              color="green"
              className="text-xs max-w-full overflow-hidden text-ellipsis whitespace-nowrap m-0 flex items-center"
            >
              <Tooltip title={file.name}>
                <span className="flex-1 overflow-hidden text-ellipsis">
                  {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                </span>
              </Tooltip>
              <CloseOutlined
                className="ml-1 cursor-pointer text-[10px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(idx)
                }}
              />
            </Tag>
          ))}
        </div>
      ) : (
        // Chỉ hiện button khi chưa có file
        <Button
          type="default"
          icon={<UploadOutlined />}
          size="small"
          loading={uploading}
          onClick={handleClickUpload}
        >
          Chọn file
        </Button>
      )}

      {/* Input file ẩn */}
      <div ref={uploadRef} style={{ display: "none" }}>
        <Upload
          multiple={multiple}
          accept={accept}
          beforeUpload={(file: File) => {
            const isValid = file.size / 1024 / 1024 < maxSizeMB
            if (!isValid) {
              message.error(`${file.name} vượt quá ${maxSizeMB}MB.`)
              return Upload.LIST_IGNORE
            }
            handleUpload(file)
            return false
          }}
          showUploadList={false}
        >
          <span />
        </Upload>
      </div>
    </div>
  )
}

export default FileUploadButton
