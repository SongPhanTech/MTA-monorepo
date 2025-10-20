import { CloseOutlined, CloudUploadOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { DocumentFile, Prisma } from '@workspace/db/client'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { message, Tooltip, Typography, Upload } from 'antd'
import type { FormInstance } from 'antd/es/form'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { env } from '@/env'

const { Dragger } = Upload
const { Link } = Typography

interface DocumentPathsComponentProps {
    form: FormInstance
    data: DocumentFile[]
    relationId: string
    relationType: Extract<Prisma.DocumentFileScalarFieldEnum, `${string}Id`>
    titleForm?: string
    multiple?: boolean
    accept?: string
    text?: string
}

interface UploadedFileItem {
    file: File | null
    name: string
    path: string
    size: bigint
    mimeType?: string
    [key: string]: any // For relation ID
}

const DocumentPaths: React.FC<DocumentPathsComponentProps> = ({
    form,
    data,
    relationId,
    relationType,
    titleForm = 'documentFiles',
    multiple = true,
    accept = '.doc,.docx,.xls,.xlsx,.pdf,.ppt,.txt',
    text = 'DOC, DOCX, XLSX, XLS, PDF, PPT, TXT',
}) => {
    const [fileList, setFileList] = useState<UploadedFileItem[]>([])

    const handleRemoveFile = (index: number): void => {
        const newList = [...fileList]
        newList.splice(index, 1)
        setFileList(newList)

        const updatedFiles = newList.map((item) => ({
            name: item.name,
            path: item.path,
            size: item.size,
            mimeType: item.mimeType,
            [relationType]: relationId,
        }))

        form.setFieldValue(titleForm, updatedFiles)
    }

    const handlePreviewFile = async (file: UploadedFileItem) => {
        try {
            if (file.file) {
                // Nếu là file mới upload
                const fileUrl = URL.createObjectURL(file.file)
                const a = document.createElement('a')
                a.href = fileUrl
                a.download = file.name
                a.target = '_blank'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                setTimeout(() => URL.revokeObjectURL(fileUrl), 100)
            } else {
                // Nếu là file từ server
                const fileUrl = `${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${file.path}`
                const a = document.createElement('a')
                a.href = fileUrl
                a.download = file.name
                a.target = '_blank'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error('Error opening file:', error)
            message.error('Không thể mở file')
        }
    }

    const handleCustomUpload = async (file: File) => {
        try {
            const extension = file.name.split('.').pop() || ''
            const resPresignedUrl = await generatePresignedUrl({
                path: 'tai-lieu-ctdt',
                extension: extension,
            })

            await axios.put(resPresignedUrl.data.url, file, {
                onUploadProgress: (progressEvent) => {
                    const { loaded, total = 1, estimated = 0 } = progressEvent
                    const percent = Math.floor((loaded * 100) / total)
                    form.setFieldsValue({
                        files: {
                            ...form.getFieldValue('files'),
                            [file.name]: {
                                ...file,
                                url: resPresignedUrl.data.fileName,
                                progress: percent,
                                timeLeft: estimated,
                            },
                        },
                    })
                },
            })

            const newItem: UploadedFileItem = {
                file,
                name: file.name,
                path: resPresignedUrl.data.fileName,
                size: BigInt(file.size || 0),
                mimeType: file.type,
                [relationType]: relationId,
            }

            const newList = multiple ? [...fileList, newItem] : [newItem]

            const documentFiles = newList.map((item) => ({
                name: item.name,
                path: item.path,
                size: item.size,
                mimeType: item.mimeType,
                [relationType]: relationId,
            }))

            setFileList(newList)
            form.setFieldValue(titleForm, documentFiles)
        } catch (err) {
            console.error(err)
            message.error(`Không thể upload ${file.name}.`)
        }
    }

    useEffect(() => {
        const initial = data.map((file) => ({
            file: null,
            name: file.name,
            path: file.path,
            size: file.size ? BigInt(file.size) : BigInt(0),
            mimeType: file.mimeType || '',
            [relationType]: relationId,
        }))
        setFileList(initial)

        // Set initial value for form
        if (data.length > 0) {
            form.setFieldValue(
                titleForm,
                initial.map((item) => ({
                    name: item.name,
                    path: item.path,
                    size: item.size,
                    mimeType: item.mimeType,
                    [relationType]: relationId,
                }))
            )
        }
    }, [data, relationId, relationType, form.setFieldValue, titleForm])

    return (
        <>
            <Dragger
                multiple={multiple}
                accept={accept}
                beforeUpload={(file: File) => {
                    const isLt5M = file.size / 1024 / 1024 < 5
                    if (!isLt5M) {
                        message.error(`${file.name} vượt quá 5MB.`)
                        return Upload.LIST_IGNORE
                    }

                    // Custom upload logic
                    handleCustomUpload(file)
                    return false // Ngăn auto upload
                }}
                showUploadList={false}
                listType="text"
            >
                <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined style={{ color: '#52c41a' }} />
                </p>
                <p className="ant-upload-text text-[#111827] text-base font-normal">
                    <Link className="text-[#2563EB] font-medium">Chọn tệp</Link> hoặc kéo và thả tệp
                    vào đây
                </p>
                <span className="text-[#4B5563] text-base font-normal">
                    Định dạng {text} (tối đa 5MB)
                </span>
            </Dragger>
            <div className="flex flex-wrap gap-2 mt-2">
                {fileList.map((item: UploadedFileItem, index: number) => {
                    const displayName = item.file?.name || item.name

                    return (
                        <div
                            key={item.path}
                            className="flex items-center border border-solid border-[#D1D5DB] rounded p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handlePreviewFile(item)}
                        >
                            <PaperClipOutlined
                                style={{
                                    marginRight: 8,
                                    color: '#595959',
                                    fontSize: 16,
                                }}
                            />
                            <Tooltip title={displayName}>
                                <span
                                    style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flexGrow: 1,
                                    }}
                                >
                                    {displayName}
                                </span>
                            </Tooltip>
                            <CloseOutlined
                                style={{
                                    marginLeft: 12,
                                    cursor: 'pointer',
                                    color: '#595959',
                                    fontSize: 14,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFile(index)
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default DocumentPaths
