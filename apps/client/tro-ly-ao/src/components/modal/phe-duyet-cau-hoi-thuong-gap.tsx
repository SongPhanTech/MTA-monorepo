import FormItem from '@components/commons/form-item'
import { cn } from '@lib/utils'
import { $Enums } from '@workspace/db'
import { useUpdateDocument, useUpdateFAQ } from '@workspace/db/hooks'
import { Col, Form, Input, Modal, Radio, message } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
type PheDuyetCauHoiThuongGapFormType = {
    status: $Enums.DocumentStatus
    reason: string
}
const PheDuyetCauHoiThuongGap = () => {
    const {
        isOpen,
        onClose,
        input: documentId,
    } = useDisclosure<string>({
        tag: PheDuyetCauHoiThuongGap.name,
    })
    const { mutateAsync: update } = useUpdateFAQ()

    const [form] = Form.useForm<PheDuyetCauHoiThuongGapFormType>()

    const status = Form.useWatch('status', form)

    const onFinish = async (values: PheDuyetCauHoiThuongGapFormType) => {
        try {
            await update({
                where: {
                    id: documentId,
                },
                data: {
                    status: values.status,
                    reason:
                        values.status === $Enums.DocumentStatus.APPROVE
                            ? null
                            : values.reason,
                },
            })
            if (values.status === $Enums.DocumentStatus.APPROVE) {
                message.success('Phê duyệt câu hỏi thường gặp thành công')
            } else {
                message.success('Từ chối câu hỏi thường gặp')
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }
    return (
        <Modal
            title="Phê duyệt câu hỏi thường gặp"
            open={isOpen}
            className={cn('min-w-[30vw]')}
            okText="Đồng ý"
            cancelText="Hủy"
            onCancel={onClose}
            onOk={form.submit}
        >
            <div className="flex gap-4 justify-between">
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    className={cn('mt-4', 'w-full')}
                >
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name={'status'}
                            label="Trạng thái"
                            required
                        >
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button
                                    value={$Enums.DocumentStatus.APPROVE}
                                >
                                    Phê duyệt
                                </Radio.Button>
                                <Radio.Button
                                    value={$Enums.DocumentStatus.DENY}
                                >
                                    Từ chối
                                </Radio.Button>
                            </Radio.Group>
                        </FormItem>
                    </Col>
                    {status === $Enums.DocumentStatus.DENY && (
                        <Col span={24}>
                            <FormItem
                                form={form}
                                name={'reason'}
                                label="Lý do từ chối"
                            >
                                <Input.TextArea placeholder="Nhập lý do từ chối" />
                            </FormItem>
                        </Col>
                    )}
                </Form>
            </div>
        </Modal>
    )
}

export default PheDuyetCauHoiThuongGap
