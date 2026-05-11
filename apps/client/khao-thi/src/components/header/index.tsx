// Header.tsx

import { getRuntimeEnv } from "@workspace/libs/utils"
import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/router"

const HeaderApp: React.FC = () => {
  const router = useRouter()

  const initializePlugin = () => {
    try {
      window.MTAMenuComponents?.default?.createPlugin("pluginContainer", {
        menuAppId: "menuContainer",
        notificationAppId: "notificationContainer",
        userAppId: "userContainer",
        tenantCode: window.tenantCode || "dev",
        appCode: getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "ems",
      })
    } catch (error) {
      console.error("Error initializing MTA Menu Plugin:", error)
    }
  }

  const resetPluginScript = () => {
    const assetPrefix = getRuntimeEnv("NEXT_PUBLIC_ASSET_PREFIX")
    if (!assetPrefix) return

    const baseSrc = `${assetPrefix}/mta-components.umd.js`
    const existing = document.querySelector(`script[src^="${baseSrc}"]`)
    if (existing)
      existing.remove()

      // Clear singleton so plugin can re-init on new containers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).MTAMenuComponents = undefined

    const script = document.createElement("script")
    script.src = `${baseSrc}?v=${Date.now()}`
    script.onload = () => initializePlugin()
    document.body.appendChild(script)
  }

  useEffect(() => {
    initializePlugin()

    const onRouteStart = (url: string) => {
      if (window.location.pathname.includes("/ems/home")) {
        window.location.href = url
      }
    }

    const onRouteDone = () => {
      requestAnimationFrame(() => {
        const container = document.getElementById("pluginContainer")
        const hasUserButton = Boolean(document.getElementById("userButton"))

        if (!container || !hasUserButton) {
          resetPluginScript()
          return
        }

        initializePlugin()
      })
    }

    router.events.on("routeChangeStart", onRouteStart)
    router.events.on("routeChangeComplete", onRouteDone)
    router.events.on("routeChangeError", onRouteDone)

    return () => {
      router.events.off("routeChangeStart", onRouteStart)
      router.events.off("routeChangeComplete", onRouteDone)
      router.events.off("routeChangeError", onRouteDone)
    }
  }, [router.events])

  return <div id="pluginContainer" />
}

export default HeaderApp
