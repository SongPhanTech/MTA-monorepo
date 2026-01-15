// Header.tsx

import { getRuntimeEnv } from '@workspace/libs/utils'
import type React from 'react'
import { useEffect, useRef } from 'react'

const HeaderApp: React.FC = () => {
    const hasInitialized = useRef(false)
    const retryTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Đã khởi tạo rồi thì không làm gì
        if (hasInitialized.current) return

        const initializePlugin = () => {
            try {
                if (
                    typeof window !== 'undefined' &&
                    window.MTAMenuComponents?.default?.createPlugin
                ) {
                    window.MTAMenuComponents.default.createPlugin('pluginContainer', {
                        menuAppId: 'menuContainer',
                        notificationAppId: 'notificationContainer',
                        userAppId: 'userContainer',
                        tenantCode: window.tenantCode || 'dev',
                        appCode: getRuntimeEnv('NEXT_PUBLIC_APP_CODE') || 'chatbot',
                    })
                    hasInitialized.current = true
                    return true
                }
                return false
            } catch (error) {
                console.error('Error initializing MTA Menu Plugin:', error)
                return false
            }
        }

        // Thử khởi tạo ngay
        if (initializePlugin()) return

        // Nếu chưa load, thử lại với interval (không dùng state để tránh re-render)
        let retryCount = 0
        const maxRetries = 10

        const retry = () => {
            if (retryCount >= maxRetries) {
                console.warn('MTAMenuComponents script not loaded after retries')
                return
            }

            retryTimerRef.current = setTimeout(() => {
                if (!initializePlugin()) {
                    retryCount++
                    retry()
                }
            }, 200)
        }

        retry()

        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current)
            }
        }
    }, [])

    return <div id="pluginContainer" />
}

export default HeaderApp
