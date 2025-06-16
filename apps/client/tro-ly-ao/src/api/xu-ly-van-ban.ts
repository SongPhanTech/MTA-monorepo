import { env } from '@/env'

export async function fetchXuLyVanBan({
    text,
    doc_type,
    conversationId,
    signal,
}: {
    text: string
    doc_type: string
    conversationId: string
    signal?: AbortSignal
}) {
    const params = new URLSearchParams({
        text,
        doc_type,
        conversationId,
    })

    const response = await fetch(
        `${env.NEXT_PUBLIC_DOC_CHAT_BOT_URL}/util/nlp_task?${params.toString()}`,
        {
            method: 'GET',
            signal,
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API NLP Task')
    }

    return response
}
