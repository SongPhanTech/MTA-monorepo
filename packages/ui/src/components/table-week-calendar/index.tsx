import { ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined } from "@ant-design/icons"
import { useLocalStorage } from "@workspace/libs/hook/use-localstorage"
import { Button, Col, DatePicker, Row, Table } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"

const dayNames = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"]

interface EventData {
  id: string
  startTime: string
  endTime: string
  content: string
  location?: string
  note?: string
  color?: string
  host?: string[]
  attendees?: string[]
  hostProfile?: {
    id: string
    fullname?: string
    firstname?: string
    lastname?: string
  }[]
  attendeesProfile?: {
    id: string
    fullname?: string
    firstname?: string
    lastname?: string
  }[]
}

interface TableWeekCalendarProps {
  eventsData?: EventData[]
  showWeekNavigation?: boolean
  showAddButtons?: boolean
  showLockToggle?: boolean
  showDateFilter?: boolean
  initialUnlockState?: boolean
  weekOffset?: number
  keyStorage?: string
  filterDate?: string | Date
  onWeekOffsetChange?: (offset: number) => void
  onFilterDateChange?: (date: Date | undefined) => void
  onEventClick?: (eventId: string, eventRecord?: any) => void
  onCreateEvent?: (startTime: string, endTime: string) => void
  onCreateWeekEvent?: (weekStart: string, weekEnd: string) => void
  /** Thu hẹp toolbar + bảng cho dashboard (khớp lịch tháng compact). */
  compact?: boolean
}

export function TableWeekCalendar({
  eventsData = [],
  compact = false,
  showWeekNavigation = true,
  showAddButtons = true,
  showLockToggle = true,
  showDateFilter = false,
  initialUnlockState = false,
  weekOffset = 0,
  keyStorage,
  filterDate,
  onWeekOffsetChange,
  onFilterDateChange,
  onEventClick,
  onCreateEvent,
  onCreateWeekEvent,
}: TableWeekCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(weekOffset)
  // const [isUnlocked, setIsUnlocked] = useState(initialUnlockState)
  const [isUnlocked, setIsUnlocked] = useLocalStorage<boolean>(
    keyStorage ?? "is_unlocked_lich_tuan",
    initialUnlockState
  )

  // Helper function to calculate week offset from a specific date
  const calculateWeekOffsetFromDate = useCallback((targetDate: Date) => {
    const today = new Date()
    const currentDay = today.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() + mondayOffset)
    currentMonday.setHours(0, 0, 0, 0)

    const targetDay = targetDate.getDay()
    const targetMondayOffset = targetDay === 0 ? -6 : 1 - targetDay
    const targetMonday = new Date(targetDate)
    targetMonday.setDate(targetDate.getDate() + targetMondayOffset)
    targetMonday.setHours(0, 0, 0, 0)

    const diffTime = targetMonday.getTime() - currentMonday.getTime()
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000))

    return diffWeeks
  }, [])
  // Effect to handle filterDate changes - navigate to week containing the date
  useEffect(() => {
    if (filterDate) {
      const targetDate = new Date(filterDate)
      if (!Number.isNaN(targetDate.getTime())) {
        const newOffset = calculateWeekOffsetFromDate(targetDate)
        // Chỉ update nếu offset thật sự thay đổi để tránh loop
        if (newOffset !== currentWeekOffset) {
          setCurrentWeekOffset(newOffset)
          onWeekOffsetChange?.(newOffset)
        }
      }
    }
  }, [filterDate, onWeekOffsetChange, calculateWeekOffsetFromDate, currentWeekOffset])

  // Helper function to check if a date matches the filterDate
  const isFilteredDate = (dateToCheck: Date) => {
    if (!filterDate) return false
    const targetDate = new Date(filterDate)
    if (Number.isNaN(targetDate.getTime())) return false

    return (
      dateToCheck.getDate() === targetDate.getDate() &&
      dateToCheck.getMonth() === targetDate.getMonth() &&
      dateToCheck.getFullYear() === targetDate.getFullYear()
    )
  }

  // Effect to handle Escape key press to clear highlight
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && filterDate) {
        onFilterDateChange?.(undefined)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [filterDate, onFilterDateChange])

  // Cập nhật weekOffset từ props
  useEffect(() => {
    setCurrentWeekOffset(weekOffset)
  }, [weekOffset])

  // Gọi callback khi weekOffset thay đổi
  const handleWeekOffsetChange = (newOffset: number) => {
    setCurrentWeekOffset(newOffset)
    onWeekOffsetChange?.(newOffset)

    // Cập nhật datepicker để hiển thị ngày trong tuần mới
    if (filterDate) {
      // Tính ngày tương ứng trong tuần mới
      const today = new Date()
      const currentDay = today.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
      const newMonday = new Date(today)
      newMonday.setDate(today.getDate() + mondayOffset + newOffset * 7)

      // Nếu có filterDate, cập nhật thành ngày tương ứng trong tuần mới
      const currentFilterDate = new Date(filterDate)
      const dayOfWeek = currentFilterDate.getDay()
      const newFilterDate = new Date(newMonday)
      newFilterDate.setDate(newMonday.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

      onFilterDateChange?.(newFilterDate)
    }
  }

  // Tính ngày đầu tuần (thứ 2) và cuối tuần (chủ nhật) dựa vào currentWeekOffset
  const { weekStart, weekEnd } = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset + currentWeekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { weekStart: monday, weekEnd: sunday }
  }, [currentWeekOffset])

  // Filter events based on week range if eventsData is provided
  const filteredEventsData = useMemo(() => {
    if (!eventsData || eventsData.length === 0) return []

    return eventsData.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return eventStart <= weekEnd && eventEnd >= weekStart
    })
  }, [eventsData, weekStart, weekEnd])

  // Helper function to display names combining profile relations and string arrays
  const displayNames = (profileRelations: any[], stringArray: string[]): React.ReactNode[] => {
    const allItems: React.ReactNode[] = []

    // Add profile relations
    if (profileRelations?.length > 0) {
      profileRelations.forEach((profile) => {
        const fullName = profile.fullname || `${profile.firstname} ${profile.lastname}`
        const orgName = profile.organization?.name

        allItems.push(
          <span key={profile.id} style={{ color: "#333333", fontWeight: 500 }}>
            - {fullName}
            {orgName && <span style={{ color: "#47a1dd", marginLeft: 4 }}>({orgName})</span>}
          </span>
        )
      })
    }

    // Add custom text from string array
    if (stringArray?.length > 0) {
      stringArray.forEach((customText, index) => {
        allItems.push(
          <span key={`custom-${index}`} style={{ color: "#333333", fontWeight: 500 }}>
            - {customText}
          </span>
        )
      })
    }

    return allItems
  }
  // // Load trạng thái từ localStorage
  // useEffect(() => {
  //     const config = getAppConfig()
  //     const savedUnlockState = config.lich_tuan_unlock_state
  //     if (savedUnlockState !== undefined) {
  //         setIsUnlocked(savedUnlockState)
  //     }
  // }, [])

  // // Hàm toggle và lưu vào localStorage
  const handleToggleUnlock = () => {
    const newState = !isUnlocked
    setIsUnlocked(newState)
    // setAppConfig('lich_tuan_unlock_state', newState)
  }

  // Group events theo ngày trong tuần hiện tại và tạo flat data cho table
  const weeklySchedule = useMemo(() => {
    const monday = new Date(weekStart)

    // Tách events thành 3 loại: cả tuần, multi-day groups, và single-day
    const weekEvents: any[] = []
    const multiDayGroups: { [key: string]: any[] } = {}
    const dayEvents: any[] = []

    filteredEventsData?.forEach((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)

      // Kiểm tra xem event có đúng là cả tuần (từ 00:00 thứ 2 đến 23:59 chủ nhật) không
      const weekStartCheck = new Date(monday)
      weekStartCheck.setHours(0, 0, 0, 0)
      const weekEndCheck = new Date(monday)
      weekEndCheck.setDate(monday.getDate() + 6)
      weekEndCheck.setHours(23, 59, 0, 0)

      const isFullWeek =
        eventStart.getTime() === weekStartCheck.getTime() &&
        eventEnd.getHours() === 23 &&
        eventEnd.getMinutes() === 59 &&
        eventEnd.getDate() === weekEndCheck.getDate() &&
        eventEnd.getMonth() === weekEndCheck.getMonth() &&
        eventEnd.getFullYear() === weekEndCheck.getFullYear()

      if (isFullWeek) {
        // Event đúng cả tuần -> thuộc hàng "Cả tuần"
        weekEvents.push(event)
      } else {
        // Kiểm tra xem có phải multi-day event không
        const startDate = new Date(
          eventStart.getFullYear(),
          eventStart.getMonth(),
          eventStart.getDate()
        )
        const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())

        // Tính số ngày khác nhau (không dùng Math.ceil)
        const timeDiff = endDate.getTime() - startDate.getTime()
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

        if (daysDiff > 0) {
          // Multi-day event -> group theo khoảng thời gian
          const pad = (num: number) => String(num).padStart(2, "0")

          // Tính toán phần của sự kiện thuộc tuần hiện tại
          const eventActualStart = new Date(eventStart)
          const eventActualEnd = new Date(eventEnd)

          // Lấy phần giao với tuần hiện tại, nhưng giữ nguyên thời gian trong ngày
          const weekEnd = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
          weekEnd.setHours(23, 59, 59, 999)

          let weekDisplayStart = eventActualStart
          let weekDisplayEnd = eventActualEnd

          // Nếu event bắt đầu trước tuần hiện tại, lấy thời điểm bắt đầu tuần nhưng giữ nguyên giờ của event
          if (eventActualStart < monday) {
            weekDisplayStart = new Date(monday)
            weekDisplayStart.setHours(
              eventActualStart.getHours(),
              eventActualStart.getMinutes(),
              eventActualStart.getSeconds()
            )
          }

          // Nếu event kết thúc sau tuần hiện tại, lấy thời điểm kết thúc tuần nhưng giữ nguyên giờ của event
          if (eventActualEnd > weekEnd) {
            weekDisplayEnd = new Date(weekEnd)
            weekDisplayEnd.setHours(
              eventActualEnd.getHours(),
              eventActualEnd.getMinutes(),
              eventActualEnd.getSeconds()
            )
          }

          const displayStartDate = new Date(
            weekDisplayStart.getFullYear(),
            weekDisplayStart.getMonth(),
            weekDisplayStart.getDate()
          )
          const displayEndDate = new Date(
            weekDisplayEnd.getFullYear(),
            weekDisplayEnd.getMonth(),
            weekDisplayEnd.getDate()
          )

          // Nếu sự kiện dài hơn hoặc bằng 7 ngày (1 tuần), thêm indicator
          const isMultiWeekEvent = daysDiff >= 7

          let groupKey: string
          if (isMultiWeekEvent) {
            // Với multi-week events, hiển thị ngày gốc thay vì ngày đã cắt theo tuần
            const originalStart = new Date(eventStart)
            const originalEnd = new Date(eventEnd)
            const startStr = `${pad(originalStart.getDate())}/${pad(originalStart.getMonth() + 1)}`
            const endStr = `${pad(originalEnd.getDate())}/${pad(originalEnd.getMonth() + 1)}`
            groupKey = `Nhiều ngày|${startStr} - ${endStr}`
          } else {
            // Với multi-day events thường, hiển thị thứ như cũ
            const startDayName = displayStartDate
              .toLocaleDateString("vi-VN", {
                weekday: "long",
              })
              .replace(/^thứ/, "Thứ")
            const endDayName = displayEndDate
              .toLocaleDateString("vi-VN", {
                weekday: "long",
              })
              .replace(/^thứ/, "Thứ")
            const startStr = `${pad(displayStartDate.getDate())}/${pad(displayStartDate.getMonth() + 1)}`
            const endStr = `${pad(displayEndDate.getDate())}/${pad(displayEndDate.getMonth() + 1)}`
            groupKey = `${startDayName} - ${endDayName}|${startStr} - ${endStr}`
          }

          if (!multiDayGroups[groupKey]) {
            multiDayGroups[groupKey] = []
          }

          // Tạo một bản sao của event với thời gian đã được adjust cho tuần hiện tại
          const adjustedEvent = {
            ...event,
            startTime: weekDisplayStart.toISOString(),
            endTime: weekDisplayEnd.toISOString(),
            originalStartTime: event.startTime, // Lưu thời gian gốc
            originalEndTime: event.endTime,
            isMultiWeekEvent,
          }

          multiDayGroups[groupKey]?.push(adjustedEvent)
        } else {
          // Single-day event -> thuộc dayEvents
          dayEvents.push(event)
        }
      }
    })

    // Tạo dữ liệu cho đủ 1 tuần (chỉ events trong ngày)
    const schedule = dayNames.map((dayName, index) => {
      const currentDate = new Date(monday)
      currentDate.setDate(monday.getDate() + index)
      return {
        id: index,
        dayName,
        date: currentDate,
        dayIndex: index === 6 ? 0 : index + 1,
        events: [] as any[],
      }
    })

    // Group day events theo từng ngày trong tuần
    dayEvents?.forEach((event) => {
      const eventStart = new Date(event.startTime)
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday)
        currentDate.setDate(monday.getDate() + i)
        // Tạo khoảng thời gian của ngày hiện tại
        const currentDayStart = new Date(currentDate)
        currentDayStart.setHours(0, 0, 0, 0)
        const currentDayEnd = new Date(currentDate)
        currentDayEnd.setHours(23, 59, 59, 999)

        // Chỉ add event nếu nó bắt đầu trong ngày này
        if (eventStart >= currentDayStart && eventStart <= currentDayEnd) {
          schedule[i]?.events?.push(event)
        }
      }
    })

    // Sort events theo thời gian trong mỗi ngày
    schedule.forEach((day) => {
      day.events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    })

    // Tạo dữ liệu cho hàng "Cả tuần"
    const weekRowData: any[] = []
    // Chỉ tạo row "Cả tuần" khi có sự kiện
    if (weekEvents.length > 0) {
      weekEvents.forEach((event, index) => {
        weekRowData.push({
          id: `week-${event.id}`,
          dayName: "Trong tuần",
          date: monday,
          dayId: "week",
          event: event,
          isFirstInDay: index === 0,
          dayRowspan: index === 0 ? weekEvents.length : 0,
          isWeekRow: true,
        })
      })
    }

    // Tạo dữ liệu cho các hàng multi-day groups
    const multiDayRowData: any[] = []
    Object.entries(multiDayGroups).forEach(([groupKey, events]) => {
      events.forEach((event, index) => {
        multiDayRowData.push({
          id: `multiday-${event.id}`,
          dayName: groupKey,
          date: monday,
          dayId: `multiday-${groupKey}`,
          event: event,
          isFirstInDay: index === 0,
          dayRowspan: index === 0 ? events.length : 0,
          isMultiDayRow: true,
        })
      })
    })

    // Flatten data để có thể merge cells
    const flatData: any[] = []

    // Tách multi-week events và multi-day events thường
    const multiWeekRowData: any[] = []
    const normalMultiDayRowData: any[] = []

    multiDayRowData.forEach((row) => {
      if (row.event?.isMultiWeekEvent) {
        multiWeekRowData.push(row)
      } else {
        normalMultiDayRowData.push(row)
      }
    })

    // Thêm hàng multi-week ở đầu tiên (trường hợp đặc biệt)
    if (multiWeekRowData.length > 0) {
      flatData.push(...multiWeekRowData)
    }

    // Thêm hàng "Cả tuần"
    if (weekRowData.length > 0) {
      flatData.push(...weekRowData)
    }

    // Thêm các hàng multi-day thường
    if (normalMultiDayRowData.length > 0) {
      flatData.push(...normalMultiDayRowData)
    }

    // Thêm các hàng thứ
    schedule.forEach((day) => {
      if (day.events.length === 0) {
        // Nếu không có sự kiện, tạo 1 row trống
        flatData.push({
          id: `${day.id}-empty`,
          dayName: day.dayName,
          date: day.date,
          dayId: day.id,
          event: null,
          isFirstInDay: true,
          dayRowspan: 1,
          isWeekRow: false,
        })
      } else {
        // Nếu có sự kiện, tạo 1 row cho mỗi sự kiện
        day.events.forEach((event, index) => {
          flatData.push({
            id: `${day.id}-${event.id}`,
            dayName: day.dayName,
            date: day.date,
            dayId: day.id,
            event: event,
            isFirstInDay: index === 0,
            dayRowspan: index === 0 ? day.events.length : 0,
            isWeekRow: false,
          })
        })
      }
    })

    return {
      flatData,
      weekStart: monday,
      weekEnd: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000),
      hasWeekEvents: weekEvents.length > 0,
    }
  }, [filteredEventsData, weekStart])

  // Tính toán thông tin tuần hiển thị
  const weekInfo = useMemo(() => {
    const { weekStart, weekEnd } = weeklySchedule

    // Tính số tuần trong năm
    const startOfYear = new Date(weekStart.getFullYear(), 0, 1)
    const dayOfYear = Math.floor(
      (weekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    )
    const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)

    const pad = (num: number) => String(num).padStart(2, "0")

    const startStr = `${pad(weekStart.getDate())}/${pad(weekStart.getMonth() + 1)}`
    const endStr = `${pad(weekEnd.getDate())}/${pad(weekEnd.getMonth() + 1)}`

    return {
      title: `${startStr} - ${endStr} (Tuần ${weekNumber})`,
      weekNumber,
    }
  }, [weeklySchedule])

  const btnSize = compact ? "small" : "middle"
  const tableScrollY = compact ? 280 : 600
  const rowEstimate = compact ? 36 : 48

  return (
    <div className={compact ? "twc-compact min-h-0 min-w-0 overflow-x-hidden" : undefined}>
      {showWeekNavigation && (
        <Row
          gutter={compact ? [8, 8] : [16, 16]}
          align="middle"
          justify="space-between"
          style={{ marginBottom: compact ? 8 : undefined }}
        >
          <Col>
            <div
              style={{
                display: "flex",
                gap: compact ? "4px" : "8px",
                alignItems: "center",
              }}
            >
              <Button
                size={btnSize}
                icon={<ArrowLeftOutlined />}
                onClick={() => handleWeekOffsetChange(currentWeekOffset - 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              />
              <Button
                size={btnSize}
                type={currentWeekOffset === 0 ? "primary" : "default"}
                onClick={() => {
                  handleWeekOffsetChange(0)
                  // If already on current week, clear the highlight; otherwise set to today
                  if (currentWeekOffset === 0) {
                    onFilterDateChange?.(undefined)
                    return
                  }
                  onFilterDateChange?.(new Date())
                }}
              >
                Tuần này
              </Button>
              <Button
                size={btnSize}
                icon={<ArrowRightOutlined />}
                onClick={() => handleWeekOffsetChange(currentWeekOffset + 1)}
                iconPosition="end"
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              />
              {showDateFilter && (
                <DatePicker
                  size={btnSize}
                  value={filterDate ? dayjs(filterDate) : null}
                  onChange={(date) => {
                    if (!date) {
                      onFilterDateChange?.(undefined)
                      return
                    }
                    onFilterDateChange?.(date.toDate())
                  }}
                  placeholder="Chọn ngày"
                  format="DD/MM/YYYY"
                  allowClear
                  style={{ marginLeft: "8px" }}
                />
              )}
            </div>
          </Col>
          <Col>
            <div
              style={{
                fontSize: compact ? "14px" : "18px",
                fontWeight: 600,
                color: "rgb(38, 38, 38)",
              }}
            >
              {weekInfo.title}
            </div>
          </Col>
          <Col>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            />
          </Col>
        </Row>
      )}

      <Row gutter={[0, compact ? 4 : 8]} className={compact ? "mt-1" : "mt-2"}>
        <Col span={24}>
          <Table
            bordered
            rowKey="id"
            className={
              compact
                ? "[&_.ant-table]:text-[11px] [&_.ant-table-thead>tr>th]:!px-1.5 [&_.ant-table-thead>tr>th]:!py-1 [&_.ant-table-tbody>tr>td]:!px-1.5 [&_.ant-table-tbody>tr>td]:!py-1"
                : undefined
            }
            scroll={{
              x: compact ? 900 : 1200,
              ...(weeklySchedule.flatData.length * rowEstimate > tableScrollY
                ? { y: tableScrollY }
                : {}),
            }}
            rowClassName={(record) => {
              // Highlight toàn bộ hàng cùng thứ, không phân biệt sự kiện
              let baseClass = "day-row"
              if (record.isWeekRow) {
                baseClass = "week-row"
              } else if (record.isMultiDayRow) {
                // Thêm class đặc biệt cho multi-week events
                const isMultiWeek = record.event?.isMultiWeekEvent
                baseClass = isMultiWeek ? "multiweek-row" : "multiday-row"
              } else {
                baseClass = `day-row-${record.dayId}`
              }
              return record.event ? `${baseClass} cursor-pointer` : baseClass
            }}
            onRow={(record) => ({
              style: {
                backgroundColor: "#ffffff",
                cursor: record.event && isUnlocked ? "pointer" : "default",
              },
              onClick: () => {
                // Chỉ cho phép click vào bản ghi có sẵn để edit
                if (record.event && isUnlocked) {
                  // Đối với multi-week events, truyền thời gian gốc để edit đúng
                  const eventToEdit = { ...record.event }
                  if (record.event.originalStartTime && record.event.originalEndTime) {
                    eventToEdit.startTime = record.event.originalStartTime
                    eventToEdit.endTime = record.event.originalEndTime
                  }
                  onEventClick?.(eventToEdit.id, {
                    ...record,
                    event: eventToEdit,
                  })
                }
              },
            })}
            columns={[
              {
                title: "Ngày",
                key: "date",
                width: 150,
                align: "center",
                fixed: "left",
                render: (text, record) => {
                  if (!record.isFirstInDay) return null
                  if (record.isWeekRow) {
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: "4px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          border: "2px dashed transparent",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.border = "2px dashed #16A34A"
                            e.currentTarget.style.backgroundColor = "#f0fdf4"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.border = "2px dashed transparent"
                            e.currentTarget.style.backgroundColor = "transparent"
                          }
                        }}
                        onClick={(e) => {
                          if (!isUnlocked) return
                          e.stopPropagation()
                          const startTime = new Date(weekStart)
                          startTime.setHours(0, 0, 0, 0)
                          const endTime = new Date(weekEnd)
                          endTime.setHours(23, 59, 59, 999)
                          onCreateWeekEvent?.(startTime.toISOString(), endTime.toISOString())
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            marginBottom: 4,
                            color: "#16A34A",
                          }}
                        >
                          Trong tuần
                        </div>
                        {/* hiển thị khoảng thời gian cả tuần */}
                        {/* <div
                                                    style={{
                                                        fontSize: '11px',
                                                        color: '#16A34A',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {weekRangeStr}
                                                </div> */}
                        {isUnlocked && (
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              fontSize: "10px",
                              color: "#16A34A",
                              opacity: 0.7,
                            }}
                          >
                            <PlusOutlined />
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (record.isMultiDayRow) {
                    // Hiển thị cho các hàng multi-day
                    const [dayRange, dateRange] = record.dayName.split("|")

                    const isMultiWeek = record.event?.isMultiWeekEvent
                    const cellColor = isMultiWeek ? "#fa8c16" : "#16A34A" // Cam cho multi-week, xanh cho multi-day
                    const bgColor = isMultiWeek ? "#fff7e6" : "#f0fdf4"

                    return (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: "4px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          border: "2px dashed transparent",
                          backgroundColor: "transparent",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (isUnlocked && !isMultiWeek) {
                            e.currentTarget.style.border = `2px dashed ${cellColor}`
                            e.currentTarget.style.backgroundColor = bgColor
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isUnlocked && !isMultiWeek) {
                            e.currentTarget.style.border = "2px dashed transparent"
                            e.currentTarget.style.backgroundColor = "transparent"
                          }
                        }}
                        onClick={(e) => {
                          if (!isUnlocked) return
                          e.stopPropagation()

                          // Không cho phép thêm mới cho multi-week events
                          if (isMultiWeek) return

                          const start = new Date(record.event.startTime)
                          const end = new Date(record.event.endTime)
                          end.setHours(23, 59, 59, 999)
                          onCreateEvent?.(start.toISOString(), end.toISOString())
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: cellColor,
                          }}
                        >
                          {dayRange}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#000",
                            marginTop: "2px",
                            fontWeight: "normal",
                          }}
                        >
                          {isMultiWeek &&
                          record.event?.originalStartTime &&
                          record.event?.originalEndTime
                            ? // Hiển thị thời gian gốc cho multi-week events
                              (() => {
                                const originalStart = new Date(record.event.originalStartTime)
                                const originalEnd = new Date(record.event.originalEndTime)
                                const pad = (n: number) => String(n).padStart(2, "0")
                                const startStr = `${pad(originalStart.getDate())}/${pad(originalStart.getMonth() + 1)}`
                                const endStr = `${pad(originalEnd.getDate())}/${pad(originalEnd.getMonth() + 1)}`
                                return `${startStr} - ${endStr}`
                              })()
                            : dateRange}
                        </div>
                        {isUnlocked && !isMultiWeek && (
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              fontSize: "10px",
                              color: cellColor,
                              opacity: 0.7,
                            }}
                          >
                            <PlusOutlined />
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Hiển thị cho các hàng thứ
                  const dateStr = record.date
                    .toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                    .replace("-", "/")

                  const isHighlighted = isFilteredDate(record.date)

                  return (
                    <div
                      style={{
                        textAlign: "center",
                        cursor: "pointer",
                        padding: "8px",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: "4px",
                        border: isHighlighted ? "2px solid #47a1dd" : "2px dashed transparent",
                        backgroundColor: isHighlighted ? "#e6f7ff" : "transparent",
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (isUnlocked && !isHighlighted) {
                          e.currentTarget.style.backgroundColor = "#f0f8ff"
                          e.currentTarget.style.borderColor = "#47a1dd"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isUnlocked && !isHighlighted) {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "transparent"
                        }
                      }}
                      onClick={(e) => {
                        // Chỉ cho phép thao tác khi đã mở khoá
                        if (!isUnlocked) return

                        e.stopPropagation()
                        // Mở modal tạo lịch cho ngày được chọn
                        const selectedDate = new Date(record.date)
                        const startTime = new Date(selectedDate)
                        startTime.setHours(6, 0, 0, 0) // Đặt giờ mặc định 6:00 AM

                        const endTime = new Date(selectedDate)
                        endTime.setHours(7, 0, 0, 0) // Đặt giờ kết thúc 7:00 AM

                        onCreateEvent?.(startTime.toISOString(), endTime.toISOString())
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "14px",
                          marginBottom: 4,
                          color: (() => {
                            if (isHighlighted) return "#47a1dd"

                            const today = new Date()
                            const recordDate = new Date(record.date)
                            const isToday =
                              today.getDate() === recordDate.getDate() &&
                              today.getMonth() === recordDate.getMonth() &&
                              today.getFullYear() === recordDate.getFullYear()

                            return isToday ? "#47a1dd" : "#000"
                          })(),
                        }}
                      >
                        {record.dayName}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: (() => {
                            if (isHighlighted) return "#47a1dd"

                            const today = new Date()
                            const recordDate = new Date(record.date)
                            const isToday =
                              today.getDate() === recordDate.getDate() &&
                              today.getMonth() === recordDate.getMonth() &&
                              today.getFullYear() === recordDate.getFullYear()

                            return isToday ? "#47a1dd" : "#000"
                          })(),
                          fontWeight: "normal",
                        }}
                      >
                        {dateStr}
                      </div>
                      {/* Icon gợi ý cho việc thêm mới - chỉ hiển thị khi mở khoá */}
                      {isUnlocked && (
                        <div
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            fontSize: "10px",
                            color: "#47a1dd",
                            opacity: 0.7,
                          }}
                        >
                          <PlusOutlined />
                        </div>
                      )}
                    </div>
                  )
                },
                onCell: (record) => ({
                  rowSpan: record.dayRowspan,
                  style: {
                    verticalAlign: "middle",
                    padding: 0,
                    position: "relative",
                    height: record.dayRowspan === 1 ? "60px" : "auto",
                    minHeight: "60px",
                  },
                }),
              },
              {
                title: "Thời gian",
                key: "time",
                width: 140,
                align: "center",
                fixed: "left",
                render: (text, record) => {
                  if (!record.event) {
                    return "-"
                  }

                  if (record.isWeekRow) {
                    // Hiển thị logic mới cho hàng "Cả tuần"
                    const startTime = new Date(record.event?.startTime || weekStart)
                    const endTime = new Date(record.event?.endTime || weekEnd)
                    const pad = (n: number) => String(n).padStart(2, "0")
                    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
                    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`

                    // Kiểm tra nếu event đúng tròn 1 tuần (00:00 đầu tuần -> 23:59 cuối tuần)
                    const weekStartDate = new Date(weekStart)
                    weekStartDate.setHours(0, 0, 0, 0)
                    const weekEndDate = new Date(weekEnd)
                    weekEndDate.setHours(23, 59, 0, 0)
                    // Chấp nhận cả trường hợp endTime là 23:59:59 hoặc 23:59:00
                    const isFullWeek =
                      startTime.getTime() === weekStartDate.getTime() &&
                      endTime.getHours() === 23 &&
                      endTime.getMinutes() === 59 &&
                      endTime.getDate() === weekEndDate.getDate() &&
                      endTime.getMonth() === weekEndDate.getMonth() &&
                      endTime.getFullYear() === weekEndDate.getFullYear()

                    // Nếu là cả tuần
                    if (isFullWeek) {
                      return <span />
                    }

                    // Chỉ coi là full-day nếu event thật sự là cả ngày (00:00:00 đến 23:59:59)
                    const isFullDayRange =
                      startTime.getHours() === 0 &&
                      startTime.getMinutes() === 0 &&
                      startTime.getSeconds() === 0 &&
                      endTime.getHours() === 23 &&
                      endTime.getMinutes() === 59 &&
                      (endTime.getSeconds() === 59 || endTime.getSeconds() === 0)

                    if (isFullDayRange) {
                      // Nếu cùng ngày thì chỉ hiển thị 1 ngày, nếu khác ngày thì hiển thị range ngày
                      if (
                        startTime.getDate() === endTime.getDate() &&
                        startTime.getMonth() === endTime.getMonth() &&
                        startTime.getFullYear() === endTime.getFullYear()
                      ) {
                        return (
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            Cả ngày
                          </span>
                        )
                      }
                      return (
                        <span>
                          {formatDate(startTime)} - {formatDate(endTime)}
                        </span>
                      )
                    }

                    // Nếu không phải các trường hợp trên, hiển thị range ngày/giờ như cũ
                    return (
                      <div style={{ whiteSpace: "nowrap" }}>
                        {formatDate(startTime)} - {formatDate(endTime)}
                        <br />
                        {formatTime(startTime)} - {formatTime(endTime)}
                      </div>
                    )
                  }

                  if (record.isMultiDayRow) {
                    // Hiển thị thời gian cho hàng multi-day
                    const event = record.event

                    // Sử dụng thời gian gốc nếu là multi-week event
                    const originalStartTime = event.originalStartTime
                      ? new Date(event.originalStartTime)
                      : new Date(event.startTime)
                    const originalEndTime = event.originalEndTime
                      ? new Date(event.originalEndTime)
                      : new Date(event.endTime)
                    const currentStartTime = new Date(event.startTime)
                    const currentEndTime = new Date(event.endTime)

                    const formatTime = (d: Date) =>
                      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                    const formatDate = (d: Date) =>
                      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`

                    // Nếu là multi-week event, hiển thị thông tin chi tiết hơn
                    if (event.isMultiWeekEvent) {
                      const isFullDayOriginal =
                        originalStartTime.getHours() === 0 &&
                        originalStartTime.getMinutes() === 0 &&
                        originalStartTime.getSeconds() === 0 &&
                        originalEndTime.getHours() === 23 &&
                        originalEndTime.getMinutes() === 59 &&
                        (originalEndTime.getSeconds() === 59 || originalEndTime.getSeconds() === 0)

                      if (isFullDayOriginal) {
                        return (
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              fontSize: "14x",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#fa8c16",
                              }}
                            >
                              {formatDate(originalStartTime)} - {formatDate(originalEndTime)}
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div
                          style={{
                            whiteSpace: "nowrap",
                            fontSize: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              color: "#fa8c16",
                            }}
                          >
                            {formatDate(originalStartTime)} - {formatDate(originalEndTime)}
                          </div>
                          <div
                            style={{
                              fontWeight: "bold",
                              color: "#fa8c16",
                              marginTop: "2px",
                            }}
                          >
                            {formatTime(originalStartTime)} - {formatTime(originalEndTime)}
                          </div>
                        </div>
                      )
                    }
                    // Multi-day event thường trong 1 tuần
                    const isFullDay =
                      currentStartTime.getHours() === 0 &&
                      currentStartTime.getMinutes() === 0 &&
                      currentStartTime.getSeconds() === 0 &&
                      currentEndTime.getHours() === 23 &&
                      currentEndTime.getMinutes() === 59 &&
                      (currentEndTime.getSeconds() === 59 || currentEndTime.getSeconds() === 0)

                    if (isFullDay) {
                      return `${formatDate(currentStartTime)} - ${formatDate(currentEndTime)}`
                    }
                    return `${formatTime(currentStartTime)} - ${formatTime(currentEndTime)}`
                  }

                  // Các hàng thông thường
                  const event = record.event
                  const startTime = new Date(event.startTime)
                  const endTime = new Date(event.endTime)
                  const pad = (n: number) => String(n).padStart(2, "0")
                  const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
                  // Chỉ coi là full-day nếu event thật sự là cả ngày (00:00:00 đến 23:59:59)
                  // Không áp dụng cho events có thời gian cụ thể
                  const isFullDayRange =
                    startTime.getHours() === 0 &&
                    startTime.getMinutes() === 0 &&
                    startTime.getSeconds() === 0 &&
                    endTime.getHours() === 23 &&
                    endTime.getMinutes() === 59 &&
                    (endTime.getSeconds() === 59 || endTime.getSeconds() === 0)

                  if (isFullDayRange) {
                    if (
                      startTime.getDate() === endTime.getDate() &&
                      startTime.getMonth() === endTime.getMonth() &&
                      startTime.getFullYear() === endTime.getFullYear()
                    ) {
                      return (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#1890ff",
                          }}
                        >
                          Cả ngày
                        </span>
                      )
                    }
                    return (
                      <span>
                        {formatDate(startTime)} - {formatDate(endTime)}
                      </span>
                    )
                  }

                  const timeRange = `${startTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${endTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`

                  return timeRange
                },
              },
              {
                title: "Môn học",
                key: "content",
                align: "left",
                width: 300,
                render: (text, record) => {
                  if (!record.event) {
                    return (
                      <span
                        style={{
                          color: "#ccc",
                          fontStyle: "italic",
                        }}
                      >
                        {record.isWeekRow ? "Không có sự kiện trong tuần" : "Không có sự kiện"}
                      </span>
                    )
                  }

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {record.event.color && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: record.event.color,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span>{record.event.content}</span>
                    </div>
                  )
                },
              },
              {
                title: "Giảng viên/Người phụ trách",
                key: "host",
                width: 250,
                align: "center",
                render: (text, record) => {
                  if (!record.event) {
                    return "-"
                  }
                  const hostItems = record.event.hostProfile
                    .map((item: any) => item.fullname)
                    .filter(Boolean)
                    .join(", ")
                  return hostItems
                },
              },
              {
                title: "Thành phần",
                key: "attendees",
                width: 250,
                align: "center",
                render: (text, record) => {
                  if (!record.event) {
                    return "-"
                  }
                  return record?.event?.attendeesProfile?.length
                    ? `${record.event.attendeesProfile.length} học viên`
                    : "-"
                },
              },
              {
                title: "Địa điểm",
                key: "location",
                width: 250,
                align: "center",
                render: (text, record) => {
                  if (!record.event) {
                    return "-"
                  }

                  return record.event.location
                },
              },
              {
                title: "Ghi chú",
                key: "note",
                width: 250,
                align: "center",
                render: (text, record) => {
                  if (!record.event?.note) {
                    return "-"
                  }
                  return ""
                },
              },
            ]}
            dataSource={weeklySchedule.flatData}
            pagination={false}
            size="small"
            showHeader={true}
          />
        </Col>
      </Row>
    </div>
  )
}

export { TableWeekCalendar as default }
export type { EventData, TableWeekCalendarProps }
