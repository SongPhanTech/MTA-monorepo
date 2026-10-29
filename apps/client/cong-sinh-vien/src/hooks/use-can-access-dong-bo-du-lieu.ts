import { useSession } from "@workspace/auth/react"
import { useGetUserPermissionsPermissionAppCodeUserId } from "@workspace/libs/api/system"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { CONG_SINH_VIEN_PERMISSION } from "@workspace/router"
import { useEffect, useMemo, useState } from "react"

export const useCanAccessDongBoDuLieu = () => {
  const { data: session, status: sessionStatus } = useSession()

  // Lắng nghe window.contextData khi MTAMenuComponents (SSO Header) tải xong thông tin người dùng
  const [contextData, setContextData] = useState<{ userId?: string }>(() => ({
    userId: typeof window !== "undefined" ? window.contextData?.userId : undefined,
  }))

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateContext = () => {
      const wUserId = window.contextData?.userId
      if (wUserId !== contextData.userId) {
        setContextData({ userId: wUserId })
      }
    }

    updateContext()
    const interval = setInterval(updateContext, 500)
    return () => clearInterval(interval)
  }, [contextData.userId])

  const userId =
    contextData.userId || session?.sDM_NhanVienId || session?.userId || ""
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE")

  // Truy vấn quyền từ be-system theo appCode
  const permissionQuery = useGetUserPermissionsPermissionAppCodeUserId(appCode, userId, {
    query: {
      enabled: Boolean(appCode && userId),
    },
  })

  const canAccess = useMemo(() => {
    if (permissionQuery.data?.status !== 200) return false

    const permissions = (permissionQuery.data.data as any)?.Permissions ?? []
    return permissions.some(
      (permission: { sFormName?: string | null }) =>
        permission.sFormName === CONG_SINH_VIEN_PERMISSION.CONG_SINH_VIEN_DONG_BO_DU_LIEU
    )
  }, [permissionQuery.data])

  const isQueryLoading =
    Boolean(appCode && userId) &&
    !permissionQuery.isFetched &&
    permissionQuery.isLoading

  return {
    canAccess,
    isLoading: sessionStatus === "loading" && !userId ? true : isQueryLoading,
  }
}
