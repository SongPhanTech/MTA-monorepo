import { DeleteFilled } from "@ant-design/icons"
import { cn } from "@lib/utils"
import type { Document } from "@workspace/db"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Image, Popconfirm } from "antd"
import { useCallback, useMemo } from "react"
import { FileUploadIcon } from "../upload"

type CardDocumentProps = {
  onDelete?: () => void
  className?: string
} & Partial<Document>

export const CardDocument = ({ title, onDelete, className, fileType, uri }: CardDocumentProps) => {
  const onDownload = async (url: string, fileName: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Lỗi khi tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  const isDisplayable = useMemo(() => {
    if (fileType) {
      return fileType.includes("image") || fileType.includes("video") || fileType.includes("audio")
    }
    return false
  }, [fileType])

  const getUrl = useCallback((path: string) => {
    const isAbsolutePath = path.startsWith("http") || path.startsWith("blob")
    if (isAbsolutePath) return path
    return new URL(path, getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")).href
  }, [])

  return (
    <div className="w-[150px] flex flex-col gap-2">
      <div
        className={cn(
          "group relative w-[150px] h-[150px] flex justify-center border border-solid border-gray-300 rounded-lg items-center",
          className
        )}
      >
        <div className="absolute flex top-1 right-2 gap-2 group-hover:visible invisible z-50">
          <Popconfirm
            placement="topLeft"
            title="Xác nhận xóa dữ liệu?"
            description="Dữ liệu sẽ bị xóa vĩnh viễn"
            okText="Đồng ý"
            onConfirm={onDelete}
            cancelText="Hủy"
          >
            <div className="bg-[#DCDCDCBB]  w-[30px] h-[30px] rounded-full flex justify-center items-center cursor-pointer">
              <DeleteFilled className="w-5 h-5 cursor-pointer text-xl text-[#FF4D4F]" />
            </div>
          </Popconfirm>
        </div>
        {!isDisplayable ? (
          <FileUploadIcon
            fileType={fileType}
            alt="icon-file"
            width={80}
            height={80}
            className="cursor-pointer text-7xl text-primary"
            onClick={(e) => {
              e.stopPropagation()
              // window.open(getUrl(url || ''), '_blank')
              const urlDownload = getUrl(uri || "")
              onDownload(urlDownload, title || urlDownload)
            }}
          />
        ) : (
          <Image
            src={getUrl(uri || "")}
            className={cn("w-[150px] h-[150px] rounded-md cursor-pointer object-cover", className)}
            alt="img-tai-lieu"
          />
        )}
      </div>
      <span>{title}</span>
    </div>
  )
}
