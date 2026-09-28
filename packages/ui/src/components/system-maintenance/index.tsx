import { customModelFetch } from "@workspace/libs/api/custom-instance"
import { Button, ConfigProvider } from "antd"
import { Construction } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useState } from "react"
import { lightThemeCustom } from "../../assets/styles/theme/global-theme-custom"

export type SystemStatus = {
  maintenance: boolean
  message?: string
}

type SystemStatusResponse = {
  status: number
  data?: SystemStatus
}

const POLL_MS = 30_000

const DEFAULT_MESSAGES = new Set([
  "Hệ thống đang được bảo trì. Vui lòng quay lại sau.",
  "Hệ thống đang bảo trì",
])

export function SystemMaintenanceScreen({
  message,
  onRetry,
  checking,
}: {
  message?: string
  onRetry?: () => void
  checking?: boolean
}) {
  const customMessage = message?.trim()
  const subtitle =
    customMessage && !DEFAULT_MESSAGES.has(customMessage) ? customMessage : undefined

  return (
    <ConfigProvider theme={lightThemeCustom}>
      <style>{`
        @keyframes mta-maint-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0.18; }
        }
        @keyframes mta-maint-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
          overflow: "hidden",
          background: "#07090d",
          fontFamily: '"Noto Serif", "SF Pro Display", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.045) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle at center, black 35%, transparent 78%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(2,136,80,0.22) 0%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 440,
            textAlign: "center",
            animation: "mta-maint-fade 0.55s ease-out",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              margin: "0 auto 28px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(2,136,80,0.35)",
                animation: "mta-maint-pulse 2.6s ease-in-out infinite",
              }}
            />
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(16px)",
                color: "#7ee0b0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              }}
            >
              <Construction size={28} strokeWidth={1.6} />
            </div>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#f4f7f5",
              lineHeight: 1.25,
            }}
          >
            Hệ thống đang bảo trì
          </h1>
          {subtitle ? (
            <p
              style={{
                margin: "14px 0 0",
                color: "rgba(244,247,245,0.62)",
                fontSize: 15,
                lineHeight: 1.65,
              }}
            >
              {subtitle}
            </p>
          ) : null}

          {onRetry ? (
            <Button
              size="large"
              onClick={onRetry}
              loading={checking}
              style={{
                marginTop: 32,
                minWidth: 148,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "#f4f7f5",
                fontWeight: 500,
                boxShadow: "none",
              }}
            >
              Thử lại
            </Button>
          ) : null}
        </div>
      </div>
    </ConfigProvider>
  )
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await customModelFetch<SystemStatusResponse>("/api/system-status", {
    method: "GET",
  })
  if (res.status === 200 && res.data) {
    return {
      maintenance: Boolean(res.data.maintenance),
      message: res.data.message,
    }
  }
  return { maintenance: false }
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [checking, setChecking] = useState(false)

  const check = useCallback(async () => {
    setChecking(true)
    try {
      setStatus(await fetchSystemStatus())
    } catch {
      setStatus({ maintenance: false })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    check()
    const timer = window.setInterval(check, POLL_MS)
    return () => window.clearInterval(timer)
  }, [check])

  if (status === null) return null

  if (status.maintenance) {
    return (
      <SystemMaintenanceScreen message={status.message} onRetry={check} checking={checking} />
    )
  }

  return <>{children}</>
}
