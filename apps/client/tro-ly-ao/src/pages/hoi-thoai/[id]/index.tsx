import {
    MoreOutlined,
    RobotOutlined,
    SendOutlined,
    UserOutlined,
} from '@ant-design/icons'
import ChatLayout from '@layouts/chat-layout'
import { MessageSender } from '@workspace/db'
import {
    useCreateConversation,
    useDeleteConversation,
    useFindManyMessage,
    useUpdateConversation,
} from '@workspace/db/hooks'
import { Avatar, Button, Dropdown, List, Menu, Spin, message } from 'antd'
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
        where: { conversationId: id as string },
    })

    // States
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<
        { id: number; role: string; content: string }[]
    >([])

    // Functions
    const handleSend = async () => {
        if (!input.trim()) return

        const newMessage = { id: Date.now(), role: 'USER', content: input }

        // Update UI immediately
        setMessages((prevMessages) => [...prevMessages, newMessage])
        setInput('')

        try {
            setLoading(true)

            if (id) {
                // Nếu đã có conversation ➔ Update
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
            } else {
                // Nếu chưa có conversation ➔ Create mới
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
                console.log('Created conversation:', res)
            }
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
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
        <div className="relative h-100vh flex flex-col">
            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)] pr-2 pb-10"
            >
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
                            <Dropdown
                                trigger={['click']}
                                overlay={
                                    <Menu
                                        items={[
                                            {
                                                key: 'delete',
                                                label: (
                                                    <span
                                                        className="text-red-500"
                                                        onClick={handleDelete}
                                                    >
                                                        Xoá hội thoại
                                                    </span>
                                                ),
                                            },
                                        ]}
                                    />
                                }
                            >
                                <Button className="bg-gray-100 p-0 w-8 h-8 rounded-full flex items-center justify-center">
                                    <MoreOutlined className="text-[18px]" />
                                </Button>
                            </Dropdown>
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

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
