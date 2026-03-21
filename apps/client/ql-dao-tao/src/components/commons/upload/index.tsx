import { DeleteFilled } from '@ant-design/icons'
import DocxIcon from '@assets/images/docx.svg'
import PptIcon from '@assets/images/ppt.svg'
import TxtIcon from '@assets/images/txt.svg'
import UploadIcon from '@assets/images/upload.svg'
import ExcelIcon from '@assets/images/xlsx.svg'
import { cn } from '@lib/utils'
import { getRuntimeEnv } from '@workspace/libs/utils'
import { Button, Divider, Image } from 'antd'
import ImageNext from 'next/image'
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

export const FileUploadIcon = ({
    fileType,
    ...rest
}: {
    fileType: string | null | undefined
} & (typeof ImageNext)['defaultProps']) => {
    const IconOfFile = useMemo(() => {
        if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return DocxIcon
        }
        if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return ExcelIcon
        }
        if (
            fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ) {
            return PptIcon
        }
        if (fileType === 'application/pdf') {
            return TxtIcon
        }
        return TxtIcon
    }, [fileType])

    return <ImageNext src={IconOfFile} width={80} height={80} alt="icon-file" {...rest} />
}

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
        const isAbsolutePath = path.startsWith('http') || path.startsWith('blob')
        if (isAbsolutePath) return path
        return new URL(path, getRuntimeEnv('NEXT_PUBLIC_MINIO_ENDPOINT')).href
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

    const onClick = () => {
        if (imageFromValue && !multiple) return
        const input = document.createElement('input')
        input.hidden = true
        input.multiple = !!multiple
        input.type = 'file'
        input.accept = accept ?? '*/*'

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
                        <FileUploadIcon fileType={fileType} />
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
                <div className="flex flex-col items-center justify-center gap-2">
                    <ImageNext width={28} height={20} alt="upload" src={UploadIcon} />
                    <p className="text-sm text-gray-500 text-center p-2">
                        {description || 'Kéo và thả tệp vào đây'}
                    </p>
                    <Divider className="my-0">
                        <span className="text-sm text-gray-500">Hoặc</span>
                    </Divider>
                    <Button className="text-primary border-primary font-semibold py-4">
                        Chọn tệp
                    </Button>
                </div>
            )}
        </div>
    )
}

export default UploadDragAndDrop
