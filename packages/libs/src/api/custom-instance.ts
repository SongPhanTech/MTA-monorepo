import { BROWSER } from "esm-env"
import { getRuntimeEnv } from "../utils"

const getTokenHeaders = (): Record<string, string> => {
  const headerEnvPairs: Array<{ header: string; value: string }> = [
    // {
    //     header: 'Authorization',
    //     value: process.env.X_TOKEN_LMS || 'Bearer 048E1562746A83519236440B013D6B9C386CED9E758C4A6BBC2F38A2E72131D3',
    // }
  ]

  return headerEnvPairs.reduce<Record<string, string>>((acc, item) => {
    if (item.value) {
      acc[item.header] = item.value
    }
    return acc
  }, {})
}

export const fetchInstance = async (url: string, options?: RequestInit): Promise<Response> => {
  const accessToken = BROWSER ? localStorage.getItem("ACCESS_TOKEN") : ""
  const tokenHeaders = getTokenHeaders()

  const payload: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...options?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...tokenHeaders,
    },
  }
  return await fetch(url, payload).then((res) => {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        const event = new CustomEvent("mta-session-expired", {
          detail: {
            message: "Phiên đăng nhập hết hạn",
          },
        })
        window.dispatchEvent(event)
      }
    }
    return res
  })
}

const getBody = <T>(c: Response | Request): Promise<T> => {
  const contentType = c.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    return c.json()
  }

  if (contentType?.includes("text/")) {
    return c.text() as Promise<T>
  }

  return c.blob() as Promise<T>
}

export const getUrl = (baseUrl: string, contextUrl: string): string => {
  let cleanBase = (baseUrl || "").trim().replace(/^["']+|["'/]+$/g, "")

  // Khi chạy trên browser tại domain production (ví dụ mta.edu.vn),
  // nếu baseUrl bị cấu hình dính cứng sang domain staging bên ngoài (daotao.swantech.vn),
  // tự động chuẩn hóa về same-origin để tránh lỗi CORS và đảm bảo dữ liệu gọi về đúng server.
  if (typeof window !== "undefined" && window.location?.hostname) {
    const currentHost = window.location.hostname
    if (
      currentHost !== "localhost" &&
      currentHost !== "127.0.0.1" &&
      (cleanBase.startsWith("http://") || cleanBase.startsWith("https://"))
    ) {
      try {
        const parsed = new URL(cleanBase)
        if (parsed.hostname !== currentHost && parsed.hostname.includes("swantech.vn")) {
          // Keep app mount prefix when present (e.g. /cong-sinh-vien/api/system on mta_online)
          const mountMatch = parsed.pathname.match(/^(\/[^/]+)\/api\//)
          const mountPrefix = mountMatch?.[1] && mountMatch[1] !== "/api" ? mountMatch[1] : ""
          const apiPath = parsed.pathname.includes("/api/portal")
            ? `${mountPrefix}/api/portal`
            : parsed.pathname.includes("/api/model")
              ? `${mountPrefix}/api/model`
              : parsed.pathname.includes("/api/lms")
                ? `${mountPrefix}/api/lms`
                : parsed.pathname.includes("/api/ems")
                  ? `${mountPrefix}/api/ems`
                  : parsed.pathname.includes("/api/system")
                    ? `${mountPrefix}/api/system`
                    : parsed.pathname.replace(/\/+$/, "")
          cleanBase = `${window.location.origin}${apiPath}`
        }
      } catch {
        // ignore parse error
      }
    }
  }

  const cleanContext = contextUrl.startsWith("/") ? contextUrl : `/${contextUrl}`
  return `${cleanBase}${cleanContext}`
}

export const customModelFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") || "/api/model", url)

  const response = await fetchInstance(requestUrl, options)
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customTrainingFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "/api/lms", url)

  const response = await fetchInstance(requestUrl, options)
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customExamFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(getRuntimeEnv("NEXT_PUBLIC_API_EMS_BASE_URL") || "/api/ems", url)

  const response = await fetchInstance(requestUrl, options)
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customPortalFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = getUrl(getRuntimeEnv("NEXT_PUBLIC_API_PORTAL_BASE_URL") || "/api/portal", url)

  const response = await fetchInstance(requestUrl, options)
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

const getClientCredentialHeaders = (): Record<string, string> => {
  const clientId =
    getRuntimeEnv("NEXT_PUBLIC_CLIENT_ID") || process.env.NEXT_PUBLIC_CLIENT_ID || ""
  const clientSecret =
    getRuntimeEnv("NEXT_PUBLIC_CLIENT_SECRET") || process.env.NEXT_PUBLIC_CLIENT_SECRET || ""
  if (!clientId || !clientSecret) return {}
  return {
    "x-clientid": clientId,
    "x-clientsecret": clientSecret,
  }
}

export const customSystemFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || process.env.NEXT_PUBLIC_APP_CODE
  // Prefer explicit SYSTEM_BASE_URL (server) or NEXT_PUBLIC_API_SYSTEM_BASE_URL (browser).
  // Fallback must NOT go through /api/model/... (that hits be-model → 404 on mta_online).
  const systemBase =
    (typeof process !== "undefined" && process.env.SYSTEM_BASE_URL
      ? `${process.env.SYSTEM_BASE_URL}/api/system/public`
      : null) ||
    (getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")
      ? `${getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")}/${appCode}/public`
      : `/api/system/${appCode}/public`)
  const requestUrl = getUrl(systemBase, url)

  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...getClientCredentialHeaders(),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customSystemShareFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || process.env.NEXT_PUBLIC_APP_CODE
  const systemBase =
    (typeof process !== "undefined" && process.env.SYSTEM_BASE_URL
      ? `${process.env.SYSTEM_BASE_URL}/api/system/share`
      : null) ||
    (getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")
      ? `${getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")}/${appCode}/share`
      : `/api/system/${appCode}/share`)
  const requestUrl = getUrl(systemBase, url)

  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...getClientCredentialHeaders(),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customStorageFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || process.env.NEXT_PUBLIC_APP_CODE
  const systemBase =
    (typeof process !== "undefined" && process.env.SYSTEM_BASE_URL
      ? `${process.env.SYSTEM_BASE_URL}/api/system/storage`
      : null) ||
    (getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")
      ? `${getRuntimeEnv("NEXT_PUBLIC_API_SYSTEM_BASE_URL")}/${appCode}/storage`
      : `/api/system/${appCode}/storage`)
  const requestUrl = getUrl(systemBase, url)

  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...getClientCredentialHeaders(),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}
