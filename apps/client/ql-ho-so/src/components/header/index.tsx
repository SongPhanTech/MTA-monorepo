// Header.tsx
import type React from 'react'
import { useEffect } from 'react'

declare global {
    interface Window {
        MTAMenuComponents: any
    }
}

const HeaderApp: React.FC = () => {
    useEffect(() => {
        try {
            if (process.env.ENVIRONMENT === 'local') {
                return
            }
            window.MTAMenuComponents.default.createPlugin('pluginContainer', {
                menuAppId: 'menuContainer',
                notificationAppId: 'notificationContainer',
                userAppId: 'userContainer',
            })
        } catch (error) {
            console.log(error)
        }
    }, [])

    return <div id="pluginContainer" />
}

export default HeaderApp
