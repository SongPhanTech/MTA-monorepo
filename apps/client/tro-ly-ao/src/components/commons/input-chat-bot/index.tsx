import { MoreOutlined, SendOutlined } from '@ant-design/icons'
import { Dropdown, Button, Menu, Spin } from 'antd'
import React from 'react'

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
    return (
        <div className="sticky bottom-0 z-10 px-4">
            {/* Background fade mờ lên trên */}
            <div className="absolute left-0 right-0 bottom-full h-8 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 pb-4">
                <div className="rounded-3xl border flex items-center gap-1 px-3 py-2 shadow bg-white">
                    <input
                        className="px-4 flex-1 outline-none border-none text-base bg-transparent"
                        placeholder="Hỏi bất kỳ điều gì ..."
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
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
