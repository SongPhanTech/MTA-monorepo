import { useEffect, useState } from 'react'
import {
    CloseOutlined,
    CloudUploadOutlined,
    PaperClipOutlined,
} from '@ant-design/icons'
import { message, Tooltip, Typography, Upload } from 'antd'
import axios from 'axios'

const { Dragger } = Upload
const { Link } = Typography

import type { FormInstance } from 'antd/es/form'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'

interface DocumentPathsComponentProps {
    form: FormInstance
    data: string[]
}

interface UploadedFileItem {
    file: File | null
    fileName: string // fileName từ resPresignedUrl
}

const DocumentPaths: React.FC<DocumentPathsComponentProps> = ({
    form,
    data,
}) => {
    const [fileList, setFileList] = useState<UploadedFileItem[]>([])

    const handleRemoveFile = (index: number): void => {
        const newList = [...fileList]
        newList.splice(index, 1)
        setFileList(newList)

        const updatedPaths = newList.map((item) => item.fileName)

        form.setFieldValue('documentPaths', updatedPaths)
    }

    const handleCustomUpload = async (file: File) => {
        try {
            const extension = file.name.split('.').pop() || ''
            const resPresignedUrl = await fetchGeneratePresignedUrl({
                body: {
                    path: 'tai-lieu-ctdt',
                    extension: extension,
                },
            })

            await axios.put(resPresignedUrl.url, file, {
                onUploadProgress: (progressEvent) => {
                    const { loaded, total = 1, estimated = 0 } = progressEvent
                    const percent = Math.floor((loaded * 100) / total)
                    form.setFieldsValue({
                        files: {
                            ...form.getFieldValue('files'),
                            [file.name]: {
                                ...file,
                                url: resPresignedUrl.fileName,
                                progress: percent,
                                timeLeft: estimated,
                            },
                        },
                    })
                },
            })

            // Upload thành công: thêm file vào danh sách
            setFileList((prev: UploadedFileItem[]) => {
                const newList = [
                    ...prev,
                    { file, fileName: resPresignedUrl.fileName },
                ]
                const rawPaths = form.getFieldValue('documentPaths')
                const currentPaths = Array.isArray(rawPaths) ? rawPaths : []
                form.setFieldValue('documentPaths', [
                    ...currentPaths,
                    resPresignedUrl.fileName,
                ])
                return newList
            })
        } catch (err) {
            console.error(err)
            message.error(`Không thể upload ${file.name}.`)
        }
    }

    useEffect(() => {
        const initial = data.map((filePath) => ({
            file: null,
            fileName: filePath,
        }))
        setFileList(initial)
    }, [data])

    return (
        <>
            <Dragger
                multiple
                accept=".doc,.docx,.xls,.xlsx"
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
                    <Link className="text-[#2563EB] font-medium">Chọn tệp</Link>{' '}
                    hoặc kéo và thả tệp vào đây
                </p>
                <span className="text-[#4B5563] text-base font-normal">
                    Định dạng XLSX, XLS (tối đa 5MB)
                </span>
            </Dragger>
            <div className="flex flex-wrap gap-2 mt-2">
                {fileList.map((item: UploadedFileItem, index: number) => {
                    const isFromData = item.file === null
                    const tooltipText = isFromData
                        ? item.fileName.split('/').pop()
                        : item?.file?.name

                    return (
                        <div
                            key={item.fileName}
                            className="flex items-center border border-solid border-[#D1D5DB] rounded p-2"
                        >
                            <PaperClipOutlined
                                style={{
                                    marginRight: 8,
                                    color: '#595959',
                                    fontSize: 16,
                                }}
                            />
                            <Tooltip title={tooltipText}>
                                <span
                                    style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flexGrow: 1,
                                    }}
                                >
                                    {tooltipText}
                                </span>
                            </Tooltip>
                            <CloseOutlined
                                style={{
                                    marginLeft: 12,
                                    cursor: 'pointer',
                                    color: '#595959',
                                    fontSize: 14,
                                }}
                                onClick={() => handleRemoveFile(index)}
                            />
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default DocumentPaths
