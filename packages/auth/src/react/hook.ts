import { useContext, useEffect } from "react"
import { fetchSession } from "."
import { SessionContext } from "./provider"

export const useSession = () => {
  const { sessionState, setSessionState, setStatus, status } = useContext(SessionContext)
  // const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (status === "loading") return
    if (!status) {
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
