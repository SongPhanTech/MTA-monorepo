import { getRuntimeEnv } from "@workspace/libs/utils"
import axios from "axios"

const postFormUrlEncoded = async (url: string, id_document: string, fieldName: string) => {
  const params = new URLSearchParams()
  params.append(fieldName, id_document)

  const response = await axios.post(url, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  return response.data
}

export const fetchChungkingAndVectorizeDocument = async (id_document: string) => {
  try {
    return await postFormUrlEncoded(
      `${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/index_document_v4`,
      id_document,
      "id_document"
    )
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi gọi API" }
  }
}

export const fetchChungkingAndVectorizeDocumentAll = async () => {
  try {
    const response = await axios.post(`${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/index_all_v4`)
    return response.data
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi gọi API" }
  }
}

export const getStatusChungkingAndVectorizeDocument = async () => {
  try {
    const response = await axios.get(`${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/index_v4_status`)
    return response.data
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi gọi API" }
  }
}

export const fetchFAQVectorize = async (faq_id: string) => {
  try {
    return await postFormUrlEncoded(
      `${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/faq_vectorize`,
      faq_id,
      "faq_id"
    )
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi gọi API FAQ" }
  }
}

export const deleteVectorRecordHoiDap = async (id_document: string) => {
  try {
    return await postFormUrlEncoded(
      `${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/xoa_ban_ghi_trong_vector_db_hoi_dap_v4`,
      id_document,
      "id_document"
    )
  } catch (_error: any) {
    return {
      status: 500,
      error: "True",
      message: "Lỗi xóa bản ghi Hỏi Đáp",
    }
  }
}

export const deleteVectorRecordFAQ = async (id_document: string) => {
  try {
    return await postFormUrlEncoded(
      `${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/xoa_ban_ghi_trong_db_faq`,
      id_document,
      "id_document"
    )
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi xóa bản ghi FAQ" }
  }
}

export const reloadBM25 = async (id_document: string) => {
  try {
    return await postFormUrlEncoded(
      `${getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")}/reload_bm25`,
      id_document,
      "id_document"
    )
  } catch (_error: any) {
    return { status: 500, error: "True", message: "Lỗi reload BM25" }
  }
}
