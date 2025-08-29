import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useGenExamFax } from '@workspace/libs/api/exam'
import { Col, Form, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export type ModalSinhFaxType = {
    examId: string
    count: number
    start: number
    step: number
}
const ModalSinhFax = () => {
    const [form] = Form.useForm<ModalSinhFaxType>()
    const {
        isOpen,
        onClose,
        input: examId,
    } = useDisclosure<string>({
        tag: ModalSinhFax.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: genExamFax } = useGenExamFax()

    async function onOk(output?: ModalSinhFaxType) {
        if (!output) return
        try {
            showSpinner()
            if (!examId) {
                message.error('Thiếu mã kỳ thi')
                hideSpinner()
                return
            }
            const data = {
                examId,
                start: output?.start,
                count: output?.count,
                step: output?.step || 1,
            }

            const res = await genExamFax({ data })
            if (res.status === 400 || res.status === 404) {
                message.error(res.data.message)
                return
            }
            message.success('Sinh fax thành công')
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        form.setFieldsValue({
            step: 1,
        })
    }, [])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Tinh fax tự động'}
            className="w-[30vw]"
            okText="Xác nhận"
        >
            <Col span={24}>
                <FormItem form={form} name="count" label="Số lượng fax" required>
                    <InputNumber type="number" step={1} min={1} className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="start" label="Số bắt đầu" required>
                    <InputNumber type="number" step={1} min={1} className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="step" label="Bước nhảy">
                    <InputNumber
                        type="number"
                        step={1}
                        min={1}
                        className="w-full"
                        defaultValue={1}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default ModalSinhFax
