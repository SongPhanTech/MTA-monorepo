import FormItem from '@components/commons/form-item'
import DefaultLayout from '@layouts/default-layout'
import {
    useCreateManyChatBotConfig,
    useFindManyChatBotConfig,
    useUpdateChatBotConfig,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { TRO_LY_AO_PERMISSION } from '@workspace/router'
import { Alert, Button, Col, Form, InputNumber, message, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'

const { Paragraph, Text } = Typography

// Mâu tham số cho LLM
type ParamsType = {
    temperature?: string
    topP?: string
    topK?: string
    maxTokens?: string
    presencePenalty?: string
}

function Page() {
    const { can } = useAbility()
    const [form] = Form.useForm<ParamsType>()
    const { data: chatbotConfig = [] } = useFindManyChatBotConfig({})
    const [isEditing, setIsEditing] = useState(false)
    const [initialValues, setInitialValues] = useState<ParamsType | null>(null)

    useEffect(() => {
        if (chatbotConfig) {
            const values = {
                temperature: chatbotConfig.find((e) => e.name === 'temperature')?.value,
                topP: chatbotConfig.find((e) => e.name === 'topP')?.value,
                topK: chatbotConfig.find((e) => e.name === 'topK')?.value,
                maxTokens: chatbotConfig.find((e) => e.name === 'maxTokens')?.value,
                presencePenalty: chatbotConfig.find((e) => e.name === 'presencePenalty')?.value,
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
                <span className="text-xl font-semibold text-gray-700">Thiết lập tham số</span>
            </div>

            <Alert
                message="Hướng dẫn cấu hình tham số"
                description={
                    <div className="space-y-2">
                        <Paragraph className="mb-2">
                            Các tham số này kiểm soát cách mô hình ngôn ngữ (LLM) tạo ra câu trả
                            lời:
                        </Paragraph>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <Text strong>Temperature (Độ ngẫu nhiên):</Text> Giá trị từ 0-1. Giá
                                trị thấp (0-0.3) cho câu trả lời chính xác, nhất quán. Giá trị cao
                                (0.7-1) cho câu trả lời sáng tạo, đa dạng hơn.
                            </li>
                            <li>
                                <Text strong>Top K:</Text> Giới hạn số lượng từ có xác suất cao nhất
                                để chọn. Giá trị thấp (10-20) cho kết quả tập trung hơn, giá trị cao
                                (40-100) cho đa dạng hơn.
                            </li>
                            <li>
                                <Text strong>Top P:</Text> Chọn từ trong tập có tổng xác suất đạt
                                ngưỡng P. Giá trị từ 0-1. Thường dùng 0.9-0.95 để cân bằng chất
                                lượng và đa dạng.
                            </li>
                            <li>
                                <Text strong>Presence Penalty (Phạt lặp lại):</Text> Giảm khả năng
                                lặp lại nội dung đã xuất hiện. Giá trị từ 0-2. Giá trị cao làm giảm
                                sự lặp lại nhưng có thể làm mất mạch câu.
                            </li>
                            <li>
                                <Text strong>Max Tokens:</Text> Số lượng token tối đa trong câu trả
                                lời. 1 token ≈ 4 ký tự tiếng Anh hoặc 1-2 từ tiếng Việt. Giá trị cao
                                cho phép câu trả lời dài hơn nhưng tốn tài nguyên hơn.
                            </li>
                        </ul>
                        <Paragraph className="mt-3 mb-0">
                            <Text strong>Gợi ý cấu hình:</Text> Temperature = 0.7, Top K = 40, Top P
                            = 0.9, Presence Penalty = 0.6, Max Tokens = 2000
                        </Paragraph>
                    </div>
                }
                type="info"
                className="mb-4"
                style={{ backgroundColor: '#D9EDE4', borderColor: '#D9EDE4' }}
            />

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
                            label="Temperature - Độ ngẫu nhiên"
                            required
                            form={form}
                        >
                            <InputNumber
                                type="number"
                                max={1}
                                min={0}
                                step={0.01}
                                disabled={!isEditing}
                                placeholder="Ví dụ: 0.7"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="topK"
                            label="Top K - Số lượng từ được xét"
                            required
                            form={form}
                        >
                            <InputNumber
                                type="number"
                                min={1}
                                step={1}
                                disabled={!isEditing}
                                placeholder="Ví dụ: 40"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="topP"
                            label="Top P - Ngưỡng xác suất tích lũy"
                            required
                            form={form}
                        >
                            <InputNumber
                                type="number"
                                max={1}
                                min={0}
                                step={0.01}
                                disabled={!isEditing}
                                placeholder="Ví dụ: 0.9"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="presencePenalty"
                            label="Presence Penalty - Phạt lặp lại"
                            required
                            form={form}
                        >
                            <InputNumber
                                type="number"
                                max={2}
                                min={0}
                                step={0.1}
                                disabled={!isEditing}
                                placeholder="Ví dụ: 0.6"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem
                            name="maxTokens"
                            label="Max Tokens - Độ dài tối đa"
                            required
                            form={form}
                        >
                            <InputNumber
                                type="number"
                                min={100}
                                step={100}
                                disabled={!isEditing}
                                placeholder="Ví dụ: 2000"
                            />
                        </FormItem>
                    </Col>
                </Row>
                <div className="flex justify-end gap-2 mt-4">
                    {can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_THAM_SO, 'SUA') &&
                        (isEditing ? (
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
                        ))}
                </div>
            </Form>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Quản trị' }, { title: 'Cấu hình tham số' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
