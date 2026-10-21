import type { Key } from "react"

export function mergePageSelection(previousIds: Key[], pageIds: Key[], selectedOnPage: Key[]) {
  const pageIdSet = new Set(pageIds.map(String))
  const preserved = previousIds.filter((id) => !pageIdSet.has(String(id)))
  return [...new Set([...preserved, ...selectedOnPage].map(String))]
}
