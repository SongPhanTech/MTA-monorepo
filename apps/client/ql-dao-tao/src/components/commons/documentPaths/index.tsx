import {
    CloseOutlined,
    CloudUploadOutlined,
    PaperClipOutlined,
} from '@ant-design/icons'
import { message, Tooltip, Typography, Upload } from 'antd'

const { Dragger } = Upload
const { Link } = Typography

import type { FormInstance } from 'antd/es/form'

interface DocumentPathsComponentProps {
    form: FormInstance
    fileList: File[]
    setFileList: React.Dispatch<React.SetStateAction<File[]>>
    handleRemoveFile: (index: number) => void
}

const DocumentPaths: React.FC<DocumentPathsComponentProps> = ({
    form,
    fileList,
    setFileList,
    handleRemoveFile,
}) => {
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

                    setFileList((prev: File[]) => {
                        const newList = [...prev, file]
                        form.setFieldValue('documentPaths', newList) // Lưu vào form
                        return newList
                    })

                    return false // Ngăn auto upload
                }}
                showUploadList={false} // Ẩn danh sách mặc định
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
                {fileList.map((file: File, index: number) => (
                    <div
                        key={file.name}
                        className="flex items-center border border-solid border-[#D1D5DB] rounded p-2"
                    >
                        <PaperClipOutlined
                            style={{
                                marginRight: 8,
                                color: '#595959',
                                fontSize: 16,
                            }}
                        />
                        <Tooltip title={file.name}>
                            <span
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flexGrow: 1,
                                }}
                            >
                                {file.name}
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
                ))}
            </div>
        </>
    )
}

export default DocumentPaths
