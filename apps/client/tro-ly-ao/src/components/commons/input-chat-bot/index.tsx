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
    const router = useRouter()
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
        <div className="sticky bottom-0 z-10 w-full bg-white">
            {/* Background mờ fade lên trên */}
            <div className="absolute left-0 right-0 bottom-full h-8 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />

            <div className="w-full flex justify-center pb-4">
                <div className="w-full max-w-4xl px-4">
                    <div className="rounded-3xl border px-3 py-2 shadow bg-white flex flex-col gap-2">
                        {/* Dòng trên: textarea */}
                        <textarea
                            ref={textareaRef}
                            className="py-1 px-3 outline-none border-none text-base bg-transparent resize-none min-h-[32px] w-full"
                            placeholder="Hỏi bất kỳ điều gì ..."
                            value={input}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            style={{
                                maxHeight: '160px',
                                overflowY: 'auto',
                                lineHeight: '1.5',
                            }}
                        />

                        {/* Dòng dưới: actions */}
                        <div className="flex justify-between items-center px-1">
                            <Tooltip title="Câu hỏi thường gặp">
                                <Button
                                    onClick={onToggleFaqMode}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isFaqMode
                                            ? 'bg-primary text-white hover:opacity-80'
                                            : 'bg-gray-100 hover:bg-gray-200 text-[#aaa]'
                                    }`}
                                    icon={<QuestionCircleOutlined style={{ fontSize: 16 }} />}
                                />
                            </Tooltip>
                            {loading ? (
                                <Button
                                    className="p-2"
                                    icon={<div className="w-2.5 h-2.5 bg-white" />}
                                    type="primary"
                                    shape="circle"
                                    danger
                                    onClick={onStop}
                                />
                            ) : (
                                <Button
                                    onClick={onSend}
                                    className="bg-primary text-white w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
                                    icon={<ArrowUpOutlined className="text-white text-[16px]" />}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
