import { CloseOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useImportPhanCongGiangDay } from '@workspace/libs/api/training'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, message, Radio, Space, Tag } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    file?: File
    semesterId?: string
    fileType?: 'THONG_KE_GIAO_VIEN_GIANG_DAY' | 'TKB_THEO_LOP_HOC_PHAN'
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
    const { id: semesterId } = useSemesterStore()
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
        if (!file || !semesterId) {
            message.warning('Vui lòng chọn đầy đủ file và học kỳ')
            return
        }
        try {
            showSpinner()
            const res = await ImportPhanCongGiangDay({
                data: {
                    file: file,
                    semesterId,
                    trainingObjectTypeId,
                    fileType: output?.fileType,
                },
            })
            if (res?.status === 200) {
                message.success(res?.data?.message || 'Nhập dữ liệu từ file thành công')
                onClose()
                queryClient.invalidateQueries({
                    queryKey: ['zenstack', 'SubjectClass'],
                })
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
            className="w-[60vw]"
            formProps={{
                initialValues: {
                    fileType: 'THONG_KE_GIAO_VIEN_GIANG_DAY',
                    semesterId: id,
                },
            }}
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
            <Col span={12}>
                <FormItem form={form} name="fileType" label="Mẫu" required>
                    <Radio.Group
                        options={[
                            {
                                label: 'Mẫu 1: Thống kê các giáo viên đang có giờ dạy (Quân sự)',
                                value: 'THONG_KE_GIAO_VIEN_GIANG_DAY',
                            },
                            {
                                label: 'Mẫu 2: TKB dự kiến theo lớp học phần (Dân sự)',
                                value: 'TKB_THEO_LOP_HOC_PHAN',
                            },
                        ]}
                        defaultValue={'THONG_KE_GIAO_VIEN_GIANG_DAY'}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </FormItem>
                <p className="text-sm text-gray-500">
                    Lưu ý: Mẫu 1 đã chứa nội dung các lớp quản lý được đăng ký vào lớp môn học từ
                    phần mềm TKBU
                </p>
                <p className="text-sm text-gray-500">
                    Lưu ý: Mẫu 2 chứa kế hoạch lớp môn học dự kiến cho các lớp Dân sự, sinh viên cần
                    đăng ký học phần theo kế hoạch này
                </p>
            </Col>
            <Col span={24}>
                <Button
                    onClick={() => {
                        const fileType = form.getFieldValue('fileType')
                        const link =
                            fileType === 'THONG_KE_GIAO_VIEN_GIANG_DAY'
                                ? 'https://minio.swantech.vn/mta/template/MAU1.TKB.GIAO-VIEN-DANH-CHO-QUAN-SU.xls'
                                : 'https://minio.swantech.vn/mta/template/MAU2.TKB.LOP-HOC-PHAN-DU-KIEN-DANH-CHO-DAN-SU.xls'
                        window.open(link, '_blank')
                    }}
                >
                    Xem mẫu file Excel
                </Button>
            </Col>
        </PutFormModal>
    )
}

export default ModalNhapTKB
