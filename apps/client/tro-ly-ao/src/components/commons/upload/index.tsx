import { env } from '@/env'
import {
    FileExcelFilled,
    FileFilled,
    FilePdfFilled,
    FilePptFilled,
    FileWordFilled,
    PlusOutlined,
    DeleteFilled,
} from '@ant-design/icons'
import { cn } from '@lib/utils'
import { Image } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

type UploadDragAndDropWrapperProps = {
    onUpload: (
        files: Array<{
            url: string
            file: File
        }>
    ) => void
    multiple?: boolean
    description?: string
    accept?: string
    value?: string | null
    isShowUpload?: boolean
} & React.HTMLAttributes<HTMLDivElement>

const UploadDragAndDrop = ({
    onUpload,
    className,
    description,
    multiple,
    accept,
    value,
    isShowUpload = true,
    ...rest
}: UploadDragAndDropWrapperProps) => {
    const [fileType, setFileType] = useState<string | null>(null)
    const [imageFromValue, setImageFromValue] = useState(value)
    const getUrl = useCallback((path: string) => {
        const isAbsolutePath =
            path.startsWith('http') || path.startsWith('blob')
        if (isAbsolutePath) return path
        return new URL(path, env.NEXT_PUBLIC_MINIO_ENDPOINT).href
    }, [])
    useEffect(() => {
        setImageFromValue(value)
    }, [value])

    const isDisplayable = useMemo(() => {
        if (fileType) {
            return (
                fileType.includes('image') ||
                fileType.includes('video') ||
                fileType.includes('audio')
            )
        }
        return false
    }, [fileType])

    const IconOfFile = useMemo(() => {
        if (
            fileType ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return FileWordFilled
        }
        if (
            fileType ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            return FileExcelFilled
        }
        if (
            fileType ===
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ) {
            return FilePptFilled
        }
        if (fileType === 'application/pdf') {
            return FilePdfFilled
        }
        return FileFilled
    }, [fileType])

    const onClick = () => {
        if (imageFromValue) return
        const input = document.createElement('input')
        input.hidden = true
        input.multiple = !!multiple
        input.type = 'file'
        input.accept = accept ?? '*/*'
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        input.onchange = (e: any) => {
            if (multiple) {
                const files = (e.target?.files as FileList) || []
                onUpload(
                    Array.from(files).map((file) => ({
                        url: URL.createObjectURL(file),
                        file,
                    }))
                )
            } else {
                const file = e.target?.files[0]
                if (file) {
                    setFileType(file.type)
                    onUpload([
                        {
                            url: URL.createObjectURL(file),
                            file,
                        },
                    ])
                }
            }

            input.remove()
        }
        input.click()
    }
    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
    }

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.dataTransfer.files
        if (multiple) {
            onUpload(
                Array.from(files).map((file) => ({
                    url: URL.createObjectURL(file),
                    file,
                }))
            )
        } else {
            const file = files[0]
            if (file) {
                setFileType(file.type)
                onUpload([
                    {
                        url: URL.createObjectURL(file),
                        file,
                    },
                ])
            }
        }
    }

    return (
        <div
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            onClick={onClick}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
                'flex items-center justify-center',
                'h-[125px] w-[240px]',
                'border-2 border-dashed border-gray-300 rounded-lg cursor-pointer',
                'hover:bg-slate-100 group relative',
                'transition-colors duration-300 ease-in-out',
                'focus:border-primary outline-none',
                className
            )}
            {...rest}
        >
            {isShowUpload && (fileType || imageFromValue) ? (
                <div className="flex justify-center items-center">
                    <div className="absolute flex top-1 right-2 gap-2 group-hover:visible invisible z-50">
                        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                                setFileType(null)
                                setImageFromValue(undefined)
                                onUpload([])
                            }}
                            className="bg-[#DCDCDCE5]  w-[25px] h-[25px] rounded-full flex justify-center items-center cursor-pointer"
                        >
                            <DeleteFilled className="w-[15px] h-[15px] text-white" />
                        </div>
                    </div>
                    {!isDisplayable ? (
                        <IconOfFile />
                    ) : (
                        <Image
                            preview={isDisplayable}
                            onClick={(e) => {
                                if (!isDisplayable) {
                                    e.stopPropagation()
                                    window.open(getUrl(value || ''), '_blank')
                                }
                            }}
                            src={getUrl(value || '')}
                            className={cn(
                                imageFromValue
                                    ? cn('object-contain', className)
                                    : 'w-[66px] h-[68px]'
                            )}
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                </div>
            ) : (
                <>
                    <PlusOutlined />
                    <p className="text-sm text-gray-500 text-center p-2">
                        {description || 'Nhấn để tải lên'}
                    </p>
                </>
            )}
        </div>
    )
}

export default UploadDragAndDrop
