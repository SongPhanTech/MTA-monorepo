import { Popconfirm, Tooltip } from "antd"
import { ScheduleCourse } from "./helper"
import { CircleAlertIcon, CircleXIcon, InfoIcon, MapPinIcon } from "lucide-react"

interface CourseBlockProps {
  course: ScheduleCourse
  index: number
  isEdit: boolean
  onUnregister: (id: string) => void
  isUnregistering: boolean
}

const CourseBlock = (props: CourseBlockProps) => {
  const { course, index, isEdit, onUnregister, isUnregistering } = props
  return (
    <div className={`course-block course-${index} ${course.isConflict ? "conflict" : ""}`}>
      <div className="flex justify-between items-start">
        <span className="course-code">{course.code}</span>
        <div className="flex gap-1 items-center">
          {course.isConflict && (
            <Tooltip
              title={
                <div>
                  <p className="font-semibold mb-1 text-red-400">Trùng tiết với:</p>
                  {course.conflictsWith?.map((label) => (
                    <p key={label} className="text-red-300">
                      • {label}
                    </p>
                  ))}
                </div>
              }
            >
              <CircleAlertIcon size={12} className="text-red-500 cursor-help" />
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

      <p className="course-name">{course.name}</p>

      <div className="course-info">
        <div className="flex items-center gap-1">
          <Tooltip
            title={
              <div>
                <p className="font-semibold mb-1">
                  Tiết: {course.startPeriod} - {course.endPeriod}
                </p>
                {course.isConflict && (
                  <>
                    <p className="font-semibold mb-1 text-red-400 mt-2">Trùng tiết với:</p>
                    {course.conflictsWith?.map((label) => (
                      <p key={label} className="text-red-300">
                        • {label}{" "}
                      </p>
                    ))}
                  </>
                )}
              </div>
            }
          >
            <InfoIcon
              size={10}
              className={`${course.isConflict ? "text-red-400" : "text-blue-400"} cursor-help`}
            />
          </Tooltip>
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

export default CourseBlock
