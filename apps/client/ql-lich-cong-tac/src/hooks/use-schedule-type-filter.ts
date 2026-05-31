import type { WeekScheduleEntryType } from "@/types/work-schedule-week-view"
import { useCallback, useMemo, useState } from "react"

export function useScheduleTypeFilter<
  T extends { type: WeekScheduleEntryType; date: string; leaderId: string; time?: string },
>(entries: T[]) {
  const [hiddenTypes, setHiddenTypes] = useState<Set<WeekScheduleEntryType>>(new Set())

  const toggleType = useCallback((type: WeekScheduleEntryType) => {
    setHiddenTypes((current) => {
      const next = new Set(current)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const filteredEntries = useMemo(
    () => entries.filter((entry) => !hiddenTypes.has(entry.type)),
    [entries, hiddenTypes]
  )

  const entriesByCell = useMemo(() => {
    const map = new Map<string, T[]>()

    for (const entry of filteredEntries) {
      const key = `${entry.date}:${entry.leaderId}`
      const current = map.get(key) ?? []
      current.push(entry)
      map.set(key, current)
    }

    for (const list of map.values()) {
      list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
    }

    return map
  }, [filteredEntries])

  return {
    hiddenTypes,
    toggleType,
    filteredEntries,
    entriesByCell,
  }
}
