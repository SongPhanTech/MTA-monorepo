import { Col, Form, Input, Modal, message, Switch, Select, Row } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FormItem from '@components/commons/form-item'
import { cn } from '@lib/utils'
import {
    useCreatePrompt,
    useUpdatePrompt,
    useUpdateManyPrompt,
} from '@/../../../../packages/database/generated/hooks/prompt'

type PromptFormType = {
    code: string
    prompt: string
    description: string
    active: boolean
}

const PutPromptHoiDap = () => {
    const {
        isOpen,
        onClose,
        input: promptData,
    } = useDisclosure<any>({
        tag: 'PutPromptHoiDap',
    })

    const { mutateAsync: createPrompt } = useCreatePrompt()
    const { mutateAsync: updatePrompt } = useUpdatePrompt()
    const { mutateAsync: updateManyPrompts } = useUpdateManyPrompt()

    // Không cần fetch prompt data vì sẽ được truyền qua input
    const [form] = Form.useForm<PromptFormType>()

    useEffect(() => {
        if (isOpen && promptData) {
            form.setFieldsValue({
                code: promptData.code || '',
                prompt: promptData.prompt || '',
                description: promptData.description || '',
                active: promptData.active ?? true,
            })
        } else if (isOpen && !promptData) {
            // Reset form for new prompt
            form.resetFields()
            form.setFieldsValue({
                active: true,
            })
        }
    }, [isOpen, promptData, form])

    const handleCancel = () => {
        onClose()
        form.resetFields()
    }

    const onFinish = async (values: PromptFormType) => {
        try {
            if (promptData?.id) {
                // If activating this prompt, deactivate others with same code first
                if (values.active && !promptData.active) {
                    await updateManyPrompts({
                        where: {
                            code: values.code,
                            id: { not: promptData.id },
                        },
                        data: { active: false },
                    })
                }

                // Update existing prompt using ZenStack
                await updatePrompt({
                    where: { id: promptData.id },
                    data: {
                        prompt: values.prompt,
                        description: values.description,
                        active: values.active,
                    },
                })
            } else {
                // If creating active prompt, deactivate others with same code first
                if (values.active) {
                    await updateManyPrompts({
                        where: { code: values.code },
                        data: { active: false },
                    })
                }

                // Create new prompt using ZenStack
                await createPrompt({
                    data: {
                        code: values.code,
                        prompt: values.prompt,
                        description: values.description,
                        active: values.active,
                        status: 'APPROVE' as any, // Default status
                    },
                })
            }
            message.success(promptData?.id ? 'Cập nhật thành công' : 'Thêm mới thành công')
            handleCancel()
        } catch (error) {
            console.error('Error saving prompt:', error)
            message.error('Lưu thất bại, vui lòng thử lại sau')
        }
    }

    return (
        <Modal
            title={promptData?.id ? 'Chỉnh sửa Prompt' : 'Thêm mới Prompt'}
            open={isOpen}
            className={cn('min-w-[50vw]')}
            onCancel={handleCancel}
            okText="Đồng ý"
            cancelText="Hủy"
            onOk={form.submit}
        >
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Row gutter={16}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Loại Prompt"
                            rules={[{ required: true, message: 'Vui lòng chọn loại prompt' }]}
                        >
                            <Select placeholder="Chọn loại prompt" disabled={!!promptData?.id}>
                                <Select.Option value="rag">Hỏi đáp dựa trên RAG</Select.Option>
                                <Select.Option value="no-rag">Hỏi đáp thông thường</Select.Option>
                            </Select>
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="active"
                            label="Kích hoạt"
                            valuePropName="checked"
                        >
                            <Switch />
                        </FormItem>
                    </Col>
                </Row>

                <Col span={24}>
                    <FormItem
                        form={form}
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <Input.TextArea placeholder="Nhập mô tả cho prompt" rows={2} />
                    </FormItem>
                </Col>

                <Col span={24}>
                    <FormItem
                        form={form}
                        name="prompt"
                        label="Nội dung Prompt"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung prompt' }]}
                    >
                        <Input.TextArea rows={8} placeholder="Nhập nội dung prompt..." />
                    </FormItem>
                </Col>
            </Form>
        </Modal>
    )
}

export default PutPromptHoiDap
