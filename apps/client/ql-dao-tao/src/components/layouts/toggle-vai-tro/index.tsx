import { useGiangVien } from "@hooks/use-giang-vien"
import { usePermissions } from "@workspace/permissions/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Button } from "antd"
import { Repeat } from "lucide-react"
import { useRouter } from "next/router"
import { GIANG_VIEN_HOME } from "@/constants/giang-vien-menu"
import { setLayoutMode, useLayoutMode } from "@/stores/layout-mode"

// Nút "Đổi vai trò": chuyển qua lại giữa Cổng Giảng viên và layout quản trị.
// Chỉ hiển thị khi người dùng vừa là giảng viên vừa có quyền quản trị.
const ToggleVaiTro = () => {
  const router = useRouter()
  const mode = useLayoutMode()
  const { isGiangVien } = useGiangVien()
  const permissions = usePermissions()
  const hasAdminAccess = permissions.length > 0

  if (!isGiangVien || !hasAdminAccess) return null

  const dangOGiangVien = mode === "giang-vien"

  const handleToggle = () => {
    if (dangOGiangVien) {
      setLayoutMode("quan-tri")
      router.push(ROUTER_PATH.QL_DAO_TAO.HOME)
    } else {
      setLayoutMode("giang-vien")
      router.push(GIANG_VIEN_HOME)
    }
  }

  return (
    <Button icon={<Repeat size={14} className="align-middle" />} onClick={handleToggle}>
      {dangOGiangVien ? "Vào trang quản trị" : "Đổi vai trò"}
    </Button>
  )
}

export default ToggleVaiTro
