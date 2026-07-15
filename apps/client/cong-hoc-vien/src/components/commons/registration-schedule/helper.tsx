import { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas"

export interface ScheduleCourse {
  id: string
  code: string
  name: string
  startPeriod: number
  endPeriod: number
  dayOfWeek: number
  room?: string
  lecturer?: string
  color?: string
  isConflict?: boolean
  conflictsWith?: string[]
  originalData: GetClassesInfo200ItemSubjectClassItem
}

export const SESSIONS = [
  {
    key: "morning",
    label: "Sáng",
    periods: [1, 2, 3, 4, 5],
  },
  {
    key: "afternoon",
    label: "Chiều",
    periods: [6, 7, 8, 9, 10],
  },
  {
    key: "evening",
    label: "Tối",
    periods: [11, 12, 13, 14, 15],
  },
]

export const DAYS = [
  { key: 2, label: "Thứ 2" },
  { key: 3, label: "Thứ 3" },
  { key: 4, label: "Thứ 4" },
  { key: 5, label: "Thứ 5" },
  { key: 6, label: "Thứ 6" },
  { key: 7, label: "Thứ 7" },
  { key: 8, label: "Chủ nhật" },
]

export const PERIODS = Array.from({ length: 15 }, (_, i) => i + 1)

const COURSE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
]

const getCourseColor = (courseId: string) => {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

const buildScheduleMap = (registeredClasses: GetClassesInfo200ItemSubjectClassItem[]) => {
  const scheduleMap = new Map<number, Map<string, ScheduleCourse[][]>>()

  DAYS.forEach((day) => {
    scheduleMap.set(day.key, new Map())
  })

  // Build all segments, then deduplicate: same subject (id) + same day + same period slot
  // should only appear once (it's the same weekly slot, just repeated across weeks)
  const segmentKeySet = new Set<string>()
  const allSegments: ScheduleCourse[] = []
  registeredClasses.forEach((cls) => {
    cls.subjectClassTimes?.forEach((time) => {
      if (time.dayOfWeek && time.startPeriod && time.endPeriod) {
        const dedupeKey = `${cls.id}-${time.dayOfWeek}-${time.startPeriod}-${time.endPeriod}`
        if (segmentKeySet.has(dedupeKey)) return
        segmentKeySet.add(dedupeKey)

        allSegments.push({
          id: cls.id,
          code: cls.code,
          name: cls.name,
          startPeriod: time.startPeriod,
          endPeriod: time.endPeriod,
          dayOfWeek: time.dayOfWeek,
          room: [cls.room?.name, cls.room?.building?.name].filter(Boolean).join(" - "),
          lecturer: cls.mainLecturer?.userProfile?.fullname || undefined,
          color: getCourseColor(cls.id),
          originalData: cls,
        })
      }
    })
  })

  DAYS.forEach((day) => {
    const dayMap = scheduleMap.get(day.key)!
    const daySegments = allSegments.filter((seg) => seg.dayOfWeek === day.key)

    const processedDaySegments = daySegments.map((seg) => {
      // Only count overlaps with DIFFERENT subjects (different id) as conflicts
      const others = daySegments.filter(
        (o) => o.id !== seg.id && seg.startPeriod <= o.endPeriod && o.startPeriod <= seg.endPeriod
      )

      const conflictsWithNames = Array.from(new Set(others.map((o) => `${o.code} - ${o.name}`)))

      return {
        ...seg,
        isConflict: others.length > 0,
        conflictsWith: conflictsWithNames,
      }
    })

    SESSIONS.forEach((session) => {
      const sessionSegments = processedDaySegments.filter(
        (seg) =>
          seg.startPeriod >= session.periods[0] &&
          seg.startPeriod <= session.periods[session.periods.length - 1]
      )

      if (sessionSegments.length === 0) {
        dayMap.set(session.key, [])
        return
      }

      const sortedSegments = [...sessionSegments].sort((a, b) => a.startPeriod - b.startPeriod)
      const disjointSets: ScheduleCourse[][] = []

      sortedSegments.forEach((seg) => {
        let added = false
        for (const set of disjointSets) {
          const overlapsWithSet = set.some(
            (s) => seg.startPeriod <= s.endPeriod && s.startPeriod <= seg.endPeriod
          )

          if (overlapsWithSet) {
            // If same subject already in this stack (same id, same periods), skip — it's a duplicate week session
            const isDuplicateSameSubject = set.some(
              (s) =>
                s.id === seg.id &&
                s.startPeriod === seg.startPeriod &&
                s.endPeriod === seg.endPeriod
            )
            if (!isDuplicateSameSubject) {
              set.push(seg)
            }
            added = true
            break
          }
        }

        if (!added) {
          disjointSets.push([seg])
        }
      })

      dayMap.set(session.key, disjointSets)
    })
  })

  return { scheduleMap }
}

const registrationScheduleHelper = {
  DAYS,
  PERIODS,
  SESSIONS,
  buildScheduleMap,
}

export default registrationScheduleHelper
