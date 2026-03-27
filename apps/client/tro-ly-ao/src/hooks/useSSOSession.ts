import { getRuntimeEnv } from '@workspace/libs/utils'
import { useCallback, useEffect, useState } from 'react'

export type SSOSessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Session data structure from /api/auth/get-session
 */
export interface SSOSession {
    userId: string
    username: string
    fullName: string
    organizationId?: string
    sDM_NhanVienId?: string
    sDM_DonViId?: string
    [key: string]: unknown
}

/**
 * Global cache - shared across all hook instances
 * Persist qua reload với localStorage
 */
interface CacheEntry {
    status: SSOSessionStatus
    session: SSOSession | null
    timestamp: number
}

const CACHE_KEY = 'sso-session-cache'
const SSO_REDIRECT_FLAG = 'sso-pending-redirect'
const SSO_CHECKED_FLAG = 'sso-redirect-checked' // Flag để đánh dấu đã check rồi trong session này
const CACHE_TIME = 5 * 60 * 1000 // 5 phút

const checkSSORedirect = (): boolean => {
    if (typeof window === 'undefined') return false

    if (sessionStorage.getItem(SSO_CHECKED_FLAG)) {
        return false
    }

    sessionStorage.setItem(SSO_CHECKED_FLAG, 'true')

    if (sessionStorage.getItem(SSO_REDIRECT_FLAG)) {
        console.log('[useSSOSession] Detected pending SSO redirect flag, invalidating cache')
        sessionStorage.removeItem(SSO_REDIRECT_FLAG)
        return true
    }

    const authIssuer = getRuntimeEnv('NEXT_PUBLIC_AUTH_ISSUER')
    if (authIssuer) {
        try {
            const authHostname = new URL(authIssuer).hostname
            if (document.referrer && document.referrer.includes(authHostname)) {
                console.log(
                    '[useSSOSession] Detected redirect from SSO via referrer, invalidating cache'
                )
                return true
            }
        } catch {
            // Invalid URL, ignore
        }
    }

    return false
}

/**
 * Set window.contextData từ session data để usePermissions có thể đọc userId
 * Phải set TRƯỚC khi trigger re-render để React Query hook có enabled: true
 */
const setWindowContextData = (session: SSOSession | null) => {
    if (typeof window === 'undefined' || !session) return
    window.contextData = {
        userId: session.userId,
        userName: session.username,
        organizationId: session.organizationId || '',
    }
}

let globalCache: CacheEntry | null = null
if (typeof window !== 'undefined') {
    const fromSSO = checkSSORedirect()

    if (fromSSO) {
        localStorage.removeItem(CACHE_KEY)
        globalCache = null
    } else {
        try {
            const stored = localStorage.getItem(CACHE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as CacheEntry
                if (Date.now() - parsed.timestamp < CACHE_TIME) {
                    globalCache = parsed
                    // Set window.contextData từ cache để usePermissions có userId ngay
                    setWindowContextData(parsed.session)
                } else {
                    localStorage.removeItem(CACHE_KEY)
                }
            }
        } catch (error) {
            console.warn('[useSSOSession] Failed to load cache from localStorage:', error)
        }
    }
}

let isFetching = false
const listeners = new Set<() => void>()

/**
 * Save cache to localStorage
 */
const saveCache = (cache: CacheEntry) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
        } catch (error) {
            console.warn('[useSSOSession] Failed to save cache to localStorage:', error)
        }
    }
}

export const useSSOSession = () => {
    const [status, setStatus] = useState<SSOSessionStatus>(globalCache?.status || 'loading')
    const [session, setSession] = useState<SSOSession | null>(globalCache?.session || null)
    const appCode = getRuntimeEnv('NEXT_PUBLIC_APP_CODE') || 'chatbot'

    const fetchSSOSession = useCallback(async () => {
        // Check cache first
        if (globalCache && Date.now() - globalCache.timestamp < CACHE_TIME) {
            setStatus(globalCache.status)
            setSession(globalCache.session)
            return
        }

        // Prevent concurrent fetches
        if (isFetching) return
        isFetching = true

        try {
            const response = await fetch(
                `${getRuntimeEnv('NEXT_PUBLIC_API_MODEL_BASE_URL')}/api/auth/get-session?appCode=${encodeURIComponent(appCode)}`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            )

            const newStatus: SSOSessionStatus = response.ok ? 'authenticated' : 'unauthenticated'
            const newSession = response.ok ? await response.json() : null

            // Set window.contextData TRƯỚC khi setState để usePermissions có userId khi re-render
            setWindowContextData(newSession)

            // Update global cache
            globalCache = {
                status: newStatus,
                session: newSession,
                timestamp: Date.now(),
            }

            // Save to localStorage
            saveCache(globalCache)

            setStatus(newStatus)
            setSession(newSession)

            // Notify all listeners
            listeners.forEach((listener) => listener())
        } catch (error) {
            console.warn('[useSSOSession] SSO session fetch failed:', error)

            globalCache = {
                status: 'unauthenticated',
                session: null,
                timestamp: Date.now(),
            }

            saveCache(globalCache)

            setStatus('unauthenticated')
            setSession(null)

            listeners.forEach((listener) => listener())
        } finally {
            isFetching = false
        }
    }, [appCode])

    // Subscribe to cache updates
    useEffect(() => {
        const handleUpdate = () => {
            if (globalCache) {
                setStatus(globalCache.status)
                setSession(globalCache.session)
            }
        }

        listeners.add(handleUpdate)
        return () => {
            listeners.delete(handleUpdate)
        }
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchSSOSession()
    }, [fetchSSOSession])

    /**
     * Hàm để redirect về trang đăng nhập SSO
     * Chỉ gọi khi người dùng chủ động click nút đăng nhập
     */
    const signIn = useCallback(() => {
        const tenantCode = (typeof window !== 'undefined' && (window as any).tenantCode) || 'dev'

        // Clear the "already checked" flag so we can check again when returning
        sessionStorage.removeItem(SSO_CHECKED_FLAG)

        // Set flag before redirect - this will be checked when user returns
        // to invalidate cache and force fresh session check
        sessionStorage.setItem(SSO_REDIRECT_FLAG, 'true')

        window.location.href = `${getRuntimeEnv('NEXT_PUBLIC_AUTH_ISSUER')}/authsso/signin?appCode=${encodeURIComponent(appCode)}&tenantCode=${tenantCode}&sRedirectDefault=${getRuntimeEnv('NEXT_PUBLIC_APP_URL')}`
    }, [appCode])

    /**
     * Refresh lại session - invalidate cache và fetch lại
     */
    const refetch = useCallback(() => {
        globalCache = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CACHE_KEY)
        }
        setStatus('loading')
        fetchSSOSession()
    }, [fetchSSOSession])

    return {
        status,
        session,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        signIn,
        refetch,
    }
}
