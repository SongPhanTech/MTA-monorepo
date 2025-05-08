import FormItem from '@components/commons/form-item'
import { DOCUMENT_TYPE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import type { $Enums } from '@workspace/db'
import { Button, Col, Form, Input, InputNumber, Row } from 'antd'

type QuestionAnswerType = {
    question: string
    answer: string
}

type PromptType = {
    [key in $Enums.DocumentType]: QuestionAnswerType
}

type PromptQuestionAnswerType = {
    type: $Enums.DocumentType
    label: string
}

const PromptQuestionAnswer = ({ label, type }: PromptQuestionAnswerType) => {
    const [form] = Form.useForm<QuestionAnswerType>()

    return (
        <Form layout="vertical">
            <span className="text-lg font-semibold text-gray-700">{label}</span>
            <FormItem name="answer" required form={form}>
                <Input.TextArea placeholder="Nhập mẫu prompt" rows={4} />
            </FormItem>
            <div className="flex justify-end">
                <Button type="primary" htmlType="submit">
                    Lưu
                </Button>
            </div>
        </Form>
    )
}

function Page() {
    return (
        <div>
            <span className="text-xl font-semibold text-gray-700">
                Thiết lập Prompt
            </span>
            <Row
                gutter={[16, 16]}
                className="mt-4 bg-white p-4 rounded-md shadow-sm"
            >
                {DOCUMENT_TYPE.map((item) => (
                    <Col span={12} key={item.value}>
                        <PromptQuestionAnswer
                            type={item.value}
                            label={item.label}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
