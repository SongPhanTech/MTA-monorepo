import FormItem from '@components/commons/form-item'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Form, Input, InputNumber, Row } from 'antd'
import { ArrowLeftIcon } from 'lucide-react'

// Mâu tham số cho LLM
type ParamsType = {
    temperature: number
    topP: number
    topK: number
    maxTokens: number
    presencePenalty: number
}

function Page() {
    const [form] = Form.useForm<ParamsType>()
    const onFinish = async (values: ParamsType) => {}

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 bg-white p-2 px-4 rounded-md shadow-sm">
                <ArrowLeftIcon size={20} />
                <span className="text-xl font-semibold text-gray-700">
                    Thiết lập tham số
                </span>
            </div>
            <Form
                form={form}
                onFinish={onFinish}
                layout="horizontal"
                className="mt-4 bg-white p-4 rounded-md shadow-sm"
            >
                <Row gutter={[12, 12]}>
                    <Col span={12}>
                        <FormItem
                            name="temperature"
                            label="Độ ngẫu nhiên (0 = rất chắc chắn, 1 = sáng tạo)"
                            required
                            form={form}
                        >
                            <InputNumber max={1} min={0} step={0.01} />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            name="topK"
                            label="Lấy top K từ có xác suất cao nhất"
                            required
                            form={form}
                        >
                            <InputNumber min={0} step={1} />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            name="topP"
                            label="Lấy từ trong tập P xác suất tích lũy"
                            required
                            form={form}
                        >
                            <InputNumber min={0} step={1} />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            name="presencePenalty"
                            label="Phạt lặp lại từ hoặc câu cũ"
                            required
                            form={form}
                        >
                            <InputNumber min={0} step={1} />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            name="maxTokens"
                            label="Số lượng token tối đa"
                            required
                            form={form}
                        >
                            <InputNumber min={0} step={1} />
                        </FormItem>
                    </Col>
                </Row>
                <Col span={24} className="flex justify-end">
                    <Button type="primary" htmlType="submit">
                        Lưu
                    </Button>
                </Col>
            </Form>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
