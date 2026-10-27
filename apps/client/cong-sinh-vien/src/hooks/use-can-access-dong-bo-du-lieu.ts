import { useSession } from "@workspace/auth/react"
import { useGetUserPermissionsPermissionAppCodeUserId } from "@workspace/libs/api/system"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { CONG_SINH_VIEN_PERMISSION } from "@workspace/router"
import { useEffect, useMemo, useState } from "react"

const ADMIN_USERNAMES = new Set(["admin", "superadmin", "quantri", "administrator"])

const isAdminRole = (role: { sCodeName?: string | null; sRoleName?: string | null }) => {
  const code = (role.sCodeName ?? "").toUpperCase()
  const name = (role.sRoleName ?? "").toUpperCase()
  return (
    code.includes("ADMIN") ||
    code.includes("QUAN_TRI") ||
    code.includes("QUANTRIVIEN") ||
    code.includes("SUPER_ADMIN") ||
    code.includes("ROOT") ||
    code.includes("SYSADMIN") ||
    code.includes("MANAGER") ||
    code.includes("DAO_TAO") ||
    code.includes("QLDT") ||
    name.includes("ADMIN") ||
    name.includes("QUẢN TRỊ") ||
    name.includes("QUAN TRI") ||
    name.includes("QUẢN LÝ") ||
    name.includes("QUAN LY") ||
    name.includes("ĐÀO TẠO") ||
    name.includes("DAO TAO")
  )
}

const isSyncPermission = (permission: { sFormName?: string | null }) => {
  const formName = (permission.sFormName ?? "").toUpperCase()
  return (
    formName === CONG_SINH_VIEN_PERMISSION.CONG_SINH_VIEN_DONG_BO_DU_LIEU ||
    formName === "CONG_SINH_VIEN_DONG_BO_DU_LIEU" ||
    formName.includes("DONG_BO_DU_LIEU") ||
    formName.includes("DONG_BO") ||
    formName.includes("SYNC")
  )
}

export const useCanAccessDongBoDuLieu = () => {
  const { data: session, status: sessionStatus } = useSession()

  // Lắng nghe window.contextData khi MTAMenuComponents (SSO Header) tải xong thông tin người dùng
  const [contextData, setContextData] = useState<{ userId?: string; userName?: string }>(() => ({
    userId: typeof window !== "undefined" ? window.contextData?.userId : undefined,
    userName: typeof window !== "undefined" ? window.contextData?.userName : undefined,
  }))

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateContext = () => {
      const wUserId = window.contextData?.userId
      const wUserName = window.contextData?.userName
      if (wUserId !== contextData.userId || wUserName !== contextData.userName) {
        setContextData({ userId: wUserId, userName: wUserName })
      }
    }

    updateContext()
    const interval = setInterval(updateContext, 500)
    return () => clearInterval(interval)
  }, [contextData.userId, contextData.userName])

  const userId =
    contextData.userId || session?.sDM_NhanVienId || session?.userId || ""
  const username = (
    contextData.userName ||
    session?.username ||
    ""
  ).trim().toLowerCase()

  const envAppCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "dangkyhoc"
  const appCode = envAppCode === "congsinhvien" ? "dangkyhoc" : envAppCode

  // Truy vấn quyền từ be-system theo appCode
  const primaryQuery = useGetUserPermissionsPermissionAppCodeUserId(appCode, userId, {
    query: {
      enabled: Boolean(userId),
    },
  })

  // Dự phòng truy vấn theo "dangkyhoc" nếu appCode khác
  const dangKyHocQuery = useGetUserPermissionsPermissionAppCodeUserId("dangkyhoc", userId, {
    query: {
      enabled: Boolean(userId && appCode !== "dangkyhoc"),
    },
  })

  // Dự phòng truy vấn theo "lms" (quản lý đào tạo)
  const lmsQuery = useGetUserPermissionsPermissionAppCodeUserId("lms", userId, {
    query: {
      enabled: Boolean(userId && appCode !== "lms"),
    },
  })

  const canAccess = useMemo(() => {
    // 1. Kiểm tra tài khoản admin/superadmin theo username
    if (username && (ADMIN_USERNAMES.has(username) || username.includes("admin"))) {
      return true
    }

    // 2. Lấy dữ liệu trả về từ response API (be-system)
    const responses = [primaryQuery.data, dangKyHocQuery.data, lmsQuery.data].filter(
      (res): res is NonNullable<typeof res> => res?.status === 200 && Boolean(res?.data)
    )

    for (const res of responses) {
      const roles = res.data.Roles ?? []
      const permissions = res.data.Permissions ?? []

      // Kiểm tra vai trò Admin từ mảng Roles trả về trong response
      if (roles.some(isAdminRole)) {
        return true
      }

      // Kiểm tra quyền chức năng Đồng bộ dữ liệu từ mảng Permissions trả về trong response
      if (permissions.some(isSyncPermission)) {
        return true
      }
    }

    return false
  }, [username, primaryQuery.data, dangKyHocQuery.data, lmsQuery.data])

  const isQueryLoading =
    Boolean(userId) &&
    !primaryQuery.isFetched &&
    primaryQuery.isLoading

  return {
    canAccess,
    isLoading: sessionStatus === "loading" && !userId ? true : isQueryLoading,
  }
}
