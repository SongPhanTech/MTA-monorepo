import KhaoSatLayout from '@layouts/khao-sat-layout'
import { Button, Card, Checkbox, Input, Radio, Space, Typography } from 'antd'
import { useState } from 'react'

const { Title } = Typography

type QuestionType = 'single' | 'multiple' | 'text'

interface Question {
    id: string
    type: QuestionType
    question: string
    options?: string[]
}

const fakeSurvey: Question[] = [
    {
        id: 'q1',
        type: 'single',
        question: 'Bạn thích loại trái cây nào nhất?',
        options: ['Táo', 'Chuối', 'Nho', 'Cam'],
    },
    {
        id: 'q2',
        type: 'multiple',
        question: 'Bạn thường sử dụng framework nào?',
        options: ['React', 'Vue', 'Angular', 'Svelte'],
    },
    {
        id: 'q3',
        type: 'text',
        question: 'Bạn có góp ý gì cho sản phẩm không?',
    },
    {
        id: 'q4',
        type: 'single',
        question: 'Bạn sử dụng hệ điều hành nào?',
        options: ['Windows', 'macOS', 'Linux', 'Khác'],
    },
    {
        id: 'q5',
        type: 'multiple',
        question: 'Bạn sử dụng trình duyệt nào?',
        options: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    },
    {
        id: 'q6',
        type: 'text',
        question: 'Bạn mong muốn cải tiến nào trong giao diện?',
    },
    {
        id: 'q7',
        type: 'single',
        question: 'Bạn sử dụng điện thoại hãng nào?',
        options: ['Apple', 'Samsung', 'Xiaomi', 'Khác'],
    },
    {
        id: 'q8',
        type: 'multiple',
        question: 'Bạn quan tâm đến chủ đề nào?',
        options: ['Công nghệ', 'Sức khỏe', 'Giáo dục', 'Tài chính'],
    },
    {
        id: 'q9',
        type: 'text',
        question: 'Bạn đánh giá thế nào về trải nghiệm người dùng?',
    },
    {
        id: 'q10',
        type: 'single',
        question: 'Bạn có sẵn sàng giới thiệu sản phẩm này không?',
        options: ['Có', 'Không', 'Còn phân vân'],
    },
    {
        id: 'q11',
        type: 'multiple',
        question: 'Bạn sử dụng mạng xã hội nào?',
        options: ['Facebook', 'Instagram', 'Twitter', 'TikTok'],
    },
    {
        id: 'q12',
        type: 'text',
        question: 'Điều gì khiến bạn quay lại sử dụng sản phẩm?',
    },
    {
        id: 'q13',
        type: 'single',
        question: 'Bạn đánh giá hiệu năng sản phẩm thế nào?',
        options: ['Tốt', 'Trung bình', 'Kém'],
    },
    {
        id: 'q14',
        type: 'multiple',
        question: 'Bạn sử dụng dịch vụ nào của chúng tôi?',
        options: ['Website', 'Mobile App', 'Hỗ trợ khách hàng', 'Blog'],
    },
    {
        id: 'q15',
        type: 'text',
        question: 'Bạn có gặp lỗi nào trong quá trình sử dụng không?',
    },
    {
        id: 'q16',
        type: 'single',
        question: 'Bạn sử dụng sản phẩm bao lâu rồi?',
        options: ['< 1 tháng', '1-6 tháng', '6-12 tháng', '> 1 năm'],
    },
    {
        id: 'q17',
        type: 'multiple',
        question: 'Bạn biết đến sản phẩm qua đâu?',
        options: ['Bạn bè', 'Quảng cáo', 'Tìm kiếm Google', 'Mạng xã hội'],
    },
    {
        id: 'q18',
        type: 'text',
        question: 'Bạn mong muốn tính năng nào trong tương lai?',
    },
    {
        id: 'q19',
        type: 'single',
        question: 'Bạn đánh giá độ ổn định của sản phẩm ra sao?',
        options: ['Rất ổn định', 'Ổn định', 'Không ổn định'],
    },
    {
        id: 'q20',
        type: 'text',
        question: 'Ý kiến tổng thể của bạn về sản phẩm là gì?',
    },
]

function SurveyPage() {
    const [answers, setAnswers] = useState<
        Record<string, string | string[] | undefined>
    >({})

    const handleChange = (id: string, value: string | string[] | undefined) => {
        setAnswers((prev) => ({ ...prev, [id]: value }))
    }

    const handleSubmit = () => {
        console.log('User Answers:', answers)
    }

    return (
        <div className="min-h-screen py-5">
            <Card style={{ maxWidth: 800, margin: '0 auto' }}>
                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                >
                    <div>
                        <Title level={3} className="text-primary">
                            Trả lời khảo sát
                        </Title>
                        <Typography.Paragraph>
                            Cảm ơn bạn đã dành thời gian tham gia khảo sát! Mục
                            tiêu của khảo sát này là:
                        </Typography.Paragraph>
                        <ul
                            style={{
                                paddingLeft: 20,
                                marginBottom: 16,
                                listStyleType: 'disc',
                            }}
                        >
                            <li>
                                Thu thập ý kiến người dùng để cải thiện sản
                                phẩm.
                            </li>
                            <li>Hiểu rõ nhu cầu và hành vi sử dụng của bạn.</li>
                            <li>
                                Mọi thông tin sẽ được bảo mật và chỉ dùng cho
                                mục đích nghiên cứu nội bộ.
                            </li>
                        </ul>
                        <Typography.Paragraph>
                            Vui lòng trả lời đầy đủ và trung thực. Khảo sát chỉ
                            mất khoảng <strong>3-5 phút</strong>. Xin chân thành
                            cảm ơn!
                        </Typography.Paragraph>
                    </div>
                    {fakeSurvey.map((q, index) => (
                        <div key={q.id}>
                            <Title level={5} className="text-primary">
                                {index + 1}. {q.question}
                            </Title>
                            {q.type === 'single' && q.options && (
                                <Radio.Group
                                    onChange={(e) =>
                                        handleChange(q.id, e.target.value)
                                    }
                                    value={
                                        answers[q.id] as string[] | undefined
                                    }
                                >
                                    <Space direction="vertical">
                                        {q.options.map((opt) => (
                                            <Radio key={opt} value={opt}>
                                                {opt}
                                            </Radio>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            )}
                            {q.type === 'multiple' && q.options && (
                                <Checkbox.Group
                                    options={q.options}
                                    value={
                                        answers[q.id] as string[] | undefined
                                    }
                                    onChange={(val) => handleChange(q.id, val)}
                                />
                            )}
                            {q.type === 'text' && (
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Nhập câu trả lời của bạn..."
                                    value={answers[q.id]}
                                    onChange={(e) =>
                                        handleChange(q.id, e.target.value)
                                    }
                                />
                            )}
                        </div>
                    ))}
                    <Button type="primary" onClick={handleSubmit}>
                        Gửi phản hồi
                    </Button>
                </Space>
            </Card>
        </div>
    )
}

export default SurveyPage

SurveyPage.getLayout = function getLayout(page: React.ReactNode) {
    return <KhaoSatLayout>{page}</KhaoSatLayout>
}
