import { useCreateUserSession, useFindUniqueUserSession } from "@workspace/db/hooks"
import { formatDateInSlash } from "@workspace/libs/timezone"
import { useEffect, useState } from "react"

const SESSION_KEY = "chatbot-session-id"

const generateSessionName = (): string => {
  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes("chrome")) return "Chrome"
    if (userAgent.includes("firefox")) return "Firefox"
    if (userAgent.includes("safari")) return "Safari"
    if (userAgent.includes("edge")) return "Edge"
    return "Unknown Browser"
  }

  const now = new Date()
  const dateStr = formatDateInSlash(now)
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  return `${getBrowserName()} - ${dateStr} ${timeStr}`
}

/**
 * Hook quản lý local user session (chatbot session)
 * KHÔNG liên quan đến SSO authentication
 * Chỉ quản lý sessionId để lưu conversation history
 */
export const useUserSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: createUserSession } = useCreateUserSession()

  const { data: existingSession, refetch: validateSession } = useFindUniqueUserSession(
    {
      where: { id: sessionId || "" },
    },
    {
      enabled: false,
    }
  )

  useEffect(() => {
    // Chỉ lấy từ localStorage, không tạo mới
    const storedSessionId = localStorage.getItem(SESSION_KEY)
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
  }, [])

  const ensureSession = async (): Promise<string> => {
    if (sessionId) {
      // Check sessionId có tồn tại trong DB không
      const { data: validSession } = await validateSession()
      if (validSession) {
        return sessionId
      }
      // Session không tồn tại trong DB, xóa localStorage và tạo mới
      localStorage.removeItem(SESSION_KEY)
      setSessionId(null)
    }

    setIsLoading(true)
    try {
      let storedSessionId = localStorage.getItem(SESSION_KEY)

      if (storedSessionId) {
        // Check session từ localStorage có tồn tại trong DB không
        const { data: validStoredSession } = await validateSession()
        if (!validStoredSession) {
          // Session không hợp lệ, xóa và tạo mới
          localStorage.removeItem(SESSION_KEY)
          storedSessionId = null
        }
      }

      if (!storedSessionId) {
        const sessionName = generateSessionName()

        const newSession = await createUserSession({
          data: {
            name: sessionName,
            email: null,
            phoneNumber: null,
          },
        })

        // Lấy ID của session vừa tạo và lưu vào localStorage
        if (!newSession || !newSession.id) {
          throw new Error("Failed to create a new session")
        }
        storedSessionId = newSession.id
        localStorage.setItem(SESSION_KEY, storedSessionId)
      }

      setSessionId(storedSessionId)
      return storedSessionId
    } catch (error) {
      console.error("Error creating session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY)
    setSessionId(null)
  }

  return {
    sessionId,
    isLoading,
    ensureSession,
    clearSession,
  }
}

// Utility function để lấy sessionId từ localStorage (cho các component khác)
export const getSessionId = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SESSION_KEY)
}
