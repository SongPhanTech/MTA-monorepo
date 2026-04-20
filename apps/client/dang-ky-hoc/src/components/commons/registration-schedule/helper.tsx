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

export const DAYS = [
  { key: 2, label: "Thứ 2" },
  { key: 3, label: "Thứ 3" },
  { key: 4, label: "Thứ 4" },
  { key: 5, label: "Thứ 5" },
  { key: 6, label: "Thứ 6" },
  { key: 7, label: "Thứ 7" },
  { key: 8, label: "Chủ nhật" },
]

export const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1)

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
  const scheduleMap = new Map<number, Map<number, ScheduleCourse[]>>()
  const conflictMap = new Map<string, string[]>()

  DAYS.forEach((day) => {
    scheduleMap.set(day.key, new Map())
  })

  const allSegments: ScheduleCourse[] = []
  registeredClasses.forEach((cls) => {
    cls.subjectClassTimes?.forEach((time) => {
      if (time.dayOfWeek && time.startPeriod && time.endPeriod) {
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

  const segmentsByDay = new Map<number, ScheduleCourse[]>()
  allSegments.forEach((seg) => {
    if (!segmentsByDay.has(seg.dayOfWeek)) segmentsByDay.set(seg.dayOfWeek, [])
    segmentsByDay.get(seg.dayOfWeek)!.push(seg)
  })

  segmentsByDay.forEach((daySegments, day) => {
    const sortedSegments = [...daySegments].sort((a, b) => a.startPeriod - b.startPeriod)

    const disjointSets: ScheduleCourse[][] = []

    sortedSegments.forEach((seg) => {
      let added = false
      for (const set of disjointSets) {
        const overlapsWithSet = set.some(
          (s) => seg.startPeriod <= s.endPeriod && s.startPeriod <= seg.endPeriod
        )

        if (overlapsWithSet) {
          set.push(seg)
          added = true
          break
        }
      }

      if (!added) {
        disjointSets.push([seg])
      }
    })

    disjointSets.forEach((set) => {
      const minStart = Math.min(...set.map((s) => s.startPeriod))
      const dayMap = scheduleMap.get(day)!

      const setWithConflictInfo = set.map((s) => {
        const others = set.filter((o) => o.id !== s.id)
        const conflictsWith = Array.from(new Set(others.map((o) => `${o.code} - ${o.name}`)))

        return {
          ...s,
          isConflict: set.length > 1,
          conflictsWith,
        }
      })

      dayMap.set(minStart, setWithConflictInfo)
    })
  })

  return { scheduleMap, conflictMap }
}

const isInsideSpan = (
  dayOfWeek: number,
  period: number,
  scheduleMap: Map<number, Map<number, ScheduleCourse[]>>
) => {
  const dayMap = scheduleMap.get(dayOfWeek)
  if (!dayMap) return false

  for (const [startPeriod, courses] of dayMap.entries()) {
    const maxEnd = Math.max(...courses.map((c) => c.endPeriod))
    if (period > startPeriod && period <= maxEnd) {
      return true
    }
  }
  return false
}

const registrationScheduleHelper = {
  DAYS,
  PERIODS,
  buildScheduleMap,
  isInsideSpan,
}

export default registrationScheduleHelper
