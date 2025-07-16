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
                setTimeout(() => {
                                  const menuButton =
                    window.MTAMenuComponents.default.createMenuButton('menuContainer')
                menuButton.init()

                const userButton = window.MTAMenuComponents.default.createUserButton(
                    'userContainer'
                )
                userButton.init()
                const notificationButton =
                    window.MTAMenuComponents.default.createNotificationButton(
                        'notificationContainer'
                    )
                notificationButton.init()
                },1000)
  
            } catch (error) {
                console.log(error)
            }
    }, [])

    return (
        <div>
            <div id="menuContainer" />
            <div id="notificationContainer" />
            <div id="userContainer" />
        </div>
    )
}

export default HeaderApp
