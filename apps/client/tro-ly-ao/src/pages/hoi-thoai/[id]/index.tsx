import { fetchHoiDap } from '@/api/hoi-dap'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import ChatInput from '@components/commons/input-chat-bot'
import ChatLayout from '@layouts/chat-layout'
import { MessageSender } from '@workspace/db'
import {
    useCreateConversation,
    useDeleteConversation,
    useFindManyMessage,
    useUpdateConversation,
} from '@workspace/db/hooks'
import { Avatar, List, Spin, message } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
export default function Page() {
    // Hooks
    const router = useRouter()
    const { id } = router.query
    const scrollRef = useRef<HTMLDivElement>(null)

    const { mutateAsync: createConversation } = useCreateConversation()
    const { mutateAsync: updateConversation } = useUpdateConversation()
    const { mutateAsync: deleteConversation } = useDeleteConversation()
    const { data: messageList } = useFindManyMessage({
        where: {
            conversationId: id as string,
        },
    })

    // States
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<
        { id: number; role: string; content: string }[]
    >([])
    const [botTyping, setBotTyping] = useState(false)
    // Functions
    const handleSend = async () => {
        if (!input.trim()) return

        const newMessage = { id: Date.now(), role: 'USER', content: input }
        setMessages((prev) => [...prev, newMessage])
        setInput('')
        setBotTyping(true)

        try {
            setLoading(true)

            if (!id) {
                message.error('Cuộc trò chuyện không tồn tại.')
                setBotTyping(false)
                return
            }

            // Cập nhật conversation
            await updateConversation({
                where: { id: id as string },
                data: {
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

            // Gọi API để lấy stream
            const response = await fetchHoiDap({
                prompt: input,
                type_data: 'GENERAL_ADMISSIONS_INFORMATION',
                conversation_id: id as string,
            })

            if (!response.body) {
                message.error('Không có nội dung phản hồi')
                setBotTyping(false)
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder('utf-8')
            let botText = ''
            const botId = Date.now() + 1

            setMessages((prev) => [
                ...prev,
                { id: botId, role: 'BOT', content: '' },
            ])

            try {
                while (true) {
                    const { value, done } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    botText += chunk

                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botId
                                ? { ...msg, content: botText }
                                : msg
                        )
                    )
                }
            } finally {
                setBotTyping(false) // Dừng trạng thái typing
            }
        } catch (err) {
            console.error(err)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
            setBotTyping(false)
        } finally {
            setLoading(false)
        }
    }
    const handleDelete = async () => {
        if (!id) return

        try {
            setLoading(true)
            await deleteConversation({ where: { id: id as string } })
            message.success('Đã xóa cuộc trò chuyện')
            router.push('/tro-ly-ao')
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        } finally {
            setLoading(false)
        }
    }
    // Effects
    useEffect(() => {
        if (messageList) {
            const mappedMessages = messageList.map((msg) => ({
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

    // Render
    return (
        <div className="flex flex-col h-full">
            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 pb-10">
                {messages.length === 0 ? (
                    <div className="flex-1" />
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
                )}
            </div>
            {(botTyping ||
                messages.some((msg) => msg.role === 'BOT' && !msg.content)) && (
                <div className="flex justify-center items-center gap-2 pl-4 pb-4">
                    <div className="px-4 py-2 bg-[#D5DAE7] text-black rounded-xl max-w-xs">
                        <Spin size="small" />{' '}
                        <span className="ml-2">Đang trả lời...</span>
                    </div>
                </div>
            )}
            {/* Input Box */}
            <ChatInput
                input={input}
                loading={loading}
                onInputChange={setInput}
                onSend={handleSend}
                onDelete={handleDelete}
            />
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
