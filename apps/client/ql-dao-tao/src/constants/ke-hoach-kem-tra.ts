export type LichKiemTraItem = {
  id: string
  classDate: string
  startTime: string
  endTime: string
  startPeriod: number
  endPeriod: number
  location: string
  notes: string
}

const STORAGE_KEY = "LICH_KIEM_TRA_GIANG_DAY"

export function saveToLocalStorage(data: LichKiemTraItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getFromLocalStorage(): LichKiemTraItem[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
