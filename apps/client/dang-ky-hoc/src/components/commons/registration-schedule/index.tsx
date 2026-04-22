import { classUnregister } from "@workspace/libs/api/portal"
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem"
import { useMutation } from "@tanstack/react-query"
import { Badge, message, Popover } from "antd"
import { useMemo, useState } from "react"
import registrationScheduleHelper, { DAYS, SESSIONS } from "./helper"
import "./registration-schedule.css"
import CourseBlock from "./course-block"

interface ISubjectClassTime {
  registeredClasses: GetClassesInfo200ItemSubjectClassItem[]
  sessionId: string
  curriculumVersionId: string
  onUnregisterSuccess?: () => void
  isEdit?: boolean
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
      return res
    },
    onMutate: (subjectClassId) => {
      setRemovedIds((prev) => new Set([...prev, subjectClassId]))
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        message.success("Huỷ đăng ký thành công")
        onUnregisterSuccess?.()
      } else {
        message.error(res.data?.message || "Huỷ đăng ký thất bại")
      }
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
            <th className="period-col">Buổi</th>
            {DAYS.map((day) => (
              <th key={day.key}>{day.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SESSIONS.map((session) => (
            <tr key={session.key}>
              <td className="period-cell">
                <div className="period-label">{session.label}</div>
              </td>
              {DAYS.map((day) => {
                const dayMap = scheduleMap.get(day.key)
                const stacks = dayMap?.get(session.key)

                const allCoursesInSession = stacks?.flat() || []
                const uniqueCourseIds = new Set(allCoursesInSession.map((c) => c.id))
                const totalCourses = uniqueCourseIds.size

                return (
                  <td key={`${day.key}-${session.key}`} className="day-cell">
                    <div className="session-cell-content">
                      {totalCourses > 1 && (
                        <div className="absolute top-1 right-1 z-50 not-print">
                          <Badge count={totalCourses} style={{ backgroundColor: "#ff4d4f" }} />
                        </div>
                      )}
                      {stacks &&
                        stacks.map((stack, stackIndex) => (
                          <div key={stackIndex} className={`conflict-stack-${stackIndex}`}>
                            {stack.map((course, courseIndex) => (
                              <CourseBlock
                                key={`${course.id}-${day.key}-${course.startPeriod}-${courseIndex}`}
                                course={course}
                                index={courseIndex}
                                isEdit={isEdit}
                                isUnregistering={isUnregistering}
                                onUnregister={(id) => unregisterMutate(id)}
                              />
                            ))}
                          </div>
                        ))}
                    </div>
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
