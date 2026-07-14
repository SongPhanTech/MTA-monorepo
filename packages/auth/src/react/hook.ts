import { useContext, useEffect } from "react"
import type { Session } from ".."
import { fetchSession } from "."
import { SessionContext } from "./provider"

const layMockProfileId = () => process.env.NEXT_PUBLIC_MOCK_USER_PROFILE_ID?.trim() || ""

const taoMockSession = (): Session => {
  const profileId = layMockProfileId()
  return {
    userId: profileId,
    username: process.env.NEXT_PUBLIC_MOCK_STUDENT_CODE?.trim() || "local-dev",
    fullName: process.env.NEXT_PUBLIC_MOCK_USER_FULL_NAME?.trim() || "Local Dev",
    organizationId: "",
    sDM_NhanVienId: profileId,
    sDM_DonViId: "",
  }
}

const dungMockSessionLocal = () => Boolean(layMockProfileId())

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
