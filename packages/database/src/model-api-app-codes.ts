/**
 * App codes accepted by the shared model API (`/api/model`).
 * Cookies are `x-token-{code}` and bearer calls send `K-AppCode`.
 * The list is the be-model Keycloak switch plus the client NEXT_PUBLIC_APP_CODE values
 * (lms, ems, dangkyhoc, hrm, conggiangvien, CongGiangVien, portal, chatbot, lct).
 * MODEL_API_APP_CODES replaces the list when set.
 */
export const MODEL_API_APP_CODES = [
  "lms",
  "ems",
  "dangkyhoc",
  "hrm",
  "conggiangvien",
  "CongGiangVien",
  "portal",
  "chatbot",
  "lct",
] as const

export function modelApiAppCodes(raw: string | null | undefined = process.env.MODEL_API_APP_CODES): string[] {
  const source = raw?.trim() ? raw.split(",") : [...MODEL_API_APP_CODES]
  return [...new Set(source.map((code) => code.trim()).filter(Boolean))]
}
