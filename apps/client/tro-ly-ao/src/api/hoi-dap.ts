import { env } from '@/env'

export async function fetchHoiDap({
    prompt,
    type_data,
    conversation_id,
    signal, // Thêm signal ở đây
}: {
    prompt: string
    type_data: string
    conversation_id: string
    signal: AbortSignal
}) {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('type_data', type_data)
    formData.append('conversation_id', conversation_id)

    const response = await fetch(
        // 'https://api.chat.chatbot.swantech.vn/hoi_dap',
        `${env.NEXT_PUBLIC_TRO_LY_AO_URL}:8011/hoi_dap`,
        {
            method: 'POST',
            body: formData,
            signal: signal,
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API Hỏi Đáp')
    }

    return response
}
