import {
    MoreOutlined,
    RobotOutlined,
    SendOutlined,
    UserOutlined,
} from '@ant-design/icons'
import ChatLayout from '@layouts/chat-layout'
import { MessageSender } from '@workspace/db'
import { useCreateConversation } from '@workspace/db/hooks'
import { Avatar, Button, List, message, Spin } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export default function TroLyAo() {
    const router = useRouter()
    const { id: conversationId } = router.query

    const scrollRef = useRef<HTMLDivElement>(null)
    const { mutateAsync: createConversation } = useCreateConversation()

    const [messages, setMessages] = useState<
        { id: number; role: string; content: string }[]
    >([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState<
        string | undefined
    >(conversationId as string)

    const handleSend = async () => {
        if (!input.trim()) return

        const newMessage = { id: Date.now(), role: 'USER', content: input }
        setMessages((prev) => [...prev, newMessage])
        setInput('')

        try {
            setLoading(true)

            if (!currentConversationId) {
                setCurrentConversationId('creating')

                const res = await createConversation({
                    data: {
                        userId: 'cm9tpyicp0000s401big8i0s9',
                        message: {
                            create: [
                                {
                                    content: input,
                                    sender: MessageSender.USER,
                                },
                            ],
                        },
                    },
                })

                const newId = res?.id
                if (newId) {
                    setCurrentConversationId(newId)
                    router.push(`/hoi-thoai/${newId}`)
                } else {
                    throw new Error('Không lấy được ID cuộc trò chuyện mới')
                }
            } else {
                // TODO: call API gửi message tiếp vào conversation cũ (nếu có)
            }
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
            setCurrentConversationId(undefined)
        } finally {
            setLoading(false)
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="relative h-100vh flex flex-col">
            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)] pr-2 pb-10"
            >
                <List
                    dataSource={messages}
                    locale={{
                        emptyText: (
                            <div className="text-center text-gray-500 mt-10">
                                <p>Bạn có thể hỏi bất cứ điều gì.</p>
                            </div>
                        ),
                    }}
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
                                    style={{ backgroundColor: '#028850' }}
                                />
                                <div
                                    className={`px-4 py-2 rounded-xl max-w-xs break-words ${
                                        msg.role === 'USER'
                                            ? 'bg-[#BEDACE] text-black rounded-br-none'
                                            : 'bg-[#D5DAE7] text-black rounded-bl-none'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            {/* Input Box */}
            <div className="fixed bottom-0 left-0 w-full px-0 mb-4">
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="rounded-3xl border flex items-center gap-1 px-3 py-2 shadow bg-white">
                        <input
                            className="flex-1 outline-none border-none text-base"
                            placeholder="Hỏi bất kỳ điều gì"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <div className="flex items-center gap-1">
                            <Button className="bg-gray-100 p-0 w-8 h-8 rounded-full flex items-center justify-center">
                                <MoreOutlined className="text-[18px]" />
                            </Button>
                            <Button
                                onClick={handleSend}
                                className="bg-primary text-white w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
                                loading={loading}
                                icon={
                                    loading ? (
                                        <Spin
                                            className="text-white"
                                            size="small"
                                        />
                                    ) : (
                                        <SendOutlined className="text-white text-[16px]" />
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

TroLyAo.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
