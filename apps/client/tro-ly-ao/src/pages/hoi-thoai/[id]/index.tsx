import { fetchHoiDap } from '@/api/hoi-dap'
import { readStreamWithLiveUpdate } from '@/utils'
import { CopyOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import ChatInput from '@components/commons/input-chat-bot'
import ChatLayout from '@layouts/chat-layout'
import { MessageSender } from '@workspace/db'
import {
    useFindManyMessage,
    useFindUniqueConversation,
    useUpdateConversation,
} from '@workspace/db/hooks'
import { Avatar, Button, List, Spin, message } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Page() {
    const router = useRouter()
    const { id } = router.query
    const scrollRef = useRef<HTMLDivElement>(null)

    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<
        { id: number; role: string; content: string }[]
    >([])
    const [loading, setLoading] = useState(false)
    const [botTyping, setBotTyping] = useState(false)
    const [abortController, setAbortController] =
        useState<AbortController | null>(null)

    const { mutateAsync: updateConversation } = useUpdateConversation()

    const { data: conversationCurrent } = useFindUniqueConversation({
        where: { id: id as string },
    })

    const { data: messageList } = useFindManyMessage({
        where: { conversationId: id as string },
    })

    const handleSend = async () => {
        if (!input.trim() || !id || botTyping) return

        const currentInput = input
        setInput('')

        // 1. Hiển thị ngay trên UI
        const userMessage = {
            id: Date.now(),
            role: 'USER',
            content: currentInput,
        }
        setMessages((prev) => [...prev, userMessage])

        // 2. Gửi bot trả lời (không block UI)
        await sendMessage(currentInput, userMessage.id)
    }

    const sendMessage = async (text: string, userMessageId: number) => {
        setBotTyping(true)
        setLoading(true)

        const controller = new AbortController()
        setAbortController(controller)

        try {
            await updateConversation({
                where: { id: id as string },
                data: {
                    message: {
                        create: [
                            {
                                content: text,
                                sender: MessageSender.USER,
                            },
                        ],
                    },
                },
            })

            const response = await fetchHoiDap({
                prompt: text,
                type_data: conversationCurrent?.type ?? '',
                conversation_id: id as string,
                signal: controller.signal,
            })

            const contentType = response.headers.get('content-type')
            if (contentType?.includes('application/json')) {
                const json = await response.json()
                if (json.error === 'True') {
                    message.error('Đã xảy ra lỗi từ máy chủ')
                    return
                }
            }

            if (!response.body) {
                message.error('Không có nội dung phản hồi')
                setBotTyping(false)
                setLoading(false)
                return
            }

            setBotTyping(false)
            setLoading(false)

            const botId = Date.now()
            setMessages((prev) => [
                ...prev,
                {
                    id: botId,
                    role: 'BOT',
                    content: '...',
                },
            ])

            await readStreamWithLiveUpdate(
                response.body,
                async (chunk, fullText) => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botId
                                ? { ...msg, content: fullText }
                                : msg
                        )
                    )
                }
            )
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                message.warning('Đã hủy yêu cầu')
            } else {
                console.error(err)
                message.error('Đã xảy ra lỗi khi gửi tin nhắn')
            }
        }
    }

    const handleStop = () => {
        abortController?.abort()
        setBotTyping(false)
        setLoading(false)
    }

    useEffect(() => {
        if (messageList) {
            const sortedMessages = [...messageList].sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
            )

            const mappedMessages = sortedMessages.map((msg) => ({
                id: Number(msg.id),
                role: msg.sender === 'USER' ? 'USER' : 'BOT',
                content: msg.content || '',
            }))
            setMessages(mappedMessages)
        }
    }, [messageList])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="flex flex-col h-full items-center bg-white">
            <div className="w-full  flex flex-col h-full px-4">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pb-4 no-scrollbar"
                >
                    {messages.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            Bắt đầu cuộc trò chuyện...
                        </div>
                    ) : (
                        <List
                            dataSource={messages}
                            renderItem={(msg) => (
                                <List.Item
                                    key={msg.id}
                                    style={{
                                        justifyContent:
                                            msg.role === 'USER'
                                                ? 'flex-end'
                                                : 'flex-start',
                                        border: 'none',
                                        padding: '8px 0',
                                    }}
                                >
                                    <div
                                        className={`flex items-end gap-2 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Avatar
                                            icon={
                                                msg.role === 'USER' ? (
                                                    <UserOutlined />
                                                ) : (
                                                    <RobotOutlined />
                                                )
                                            }
                                            style={{
                                                backgroundColor: '#028850',
                                            }}
                                        />
                                        <div
                                            className={`px-4 py-2 rounded-xl max-w-[80%] break-words ${
                                                msg.role === 'USER'
                                                    ? 'bg-[#BEDACE] text-black rounded-br-none'
                                                    : 'bg-[#D5DAE7] text-black rounded-bl-none'
                                            }`}
                                        >
                                            <div className="relative group">
                                                {msg.role === 'USER' ? (
                                                    <div
                                                        style={{
                                                            whiteSpace:
                                                                'pre-wrap',
                                                        }}
                                                        className="font-normal"
                                                    >
                                                        {msg.content}
                                                    </div>
                                                ) : (
                                                    <ReactMarkdown>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                )}
                                                <Button
                                                    size="small"
                                                    icon={<CopyOutlined />}
                                                    className={`absolute bottom-0 ${
                                                        msg.role === 'USER'
                                                            ? 'right-0'
                                                            : 'left-0'
                                                    } opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-white`}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            msg.content
                                                        )
                                                        message.success(
                                                            'Đã sao chép nội dung!'
                                                        )
                                                    }}
                                                    type="text"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                    {botTyping && (
                        <div className="flex justify-center items-center py-2">
                            <div className="flex items-center space-x-1 px-4 py-3 bg-[#D5DAE7] text-black rounded-2xl">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0s]" />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                </div>

                <ChatInput
                    input={input}
                    loading={loading}
                    onInputChange={setInput}
                    onSend={handleSend}
                    onStop={handleStop}
                />
            </div>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
