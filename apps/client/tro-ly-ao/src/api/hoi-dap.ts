import { env } from '@/env'

export async function fetchHoiDap({
    prompt,
    conversation_id,
    signal,
    document_ids,
}: {
    prompt: string
    conversation_id: string
    signal: AbortSignal
    document_ids?: string[]
}) {
    const params = new URLSearchParams()
    params.append('prompt', prompt)
    params.append('conversation_id', conversation_id)

    if (document_ids && document_ids.length > 0) {
        params.append('document_ids', document_ids.join(','))
    }

    const response = await fetch(
        // 'https://api.chat.chatbot.swantech.vn/hoi_dap_v2',
        `${env.NEXT_PUBLIC_CHAT_BOT_URL}/hoi_dap_v4`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            signal: signal,
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API Hỏi Đáp')
    }

    return response
}

export async function fetchHoiDapFaq({
    prompt,
    conversation_id,
    signal,
}: {
    prompt: string
    conversation_id: string
    signal: AbortSignal
}) {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('conversation_id', conversation_id)

    const response = await fetch(
        // 'https://api.chat.chatbot.swantech.vn/hoi_dap_faq',
        `${env.NEXT_PUBLIC_CHAT_BOT_URL}/hoi_dap_faq`,
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

export async function fetchRecommendByTopicId({
    topic_id,
    signal,
}: {
    topic_id: string
    signal?: AbortSignal
}) {
    const formData = new URLSearchParams()
    formData.append('topic_id', topic_id)

    const response = await fetch(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/recommend_by_topic_id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: signal,
    })

    if (!response.ok) {
        throw new Error('Lỗi khi tải danh sách câu hỏi FAQ')
    }

    return response
}

export async function fetchGetFaqAnswer({
    question,
    topic_id,
    conversation_id,
    signal,
}: {
    question: string
    topic_id: string
    conversation_id: string
    signal?: AbortSignal
}) {
    const formData = new URLSearchParams()
    formData.append('question', question)
    formData.append('topic_id', topic_id)
    formData.append('conversation_id', conversation_id)

    const response = await fetch(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/get_faq_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: signal,
    })

    if (!response.ok) {
        throw new Error('Lỗi khi lấy câu trả lời FAQ')
    }

    return response
}
