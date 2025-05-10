export async function fetchHoiDap({
    prompt,
    type_data,
    conversation_id,
}: {
    prompt: string
    type_data: string
    conversation_id: string
}) {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('type_data', type_data)
    formData.append('conversation_id', conversation_id)

    const response = await fetch(
        'https://api.chat.chatbot.swantech.vn/hoi_dap',
        {
            method: 'POST',
            body: formData,
        }
    )

    if (!response.ok) {
        throw new Error('Lỗi khi gọi API Hỏi Đáp')
    }

    return response // trả về response để handle stream ở ngoài
}
