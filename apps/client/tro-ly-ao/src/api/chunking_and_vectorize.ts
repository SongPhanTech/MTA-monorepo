import { env } from '@/env'
import axios from 'axios'

const postFormUrlEncoded = async (url: string, id_document: string) => {
    const params = new URLSearchParams()
    params.append('id_document', id_document)

    const response = await axios.post(url, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    return response.data
}

export const fetchChungkingAndVectorizeDocument = async (
    id_document: string
) => {
    try {
        return await postFormUrlEncoded(
            `${env.NEXT_PUBLIC_CHAT_BOT_URL}/chungking_and_vectorize_document`,
            id_document
        )
    } catch (error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API' }
    }
}

export const fetchFAQDocument = async (id_document: string) => {
    try {
        return await postFormUrlEncoded(
            `${env.NEXT_PUBLIC_CHAT_BOT_URL}/faq_vectorize`,
            id_document
        )
    } catch (error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API FAQ' }
    }
}

export const deleteVectorRecordHoiDap = async (id_document: string) => {
    try {
        return await postFormUrlEncoded(
            `${env.NEXT_PUBLIC_CHAT_BOT_URL}/xoa_ban_ghi_trong_vector_db_hoi_dap`,
            id_document
        )
    } catch (error: any) {
        return {
            status: 500,
            error: 'True',
            message: 'Lỗi xóa bản ghi Hỏi Đáp',
        }
    }
}

export const deleteVectorRecordFAQ = async (id_document: string) => {
    try {
        return await postFormUrlEncoded(
            `${env.NEXT_PUBLIC_CHAT_BOT_URL}/xoa_ban_ghi_trong_db_faq`,
            id_document
        )
    } catch (error: any) {
        return { status: 500, error: 'True', message: 'Lỗi xóa bản ghi FAQ' }
    }
}
