import { CloseOutlined } from '@ant-design/icons'
import useSpinner from '@hooks/spinner'
import { importPhienBanCTDT } from '@workspace/libs/api/training'
import { Button, Collapse, Modal, message, Space, Tag } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

const { Panel } = Collapse
interface ImportCurriculumVersionModalProps {
    visible: boolean
    onCancel: () => void
}

const ImportCurriculumVersionModal = ({ visible, onCancel }: ImportCurriculumVersionModalProps) => {
    const [file, setFile] = useState<File | null>(null)
    const [disbaledButton, setDisbaledButton] = useState<boolean>(true)
    const router = useRouter()
    const id = router.query.id as string
    const [fileName, setFileName] = useState<string>('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        setFileName(`Dữ liệu phiên bản chương trình đào tạo.${file.name.split('.')[1]}`)
        setDisbaledButton(false)
        const reader = new FileReader()
        // reader.onload = (e) => {
        //     const { trainingObjectType, trainingCourse, students, errors } = parseSheetHeQuanSu(
        //         e.target?.result as ArrayBuffer
        //     )
        //     setPreviewData(students)
        //     setData({ trainingObjectType, trainingCourse })
        //     if (errors.length === 0) {
        //         setDisbaledButton(false)
        //     }
        //     setErrorData(errors)
        //     console.log(errors)
        // }
        reader.readAsArrayBuffer(file)
    }

    const handleRemoveFile = () => {
        setFile(null)
        setFileName('')
        // Reset input file để có thể chọn lại file cùng tên
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) {
            fileInput.value = ''
        }
    }

    const handleCancel = () => {
        handleRemoveFile()
        onCancel()
    }
    const { showSpinner, hideSpinner } = useSpinner()
    const handleConfirm = async () => {
        showSpinner()

        try {
            if (!file) return
            const res = await importPhienBanCTDT(id, { file: file, timeout: 30 })
            if (res?.status === 200) {
                message.success(
                    res?.data?.message ||
                        'Nhâp dữ liệu phiên bản chương trình đào tạo từ file thành công'
                )
            } else {
                message.error(
                    res?.data?.message ||
                        'Nhâp dữ liệu phiên bản chương trình đào tạo từ file thất bại'
                )
            }
        } catch (_error) {
            message.error('Có lỗi xảy ra khi nhập dữ liệu từ file')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Modal
            title="Nhập dữ liệu phiên bản chương trình đào tạo từ Excel"
            open={visible}
            width={900}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={handleConfirm}
                    disabled={disbaledButton}
                >
                    Xác nhận
                </Button>,
            ]}
        >
            <div className="rounded-lg border-[1px] border-solid border-blue-400 bg-blue-50 p-3 mb-4">
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    type="primary"
                    className="bg-[#1677ff] mb-4"
                >
                    Chọn file
                </Button>

                {fileName ? (
                    <Space style={{ marginLeft: 16 }}>
                        <Tag
                            closable
                            onClose={handleRemoveFile}
                            closeIcon={<CloseOutlined style={{ color: 'red' }} />}
                        >
                            {fileName}
                        </Tag>
                    </Space>
                ) : (
                    <span className="ml-3">Chưa có tệp nào được chọn</span>
                )}
                {/* <Row className="mb-2">
                    <ExportTemplateStudent />
                </Row> */}
                <p className="">Chọn file Excel mẫu đã xuất từ hệ thống</p>
            </div>
        </Modal>
    )
}

export default ImportCurriculumVersionModal
