import FormItem from '@components/commons/form-item'
import DefaultLayout from '@layouts/default-layout'
import {
    useCreateChatBotConfig,
    useCreateManyChatBotConfig,
    useFindFirstChatBotConfig,
    useFindManyChatBotConfig,
    useUpdateChatBotConfig,
} from '@workspace/db/hooks'
import { Button, Col, Form, InputNumber, Row, message } from 'antd'
import { useEffect, useState } from 'react'

// Mâu tham số cho LLM
type ParamsType = {
    temperature?: string
    topP?: string
    topK?: string
    maxTokens?: string
    presencePenalty?: string
}

function Page() {
    const [form] = Form.useForm<ParamsType>()
    const { data: chatbotConfig = [] } = useFindManyChatBotConfig({})
    const [isEditing, setIsEditing] = useState(false)
    const [initialValues, setInitialValues] = useState<ParamsType | null>(null)

    useEffect(() => {
        if (chatbotConfig) {
            const values = {
                temperature: chatbotConfig.find((e) => e.name === 'temperature')
                    ?.value,
                topP: chatbotConfig.find((e) => e.name === 'topP')?.value,
                topK: chatbotConfig.find((e) => e.name === 'topK')?.value,
                maxTokens: chatbotConfig.find((e) => e.name === 'maxTokens')
                    ?.value,
                presencePenalty: chatbotConfig.find(
                    (e) => e.name === 'presencePenalty'
                )?.value,
            }
            form.setFieldsValue(values)
            setInitialValues(values)
        }
    }, [chatbotConfig, form])

    const { mutateAsync: updateChatbotConfig } = useUpdateChatBotConfig()
    const { mutateAsync: createChatbotConfig } = useCreateManyChatBotConfig()
    const onFinish = async (values: ParamsType) => {
        try {
            const configData = [
                { name: 'temperature', value: values.temperature },
                { name: 'topP', value: values.topP },
                { name: 'topK', value: values.topK },
                { name: 'maxTokens', value: values.maxTokens },
                { name: 'presencePenalty', value: values.presencePenalty },
            ]

            if (chatbotConfig.length > 0) {
                await Promise.all(
                    configData.map((item) => {
                        return updateChatbotConfig({
                            where: { name: item.name },
                            data: {
                                value: String(item.value) ?? '',
                            },
                        })
                    })
                )
            } else {
                await createChatbotConfig({
                    data: configData.map((item) => {
                        return {
                            name: item.name,
                            value: String(item.value) ?? '',
                        }
                    }),
                })
            }
            message.success('Cập nhật thành công')
            setIsEditing(false)
            setInitialValues(values)
        } catch (error) {
            console.error('Error updating chatbot config:', error)
            message.error('Cập nhật thất bại, vui lòng thử lại sau')
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4 bg-white rounded-md">
                <span className="text-xl font-semibold text-gray-700">
                    Thiết lập tham số
                </span>
            </div>
            <Form
                form={form}
                onFinish={onFinish}
                layout="horizontal"
                className="mt-4 bg-white rounded-md"
            >
                <Row gutter={[12, 12]}>
                    <Col span={24}>
                        <FormItem
                            name="temperature"
                            label="Độ ngẫu nhiên (0 = rất chắc chắn, 1 = sáng tạo)"
                            required
                            form={form}
                        >
                            <InputNumber
                                max={1}
                                min={0}
                                step={0.01}
                                disabled={!isEditing}
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="topK"
                            label="Lấy top K từ có xác suất cao nhất"
                            required
                            form={form}
                        >
                            <InputNumber
                                min={0}
                                step={1}
                                disabled={!isEditing}
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="topP"
                            label="Lấy từ trong tập P xác suất tích lũy"
                            required
                            form={form}
                        >
                            <InputNumber
                                min={0}
                                step={1}
                                disabled={!isEditing}
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="presencePenalty"
                            label="Phạt lặp lại từ hoặc câu cũ"
                            required
                            form={form}
                        >
                            <InputNumber
                                min={0}
                                step={1}
                                disabled={!isEditing}
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="maxTokens"
                            label="Số lượng token tối đa"
                            required
                            form={form}
                        >
                            <InputNumber
                                min={0}
                                step={1}
                                disabled={!isEditing}
                            />
                        </FormItem>
                    </Col>
                </Row>
                <div className="flex justify-end gap-2 mt-4">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={() => {
                                    form.setFieldsValue(initialValues || {})
                                    setIsEditing(false)
                                }}
                            >
                                Huỷ
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Lưu
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>Sửa</Button>
                    )}
                </div>
            </Form>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
