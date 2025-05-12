export async function fetchXuLyVanBan({
    text,
    doc_type,
    conversationId,
}: {
    text: string
    doc_type: string
    conversationId: string
}) {
    const params = new URLSearchParams({
        text,
        doc_type,
        conversationId: conversationId,
    })

    const response = await fetch(
        `http://117.4.240.104:8010/util/nlp_task?${params.toString()}`,
        {
            method: 'GET',
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API NLP Task')
    }

    return response // trả về response để handle stream ở ngoài
}
