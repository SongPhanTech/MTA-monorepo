import { cn } from "@lib/utils"
import type { Document } from "@workspace/db"
import { Tooltip } from "antd"
import type { MouseEventHandler } from "react"
import { FileUploadIcon } from "../upload"

type CardDocumentProps = {
  onDelete?: () => void
  onClick?: MouseEventHandler<HTMLDivElement>
  className?: string
} & Partial<Document>

export const CardDocument = ({
  title,
  onDelete,
  onClick,
  className,
  fileType,
}: CardDocumentProps) => {
  return (
    <div className="w-[150px] flex flex-col gap-2" onClick={onClick}>
      <div
        className={cn(
          "group relative w-[150px] h-[150px] flex flex-col gap-2 justify-center border border-solid border-gray-300 rounded-lg items-center",
          className
        )}
      >
        {/* <div className="absolute flex top-1 right-2 gap-2 group-hover:visible invisible z-50">
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
                </div> */}
        <FileUploadIcon
          fileType={fileType}
          alt="icon-file"
          width={80}
          height={80}
          className="cursor-pointer text-7xl text-primary"
        />
        <Tooltip title={title}>
          <span className="text-center text-xs font-semibold w-[150px] truncate text-gray-700 px-2">
            {title}
          </span>
        </Tooltip>
      </div>
    </div>
  )
}
