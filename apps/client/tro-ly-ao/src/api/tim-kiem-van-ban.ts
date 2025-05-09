// services/searchService.ts
import axiosInstance from './axios-instance'

export const TimKiemTheoTuKhoa = async (prompt: string) => {
    try {
        const response = await axiosInstance.post(
            '/tim_kiem_theo_tu_khoa',
            new URLSearchParams({ prompt })
        )
        return response.data
    } catch (error) {
        console.error('Lỗi khi gọi searchByKeyword:', error)
        return []
    }
}
