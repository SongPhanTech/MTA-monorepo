import { getRuntimeEnv } from "@workspace/libs/utils"
import type { Session, SessionStatus } from ".."
import { useSession } from "./hook"
import SessionProvider from "./provider"

declare global {
  interface Window {
    tenantCode?: string
    NEXT_PUBLIC_AUTH_ISSUER?: string
  }
}

const signIn = () => {
  const tenantCode = window.tenantCode || "dev"
  window.location.href = `${getRuntimeEnv("NEXT_PUBLIC_AUTH_ISSUER")}/authsso/signin?appCode=${getRuntimeEnv("NEXT_PUBLIC_APP_CODE")}&tenantCode=${tenantCode}&sRedirectDefault=${getRuntimeEnv("NEXT_PUBLIC_APP_URL")}`
}
const fetchSession = async (): Promise<{
  status: SessionStatus
  data: Session | null
  error: Error | null
}> => {
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE")
  const url = `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/auth/get-session?appCode=${appCode}`

  console.log("[fetchSession] ========== REQUEST ==========")
  console.log("[fetchSession] url:", url)
  console.log("[fetchSession] appCode:", appCode)
  console.log(
    "[fetchSession] document.cookie:",
    typeof document !== "undefined" ? document.cookie : "(ssr)"
  )

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    console.log("[fetchSession] ========== RESPONSE ==========")
    console.log("[fetchSession] status:", response.status, response.statusText)

    const responseText = await response.text()
    console.log("[fetchSession] body (raw):", responseText)

    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.status} ${responseText}`)
    }

    const sessionData = JSON.parse(responseText) as Session
    console.log("[fetchSession] body (parsed):", JSON.stringify(sessionData, null, 2))

    return {
      status: "authenticated",
      data: sessionData,
      error: null,
    }
  } catch (error) {
    console.log("[fetchSession] ========== ERROR ==========")
    console.log("[fetchSession] error:", error)

    if (window.NEXT_PUBLIC_AUTH_ISSUER) {
      console.log("[fetchSession] redirecting to signIn...")
      signIn()
    }
    return {
      status: "unauthenticated",
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}
const signOut = async () => {}

const getSession = async () => {
  return (await fetchSession()).data
}

export { signIn, signOut, getSession, fetchSession, useSession, SessionProvider }
