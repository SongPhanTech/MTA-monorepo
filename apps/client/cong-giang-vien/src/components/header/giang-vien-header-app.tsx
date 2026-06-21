import { getRuntimeEnv } from "@workspace/libs/utils"
import type React from "react"
import { useEffect } from "react"

const GiangVienHeaderApp: React.FC<{ className?: string }> = ({ className }) => {
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
      console.log(error)
    }
  }, [])

  return <div id="pluginContainer" className={className} />
}

export default GiangVienHeaderApp
