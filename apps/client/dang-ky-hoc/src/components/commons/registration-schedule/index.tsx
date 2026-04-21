import { classUnregister } from "@workspace/libs/api/portal"
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem"
import { useMutation } from "@tanstack/react-query"
import { message, Popconfirm, Tooltip } from "antd"
import { CircleAlertIcon, CircleXIcon, InfoIcon, MapPinIcon } from "lucide-react"
import { useMemo, useState } from "react"
import registrationScheduleHelper, { DAYS, PERIODS, type ScheduleCourse } from "./helper"
import "./registration-schedule.css"

interface ISubjectClassTime {
  registeredClasses: GetClassesInfo200ItemSubjectClassItem[]
  sessionId: string
  curriculumVersionId: string
  onUnregisterSuccess?: () => void
  isEdit?: boolean
}

const CourseBlock = ({
  course,
  isEdit,
  onUnregister,
  isUnregistering,
}: {
  course: ScheduleCourse
  isEdit: boolean
  onUnregister: (id: string) => void
  isUnregistering: boolean
}) => {
  return (
    <div className={`course-block ${course.isConflict ? "conflict" : ""}`}>
      <div className="flex justify-between items-start">
        <span className="course-code">{course.code}</span>
        <div className="flex gap-1 items-center">
          {course.isConflict && (
            <Tooltip
              title={
                <div>
                  <p className="font-semibold mb-1">Trùng tiết với:</p>
                  {course.conflictsWith?.map((label) => (
                    <p key={label}>• {label}</p>
                  ))}
                </div>
              }
            >
              <CircleAlertIcon size={12} className="text-red-500" />
            </Tooltip>
          )}
          {isEdit && (
            <Popconfirm
              title="Huỷ đăng ký học phần này?"
              okText="Huỷ"
              cancelText="Đóng"
              disabled={isUnregistering}
              onConfirm={() => onUnregister(course.id)}
            >
              <CircleXIcon
                size={12}
                className="text-gray-400 cursor-pointer hover:text-red-500 transition-colors not-print"
              />
            </Popconfirm>
          )}
        </div>
      </div>

      <Tooltip title={course.name} placement="bottom">
        <p className="course-name">{course.name}</p>
      </Tooltip>

      <div className="course-info">
        <div className="flex items-center gap-1">
          <InfoIcon size={10} className="text-blue-400" />
          <span>
            Tiết: {course.startPeriod} - {course.endPeriod}
          </span>
        </div>
        {course.room && (
          <div className="flex items-center gap-1">
            <MapPinIcon size={10} className="text-blue-400" />
            <span className="truncate">{course.room}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const ThoiKhoaBieuDangKy = (props: ISubjectClassTime) => {
  const {
    registeredClasses,
    sessionId,
    curriculumVersionId,
    onUnregisterSuccess,
    isEdit = true,
  } = props

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const { scheduleMap } = useMemo(() => {
    const displayClasses = registeredClasses.filter((c) => !removedIds.has(c.id ?? ""))
    return registrationScheduleHelper.buildScheduleMap(displayClasses)
  }, [registeredClasses, removedIds])

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

  return (
    <div className="timetable-container" id="print-timetable">
      <table className="timetable">
        <thead>
          <tr>
            <th className="period-col">Tiết</th>
            {DAYS.map((day) => (
              <th key={day.key}>{day.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period}>
              <td className="period-cell">
                <div className="period-label">{period}</div>
              </td>
              {DAYS.map((day) => {
                const dayMap = scheduleMap.get(day.key)
                const courses = dayMap?.get(period)

                if (registrationScheduleHelper.isInsideSpan(day.key, period, scheduleMap)) {
                  return null
                }

                if (courses && courses.length > 0) {
                  const maxEndPeriod = Math.max(...courses.map((c) => c.endPeriod))
                  const rowSpan = maxEndPeriod - period + 1

                  return (
                    <td key={`${day.key}-${period}`} rowSpan={rowSpan} className="day-cell">
                      <div className="conflict-stack">
                        {courses.map((course) => (
                          <CourseBlock
                            key={`${course.id}-${day.key}-${course.startPeriod}`}
                            course={course}
                            isEdit={isEdit}
                            isUnregistering={isUnregistering}
                            onUnregister={(id) => unregisterMutate(id)}
                          />
                        ))}
                      </div>
                    </td>
                  )
                }

                return <td key={`${day.key}-${period}`} className="day-cell" />
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ThoiKhoaBieuDangKy
