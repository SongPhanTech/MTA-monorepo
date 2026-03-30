import axios from "axios"
import { axiosInstanceChatbot } from "./axios-instance"

export const TimKiemTheoTuKhoa = async (prompt: string) => {
  try {
    const response = await axiosInstanceChatbot.post(
      "/tim_kiem_theo_tu_khoa",
      new URLSearchParams({ prompt })
    )
    return response.data
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      throw new Error("Yêu cầu quá thời gian. Vui lòng thử lại sau.")
    }

    throw new Error("Đã xảy ra lỗi khi gọi API.")
  }
}

export const TimKiemTheoNguNghia = async (prompt: string) => {
  try {
    const response = await axiosInstanceChatbot.post(
      "/tim_kiem_theo_ngu_nghia",
      new URLSearchParams({ prompt })
    )
    return response.data
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      throw new Error("Yêu cầu quá thời gian. Vui lòng thử lại sau.")
    }

    throw new Error("Đã xảy ra lỗi khi gọi API.")
  }
}
