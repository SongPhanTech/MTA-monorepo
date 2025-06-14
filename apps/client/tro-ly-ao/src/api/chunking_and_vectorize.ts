import { env } from '@/env'
import axios from 'axios'

export const fetchChungkingAndVectorizeDocument = async (
    id_document: string
) => {
    try {
        const params = new URLSearchParams()
        params.append('id_document', id_document)

        const response = await axios.post(
            `${env.NEXT_PUBLIC_TRO_LY_AO_URL}:8011/chungking_and_vectorize_document`,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )

        return response.data
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API' }
    }
}

export const fetchFAQDocument = async (id_document: string) => {
    try {
        const params = new URLSearchParams()
        params.append('id_document', id_document)

        const response = await axios.post(
            `${env.NEXT_PUBLIC_TRO_LY_AO_URL}:8011/faq_vectorize`,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )

        return response.data
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        return { status: 500, error: 'True', message: 'Lỗi gọi API FAQ' }
    }
}
