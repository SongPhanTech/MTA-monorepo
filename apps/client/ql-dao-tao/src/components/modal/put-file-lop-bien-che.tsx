import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingCourse } from '@workspace/db'
import { useFindManyTrainingCourse } from '@workspace/db/hooks'
import { Col, Form, Input, message, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import type { UploadFile } from 'antd/es/upload/interface'
import { fetchUploadFile } from '@api/userProfile'

export type PutUploadFixedClass = {
    trainingCourseId: string
    file: UploadFile<any>[]
}

const PutUploadFixedClassModal = () => {
    const [form] = Form.useForm<PutUploadFixedClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutUploadFixedClassModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse()

    async function onOk(output?: PutUploadFixedClass) {
        if (!output) return
        if (!output.file || output.file.length === 0) {
            message.error('Vui lòng chọn một file để tải lên.')
            return
        }
        const uploadFile = output.file[0]

        if (!uploadFile.originFileObj) {
            message.error('Tệp tải lên không hợp lệ.')
            return
        }

        try {
            showSpinner()

            const formData = new FormData()
            formData.append('file', uploadFile.originFileObj as File)
            formData.append('trainingCourseId', output.trainingCourseId)

            const res = await fetchUploadFile(
                formData,
                'api/fixed-class/FixedClass/upload-excel-create-fixed-class'
            )
            const data = await res.json()

            if (res.ok) {
                message.success('Tải lên thành công!')
            } else {
                message.error(data.message || 'Tải lên thất bại!')
            }

            queryClient.invalidateQueries({ queryKey: ['FixedClass'] })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable
            title="Tải file nhập danh sách lớp biên chế"
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="trainingCourseId"
                    label="Khóa"
                    required
                >
                    <Select
                        placeholder="Chọn khóa"
                        options={trainingCourseData.map(
                            (i: TrainingCourse) => ({
                                value: i.id,
                                label: i.name,
                            })
                        )}
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem
                    form={form}
                    name="file"
                    label="Tệp Excel"
                    required
                    valuePropName="fileList"
                    getValueFromEvent={(e) =>
                        Array.isArray(e) ? e : e?.fileList
                    }
                >
                    <Upload
                        beforeUpload={(file) => {
                            const isExcel =
                                file.type ===
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                                file.type === 'application/vnd.ms-excel'
                            if (!isExcel) {
                                message.error(
                                    'Chỉ được phép tải lên file Excel (.xlsx, .xls)'
                                )
                                return Upload.LIST_IGNORE
                            }
                            return false // Không upload tự động
                        }}
                        maxCount={1}
                        accept=".xlsx,.xls"
                    >
                        <Button icon={<UploadOutlined />}>
                            Chọn file Excel
                        </Button>
                    </Upload>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutUploadFixedClassModal
