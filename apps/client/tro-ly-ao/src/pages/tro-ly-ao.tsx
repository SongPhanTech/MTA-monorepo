import AI_TYPES from '@constants/ai_types'
import ChatLayout from '@layouts/chat-layout'
import { useSession } from '@workspace/auth/react'
import { type DocumentType, MessageSender } from '@workspace/db'
import { useCreateConversation } from '@workspace/db/hooks'
import { Typography, message } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'
const { Title } = Typography
export default function TroLyAo() {
    const router = useRouter()
    const { data: userCurrent } = useSession()

    const { id: conversationId } = router.query
    const [loading, setLoading] = useState(false)
    const { mutateAsync: createConversation } = useCreateConversation()
    const [currentConversationId, setCurrentConversationId] = useState<
        string | undefined
    >(conversationId as string)

    // const handleClick = async (key: string) => {
    //     try {
    //         setLoading(true)

    //         // Tìm loại AI đã chọn từ dữ liệu
    //         const selectedAI = Object.values(groupedAITypes)
    //             .flat()
    //             .find((item) => item.key === key)

    //         if (!selectedAI) {
    //             throw new Error('Không tìm thấy loại AI')
    //         }

    //         const { label } = selectedAI // Lấy label của AI đã chọn

    //         // Kiểm tra nếu chưa có currentConversationId thì tạo một cuộc trò chuyện mới
    //         if (!currentConversationId && userCurrent?.id) {
    //             const res = await createConversation({
    //                 data: {
    //                     userId: userCurrent?.id, // ID người dùng, thay theo đúng
    //                     message: {
    //                         create: [
    //                             {
    //                                 content: `${label}`, // Sử dụng label của AI
    //                                 sender: MessageSender.BOT,
    //                             },
    //                         ],
    //                     },
    //                     type: key as DocumentType,
    //                 },
    //             })

    //             const newConversationId = res?.id
    //             if (newConversationId) {
    //                 setCurrentConversationId(newConversationId)

    //                 // Chuyển sang trang hội thoại mới với query document_type
    //                 router.push({
    //                     pathname: `/hoi-thoai/${newConversationId}`,
    //                 })
    //             } else {
    //                 throw new Error('Không tạo được cuộc trò chuyện mới')
    //             }
    //         } else {
    //             // Nếu đã có currentConversationId, chuyển hướng sang trang hội thoại cũ với document_type
    //             router.push({
    //                 pathname: `/hoi-thoai/${currentConversationId}`,
    //             })
    //         }
    //     } catch (error) {
    //         console.error(error)
    //         message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
    //     } finally {
    //         setLoading(false)
    //     }
    // }
    const handleClick = async (key: string) => {
        if (loading) return // Chặn bấm liên tục

        setLoading(true)

        try {
            const selectedAI = Object.values(groupedAITypes)
                .flat()
                .find((item) => item.key === key)

            if (!selectedAI) throw new Error('Không tìm thấy loại AI')

            const { label } = selectedAI

            if (!currentConversationId && userCurrent?.sDM_NhanVienId) {
                const res = await createConversation({
                    data: {
                        userId: userCurrent.sDM_NhanVienId,
                        message: {
                            create: [
                                {
                                    content: label,
                                    sender: MessageSender.BOT,
                                },
                            ],
                        },
                        type: key as DocumentType,
                    },
                })

                const newId = res?.id
                if (newId) {
                    setCurrentConversationId(newId)
                    router.push({ pathname: `/hoi-thoai/${newId}` })
                } else {
                    throw new Error('Không tạo được cuộc trò chuyện mới')
                }
            } else {
                router.push({ pathname: `/hoi-thoai/${currentConversationId}` })
            }
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng thử lại sau')
        } finally {
            setLoading(false)
        }
    }
    const groupedAITypes = AI_TYPES.reduce(
        (acc, cur) => {
            if (!acc[cur.group]) acc[cur.group] = []
            acc[cur.group].push(cur)
            return acc
        },
        {} as Record<string, typeof AI_TYPES>
    )

    return (
        <div className="h-full overflow-auto p-6">
            {/* <h2 className="text-2xl font-semibold mb-6">Chọn loại Trợ lý AI</h2> */}
            {Object.entries(groupedAITypes).map(([group, items]) => (
                <div key={group} className="mb-10">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">
                        {group}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => (
                            <div
                                key={item.key}
                                onClick={() => handleClick(item.key)}
                                className={`group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 transform hover:bg-[#028850] hover:text-white hover:border-[#028850] hover:shadow-xl ${
                                    loading
                                        ? 'pointer-events-none opacity-50'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-xl text-[#028850] group-hover:text-white transition-all duration-300">
                                        {<item.icon />}
                                    </span>
                                    <span className="font-medium group-hover:text-white transition-all duration-300">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

TroLyAo.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
