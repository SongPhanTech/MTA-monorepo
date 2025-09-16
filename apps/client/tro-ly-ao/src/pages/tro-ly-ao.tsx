import ChatInput from '@components/commons/input-chat-bot'
import ChatLayout from '@layouts/chat-layout'
import { type DocumentType, MessageSender } from '@workspace/db'
import { useCreateConversation } from '@workspace/db/hooks'
import { Card, message } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useRef, useState } from 'react'

const SUGGESTED_QUESTIONS = [
    'Điều kiện tuyển sinh vào học viện là gì?',
    'Chương trình đào tạo có những ngành nào?',
    'Quy chế thi cử như thế nào?',
    'Chính sách hỗ trợ cho học viên quân sự?',
    'Thông tin về cơ sở vật chất của học viện?',
    'Lịch học và thời gian biểu ra sao?',
]

export default function TroLyAo() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const { mutateAsync: createConversation } = useCreateConversation()
    const isProcessingRef = useRef(false)

    const handleSend = async () => {
        if (!input.trim() || loading || isProcessingRef.current) return

        isProcessingRef.current = true
        setLoading(true)

        try {
            // Calculate label from first message (user input)
            const label = input.trim()

            const res = await createConversation({
                data: {
                    sessionId: 'cmfjff3dr0000kpv4gahido0t',
                    message: {
                        create: [
                            {
                                content: label,
                                sender: MessageSender.USER,
                            },
                        ],
                    },
                    type: 'ACADEMY_INFORMATION' as DocumentType,
                },
            })

            const newId = res?.id
            if (newId) {
                setInput('') // Reset input after successful creation
                router.push({ pathname: `/hoi-thoai/${newId}` })
            } else {
                throw new Error('Không tạo được cuộc trò chuyện mới')
            }
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        } finally {
            setLoading(false)
            isProcessingRef.current = false
        }
    }

    const handleSuggestionClick = async (question: string) => {
        if (loading || isProcessingRef.current) return

        isProcessingRef.current = true

        setInput(question)
        setLoading(true)

        try {
            // Calculate label from the question
            const label = question.trim()

            const res = await createConversation({
                data: {
                    sessionId: 'cmfjff3dr0000kpv4gahido0t',
                    message: {
                        create: [
                            {
                                content: label,
                                sender: MessageSender.USER,
                            },
                        ],
                    },
                    type: 'ACADEMY_INFORMATION' as DocumentType,
                },
            })

            const newId = res?.id
            if (newId) {
                setInput('') // Reset input after successful creation
                router.push({ pathname: `/hoi-thoai/${newId}` })
            } else {
                throw new Error('Không tạo được cuộc trò chuyện mới')
            }
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        } finally {
            setLoading(false)
            isProcessingRef.current = false
        }
    }
    return (
        <div className="h-full flex flex-col">
            {/* Main content area */}
            <div className="flex-1 flex flex-col justify-center items-center px-6">
                {/* Welcome message */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Xin chào! Tôi có thể giúp gì cho bạn?
                    </h1>
                    <p className="text-gray-600">
                        Hỏi tôi bất kỳ điều gì về Học viện Kỹ thuật Quân sự
                    </p>
                </div>

                {/* Suggested questions */}
                <div className="w-full max-w-4xl mb-8">
                    <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">
                        Câu hỏi gợi ý
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SUGGESTED_QUESTIONS.map((question) => (
                            <Card
                                key={question}
                                className={`transition-all duration-200 ${
                                    loading || isProcessingRef.current
                                        ? 'cursor-not-allowed opacity-50 pointer-events-none'
                                        : 'cursor-pointer hover:shadow-md hover:border-primary'
                                }`}
                                onClick={() =>
                                    !loading &&
                                    !isProcessingRef.current &&
                                    handleSuggestionClick(question)
                                }
                                styles={{ body: { padding: '12px 16px' } }}
                            >
                                <p className="text-sm text-gray-700 m-0">{question}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat input at bottom */}
            <div className="pb-4">
                <ChatInput
                    input={input}
                    loading={loading}
                    onInputChange={setInput}
                    onSend={handleSend}
                />
            </div>
        </div>
    )
}

TroLyAo.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
