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
import { Col, Form, Input, Modal, message, Checkbox, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useTopics } from '@/hooks/useTopics'

type TopicFormType = {
    name: string
    type: string
    description?: string
    isPinned?: boolean
}

const PutTopic = () => {
    const { isTopicTypeExists } = useTopics()
    const [hasUserEditedType, setHasUserEditedType] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
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
    const nameValue = Form.useWatch('name', form)

    const removeVietnameseTones = (str: string): string => {
        const from =
            'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ'
        const to =
            'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
        let result = str
        for (let i = 0; i < from.length; i++) {
            result = result.replace(new RegExp(from[i], 'g'), to[i])
        }
        return result
    }

    const generateTypeFromName = (name: string): string => {
        if (!name) return ''

        const baseType = removeVietnameseTones(name)
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')

        let finalType = baseType
        let counter = 1
        while (isTopicTypeExists(finalType)) {
            finalType = `${baseType}_${counter}`
            counter++
        }

        return finalType
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value

        if (!id && !hasUserEditedType) {
            if (newName) {
                const generatedType = generateTypeFromName(newName)
                form.setFieldValue('type', generatedType)
            } else {
                form.setFieldValue('type', '')
            }
        }
    }

    useEffect(() => {
        if (isOpen) {
            if (id && detail) {
                const pinnedValue = detail.isPinned === true
                setIsPinned(pinnedValue)
                form.setFieldsValue({
                    name: detail.name || undefined,
                    type: detail.type || undefined,
                    description: detail.description || undefined,
                    isPinned: pinnedValue,
                })
            } else if (!id) {
                setIsPinned(false)
                form.resetFields()
                setHasUserEditedType(false)
            }
        }
    }, [isOpen, id, detail, form])

    const { data: existingPrompt } = useFindFirstPrompt({
        where: {
            topicId: id,
        },
    })

    const onFinish = async (values: TopicFormType) => {
        const finalValues = {
            ...values,
            isPinned: isPinned,
        }
        try {
            if (id) {
                await update({
                    where: {
                        id,
                    },
                    data: {
                        name: finalValues.name,
                        type: finalValues.type,
                        description: finalValues.description,
                        isPinned: finalValues.isPinned,
                    },
                })

                const updatedPrompt = getDefaultPromptTemplate(finalValues.name)

                if (existingPrompt) {
                    await updatePrompt({
                        where: {
                            topicId: id,
                        },
                        data: {
                            prompt: updatedPrompt,
                        },
                    })
                }

                message.success('Cập nhật chủ đề thành công')
            } else {
                const newTopic = await create({
                    data: {
                        name: finalValues.name,
                        type: finalValues.type,
                        description: finalValues.description,
                        isPinned: finalValues.isPinned,
                    },
                })

                if (newTopic) {
                    const defaultPrompt = getDefaultPromptTemplate(finalValues.name)
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
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                initialValues={{
                    isPinned: false,
                }}
            >
                <Col span={24}>
                    <FormItem
                        form={form}
                        name={'name'}
                        label="Tên chủ đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tên chủ đề' }]}
                    >
                        <Input placeholder="Nhập tên chủ đề" onChange={handleNameChange} />
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
                        <Input
                            placeholder="Nhập mã định danh (VD: CHAT_BOT, AI_ASSISTANT)"
                            onChange={() => setHasUserEditedType(true)}
                            disabled={!id && !nameValue}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name={'description'} label="Mô tả">
                        <Input.TextArea rows={4} placeholder="Nhập mô tả cho chủ đề" />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <Tooltip title="Chủ đề được ghim sẽ hiển thị làm câu hỏi gợi ý trên trang chủ hỏi đáp">
                        <Checkbox
                            checked={isPinned}
                            onChange={(e) => {
                                const newValue = e.target.checked
                                setIsPinned(newValue)
                                form.setFieldValue('isPinned', newValue)
                            }}
                        >
                            <span className="text-sm">Chủ đề gợi ý</span>
                        </Checkbox>
                    </Tooltip>
                </Col>
            </Form>
        </Modal>
    )
}

export default PutTopic
