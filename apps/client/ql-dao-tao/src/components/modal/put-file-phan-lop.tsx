import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { UserType } from '@workspace/db'
import { useFindManyUserType } from '@workspace/db/hooks'
import { Col, Form, Input, message, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
import { fetchUploadFile } from '@api/userProfile'
export type PutUploadDivision = {
    file: File
}
const PutUploadDivisionModal = () => {
    const [form] = Form.useForm<PutUploadDivision>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutUploadDivisionModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output?: PutUploadDivision) {
        if (!output) return
        try {
            showSpinner()
            const formData = new FormData()
            formData.append('file', output.file)
            const res = await fetchUploadFile(
                formData,
                'api/fixClass/upload-excel-update-user-profile'
            )
            const data = await res.json()
            if (res.ok) {
                message.success('Tải lên thành công!')
            } else {
                message.error(data.message || 'Tải lên thất bại!')
            }

            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['UserProfile'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title="Tải file xếp lớp"
            className="w-[25vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="file"
                    label="Tệp Excel"
                    required
                    valuePropName="fileList"
                    getValueFromEvent={(e) => {
                        return Array.isArray(e) ? e : e?.fileList
                    }}
                >
                    <Upload
                        beforeUpload={() => false} // Không upload ngay, chỉ chọn file
                        maxCount={1} // Chỉ cho chọn 1 file
                        accept=".xlsx,.xls" // Chỉ chấp nhận file Excel
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

export default PutUploadDivisionModal
