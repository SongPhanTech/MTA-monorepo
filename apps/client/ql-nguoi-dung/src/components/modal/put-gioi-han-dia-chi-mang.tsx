import FormItem from '@components/commons/form-item'
import PutFormModal, { type PutModalFormType } from '@components/commons/put-modal'
import { useFindUniqueBlockedIp } from '@workspace/db/hooks'
import { Col, Form, Input } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutGioiHanDiaChiMangFormType = {
    id?: string
    ipAddress: string
    reason: string
} & PutModalFormType
const PutGioiHanDiaChiMangDungModal = () => {
    const [form] = Form.useForm<PutGioiHanDiaChiMangFormType>()
    const {
        isOpen,
        onClose,
        onOk,
        input: id,
    } = useDisclosure<string>({
        tag: PutGioiHanDiaChiMangDungModal.name,
        onClose: form.resetFields,
    })

    const { data: blockedIp } = useFindUniqueBlockedIp({
        where: { id },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (blockedIp) {
            form.setFieldsValue({
                ...blockedIp,
                reason: blockedIp.reason || '',
                description: blockedIp.description || '',
            })
        }
    }, [blockedIp])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={`${id ? 'Chỉnh sửa' : 'Thêm mới'} địa chỉ mạng giới hạn truy cập vào hệ thống`}
        >
            <FormItem form={form} name="id" hidden>
                <Input />
            </FormItem>
            <Col span={12}>
                <FormItem form={form} name="reason" label="Lý do" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="ipAddress"
                    label="Địa chỉ IP"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập địa chỉ IP',
                        },
                        {
                            pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
                            message: 'Địa chỉ IP không hợp lệ',
                        },
                    ]}
                >
                    <Input />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutGioiHanDiaChiMangDungModal
