import { ArrowUpOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'

interface ChatInputProps {
    input: string
    loading: boolean
    onInputChange: (value: string) => void
    onSend: () => void
    onDelete?: () => void
    onStop?: () => void
    isFaqMode?: boolean
    onToggleFaqMode?: () => void
}

export default function ChatInput({
    input,
    loading,
    onInputChange,
    onSend,
    onDelete,
    onStop,
    isFaqMode = false,
    onToggleFaqMode,
}: ChatInputProps) {
    const _router = useRouter()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const resizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const scrollHeight = textareaRef.current.scrollHeight
            textareaRef.current.style.height = scrollHeight <= 160 ? `${scrollHeight}px` : '160px'
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        resizeTextarea()
    }, [input])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInputChange(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            const cursorPosition = e.currentTarget.selectionStart
            const newValue = `${input.slice(0, cursorPosition)}\n${input.slice(cursorPosition)}`
            onInputChange(newValue)
            setTimeout(resizeTextarea, 0)
        }
    }

    return (
        <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-white/95 to-white/60 backdrop-blur-md">
            {/* Background mờ fade lên trên */}
            <div className="absolute left-0 right-0 bottom-full h-12 bg-gradient-to-t from-white/80 via-white/30 to-transparent pointer-events-none" />

            <div className="w-full flex justify-center pb-4">
                <div className="w-full max-w-4xl px-4">
                    <div className="rounded-2xl border border-gray-200/80 px-3 py-2 shadow-lg shadow-black/5 bg-white/90 backdrop-blur-sm flex flex-col gap-2 transition-all duration-200 hover:shadow-xl hover:shadow-black/10">
                        {/* Dòng trên: textarea */}
                        <textarea
                            ref={textareaRef}
                            className={`py-1 px-3 outline-none border-none text-base bg-transparent resize-none min-h-[32px] w-full placeholder:text-gray-400 focus:placeholder:text-gray-300 transition-colors ${
                                loading ? 'cursor-not-allowed opacity-60' : ''
                            }`}
                            placeholder="Hỏi bất kỳ điều gì..."
                            value={input}
                            onChange={loading ? undefined : handleChange}
                            onKeyDown={loading ? undefined : handleKeyDown}
                            style={{
                                maxHeight: '160px',
                                overflowY: 'auto',
                                lineHeight: '1.6',
                            }}
                        />

                        {/* Dòng dưới: actions */}
                        <div className="flex justify-between items-center px-1">
                            <Tooltip title="Câu hỏi thường gặp">
                                <Button
                                    onClick={onToggleFaqMode}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border-0 transition-all duration-200 ${
                                        isFaqMode
                                            ? 'bg-primary text-white hover:bg-primary/90 shadow-md'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                    }`}
                                    icon={<QuestionCircleOutlined style={{ fontSize: 16 }} />}
                                />
                            </Tooltip>
                            {loading ? (
                                <Button
                                    className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 border-0 flex items-center justify-center shadow-md transition-all duration-200"
                                    icon={<div className="w-3 h-3 bg-white rounded-sm" />}
                                    onClick={onStop}
                                />
                            ) : (
                                <Button
                                    onClick={() => {
                                        if (!loading && input.trim()) {
                                            onSend()
                                        }
                                    }}
                                    className={`w-9 h-9 rounded-full border-0 flex items-center justify-center shadow-md transition-all duration-200 ${
                                        input.trim()
                                            ? 'bg-primary text-white hover:bg-primary/90 hover:scale-105'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                    icon={<ArrowUpOutlined className="text-[16px]" />}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
