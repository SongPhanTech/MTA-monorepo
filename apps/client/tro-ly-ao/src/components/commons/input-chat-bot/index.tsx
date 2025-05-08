import { MoreOutlined, SendOutlined } from '@ant-design/icons'
import { Dropdown, Button, Menu, Spin } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useRef } from 'react'

interface ChatInputProps {
    input: string
    loading: boolean
    onInputChange: (value: string) => void
    onSend: () => void
    onDelete?: () => void
}

export default function ChatInput({
    input,
    loading,
    onInputChange,
    onSend,
    onDelete,
}: ChatInputProps) {
    const router = useRouter()
    const isTroLyAo = router.pathname === '/tro-ly-ao'

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Hàm tự động điều chỉnh chiều cao của textarea
    const resizeTextarea = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [])

    useEffect(() => {
        resizeTextarea()
    }, [resizeTextarea])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            const cursorPosition = e.currentTarget.selectionStart
            const newValue = `${input.slice(0, cursorPosition)}\n${input.slice(cursorPosition)}`
            onInputChange(newValue)
            setTimeout(() => resizeTextarea(), 0)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInputChange(e.target.value)
    }

    return (
        <div className="sticky bottom-0 z-10 px-4">
            {/* Background fade mờ lên trên */}
            <div className="absolute left-0 right-0 bottom-full h-8 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 pb-4">
                <div className="rounded-3xl border flex flex-col gap-2 px-3 py-2 shadow bg-white">
                    <textarea
                        ref={textareaRef}
                        className="px-3 py-1 outline-none border-none text-base bg-transparent resize-none min-h-[32px] max-h-[160px] w-full"
                        placeholder="Hỏi bất kỳ điều gì ..."
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex justify-between items-center px-1">
                        {!isTroLyAo ? (
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
                                                        onClick={onDelete}
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
                        ) : (
                            <div />
                        )}
                        <Button
                            onClick={onSend}
                            className="bg-primary text-white w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center"
                            loading={loading}
                            icon={
                                loading ? (
                                    <Spin className="text-white" size="small" />
                                ) : (
                                    <SendOutlined className="text-white text-[16px]" />
                                )
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
