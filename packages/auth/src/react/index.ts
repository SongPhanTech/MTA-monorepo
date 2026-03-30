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
  try {
    const response = await fetch(
      `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/auth/get-session?appCode=${getRuntimeEnv("NEXT_PUBLIC_APP_CODE")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch session")
    }
    const sessionData = await response.json()
    return {
      status: "authenticated",
      data: sessionData,
      error: null,
    }
  } catch (error) {
    if (window.NEXT_PUBLIC_AUTH_ISSUER) {
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
