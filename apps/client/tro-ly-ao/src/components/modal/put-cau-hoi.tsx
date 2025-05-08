import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import { DOCUMENT_TYPE } from '@constants/constants'
import { cn } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    useCreateFAQ,
    useCreateManyFAQ,
    useFindFirstFAQ,
    useFindUniqueFAQ,
    useUpdateFAQ,
    useUpdateManyFAQ,
} from '@workspace/db/hooks'
import { Col, Form, Input, Modal, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
type FAQFormType = {
    type: $Enums.DocumentType
    question: string
    answer: string
}
const PutCauHoi = () => {
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCauHoi.name,
    })
    const { mutateAsync: create } = useCreateFAQ()
    const { mutateAsync: update } = useUpdateFAQ()

    const { data: detail } = useFindFirstFAQ({
        where: {
            id,
        },
    })

    useEffect(() => {
        if (id && detail) {
            form.setFieldsValue({
                type: detail.type,
                question: detail.question ?? '',
                answer: detail.answer ?? '',
            })
        }
    }, [detail, id])

    const [form] = Form.useForm<FAQFormType>()

    const onFinish = async (values: FAQFormType) => {
        try {
            if (id) {
                await update({
                    where: {
                        id,
                    },
                    data: {
                        type: values.type,
                        question: values.question,
                        answer: values.answer,
                    },
                })
                message.success('Cập nhật tài liệu thành công')
            } else {
                await create({
                    data: {
                        type: values.type,
                        question: values.question,
                        answer: values.answer,
                    },
                })
                message.success('Thêm tài liệu thành công')
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }
    return (
        <Modal
            title="Thêm tài liệu"
            open={isOpen}
            className={cn('min-w-[50vw]')}
            okText="Đồng ý"
            cancelText="Hủy"
            onCancel={onClose}
            onOk={form.submit}
        >
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                initialValues={{
                    type: $Enums.DocumentType.ACADEMY_INFORMATION,
                }}
            >
                <Col span={24}>
                    <FormItem form={form} name={'type'} label="Loại tài liệu">
                        <Select
                            defaultValue={
                                $Enums.DocumentType.ACADEMY_INFORMATION
                            }
                            options={DOCUMENT_TYPE}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'question'} label="Câu hỏi">
                        <Input />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'answer'} label="Câu trả lời">
                        <Input.TextArea rows={6} />
                    </FormItem>
                </Col>
            </Form>
        </Modal>
    )
}

export default PutCauHoi
