import { useContext, useEffect } from "react"
import type { Session } from ".."
import { fetchSession } from "."
import { SessionContext } from "./provider"

/** Mock local — gỡ trước khi deploy production. */
const DEV_MOCK_PROFILE_ID = "b8bd3015-c14e-4037-9fbe-1041003b92d2"

const taoMockSession = (): Session => ({
  userId: DEV_MOCK_PROFILE_ID,
  username: "local-dev",
  fullName: "Local Dev",
  organizationId: "",
  sDM_NhanVienId: DEV_MOCK_PROFILE_ID,
  sDM_DonViId: "",
})

const dungMockSessionLocal = () => process.env.NODE_ENV === "development"

export const useSession = () => {
  const { sessionState, setSessionState, setStatus, status } = useContext(SessionContext)
  // const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (status === "loading") return
    if (!status) {
      if (dungMockSessionLocal()) {
        setSessionState(taoMockSession())
        setStatus("authenticated")
        return
      }

      setStatus("loading")
      fetchSession().then((result) => {
        setSessionState(result.data)
        setStatus(result.status)
      })
    }
  }, [])

  // const goToLastPage = useCallback(
  //     (basePath?: string) => {
  //         const lastPage = localStorage.getItem('lastPage')
  //         const lastSubsystem = localStorage.getItem('lastSubsystem')
  //         if (lastPage && lastPage !== '/' && lastSubsystem) {
  //             if (lastSubsystem.split('/')[1] === basePath) {
  //                 router.push(lastPage)
  //                 return true
  //             }
  //             return false
  //         }
  //         return false
  //     },
  //     [router]
  // )

  return {
    status,
    data: sessionState,
    // goToLastPage,
  }
}
