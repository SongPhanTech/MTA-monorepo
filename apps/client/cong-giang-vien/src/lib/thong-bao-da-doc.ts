const STORAGE_PREFIX = "cgv-thong-bao-da-doc"
const THONG_BAO_DA_DOC_UPDATED_EVENT = "cgv-thong-bao-da-doc-updated"

const docIdsKey = (profileId: string) => `${STORAGE_PREFIX}-${profileId}`

export const loadDaDocIds = (profileId: string): Set<string> => {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(docIdsKey(profileId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export const saveDaDocIds = (profileId: string, ids: Set<string>) => {
  if (typeof window === "undefined") return
  localStorage.setItem(docIdsKey(profileId), JSON.stringify([...ids]))
  window.dispatchEvent(new CustomEvent(THONG_BAO_DA_DOC_UPDATED_EVENT, { detail: { profileId } }))
}

export { THONG_BAO_DA_DOC_UPDATED_EVENT }
