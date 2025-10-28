import type React from 'react'
import { useEffect } from 'react'
import { env } from '@/env'

declare global {
    interface Window {
        MTAMenuComponents: any
    }
}

const HeaderApp: React.FC = () => {
    useEffect(() => {
        try {
            if (env.NEXT_PUBLIC_ENVIRONMENT === 'local') return
            window.MTAMenuComponents.default.createPlugin('pluginContainer', {
                menuAppId: 'menuContainer',
                notificationAppId: 'notificationContainer',
                userAppId: 'userContainer',
                tenantCode: window.tenantCode || 'dev',
                appCode: env.NEXT_PUBLIC_APP_CODE,
            })
        } catch (error) {
            console.log(error)
        }
    }, [])

    return <div id="pluginContainer" />
}

export default HeaderApp
