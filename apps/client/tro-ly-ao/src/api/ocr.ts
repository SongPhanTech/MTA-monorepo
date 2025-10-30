import axios from 'axios'
import { env } from '@/env'

export const fetchOCR = async (file: File) => {
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/ocr`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (_error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API OCR' }
    }
}
