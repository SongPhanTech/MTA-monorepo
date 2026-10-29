import NAVIGATION, { CONG_SINH_VIEN_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useMemo } from "react"
import { useCanAccessDongBoDuLieu } from "./use-can-access-dong-bo-du-lieu"

const useMenuList = () => {
  const { canAccess: canAccessSync } = useCanAccessDongBoDuLieu()

  const menus = useMemo(() => {
    return NAVIGATION.CONG_SINH_VIEN.menus.filter((menu) => {
      // Ẩn các menu có cờ hidden
      if (menu.hidden) return false

      // Menu "Đồng bộ dữ liệu" chỉ hiển thị đối với tài khoản có quyền
      if (
        menu.id === CONG_SINH_VIEN_PERMISSION.CONG_SINH_VIEN_DONG_BO_DU_LIEU ||
        menu.path === ROUTER_PATH.CONG_SINH_VIEN.DONG_BO_DU_LIEU
      ) {
        return canAccessSync
      }

      return true
    })
  }, [canAccessSync])

  return menus
}

export { useMenuList }

