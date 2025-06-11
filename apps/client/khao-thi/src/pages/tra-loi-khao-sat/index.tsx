import KhaoSatLayout from '@layouts/khao-sat-layout'
import {
    Button,
    Card,
    Checkbox,
    Input,
    message,
    Radio,
    Space,
    Typography,
} from 'antd'
import { useState } from 'react'
import {
    useFindManySurveyQuestion,
    useCreateManySurveyAnswer,
} from '@workspace/db/hooks'
import type { SurveyQuestion } from '@workspace/db'
import useSpinner from '@hooks/spinner'
import { ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'

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
    // ... các câu hỏi khác giữ nguyên
]

function SurveyPage() {
    // Thay đổi cấu trúc của answers thành mảng
    const [answers, setAnswers] = useState<
        Array<{
            surveyQuestionId: string
            answer: string | string[]
        }>
    >([])

    const { data = [], refetch } = useFindManySurveyQuestion()
    const { mutateAsync: createMany } = useCreateManySurveyAnswer()
    const router = useRouter()

    const questions = data.map((item: SurveyQuestion) => {
        return {
            id: item.id,
            type: 'text',
            question: item.name,
            options: ['Rất ổn định', 'Ổn định', 'Không ổn định'],
        }
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const handleChange = (id: string, value: string | string[]) => {
        const existingAnswerIndex = answers.findIndex(
            (a) => a.surveyQuestionId === id
        )

        if (existingAnswerIndex !== -1) {
            setAnswers((prev) => {
                const newAnswers = [...prev]
                newAnswers[existingAnswerIndex] = {
                    surveyQuestionId: id,
                    answer: value,
                }
                return newAnswers
            })
        } else {
            setAnswers((prev) => [
                ...prev,
                {
                    surveyQuestionId: id,
                    answer: value,
                },
            ])
        }
    }

    const handleSubmit = async () => {
        console.log('User Answers:', answers)
        try {
            showSpinner()
            await createMany({
                data: answers.map((item) => {
                    return {
                        ...item,
                        answer: Array.isArray(item.answer)
                            ? item.answer.join(',')
                            : item.answer,
                        userId: 'cm9tpyicp0000s401big8i0s9',
                    }
                }),
            })

            message.success('Nộp khảo sát thành công')
            router.push(ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG)
        } catch (error) {
            message.error('Nộp khảo sát thất bại')
        }
        hideSpinner()
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
                    {questions.map((q, index) => {
                        // Tìm câu trả lời hiện tại của câu hỏi này (nếu có)
                        const currentAnswer = answers.find(
                            (a) => a.surveyQuestionId === q.id
                        )

                        return (
                            <div key={q.id}>
                                <Title level={5} className="text-primary">
                                    {index + 1}. {q.question}
                                </Title>
                                {q.type === 'single' && q.options && (
                                    <Radio.Group
                                        onChange={(e) =>
                                            handleChange(q.id, e.target.value)
                                        }
                                        value={currentAnswer?.answer as string}
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
                                            currentAnswer?.answer as string[]
                                        }
                                        onChange={(val) =>
                                            handleChange(q.id, val)
                                        }
                                    />
                                )}
                                {q.type === 'text' && (
                                    <Input.TextArea
                                        rows={4}
                                        placeholder="Nhập câu trả lời của bạn..."
                                        value={currentAnswer?.answer as string}
                                        onChange={(e) =>
                                            handleChange(q.id, e.target.value)
                                        }
                                    />
                                )}
                            </div>
                        )
                    })}
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
