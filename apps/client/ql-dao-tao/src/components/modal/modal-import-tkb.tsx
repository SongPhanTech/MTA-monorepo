import { CloseOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import useSpinner from '@hooks/spinner'
import { useImportPhanCongGiangDay } from '@workspace/libs/api/training'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, message, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    file?: File
    semesterId?: string
}

const ModalNhapTKB = () => {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [form] = Form.useForm<Record<string, unknown>>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'ModalNhapTKB',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const [file, setFile] = useState<File | null>(null)
    const [fileName, setFileName] = useState<string>('')

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        form.setFieldsValue({
            semesterId: id,
        })
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        setFileName(`Dữ liệu thời khoá biểu.${file.name.split('.')[1]}`)
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
    }

    const handleRemoveFile = () => {
        setFile(null)
        setFileName('')
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) {
            fileInput.value = ''
        }
    }

    const { mutateAsync: ImportPhanCongGiangDay } = useImportPhanCongGiangDay()

    const handleSubmit = async (output?: FilterProps) => {
        if (!trainingObjectTypeId) {
            message.warning('Vui lòng chọn đối tượng đào tạo')
            return
        }
        if (!file || !output?.semesterId) {
            message.warning('Vui lòng chọn đầy đủ file và học kỳ')
            return
        }
        try {
            showSpinner()
            const res = await ImportPhanCongGiangDay({
                data: {
                    file: file,
                    semesterId: output.semesterId || '',
                    trainingObjectTypeId,
                },
            })
            if (res?.status === 200) {
                message.success(res?.data?.message || 'Nhập dữ liệu từ file thành công')
                onClose()
            } else {
                message.error(res?.data?.message || 'Nhập dữ liệu từ file thất bại')
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi nhập dữ liệu từ file')
        } finally {
            hideSpinner()
        }
    }

    const handleCancel = () => {
        handleRemoveFile()
        onClose()
    }

    return (
        <PutFormModal
            form={form}
            onFinish={handleSubmit}
            open={isOpen}
            onCancel={handleCancel}
            title={'Import danh sách phân công giảng dạy'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="file" label="File Excel" required>
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
                        <p className="">Chọn file Excel mẫu đã xuất từ hệ thống</p>
                    </div>
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="semesterId" label="Kỳ học" required>
                    <TreeSelectSemester defaultValue={id || undefined} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default ModalNhapTKB
