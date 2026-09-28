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

export function SystemMaintenanceScreen({
  message,
  onRetry,
  checking,
}: {
  message?: string
  onRetry?: () => void
  checking?: boolean
}) {
  return (
    <ConfigProvider theme={lightThemeCustom}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "linear-gradient(160deg, #0b3d2e 0%, #028850 48%, #e8f5ee 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
            padding: "40px 32px 32px",
            boxShadow: "0 20px 48px rgba(11, 61, 46, 0.22)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 20px",
              borderRadius: 999,
              background: "#e8f5ee",
              color: "#028850",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Construction size={34} />
          </div>
          <div style={{ color: "#028850", fontSize: 13, fontWeight: 600, letterSpacing: 0.4 }}>
            HỌC VIỆN KỸ THUẬT QUÂN SỰ
          </div>
          <h1 style={{ margin: "10px 0 12px", fontSize: 28, color: "#1a1a1a", lineHeight: 1.3 }}>
            Hệ thống đang bảo trì
          </h1>
          <p style={{ margin: 0, color: "#4b5563", fontSize: 15, lineHeight: 1.6 }}>
            {message || "Hệ thống đang được bảo trì. Vui lòng quay lại sau."}
          </p>
          {onRetry ? (
            <Button
              type="primary"
              size="large"
              onClick={onRetry}
              loading={checking}
              style={{ marginTop: 24, minWidth: 140 }}
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
