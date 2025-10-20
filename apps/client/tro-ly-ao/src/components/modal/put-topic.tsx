import FormItem from '@components/commons/form-item'
import { cn } from '@lib/utils'
import { getDefaultPromptTemplate } from '@lib/prompt-template'
import { $Enums } from '@workspace/db'
import {
    useCreateManyPrompt,
    useCreateTopic,
    useFindFirstPrompt,
    useFindFirstTopic,
    useUpdateManyPrompt,
    useUpdateTopic,
} from '@workspace/db/hooks'
import { Col, Form, Input, Modal, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useTopics } from '@/hooks/useTopics'

type TopicFormType = {
    name: string
    type: string
    description?: string
}

const PutTopic = () => {
    const { isTopicTypeExists } = useTopics()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutTopic',
    })
    const { mutateAsync: create } = useCreateTopic()
    const { mutateAsync: update } = useUpdateTopic()
    const { mutateAsync: createPrompt } = useCreateManyPrompt()
    const { mutateAsync: updatePrompt } = useUpdateManyPrompt()

    const { data: detail } = useFindFirstTopic({
        where: {
            id,
        },
    })

    const [form] = Form.useForm<TopicFormType>()

    // Clear form when opening new modal (no id)
    useEffect(() => {
        if (isOpen && !id) {
            form.resetFields()
        }
    }, [isOpen, id, form])

    useEffect(() => {
        if (id && detail) {
            form.setFieldsValue({
                name: detail.name || undefined,
                type: detail.type || undefined,
                description: detail.description || undefined,
            })
        }
    }, [id, detail, form])

    const { data: existingPrompt } = useFindFirstPrompt({
        where: {
            topicId: id,
        },
    })

    const onFinish = async (values: TopicFormType) => {
        const defaultPrompt = getDefaultPromptTemplate(values.name)

        try {
            if (id) {
                await update({
                    where: {
                        id,
                    },
                    data: {
                        name: values.name,
                        type: values.type,
                        description: values.description,
                    },
                })

                if (existingPrompt) {
                    await updatePrompt({
                        where: {
                            topicId: id,
                        },
                        data: {
                            prompt: defaultPrompt,
                        },
                    })
                }

                message.success('Cập nhật chủ đề thành công')
            } else {
                const newTopic = await create({
                    data: {
                        name: values.name,
                        type: values.type,
                        description: values.description,
                    },
                })

                if (newTopic) {
                    await createPrompt({
                        data: {
                            prompt: defaultPrompt,
                            topicId: newTopic.id,
                            status: $Enums.DocumentStatus.APPROVE,
                        },
                    })
                }

                message.success('Thêm chủ đề thành công')
            }
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <Modal
            title={id ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
            open={isOpen}
            className={cn('min-w-[40vw]')}
            onCancel={onClose}
            okText="Đồng ý"
            cancelText="Hủy"
            onOk={form.submit}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Col span={24}>
                    <FormItem
                        form={form}
                        name={'name'}
                        label="Tên chủ đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tên chủ đề' }]}
                    >
                        <Input placeholder="Nhập tên chủ đề" />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem
                        form={form}
                        name={'type'}
                        label="Mã định danh"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã định danh' },
                            {
                                pattern: /^[A-Z0-9]+(_[A-Z0-9]+)*$/,
                                message:
                                    'Mã định danh chỉ được chứa chữ in hoa, số và dấu gạch dưới (VD: CHAT_BOT, AI_ASSISTANT, GPT_4)',
                            },
                            {
                                validator: (_, value) => {
                                    if (!id && value && isTopicTypeExists(value)) {
                                        return Promise.reject(new Error('Mã định danh đã tồn tại'))
                                    }
                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input placeholder="Nhập mã định danh (VD: CHAT_BOT, AI_ASSISTANT)" />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'description'} label="Mô tả" required>
                        <Input.TextArea rows={4} placeholder="Nhập mô tả cho chủ đề" />
                    </FormItem>
                </Col>
            </Form>
        </Modal>
    )
}

export default PutTopic
