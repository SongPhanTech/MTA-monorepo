// Header.tsx

import { getRuntimeEnv } from '@workspace/libs/utils'
import type React from 'react'
import { useEffect, useRef } from 'react'

const HeaderApp: React.FC = () => {
    const initialized = useRef(false)

    useEffect(() => {
        // Prevent double initialization
        if (initialized.current) return

        // Skip SSO menu in local environment - it requires connection to SSO server
        const env = getRuntimeEnv('NEXT_PUBLIC_ENVIRONMENT')
        if (env === 'local') return

        const initPlugin = () => {
            // Check if MTAMenuComponents is loaded and available
            if (
                typeof window !== 'undefined' &&
                window.MTAMenuComponents?.default?.createPlugin
            ) {
                initialized.current = true
                // Use .catch() to handle any fetch errors from within the plugin
                Promise.resolve(
                    window.MTAMenuComponents.default.createPlugin('pluginContainer', {
                        menuAppId: 'menuContainer',
                        notificationAppId: 'notificationContainer',
                        userAppId: 'userContainer',
                        tenantCode: window.tenantCode || 'dev',
                        appCode: getRuntimeEnv('NEXT_PUBLIC_APP_CODE') || 'Chatbot',
                    })
                ).catch((error) => {
                    // Silently ignore - expected when running locally or SSO unavailable
                    console.warn('[HeaderApp] MTAMenuComponents error:', error?.message || error)
                })
            }
        }

        // Try immediately
        initPlugin()

        // If script not loaded yet, retry after delay
        const retryTimeout = setTimeout(() => {
            if (!initialized.current) {
                initPlugin()
            }
        }, 500)

        return () => clearTimeout(retryTimeout)
    }, [])

    return <div id="pluginContainer" />
}

export default HeaderApp
