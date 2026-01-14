import { getRuntimeEnv } from '@workspace/libs/utils'
import { useCallback, useEffect, useRef, useState } from 'react'

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
 * Hook để kiểm tra SSO session cho tro-ly-ao
 * KHÔNG tự động redirect về trang đăng nhập khi chưa authenticated
 * Khác với useSession từ @workspace/auth/react sẽ auto redirect
 * 
 * Simple version - chỉ fetch 1 lần khi mount, không retry/cache phức tạp
 */
export const useSSOSession = () => {
    const [status, setStatus] = useState<SSOSessionStatus>('loading')
    const [session, setSession] = useState<SSOSession | null>(null)
    const hasFetched = useRef(false)

    const fetchSSOSession = useCallback(async () => {
        // Prevent multiple fetches
        if (hasFetched.current) return
        hasFetched.current = true

        try {
            const response = await fetch(
                `${getRuntimeEnv('NEXT_PUBLIC_API_MODEL_BASE_URL')}/api/auth/get-session?appCode=chatbot`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            )

            if (!response.ok) {
                setStatus('unauthenticated')
                setSession(null)
                return
            }

            const sessionData = await response.json()
            setSession(sessionData)
            setStatus('authenticated')
        } catch (error) {
            console.warn('[useSSOSession] SSO session fetch failed:', error)
            setStatus('unauthenticated')
            setSession(null)
        }
    }, [])

    // Fetch once on mount
    useEffect(() => {
        fetchSSOSession()
    }, [fetchSSOSession])

    /**
     * Hàm để redirect về trang đăng nhập SSO
     * Chỉ gọi khi người dùng chủ động click nút đăng nhập
     */
    const signIn = useCallback(() => {
        const tenantCode =
            (typeof window !== 'undefined' && (window as any).tenantCode) || 'dev'
        window.location.href = `${getRuntimeEnv('NEXT_PUBLIC_AUTH_ISSUER')}/authsso/signin?appCode=${getRuntimeEnv('NEXT_PUBLIC_APP_CODE')}&tenantCode=${tenantCode}&sRedirectDefault=${getRuntimeEnv('NEXT_PUBLIC_APP_URL')}`
    }, [])

    /**
     * Refresh lại session - reset hasFetched và fetch lại
     */
    const refetch = useCallback(() => {
        hasFetched.current = false
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
