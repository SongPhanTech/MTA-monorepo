import {
    AudioOutlined,
    MoreOutlined,
    RobotOutlined,
    SendOutlined,
    UserOutlined,
} from '@ant-design/icons'
import ChatLayout from '@layouts/chat-layout'
import { Avatar, Button, List } from 'antd'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export default function TroLyAo() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
        },
    ])
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleSend = () => {
        if (!input.trim()) return
        const newMessage = { id: Date.now(), role: 'user', content: input }
        setMessages([...messages, newMessage])
        setInput('')
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
                    renderItem={(msg) => (
                        <List.Item
                            key={msg.id}
                            style={{
                                justifyContent:
                                    msg.role === 'user'
                                        ? 'flex-end'
                                        : 'flex-start',
                                border: 'none',
                                padding: '8px 0',
                            }}
                        >
                            <div
                                className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar
                                    icon={
                                        msg.role === 'user' ? (
                                            <UserOutlined />
                                        ) : (
                                            <RobotOutlined />
                                        )
                                    }
                                    style={{
                                        backgroundColor:
                                            msg.role === 'user'
                                                ? '#000'
                                                : '#005f37',
                                    }}
                                />
                                <div
                                    className={`px-4 py-2 rounded-xl max-w-xs break-words ${
                                        msg.role === 'user'
                                            ? 'bg-black text-white rounded-br-none'
                                            : 'bg-[#005f37] text-white rounded-bl-none'
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
                    <div className="rounded-2xl border flex items-center gap-2 px-4 py-2 shadow bg-white">
                        <input
                            className="flex-1 outline-none border-none text-base"
                            placeholder="Hỏi bất kỳ điều gì"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <div className="flex items-center gap-2">
                            <Button className="p-2 rounded-full hover:bg-gray-100">
                                <AudioOutlined />
                            </Button>
                            <Button className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                <MoreOutlined />
                            </Button>
                            <Button
                                onClick={handleSend}
                                className="bg-primary text-white w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
                            >
                                <SendOutlined className="text-white text-md" />
                            </Button>
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
