import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { Button, Space } from "antd"
import moment from "moment"
import "moment/locale/vi"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Calendar,
  type Event,
  momentLocalizer,
  type NavigateAction,
  type View,
  Views,
} from "react-big-calendar"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./style.css"
import { cn } from "@workspace/ui/lib/utils"

// Set Vietnamese locale
moment.locale("vi")

const localizer = momentLocalizer(moment)

// Vietnamese messages for calendar
const messages = {
  allDay: "Cả ngày",
  previous: "Trước",
  next: "Tiếp",
  today: "Hôm nay",
  month: "Tháng",
  week: "Tuần",
  day: "Ngày",
  agenda: "Lịch trình",
  date: "Ngày",
  time: "Thời gian",
  event: "Sự kiện",
  noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
  showMore: (total: number) => `+ ${total} sự kiện`,
}

// Custom calendar event interface
export interface CustomCalendarEvent extends Event {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  description?: string
  location?: string
  host?: string
  attendees?: string
  allDay?: boolean
  subjectClassId?: string
}

interface ReactBigCalendarCustomProps {
  events?: CustomCalendarEvent[]
  onSelectEvent?: (event: CustomCalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => void
  onDoubleClickEvent?: (event: CustomCalendarEvent) => void
  onChange?: (date: Date) => void
  style?: React.CSSProperties
  className?: string
  height?: number | string
  defaultView?: "month" | "week" | "day" | "agenda"
  filterDate?: Date
}

const ReactBigCalendarCustom: React.FC<ReactBigCalendarCustomProps> = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  onDoubleClickEvent,
  onChange,
  style,
  className,
  height = 600,
  defaultView = "month",
  filterDate,
}) => {
  // State for calendar navigation and view
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>(defaultView as View)
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null)
  const [originalDay, setOriginalDay] = useState<number | null>(null) // Track original day for navigation

  // Effect để theo dõi filterDate và navigate calendar đến ngày đó
  useEffect(() => {
    if (filterDate && filterDate instanceof Date && !Number.isNaN(filterDate.getTime())) {
      setCurrentDate(filterDate)
      setHighlightedDate(filterDate)
      setOriginalDay(filterDate.getDate()) // Store the original day
    } else {
      setHighlightedDate(null)
      setOriginalDay(null)
    }
  }, [filterDate])

  // Initialize originalDay with today's day if no filterDate is provided
  useEffect(() => {
    if (!filterDate && originalDay === null) {
      setOriginalDay(new Date().getDate())
    }
  }, [filterDate, originalDay])

  useEffect(() => {
    if (currentView === Views.DAY || currentView === Views.WEEK) {
      setTimeout(() => {
        // const section = document.querySelector('#time-gutter-6')
        // section?.scrollIntoView({
        //     behavior: 'instant',
        //     block: 'start',
        //     inline: 'nearest',
        // })
      }, 0)
    }
  }, [currentView])

  // Helper function to get safe day for target month
  const getSafeDayForMonth = useCallback((targetDate: Date, originalDayNumber: number) => {
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    // Get the last day of the target month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

    // Use the original day or the last day of month, whichever is smaller
    const safeDay = Math.min(originalDayNumber, lastDayOfMonth)

    return new Date(year, month, safeDay)
  }, [])

  // Helper function to check if two dates are the same day
  const isSameDay = useCallback((date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }, [])

  // Helper function to add/subtract months
  const addMonths = useCallback((date: Date, months: number) => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + months)
    return newDate
  }, [])

  // Helper function to add/subtract weeks
  const addWeeks = useCallback((date: Date, weeks: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + weeks * 7)
    return newDate
  }, [])

  // Helper function to add/subtract days
  const addDays = useCallback((date: Date, days: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)
    return newDate
  }, [])

  // Helper function to get start of week
  const getStartOfWeek = useCallback((date: Date) => {
    const newDate = new Date(date)
    const day = newDate.getDay()
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(newDate.setDate(diff))
  }, [])

  // Helper function to get end of week
  const getEndOfWeek = useCallback(
    (date: Date) => {
      const startOfWeek = getStartOfWeek(date)
      return addDays(startOfWeek, 6)
    },
    [getStartOfWeek, addDays]
  )

  // Helper function to check if date is between two dates
  const isBetween = useCallback((date: Date, start: Date, end: Date) => {
    return date >= start && date <= end
  }, [])

  // Get current label for toolbar
  const getCurrentLabel = useCallback(() => {
    switch (currentView) {
      case Views.MONTH:
        return moment(currentDate).format("[Tháng] M [năm] YYYY")
      case Views.WEEK: {
        const start = moment(currentDate).startOf("week")
        const end = moment(currentDate).endOf("week")
        const weekNumber = moment(currentDate).week()
        return `${start.format("DD/MM")} - ${end.format("DD/MM/YYYY")} (Tuần ${weekNumber})`
      }
      case Views.DAY:
        return moment(currentDate).format("dddd, DD MMMM [năm] YYYY")
      default:
        return moment(currentDate).format("MMMM YYYY")
    }
  }, [currentDate, currentView])

  // Handle navigation
  const handleNavigate = useCallback(
    (action: NavigateAction) => {
      switch (action) {
        case "PREV":
          setCurrentDate((prev) => {
            let newDate: Date
            switch (currentView) {
              case Views.MONTH: {
                newDate = addMonths(prev, -1)

                // If we have an original day to maintain, set highlighted date
                if (originalDay !== null) {
                  const highlightDate = getSafeDayForMonth(newDate, originalDay)
                  setHighlightedDate(highlightDate)
                }
                break
              }
              case Views.WEEK:
                newDate = addWeeks(prev, -1)
                // For week view, maintain the highlighted date if it exists
                if (originalDay !== null) {
                  const weekStart = getStartOfWeek(newDate)
                  const targetDate = getSafeDayForMonth(weekStart, originalDay)
                  // Check if the target date is within the current week
                  const weekEnd = getEndOfWeek(newDate)
                  if (isBetween(targetDate, weekStart, weekEnd)) {
                    setHighlightedDate(targetDate)
                  } else {
                    setHighlightedDate(null)
                  }
                }
                break
              case Views.DAY:
                newDate = addDays(prev, -1)
                setHighlightedDate(newDate) // In day view, always highlight the current day
                break
              default:
                newDate = addMonths(prev, -1)
                if (originalDay !== null) {
                  const highlightDate = getSafeDayForMonth(newDate, originalDay)
                  setHighlightedDate(highlightDate)
                }
            }
            onChange?.(newDate)
            return newDate
          })
          break
        case "NEXT":
          setCurrentDate((prev) => {
            let newDate: Date
            switch (currentView) {
              case Views.MONTH: {
                newDate = addMonths(prev, 1)

                // If we have an original day to maintain, set highlighted date
                if (originalDay !== null) {
                  const highlightDate = getSafeDayForMonth(newDate, originalDay)
                  setHighlightedDate(highlightDate)
                }
                break
              }
              case Views.WEEK:
                newDate = addWeeks(prev, 1)
                // For week view, maintain the highlighted date if it exists
                if (originalDay !== null) {
                  const weekStart = getStartOfWeek(newDate)
                  const targetDate = getSafeDayForMonth(weekStart, originalDay)
                  // Check if the target date is within the current week
                  const weekEnd = getEndOfWeek(newDate)
                  if (isBetween(targetDate, weekStart, weekEnd)) {
                    setHighlightedDate(targetDate)
                  } else {
                    setHighlightedDate(null)
                  }
                }
                break
              case Views.DAY:
                newDate = addDays(prev, 1)
                setHighlightedDate(newDate) // In day view, always highlight the current day
                break
              default:
                newDate = addMonths(prev, 1)
                if (originalDay !== null) {
                  const highlightDate = getSafeDayForMonth(newDate, originalDay)
                  setHighlightedDate(highlightDate)
                }
            }
            onChange?.(newDate)
            return newDate
          })
          break
        case "TODAY": {
          const today = new Date()
          setCurrentDate(today)
          setHighlightedDate(today)
          setOriginalDay(today.getDate()) // Update original day to today
          onChange?.(today)
          break
        }
      }
    },
    [
      currentView,
      onChange,
      originalDay,
      getSafeDayForMonth,
      addMonths,
      addWeeks,
      addDays,
      getStartOfWeek,
      getEndOfWeek,
      isBetween,
    ]
  )

  // Handle calendar navigation (when user clicks on dates)
  const handleCalendarNavigate = useCallback(
    (date: Date) => {
      setCurrentDate(date)
      setHighlightedDate(date)
      setOriginalDay(date.getDate()) // Update original day when user clicks on a date
      onChange?.(date)
    },
    [onChange]
  )

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view)
  }, [])

  const isLightColor = useCallback((color: string) => {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6
  }, [])

  const EventComponent = useCallback(
    ({ event }: { event: CustomCalendarEvent }) => {
      const backgroundColor = event.color || "#47a1dd"
      const textColor = isLightColor(backgroundColor) ? "#000000" : "#ffffff"

      if (currentView === Views.MONTH) {
        return (
          <span
            style={{
              color: textColor,
              fontSize: "12px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              width: "100%",
            }}
          >
            {event.title}
          </span>
        )
      }

      if (currentView === Views.WEEK) {
        return (
          <div
            style={{
              color: textColor,
              fontSize: "10px",
              fontWeight: 400,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
              padding: "2px",
              lineHeight: 1.1,
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "1px",
                flexShrink: 0,
              }}
            >
              {event.title}
            </div>
          </div>
        )
      }

      return (
        <div
          style={{
            color: textColor,
            fontSize: "10px",
            fontWeight: 400,
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            height: "100%",
            width: "100%",
            padding: "2px",
            lineHeight: 1.1,
            gap: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: "1px",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {event.title}
            </div>
          </div>

          {/* Right column: Description - only for longer events */}
          {event.description && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "flex-start",
                minWidth: "0",
                maxHeight: "100%",
                borderLeft: `1px solid ${
                  isLightColor(backgroundColor) ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"
                }`,
                paddingLeft: "4px",
                marginLeft: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.85,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                Ghi chú: {event.description}
              </div>
            </div>
          )}
        </div>
      )
    },
    [currentView, isLightColor]
  )

  // Format event times
  const formats = useMemo(
    () => ({
      timeGutterFormat: "HH:mm",
      eventTimeRangeFormat: (
        { start, end }: { start: Date; end: Date },
        culture?: string,
        localizer?: any
      ) =>
        `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(end, "HH:mm", culture)}`,
      agendaTimeFormat: "HH:mm",
      agendaTimeRangeFormat: (
        { start, end }: { start: Date; end: Date },
        culture?: string,
        localizer?: any
      ) =>
        `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(end, "HH:mm", culture)}`,
      dayHeaderFormat: "dddd DD/MM",
      weekdayFormat: "dddd DD/MM",
      monthHeaderFormat: "dddd", // Only show weekday name for month view
      dayRangeHeaderFormat: ({ start }: { start: Date }, culture?: string, localizer?: any) =>
        localizer.format(start, "dddd", culture), // Only show weekday name for month view
    }),
    []
  )

  // Handle slot selection
  const handleSelectSlot = useCallback(
    (slotInfo: any) => {
      if (onSelectSlot) {
        // Xử lý thời gian để end time là 23:59 của cùng ngày thay vì 00:00 của ngày hôm sau
        const { start, end, slots, action } = slotInfo
        let adjustedEnd = end

        // Check if end time is 00:00 and is the next day
        const endHours = end.getHours()
        const endMinutes = end.getMinutes()
        const startDate = start.getDate()
        const endDate = end.getDate()

        if (endHours === 0 && endMinutes === 0 && endDate > startDate) {
          // Set to 23:59 of the same day as start
          adjustedEnd = new Date(end)
          adjustedEnd.setMinutes(adjustedEnd.getMinutes() - 1)
        }

        const adjustedSlotInfo = {
          start,
          end: adjustedEnd,
          slots,
          action,
        }

        onSelectSlot(adjustedSlotInfo)
      }
    },
    [onSelectSlot]
  )

  // Handle event selection
  const handleSelectEvent = useCallback(
    (event: CustomCalendarEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event)
      }
    },
    [onSelectEvent]
  )

  // Handle double click event
  const handleDoubleClickEvent = useCallback(
    (event: CustomCalendarEvent) => {
      if (onDoubleClickEvent) {
        onDoubleClickEvent(event)
      }
    },
    [onDoubleClickEvent]
  )

  // Event prop getter for custom styling
  const eventPropGetter = useCallback(
    (event: CustomCalendarEvent) => {
      const backgroundColor = event.color || "#47a1dd"
      const isLight = isLightColor(backgroundColor)
      const textColor = isLight ? "#000000" : "#ffffff"

      // Only add border for week and day views, keep month view clean
      const isTimeView = currentView === Views.WEEK || currentView === Views.DAY

      // Use dark border for light colors, light border for dark colors
      const borderColor = isLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)"

      return {
        style: {
          backgroundColor,
          borderColor: isTimeView ? borderColor : backgroundColor,
          color: textColor,
          border: isTimeView ? `0.5px solid ${borderColor}` : "none",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 500,
          boxShadow: isTimeView ? "0 1px 2px rgba(0, 0, 0, 0.15)" : "none",
          "--event-color": backgroundColor,
          "--event-label-bg": isLight ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
          "--event-label-border": isLight ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)",
        } as React.CSSProperties & {
          "--event-color": string
          "--event-label-bg": string
          "--event-label-border": string
        },
        className: "custom-event-with-color",
      }
    },
    [currentView, isLightColor]
  )

  // Custom week header component
  const WeekHeaderComponent = useCallback(
    ({ date }: { date: Date; localizer: any }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const dayName = moment(date).format("dddd")
      const dayNumber = moment(date).format("DD/MM")

      const handleDateClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentDate(date)
        setHighlightedDate(date)
        setOriginalDay(date.getDate())
        onChange?.(date)
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1.2,
            width: "100%",
            height: "100%",
            justifyContent: "center",
            padding: "4px 8px",
            color: isToday ? "#1890ff" : isHighlighted ? "#ff4d4f" : "#262626",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onClick={handleDateClick}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: isHighlighted && !isToday ? "#ff4d4f" : "#595959",
              marginBottom: "4px",
            }}
          >
            {dayName}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: isToday ? 700 : isHighlighted ? 700 : 600,
              color: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "#262626",
              backgroundColor: isToday ? "rgba(71, 161, 221, 0.1)" : "transparent",
              borderRadius: isToday ? "6px" : "0",
              padding: isToday ? "2px 6px" : "0",
            }}
          >
            {dayNumber}
          </span>
        </div>
      )
    },
    [highlightedDate, onChange, isSameDay]
  )

  // Custom day header component
  const DayHeaderComponent = useCallback(
    ({ date }: { date: Date; localizer: any }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const dayLabel = moment(date).format("dddd, DD MMMM YYYY")

      const handleDateClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentDate(date)
        setHighlightedDate(date)
        setOriginalDay(date.getDate())
        onChange?.(date)
      }

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontSize: "16px",
            fontWeight: isToday ? 700 : isHighlighted ? 700 : 600,
            color: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "#262626",
            backgroundColor:
              isHighlighted && !isToday
                ? "rgba(255, 77, 79, 0.1)"
                : isToday
                  ? "rgba(71, 161, 221, 0.1)"
                  : "transparent",
            borderRadius: isHighlighted || isToday ? "8px" : "0",
            border:
              isHighlighted && !isToday
                ? "2px solid rgba(255, 77, 79, 0.3)"
                : isToday
                  ? "2px solid rgba(71, 161, 221, 0.3)"
                  : "2px solid transparent",
            padding: "8px 16px",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onClick={handleDateClick}
        >
          {dayLabel}
        </div>
      )
    },
    [highlightedDate, onChange, isSameDay]
  )
  const MonthHeaderComponent = useCallback(({ date }: { date: Date; localizer: any }) => {
    const dayName = moment(date).format("dddd")

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontSize: "13px",
          fontWeight: 600,
          color: "#262626",
        }}
      >
        {dayName}
      </div>
    )
  }, [])

  // Custom date cell component for month view
  const MonthDateCellComponent = useCallback(
    ({ date }: { date: Date }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const dayNumber = date.getDate().toString()

      const handleDateClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentDate(date)
        setHighlightedDate(date)
        setOriginalDay(date.getDate())
        onChange?.(date)
      }

      return (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "4px",
          }}
          onClick={handleDateClick}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: isToday || isHighlighted ? 600 : 400,
              color: isToday ? "#fff" : isHighlighted ? "#fff" : "#262626",
              backgroundColor: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "transparent",
              borderRadius: isToday || isHighlighted ? "50%" : "0",
              width: isToday || isHighlighted ? "24px" : "auto",
              height: isToday || isHighlighted ? "24px" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: isToday || isHighlighted ? "24px" : "auto",
              zIndex: 1,
              position: "relative",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            {dayNumber}
          </span>
        </div>
      )
    },
    [highlightedDate, onChange, isSameDay]
  )

  return (
    <div
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      className={className}
    >
      {/* External Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "0",
          background: "transparent",
          border: "none",
        }}
      >
        {/* Navigation */}
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigate("PREV")}
            style={{ display: "flex", alignItems: "center" }}
          />
          <Button onClick={() => handleNavigate("TODAY")} type="primary">
            Hôm nay
          </Button>
          <Button
            icon={<ArrowRightOutlined />}
            onClick={() => handleNavigate("NEXT")}
            iconPosition="end"
            style={{ display: "flex", alignItems: "center" }}
          />
        </Space>

        {/* Current date/period label */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#262626",
          }}
        >
          {getCurrentLabel()}
        </div>

        {/* View switcher */}
        <Space>
          <Button
            type={currentView === Views.MONTH ? "primary" : "default"}
            onClick={() => handleViewChange(Views.MONTH)}
          >
            Tháng
          </Button>
          <Button
            type={currentView === Views.WEEK ? "primary" : "default"}
            onClick={() => handleViewChange(Views.WEEK)}
          >
            Tuần
          </Button>
          <Button
            type={currentView === Views.DAY ? "primary" : "default"}
            onClick={() => handleViewChange(Views.DAY)}
          >
            Ngày
          </Button>
          {/* todo: bỏ view lịch trình */}
          <Button
            type={currentView === Views.AGENDA ? "primary" : "default"}
            onClick={() => handleViewChange(Views.AGENDA)}
            style={{ display: "none" }} // Hide agenda view for now
          >
            Lịch trình
          </Button>
        </Space>
      </div>

      {/* Calendar */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100% - 60px)" }}
        messages={messages}
        formats={formats}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={currentView}
        date={currentDate}
        onNavigate={handleCalendarNavigate}
        onView={setCurrentView}
        step={30}
        timeslots={2}
        showMultiDayTimes
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onDoubleClickEvent={handleDoubleClickEvent}
        dayLayoutAlgorithm="overlap"
        scrollToTime={new Date(new Date().setHours(6, 0, 0, 0))}
        enableAutoScroll
        components={{
          event: EventComponent,
          toolbar: () => null, // Disable default toolbar
          week: {
            header: WeekHeaderComponent,
          },
          day: {
            header: DayHeaderComponent,
          },
          month: {
            header: MonthHeaderComponent,
            dateHeader: MonthDateCellComponent,
          },
          timeGutterHeader: () => <span className="w-[40px] text-center">Lịch tuần</span>, // Disable time gutter header
          timeGutterWrapper: (e: any) => {
            return (
              <span className={cn(e.children.props.className, "text-center w-[40px]")}>
                {e.children.props.children.map((child: any, idx: number) => (
                  <span key={child.key} id={`time-gutter-${child.key}`}>
                    {child}
                  </span>
                ))}
              </span>
            )
          }, // Disable time gutter wrapper
        }}
        culture="vi"
        eventPropGetter={eventPropGetter}
      />
    </div>
  )
}

export default ReactBigCalendarCustom
export { ReactBigCalendarCustom }
export type { ReactBigCalendarCustomProps }
