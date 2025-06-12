import { env } from '@/env'

export async function fetchXuLyVanBan({
    text,
    doc_type,
    conversationId,
    signal, // thêm signal vào
}: {
    text: string
    doc_type: string
    conversationId: string
    signal?: AbortSignal // optional
}) {
    const params = new URLSearchParams({
        text,
        doc_type,
        conversationId,
    })

    const response = await fetch(
        `${env.NEXT_PUBLIC_TRO_LY_AO_URL}:8010/util/nlp_task?${params.toString()}`,
        {
            method: 'GET',
            signal, // truyền signal vào đây
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API NLP Task')
    }

    return response
}
