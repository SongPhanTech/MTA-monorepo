import { UploadOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import { fetchUploadFile } from '@api/userProfile'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { Button, Col, Form, Upload, message } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutUpdateProfile = {
    file: File
}
const PutUpdateProfileModal = () => {
    const [form] = Form.useForm<PutUpdateProfile>()
    const {
        isOpen,
        onClose,
        input: code,
    } = useDisclosure<any>({
        tag: PutUpdateProfileModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const [typeId, setTypeId] = useState<any>()
    useEffect(() => {
        const type = userTypeData?.find((item: any) => item.code === code)
        setTypeId(type?.id ?? undefined)
    }, [code])
    const { data: userTypeData = [], refetch: refetchUserType } =
        useFindManyUserType()

    async function onOk(output?: PutUpdateProfile) {
        if (!output) return
        try {
            showSpinner()
            const formData = new FormData()
            formData.append('file', output.file)
            formData.append('type', typeId)
            const res = await fetchUploadFile(
                formData,
                'api/UserProfile/upload-excel-update-user-profile'
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
            title={'Tải file cập nhật thông tin'}
            className="w-[30vw]"
        >
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="type"
                    label="Đối tượng"
                    required
                >
                    <Select placeholder='Chọn đối tượng' options={userTypeData.map((i: UserType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col> */}

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

export default PutUpdateProfileModal
