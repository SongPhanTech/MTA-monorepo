import { getRuntimeEnv } from "@workspace/libs/utils"
import type React from "react"
import { useEffect } from "react"

const HeaderApp: React.FC<{ className?: string }> = ({ className }) => {
  useEffect(() => {
    try {
      window.MTAMenuComponents?.default?.createPlugin("pluginContainer", {
        menuAppId: "menuContainer",
        notificationAppId: "notificationContainer",
        userAppId: "userContainer",
        tenantCode: window.tenantCode || "dev",
        appCode: getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "hrm",
      })
    } catch {
      // Plugin header có thể chưa load khi hydrate
    }
  }, [])

  return <div id="pluginContainer" className={className} />
}

export default HeaderApp
