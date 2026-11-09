/** Client credentials + URL helper để be-model gọi public-api (SYSTEM_BASE_URL). */

export function getSystemClientCredentials(appCode: string): {
  clientId: string
  clientSecret: string
} {
  const code = appCode.toLowerCase()
  const clientId = (() => {
    switch (code) {
      case "lms":
        return process.env.KEYCLOAK_CLIENT_ID_LMS || ""
      case "conggiangvien":
        return process.env.KEYCLOAK_CLIENT_ID_CONG_GIANG_VIEN || ""
      case "congsinhvien":
        return (
          process.env.KEYCLOAK_CLIENT_ID_CONG_SINH_VIEN ||
          process.env.KEYCLOAK_CLIENT_ID_PORTAL ||
          ""
        )
      case "conghocvien":
        return (
          process.env.KEYCLOAK_CLIENT_ID_CONG_HOC_VIEN ||
          process.env.KEYCLOAK_CLIENT_ID_PORTAL ||
          ""
        )
      case "ems":
        return process.env.KEYCLOAK_CLIENT_ID_EMS || ""
      case "hrm":
        return process.env.KEYCLOAK_CLIENT_ID_HRM || ""
      case "portal":
      case "dangkyhoc":
        return process.env.KEYCLOAK_CLIENT_ID_PORTAL || ""
      case "chatbot":
        return process.env.KEYCLOAK_CLIENT_ID_CHATBOT || ""
      case "lct":
        return process.env.KEYCLOAK_CLIENT_ID_LCT || ""
      default:
        return process.env.KEYCLOAK_CLIENT_ID || ""
    }
  })()
  const clientSecret = (() => {
    switch (code) {
      case "lms":
        return process.env.KEYCLOAK_CLIENT_SECRET_LMS || ""
      case "conggiangvien":
        return process.env.KEYCLOAK_CLIENT_SECRET_CONG_GIANG_VIEN || ""
      case "congsinhvien":
        return (
          process.env.KEYCLOAK_CLIENT_SECRET_CONG_SINH_VIEN ||
          process.env.KEYCLOAK_CLIENT_SECRET_PORTAL ||
          ""
        )
      case "conghocvien":
        return (
          process.env.KEYCLOAK_CLIENT_SECRET_CONG_HOC_VIEN ||
          process.env.KEYCLOAK_CLIENT_SECRET_PORTAL ||
          ""
        )
      case "ems":
        return process.env.KEYCLOAK_CLIENT_SECRET_EMS || ""
      case "hrm":
        return process.env.KEYCLOAK_CLIENT_SECRET_HRM || ""
      case "portal":
      case "dangkyhoc":
        return process.env.KEYCLOAK_CLIENT_SECRET_PORTAL || ""
      case "chatbot":
        return process.env.KEYCLOAK_CLIENT_SECRET_CHATBOT || ""
      case "lct":
        return process.env.KEYCLOAK_CLIENT_SECRET_LCT || ""
      default:
        return process.env.KEYCLOAK_CLIENT_SECRET || ""
    }
  })()
  return { clientId, clientSecret }
}

export function getSystemOrigin(): string {
  return (process.env.SYSTEM_BASE_URL || "").replace(/\/$/, "")
}

/** Gọi system public API lấy quyền theo app + user. */
export async function fetchSystemUserPermission(appCode: string, userId: string) {
  const code = appCode.trim().toLowerCase()
  const uid = userId.trim()
  const origin = getSystemOrigin()
  if (!origin) {
    throw Object.assign(new Error("SYSTEM_BASE_URL chưa cấu hình"), { status: 500 })
  }
  const { clientId, clientSecret } = getSystemClientCredentials(code)
  if (!clientId || !clientSecret) {
    throw Object.assign(new Error(`Thiếu x-clientid/secret cho app ${code}`), { status: 401 })
  }

  // Public-api mount: /api/system/public/... (không phải /api/system/{appCode}/...)
  const url = `${origin}/api/system/public/UserPermissions/permission/${encodeURIComponent(code)}/${encodeURIComponent(uid)}`
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-clientid": clientId,
      "x-clientsecret": clientSecret,
    },
  })

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text || "Invalid JSON from system API" }
  }

  return { status: res.status, data }
}
