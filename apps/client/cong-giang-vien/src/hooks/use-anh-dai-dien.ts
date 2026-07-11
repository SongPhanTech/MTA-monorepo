import { getRuntimeEnv } from "@workspace/libs/utils"
import axios from "axios"
import { useEffect, useState } from "react"

/**
 * Tải ảnh đại diện (avatar) theo userProfileId, trả về blob URL để hiển thị.
 * `phienBan` là khóa tùy chọn (vd: tên file avatar) để tải lại ảnh khi avatar được cập nhật.
 */
const useAnhDaiDien = (userProfileId?: string, phienBan?: string) => {
  const [anhDaiDien, setAnhDaiDien] = useState<string>()

  useEffect(() => {
    if (!userProfileId) {
      setAnhDaiDien(undefined)
      return
    }

    let urlAnh: string | undefined
    let daHuy = false

    const taiAnh = async () => {
      try {
        const res = await axios.get(
          `${getRuntimeEnv("NEXT_PUBLIC_API_UPLOAD_URL")}/Files/employee/${userProfileId}/image`,
          {
            responseType: "blob",
            headers: {
              "Content-Type": "multipart/form-data",
              "K-TenantCode": window.tenantCode,
              "K-AppCode": getRuntimeEnv("NEXT_PUBLIC_APP_CODE"),
            },
            params: {
              h: 100,
              w: 100,
              appCode: getRuntimeEnv("NEXT_PUBLIC_APP_CODE"),
              tenantCode: window.tenantCode,
            },
          }
        )
        if (daHuy) return
        if (res?.status === 200) {
          urlAnh = URL.createObjectURL(res.data)
          setAnhDaiDien(urlAnh)
        } else {
          console.error("Không tải được ảnh đại diện", res)
          setAnhDaiDien(undefined)
        }
      } catch (error) {
        if (!daHuy) {
          console.error("Không tải được ảnh đại diện", error)
          setAnhDaiDien(undefined)
        }
      }
    }

    taiAnh()

    return () => {
      daHuy = true
      if (urlAnh) URL.revokeObjectURL(urlAnh)
    }
  }, [userProfileId, phienBan])

  return anhDaiDien
}

export default useAnhDaiDien
