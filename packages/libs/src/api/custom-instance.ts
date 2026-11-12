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
  // Older clients store the token as `access_token`, while some apps use
  // `ACCESS_TOKEN`. Support both so authenticated API calls do not silently
  // omit the Authorization header.
  const accessToken = BROWSER
    ? localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("access_token")
    : ""
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

/** Nội bộ MTA (daihocso / mta.edu.vn): be-model mount tại /api/lms/model. Internet (swantech): /api/model. */
const isInternalMtaHost = (hostname: string) =>
  hostname.includes("mta.edu.vn") ||
  hostname.includes("mta.edu") ||
  hostname.includes("daihocso") ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")

const isSwantechHost = (hostname: string) => hostname.includes("swantech.vn")

/**
 * Chuẩn hoá pathname API theo host hiện tại.
 * - Internet: /api/model
 * - Nội bộ:   /api/lms/model
 * System giữ /api/system. Giữ suffix sau root (vd. /congsinhvien/public).
 */
const normalizeApiPathname = (pathname: string, toInternal: boolean): string => {
  const cleaned = pathname.replace(/\/+$/, "") || "/"

  // Thứ tự: /api/lms/model trước /api/lms và trước /api/model
  const rules: Array<{ re: RegExp; internetRoot: string; internalRoot: string }> = [
    { re: /^(\/[^/]+)?\/api\/lms\/model(?=\/|$)/, internetRoot: "/api/model", internalRoot: "/api/lms/model" },
    { re: /^(\/[^/]+)?\/api\/model(?=\/|$)/, internetRoot: "/api/model", internalRoot: "/api/lms/model" },
    { re: /^(\/[^/]+)?\/api\/system(?=\/|$)/, internetRoot: "/api/system", internalRoot: "/api/system" },
    { re: /^(\/[^/]+)?\/api\/portal(?=\/|$)/, internetRoot: "/api/portal", internalRoot: "/api/portal" },
    { re: /^(\/[^/]+)?\/api\/ems(?=\/|$)/, internetRoot: "/api/ems", internalRoot: "/api/ems" },
    { re: /^(\/[^/]+)?\/api\/lms(?=\/|$)/, internetRoot: "/api/lms", internalRoot: "/api/lms" },
  ]

  for (const rule of rules) {
    const match = cleaned.match(rule.re)
    if (!match) continue
    const suffix = cleaned.slice(match[0].length)
    const root = toInternal ? rule.internalRoot : rule.internetRoot
    // Nội bộ không giữ mount prefix kiểu /cong-sinh-vien (nginx mount /api/lms/model trực tiếp)
    if (toInternal) return `${root}${suffix}`
    const mount = match[1] && match[1] !== "/api" ? match[1] : ""
    return `${mount}${root}${suffix}`
  }

  return cleaned
}

export const getUrl = (baseUrl: string, contextUrl: string): string => {
  let cleanBase = (baseUrl || "").trim().replace(/^["']+|["'/]+$/g, "")

  // Same-origin + map /api/model ↔ /api/lms/model theo môi trường (internet vs nội bộ).
  if (typeof window !== "undefined" && window.location?.hostname) {
    const currentHost = window.location.hostname
    if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      const toInternal = isInternalMtaHost(currentHost)
      try {
        if (cleanBase.startsWith("http://") || cleanBase.startsWith("https://")) {
          const parsed = new URL(cleanBase)
          const shouldRewriteHost =
            parsed.hostname !== currentHost &&
            (isSwantechHost(parsed.hostname) || isInternalMtaHost(parsed.hostname))
          if (shouldRewriteHost || parsed.hostname === currentHost) {
            const apiPath = normalizeApiPathname(parsed.pathname, toInternal)
            cleanBase = shouldRewriteHost
              ? `${window.location.origin}${apiPath}`
              : `${parsed.origin}${apiPath}`
          }
        } else if (cleanBase.startsWith("/")) {
          cleanBase = normalizeApiPathname(cleanBase, toInternal)
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

type SystemScope = "public" | "share" | "storage"

/**
 * System API:
 * - Browser: luôn proxy qua be-model (MODEL base) → `/system/{appCode}/{scope}/...`
 *   Chỉ cần cấu hình MODEL path trên FE; SYSTEM_BASE_URL chỉ set ở BE.
 * - Server (BE): gọi thẳng SYSTEM_BASE_URL/api/system/{scope}/...
 *   Chỉ khi đặt SYSTEM_API_APP_CODE mới chèn appCode: /api/system/{SYSTEM_API_APP_CODE}/{scope}/...
 *   (biến riêng, không dùng chung PORTAL_APP_CODE / MTA_APP_CODE vì nginx nội bộ chỉ có /api/system/{scope}/)
 */
const resolveSystemRequestUrl = (scope: SystemScope, url: string): string => {
  const path = url.startsWith("/") ? url : `/${url}`

  // BE / Node: gọi system trực tiếp — chỉ cần SYSTEM_BASE_URL trong .env server
  if (typeof window === "undefined" && process.env.SYSTEM_BASE_URL) {
    const origin = process.env.SYSTEM_BASE_URL.replace(/\/$/, "")
    const serverAppCode = process.env.SYSTEM_API_APP_CODE?.trim().toLowerCase()
    const appSegment = serverAppCode ? `/${serverAppCode}` : ""
    return `${origin}/api/system${appSegment}/${scope}${path}`
  }

  const appCode = (
    getRuntimeEnv("NEXT_PUBLIC_APP_CODE") ||
    process.env.NEXT_PUBLIC_APP_CODE ||
    process.env.MTA_APP_CODE ||
    process.env.PORTAL_APP_CODE ||
    "lms"
  ).toLowerCase()
  const systemPath = `/system/${appCode}/${scope}${path}`

  // Browser: không gọi /api/system trực tiếp — proxy qua be-model (MODEL base)
  const modelBase =
    getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") ||
    process.env.NEXT_PUBLIC_API_MODEL_BASE_URL ||
    "/api/model"
  return getUrl(modelBase, systemPath)
}

export const customSystemFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = resolveSystemRequestUrl("public", url)
  // Browser → be-model tự gắn x-clientid/secret từ BE .env; vẫn gửi FE credentials khi có (fallback local)
  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...(typeof window === "undefined" ? getClientCredentialHeaders() : {}),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customSystemShareFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = resolveSystemRequestUrl("share", url)
  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...(typeof window === "undefined" ? getClientCredentialHeaders() : {}),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}

export const customStorageFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const requestUrl = resolveSystemRequestUrl("storage", url)
  const response = await fetchInstance(requestUrl, {
    ...options,
    headers: {
      ...(typeof window === "undefined" ? getClientCredentialHeaders() : {}),
      ...options?.headers,
    },
  })
  const data = await getBody<T>(response)

  return { status: response.status, data, headers: response.headers } as T
}
