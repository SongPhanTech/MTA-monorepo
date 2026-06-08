import { useGiangVien } from "@hooks/use-giang-vien"
import { usePermissions } from "@workspace/permissions/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Button } from "antd"
import { Repeat } from "lucide-react"
import { useRouter } from "next/router"
import { setLayoutMode, useLayoutMode } from "@/stores/layout-mode"

// const ToggleVaiTroCongGiangVien = () => {
//   const router = useRouter()
//   const mode = useLayoutMode()
//   const { isGiangVien } = useGiangVien()
//   const permissions = usePermissions()
//   const hasAdminAccess = permissions.length > 0

//   if (!isGiangVien || !hasAdminAccess) return null

//   const dangOGiangVien = mode === "giang-vien"

//   const handleToggle = () => {
//     if (dangOGiangVien) {
//       setLayoutMode("quan-tri")
//       router.push(ROUTER_PATH.QL_DAO_TAO.HOME)
//     } else {
//       setLayoutMode("giang-vien")
//       router.push(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN)
//     }
//   }

//   return (
//     <Button
//       icon={<Repeat size={14} className="align-middle" />}
//       onClick={handleToggle}
//       className="giang-vien-toggle-role"
//     >
//       Đổi vai trò
//     </Button>
//   )
// }

// export default ToggleVaiTroCongGiangVien
