import { CopyOutlined, DownOutlined } from '@ant-design/icons'
import ChatInput from '@components/commons/input-chat-bot'
import ChatLayout from '@layouts/chat-layout'
import { MessageSender } from '@workspace/db'
import {
    useFindManyMessage,
    useFindUniqueConversation,
    useUpdateConversation,
} from '@workspace/db/hooks'
import { Button, List, message } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { fetchHoiDap, fetchHoiDapFaq } from '@/api/hoi-dap'

export default function Page() {
    const router = useRouter()
    const { id, isInitMessage } = router.query
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isFaqMode, setIsFaqMode] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<{ id: number; role: string; content: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const [isUserScrolling, setIsUserScrolling] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [hasAutoReplied, setHasAutoReplied] = useState(false)

    const { mutateAsync: updateConversation } = useUpdateConversation()

    const { data: conversationCurrent } = useFindUniqueConversation(
        {
            where: { id: id as string },
        },
        {
            enabled: !!id,
        }
    )

    const { data: messageList } = useFindManyMessage({
        where: { conversationId: id as string },
    })

    const handleSend = async () => {
        if (!input.trim() || !id || loading || isStreaming) return

        // Abort any existing request
        if (abortController) {
            abortController.abort()
            setAbortController(null)
        }

        const currentInput = input
        setInput('')

        const userMessage = {
            id: Date.now(),
            role: 'USER',
            content: currentInput,
        }
        setMessages((prev) => [...prev, userMessage])

        await sendMessage(currentInput, userMessage.id)
    }

    const sendMessage = useCallback(
        async (text: string, userMessageId: number, skipUserMessage = false) => {
            setLoading(true)
            const controller = new AbortController()
            setAbortController(controller)

            try {
                // Chỉ tạo USER message nếu chưa có (khi user gửi từ input)
                if (!skipUserMessage) {
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
                }

                const response = await (isFaqMode ? fetchHoiDapFaq : fetchHoiDap)({
                    prompt: text,
                    type_data: conversationCurrent?.type ?? '',
                    conversation_id: id as string,
                    signal: controller.signal,
                })

                if (!response.ok) {
                    message.error('Lỗi từ server')
                    setLoading(false)
                    return
                }

                let botReply = ''

                if (isFaqMode) {
                    const json = await response.json()
                    if (json?.error === 'True') {
                        message.error('Đã xảy ra lỗi từ máy chủ')
                        return
                    }
                    botReply = json?.success_detail || 'Không có phản hồi'

                    // Hiển thị response với chức năng FAQ
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now(),
                            role: 'BOT',
                            content: botReply,
                        },
                    ])
                } else {
                    // Tạo message BOT trống trước
                    const botMessageId = Date.now()
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: botMessageId,
                            role: 'BOT',
                            content: '',
                        },
                    ])

                    // lấy từ steam và cập nhật
                    const reader = response.body?.getReader()
                    const decoder = new TextDecoder()

                    if (reader) {
                        let accumulatedText = ''
                        setLoading(false) // Tắt loading khi bắt đầu trả lời
                        setIsStreaming(true) // Bắt đầu streaming

                        while (true) {
                            // Check if request was aborted
                            if (controller.signal.aborted) {
                                break
                            }

                            const { done, value } = await reader.read()
                            if (done) break

                            const chunk = decoder.decode(value, { stream: true })
                            accumulatedText += chunk

                            // Cập nhật toàn bộ message của BOT
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === botMessageId
                                        ? { ...msg, content: accumulatedText }
                                        : msg
                                )
                            )
                        }

                        setIsStreaming(false) // Kết thúc streaming
                        botReply = accumulatedText
                    } else {
                        // Fallback nếu không có stream
                        botReply = await response.text()
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === botMessageId ? { ...msg, content: botReply } : msg
                            )
                        )
                    }
                }

                setTimeout(() => {
                    setLoading(false)
                    setIsStreaming(false)
                    setAbortController(null)
                }, 0)
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    // message.warning('Đã hủy yêu cầu')
                    // hủy yêu cầu khi chuyển sang cuộc hội thoại khác
                } else {
                    console.error(err)
                    message.error('Đã xảy ra lỗi khi gửi tin nhắn')
                }
                setLoading(false)
                setIsStreaming(false)
            } finally {
                setAbortController(null)
            }
        },
        [id, isFaqMode, conversationCurrent?.type, updateConversation]
    )

    const handleStop = () => {
        if (abortController) {
            abortController.abort()
            setAbortController(null)
        }
        setLoading(false)
        setIsStreaming(false)
    }

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            setIsUserScrolling(false)
            setShowScrollButton(false)
        }
    }

    const handleScroll = () => {
        if (!scrollRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

        if (isAtBottom) {
            setIsUserScrolling(false)
            setShowScrollButton(false)
        } else {
            setIsUserScrolling(true)
            setShowScrollButton(true)
        }
    }

    useEffect(() => {
        if (messageList) {
            const sortedMessages = [...messageList].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )

            const mappedMessages = sortedMessages.map((msg) => ({
                id: Number(msg.id),
                role: msg.sender === 'USER' ? 'USER' : 'BOT',
                content: msg.content || '',
            }))
            setMessages(mappedMessages)
        }
    }, [messageList])

    // Reset states khi chuyển conversation khác
    // biome-ignore lint/correctness/useExhaustiveDependencies: need to reset when conversation changes
    useEffect(() => {
        // Hủy request đang pending nếu có
        if (abortController) {
            abortController.abort()
        }

        // Reset các state
        setLoading(false)
        setIsStreaming(false)
        setAbortController(null)
        setInput('')
        setIsUserScrolling(false)
        setShowScrollButton(false)
        setHasAutoReplied(false)
    }, [id]) // Chạy khi id thay đổi

    // Tự động gọi API cho conversation mới (chỉ có USER message, chưa có BOT reply)
    useEffect(() => {
        if (
            messageList &&
            messageList.length === 1 &&
            messageList[0].sender === 'USER' &&
            id &&
            !loading &&
            !isStreaming &&
            !hasAutoReplied &&
            conversationCurrent && // conversationCurrent đã load
            !messageList.some((msg) => msg.sender === 'BOT') && // Chưa có tin nhắn BOT nào
            isInitMessage === 'true' // Chỉ auto reply cho tin nhắn init
        ) {
            const userMessage = messageList[0]
            setHasAutoReplied(true)
            sendMessage(userMessage.content || '', Date.now(), true) // skipUserMessage = true

            // Xóa param isInitMessage khỏi URL sau khi đã xử lý
            router.replace(`/hoi-thoai/${id}`, undefined, { shallow: true })
        }
    }, [
        messageList,
        id,
        conversationCurrent,
        loading,
        isStreaming,
        hasAutoReplied,
        sendMessage,
        isInitMessage,
        router,
    ])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (scrollRef.current && !isUserScrolling) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isUserScrolling])

    return (
        <div className="flex flex-col h-full items-center bg-white overflow-hidden">
            <div className="w-full flex flex-col h-full min-w-0 relative max-w-5xl mx-auto">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pb-4 no-scrollbar px-4 md:px-6"
                    onScroll={handleScroll}
                >
                    {messages.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            Bắt đầu cuộc trò chuyện...
                        </div>
                    ) : (
                        <List
                            dataSource={
                                loading &&
                                !messages.some((m) => m.role === 'BOT' && m.content === '')
                                    ? [...messages, { id: -1, role: 'BOT', content: 'loading' }]
                                    : messages
                            }
                            renderItem={(msg) => (
                                <List.Item
                                    key={msg.id}
                                    style={{
                                        justifyContent:
                                            msg.role === 'USER' ? 'flex-end' : 'flex-start',
                                        border: 'none',
                                        padding: '8px 0',
                                    }}
                                >
                                    {msg.content === 'loading' ? (
                                        <div className="flex justify-start">
                                            <div className="flex items-center space-x-1 px-4 py-3 bg-[#D5DAE7] text-black rounded-2xl rounded-bl-md shadow-sm max-w-[95%]">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0s]" />
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0.2s]" />
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} min-w-0`}
                                        >
                                            <div
                                                className={`px-4 py-3 rounded-2xl break-words overflow-hidden shadow-sm ${
                                                    msg.content.length <= 50
                                                        ? 'max-w-max'
                                                        : 'max-w-[75%]'
                                                } ${
                                                    msg.role === 'USER'
                                                        ? 'bg-[#BEDACE] text-black rounded-br-md'
                                                        : 'bg-[#D5DAE7] text-black rounded-bl-md'
                                                }`}
                                            >
                                                <div className="relative group">
                                                    {msg.role === 'USER' ? (
                                                        <div
                                                            style={{
                                                                whiteSpace: 'pre-wrap',
                                                            }}
                                                            className="font-normal"
                                                        >
                                                            {msg.content}
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <ReactMarkdown>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        icon={<CopyOutlined />}
                                                        className={`absolute -bottom-1 ${
                                                            msg.role === 'USER'
                                                                ? '-left-1'
                                                                : '-right-1'
                                                        } opacity-0 group-hover:opacity-100 transition-all duration-200 border-0 shadow-lg rounded-full w-8 h-8 flex items-center justify-center ${
                                                            msg.role === 'USER'
                                                                ? 'bg-white hover:bg-gray-50 text-primary'
                                                                : 'bg-primary hover:bg-primary/90 text-white'
                                                        }`}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                msg.content
                                                            )
                                                            message.success('Đã sao chép nội dung!')
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </List.Item>
                            )}
                        />
                    )}
                </div>

                <div className="relative">
                    {showScrollButton && (
                        <div
                            onClick={scrollToBottom}
                            className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50 w-8 h-8 bg-primary/90 hover:bg-primary text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
                        >
                            <DownOutlined className="text-xs" />
                        </div>
                    )}
                    <ChatInput
                        input={input}
                        loading={loading}
                        onInputChange={setInput}
                        onSend={handleSend}
                        onStop={handleStop}
                        isFaqMode={isFaqMode}
                        onToggleFaqMode={() => setIsFaqMode((prev) => !prev)}
                    />
                </div>
            </div>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
