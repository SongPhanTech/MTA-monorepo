import axiosInstance from './axios-instance'
import axios from 'axios'

export const TimKiemTheoTuKhoa = async (prompt: string) => {
    try {
        const response = await axiosInstance.post(
            '/tim_kiem_theo_tu_khoa',
            new URLSearchParams({ prompt })
        )
        return response.data
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            throw new Error('Yêu cầu quá thời gian. Vui lòng thử lại sau.')
        }

        throw new Error('Đã xảy ra lỗi khi gọi API.')
    }
}
