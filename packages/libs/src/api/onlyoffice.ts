import { customModelFetch } from "./custom-instance"

export type SignOnlyOfficeConfigResponse = {
  status: number
  data: { token: string } | { message?: string }
  headers: Headers
}

/** Sign OnlyOffice DocEditor config with server-side JWT secret. */
export const signOnlyOfficeConfig = async (
  config: Record<string, unknown>,
  options?: RequestInit
): Promise<SignOnlyOfficeConfigResponse> => {
  return customModelFetch<SignOnlyOfficeConfigResponse>("/api/minio/onlyoffice-sign", {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    body: JSON.stringify(config),
  })
}
