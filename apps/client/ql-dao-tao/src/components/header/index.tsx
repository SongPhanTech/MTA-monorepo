// Header.tsx

import { getRuntimeEnv } from "@workspace/libs/utils"
import type React from "react"
import { useEffect } from "react"

const HeaderApp: React.FC = () => {
  useEffect(() => {
    try {
      window.MTAMenuComponents.default.createPlugin("pluginContainer", {
        menuAppId: "menuContainer",
        notificationAppId: "notificationContainer",
        userAppId: "userContainer",
        tenantCode: window.tenantCode || "dev",
        appCode: getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "lms",
      })
    } catch (error) {
    }
  }, [])

  return <div id="pluginContainer" />
}

export default HeaderApp
