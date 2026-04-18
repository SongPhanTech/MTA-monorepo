import { classUnregister } from "@workspace/libs/api/portal"
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem"
import { useMutation } from "@tanstack/react-query"
import { message, Popconfirm, Tooltip } from "antd"
import { CircleAlertIcon, CircleXIcon } from "lucide-react"
import { useState } from "react"

const DAYS = [
  { key: 2, label: "Thứ 2" },
  { key: 3, label: "Thứ 3" },
  { key: 4, label: "Thứ 4" },
  { key: 5, label: "Thứ 5" },
  { key: 6, label: "Thứ 6" },
  { key: 7, label: "Thứ 7" },
  { key: 8, label: "Chủ nhật" },
]

const BUOI = [
  { key: "sang", label: "Sáng" },
  { key: "chieu", label: "Chiều" },
  { key: "toi", label: "Tối" },
]

const getBuoi = (startPeriod?: number | null): string | null => {
  if (!startPeriod) return null
  if (startPeriod <= 5) return "sang"
  if (startPeriod <= 10) return "chieu"
  return "toi"
}

// courseId → danh sách môn bị trùng tiết (label "mã - tên")
const buildConflictMap = (
  cellMap: Map<
    string,
    { course: GetClassesInfo200ItemSubjectClassItem; startPeriod: number; endPeriod: number }[]
  >
): Map<string, string[]> => {
  const conflictMap = new Map<string, string[]>()
  for (const entries of cellMap.values()) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]
        const b = entries[j]
        if (a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod) {
          const labelA = [a.course.code, a.course.name].filter(Boolean).join(" - ")
          const labelB = [b.course.code, b.course.name].filter(Boolean).join(" - ")
          if (!conflictMap.has(a.course.id!)) conflictMap.set(a.course.id!, [])
          if (!conflictMap.has(b.course.id!)) conflictMap.set(b.course.id!, [])
          conflictMap.get(a.course.id!)!.push(labelB)
          conflictMap.get(b.course.id!)!.push(labelA)
        }
      }
    }
  }
  return conflictMap
}

const ThoiKhoaBieuDangKy = ({
  registeredClasses,
  sessionId,
  curriculumVersionId,
  onUnregisterSuccess,
  isEdit = true,
}: {
  registeredClasses: GetClassesInfo200ItemSubjectClassItem[]
  sessionId: string
  curriculumVersionId: string
  onUnregisterSuccess?: () => void
  isEdit?: boolean
}) => {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const { mutate: unregisterMutate, isPending: isUnregistering } = useMutation({
    mutationFn: async (subjectClassId: string) => {
      const res = await classUnregister({
        sessionId,
        curriculumVersionId,
        subjectClassIds: [subjectClassId],
      })
      if (res.status !== 200) {
        throw new Error(res.data?.message || "Huỷ đăng ký thất bại")
      }
      return res
    },
    onMutate: (subjectClassId) => {
      setRemovedIds((prev) => new Set([...prev, subjectClassId]))
    },
    onSuccess: () => {
      message.success("Huỷ đăng ký thành công")
      onUnregisterSuccess?.()
    },
    onError: (error: any, subjectClassId) => {
      setRemovedIds((prev) => {
        const next = new Set(prev)
        next.delete(subjectClassId)
        return next
      })
      message.error(error?.message || "Huỷ đăng ký thất bại")
    },
  })

  const displayClasses = registeredClasses.filter((c) => !removedIds.has(c.id ?? ""))

  const cellMap = new Map<
    string,
    { course: GetClassesInfo200ItemSubjectClassItem; startPeriod: number; endPeriod: number }[]
  >()

  for (const course of displayClasses) {
    for (const slot of course.subjectClassTimes ?? []) {
      const buoi = getBuoi(slot.startPeriod)
      if (!slot.dayOfWeek || !buoi) continue
      const key = `${slot.dayOfWeek}-${buoi}`
      if (!cellMap.has(key)) cellMap.set(key, [])
      cellMap.get(key)!.push({
        course,
        startPeriod: slot.startPeriod ?? 0,
        endPeriod: slot.endPeriod ?? 0,
      })
    }
  }

  const conflictMap = buildConflictMap(cellMap)

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 100 }} />
          {DAYS.map((d) => (
            <col key={d.key} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-1 text-center font-semibold">
              Thời khóa biểu
            </th>
            {DAYS.map((d) => (
              <th
                key={d.key}
                className="border border-gray-300 bg-gray-100 p-1 text-center font-semibold"
              >
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BUOI.map((buoi) => (
            <tr key={buoi.key}>
              <td className="border border-gray-300 bg-gray-50 p-1 text-center font-semibold align-middle">
                {buoi.label}
              </td>
              {DAYS.map((day) => {
                const entries = cellMap.get(`${day.key}-${buoi.key}`) ?? []
                return (
                  <td key={day.key} className="border border-gray-300 p-1 align-top">
                    {entries.map(({ course, startPeriod, endPeriod }) => {
                      const conflictsWith = conflictMap.get(course.id ?? "")
                      const hasConflict = !!conflictsWith?.length
                      return (
                        <div
                          key={`${course.id}-${day.key}`}
                          className={`rounded p-1 mb-1 bg-white text-xs border ${
                            hasConflict ? "border-red-500 bg-red-50" : "border-blue-400"
                          }`}
                        >
                          <div className="flex gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p
                                  className={`font-medium truncate ${hasConflict ? "text-red-600" : "text-blue-700"}`}
                                >
                                  {course.code}
                                </p>
                                {hasConflict && (
                                  <Tooltip
                                    title={
                                      <div>
                                        <p className="font-semibold mb-1">Trùng tiết với:</p>
                                        {conflictsWith.map((label) => (
                                          <p key={label}>• {label}</p>
                                        ))}
                                      </div>
                                    }
                                  >
                                    <CircleAlertIcon size={12} className="text-red-500 shrink-0" />
                                  </Tooltip>
                                )}
                              </div>
                              <p className="font-semibold leading-tight">{course.name}</p>
                              <p className="text-gray-500">
                                (
                                {Array.from(
                                  { length: endPeriod - startPeriod + 1 },
                                  (_, i) => startPeriod + i
                                ).join(",")}
                                )
                              </p>
                              {course.room && (
                                <p className="text-gray-600 whitespace-normal break-words leading-tight">
                                  {[course.room.name, course.room.building?.name]
                                    .filter(Boolean)
                                    .join(" - ")}
                                  {course.room.building?.trainingLocation?.name
                                    ? ` (${course.room.building.trainingLocation.name})`
                                    : ""}
                                </p>
                              )}
                            </div>
                            {isEdit && (
                              <Popconfirm
                                title="Bạn có chắc chắn muốn huỷ đăng ký học phần này?"
                                okText="Huỷ"
                                cancelText="Đóng"
                                disabled={isUnregistering}
                                onConfirm={() => unregisterMutate(course.id ?? "")}
                              >
                                <CircleXIcon
                                  size={14}
                                  className="text-red-500 cursor-pointer shrink-0 mt-0.5"
                                />
                              </Popconfirm>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ThoiKhoaBieuDangKy
