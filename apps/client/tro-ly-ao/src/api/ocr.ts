import axios from 'axios'
import { env } from '@/env'

export const fetchOCR = async (file: File) => {
    try {
        const formData = new FormData()
        formData.append('file', file)

        // const response = await axios.post(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/ocr`, formData, {
        //     headers: {
        //         'Content-Type': 'multipart/form-data',
        //     },
        // })
        const response = await axios.post(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (_error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API OCR' }
    }
}

interface OCRResult {
    task_id: string
    status: string
    output?: string
    text?: string
}

export const getOCRResult = async (taskId: string): Promise<OCRResult> => {
    try {
        const response = await axios.get(`${env.NEXT_PUBLIC_CHAT_BOT_URL}/result/${taskId}`)
        return response.data
    } catch (_error: any) {
        return { task_id: taskId, status: 'error', text: '' }
    }
}

export const pollOCRResult = async (
    taskId: string,
    onSuccess: (result: OCRResult) => void,
    onError?: (error: any) => void,
    maxRetries = 120,
    intervalMs = 3000
): Promise<void> => {
    let retries = 0

    const poll = async () => {
        try {
            const result = await getOCRResult(taskId)

            if (result.status === 'done') {
                console.log('[OCR Polling] Hoàn thành xử lý OCR với task_id:', taskId)
                onSuccess(result)
            } else if (result.status === 'error' || result.status === 'failed') {
                console.error('[OCR Polling] Xử lý OCR thất bại với task_id:', taskId)
                if (onError) onError(result)
            } else if (result.status === 'processing') {
                retries++
                console.log(
                    `[OCR Polling] Đang xử lý OCR (lần ${retries}/${maxRetries}), task_id: ${taskId}`
                )
                if (retries < maxRetries) {
                    setTimeout(poll, intervalMs)
                } else {
                    console.error('[OCR Polling] Timeout: Vượt quá số lần thử tối đa')
                    if (onError) onError(new Error('OCR processing timeout'))
                }
            }
        } catch (error) {
            console.error('[OCR Polling] Lỗi khi polling OCR result:', error)
            if (onError) onError(error)
        }
    }

    poll()
}
