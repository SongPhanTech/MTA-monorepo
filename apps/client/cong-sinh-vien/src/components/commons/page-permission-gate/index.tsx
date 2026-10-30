import Loading from "@components/commons/loading"
import { useStoreState } from "@redux/hook"
import { useAbility } from "@workspace/permissions/hooks"
import { CONG_SINH_VIEN_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { type ReactNode, useEffect } from "react"

type Props = {
  permission: CONG_SINH_VIEN_PERMISSION
  children: ReactNode
}

/** Chặn trang nếu chưa có bit XEM — redirect sang /403. */
export function PagePermissionGate({ permission, children }: Props) {
  const router = useRouter()
  const { can } = useAbility()
  const isUpdateAbility = useStoreState((state) => state.appState.isUpdateAbility)
  const allowed = isUpdateAbility && can(permission, "XEM")
  const forbiddenPath = ROUTER_PATH.CONG_SINH_VIEN.FORBIDDEN

  useEffect(() => {
    if (!isUpdateAbility || allowed) return
    if (router.pathname === forbiddenPath) return
    void router.replace({
      pathname: forbiddenPath,
      query: { from: router.asPath },
    })
  }, [allowed, forbiddenPath, isUpdateAbility, router])

  if (!isUpdateAbility || !allowed) {
    return <Loading />
  }

  return <>{children}</>
}
