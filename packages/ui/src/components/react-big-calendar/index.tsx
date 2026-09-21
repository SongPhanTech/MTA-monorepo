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
  /** Event giả trên view Tháng: dòng "+ N sự kiện" */
  isShowMore?: boolean
  moreEvents?: CustomCalendarEvent[]
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
  /** Thu hẹp ô/padding giống lịch nhỏ — dùng khi card thấp */
  compact?: boolean
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
  compact = false,
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

  // Tháng: chỉ hiện môn thuộc đúng tháng đang xem (ẩn ngày tháng trước/sau)
  const visibleEvents = useMemo(() => {
    if (currentView !== Views.MONTH) return events
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()
    return events.filter((e) => {
      if (!e.start) return false
      return e.start.getMonth() === month && e.start.getFullYear() === year
    })
  }, [events, currentView, currentDate])

  /**
   * View Tháng ở chế độ compact (card thấp): mỗi ngày chỉ 1 sự kiện thật.
   * Phần còn lại → link "+ N sự kiện" (đặt SAU event thật để nằm dưới, giống rbc-show-more).
   * Lịch full-size giữ nguyên toàn bộ sự kiện.
   */
  const monthCappedEvents = useMemo(() => {
    if (!compact || currentView !== Views.MONTH) return visibleEvents

    const byDay = new Map<string, CustomCalendarEvent[]>()
    for (const e of visibleEvents) {
      if (!e.start || e.isShowMore) continue
      const key = moment(e.start).format("YYYY-MM-DD")
      const list = byDay.get(key) ?? []
      list.push(e)
      byDay.set(key, list)
    }

    const capped: CustomCalendarEvent[] = []
    for (const [, list] of byDay) {
      list.sort((a, b) => a.start.getTime() - b.start.getTime())
      const first = list[0]
      if (!first) continue
      capped.push(first)
      if (list.length > 1) {
        // Neo sau event đầu → RBC xếp hàng dưới thẻ, không đè lên trên.
        // Clamp trong ngày của event đầu để event qua nửa đêm không đẩy link sang ô ngày khác.
        const dayEnd = moment(first.start).endOf("day")
        const moreStart = moment
          .min(moment(first.end ?? first.start).add(1, "minute"), dayEnd)
          .toDate()
        capped.push({
          id: `__more__${moment(first.start).format("YYYY-MM-DD")}`,
          title: `+ ${list.length - 1} sự kiện`,
          start: moreStart,
          end: moment.min(moment(moreStart).add(1, "minute"), dayEnd).toDate(),
          allDay: false,
          isShowMore: true,
          moreEvents: list,
          color: "transparent",
        })
      }
    }
    return capped
  }, [visibleEvents, currentView, compact])

  const isLightColor = useCallback((color: string) => {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6
  }, [])

  // hex → rgba; chỉ cover #RRGGBB (đủ cho color event hiện tại)
  const hexToRgba = useCallback((color: string, alpha: number) => {
    const hex = color.replace("#", "")
    if (hex.length !== 6) return color
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }, [])

  const EventComponent = useCallback(
    ({ event }: { event: CustomCalendarEvent }) => {
      if (event.isShowMore) {
        return (
          <button type="button" className="rbc-button-link rbc-show-more">
            {event.title}
          </button>
        )
      }

      const backgroundColor = event.color || "#47a1dd"
      const textColor = isLightColor(backgroundColor) ? "#000000" : "#ffffff"
      const timeRange =
        event.start && event.end
          ? `${moment(event.start).format("HH:mm")} - ${moment(event.end).format("HH:mm")}`
          : ""

      if (currentView === Views.MONTH) {
        const startTime = event.start ? moment(event.start).format("HH:mm") : ""
        return (
          <span
            style={{
              color: textColor,
              fontSize: compact ? "10px" : "12px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              width: "100%",
            }}
          >
            {startTime ? `${startTime} ${event.title}` : event.title}
          </span>
        )
      }

      // Tuần / Ngày: title → giờ → địa điểm, căn giữa dọc
      const titleSize = compact ? "10px" : "12px"
      const metaSize = compact ? "9px" : "11px"
      const metaStyle: React.CSSProperties = {
        fontSize: metaSize,
        fontWeight: 400,
        opacity: 0.75,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }

      return (
        <div
          style={{
            color: textColor,
            fontSize: metaSize,
            fontWeight: 400,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            padding: compact ? "1px" : "2px",
            lineHeight: 1.2,
            gap: "1px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: titleSize,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {event.title}
          </div>
          {timeRange ? <div style={metaStyle}>{timeRange}</div> : null}
          {event.location && !compact ? <div style={metaStyle}>{event.location}</div> : null}
        </div>
      )
    },
    [currentView, isLightColor, compact]
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
      // "+ N sự kiện" — chuyển sang xem Ngày (giống drill-down mặc định của RBC).
      // Lấy ngày từ event thật đầu tiên, vì start của link đã bị clamp theo cuối ngày.
      if (event.isShowMore) {
        const targetDate = event.moreEvents?.[0]?.start ?? event.start
        setCurrentDate(targetDate)
        setHighlightedDate(targetDate)
        setOriginalDay(targetDate.getDate())
        setCurrentView(Views.DAY)
        onChange?.(targetDate)
        return
      }
      if (onSelectEvent) {
        onSelectEvent(event)
      }
    },
    [onSelectEvent, onChange]
  )

  // Handle double click event
  const handleDoubleClickEvent = useCallback(
    (event: CustomCalendarEvent) => {
      if (event.isShowMore) return
      if (onDoubleClickEvent) {
        onDoubleClickEvent(event)
      }
    },
    [onDoubleClickEvent]
  )

  // Event prop getter for custom styling
  const eventPropGetter = useCallback(
    (event: CustomCalendarEvent) => {
      if (event.isShowMore) {
        return {
          style: {
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
            padding: 0,
            margin: 0,
            minHeight: 0,
            height: "auto",
          } as React.CSSProperties,
          className: "rbc-month-more-event",
        }
      }

      const backgroundColor = event.color || "#47a1dd"
      const isLight = isLightColor(backgroundColor)
      const textColor = isLight ? "#000000" : "#ffffff"

      return {
        style: {
          // Nền trong suốt; không viền — giống Tháng
          backgroundColor: hexToRgba(backgroundColor, 0.72),
          borderColor: "transparent",
          color: textColor,
          border: "none",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: "none",
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
    [isLightColor, hexToRgba]
  )

  // Custom week header component
  const WeekHeaderComponent = useCallback(
    ({ date }: { date: Date; localizer: any }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const raw = moment(date).format("dddd DD/MM")
      const dayLabel = raw.charAt(0).toUpperCase() + raw.slice(1)

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
            color: isToday ? "#1890ff" : isHighlighted ? "#ff4d4f" : "#262626",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onClick={handleDateClick}
        >
          <span
            style={{
              fontSize: compact ? "11px" : "13px",
              fontWeight: isToday ? 700 : isHighlighted ? 700 : 600,
              color: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "#262626",
              backgroundColor: isToday ? "rgba(71, 161, 221, 0.1)" : "transparent",
              borderRadius: isToday ? "6px" : "0",
              padding: isToday ? (compact ? "1px 4px" : "2px 6px") : "0",
              whiteSpace: "nowrap",
            }}
          >
            {dayLabel}
          </span>
        </div>
      )
    },
    [highlightedDate, onChange, isSameDay, compact]
  )

  // Custom day header component
  const DayHeaderComponent = useCallback(
    ({ date }: { date: Date; localizer: any }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const dayLabel = compact
        ? moment(date).format("dddd, DD/MM")
        : moment(date).format("dddd, DD MMMM YYYY")

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
            fontSize: compact ? "12px" : "16px",
            fontWeight: isToday ? 700 : isHighlighted ? 700 : 600,
            color: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "#262626",
            backgroundColor:
              isHighlighted && !isToday
                ? "rgba(255, 77, 79, 0.1)"
                : isToday
                  ? "rgba(71, 161, 221, 0.1)"
                  : "transparent",
            borderRadius: isHighlighted || isToday ? (compact ? "4px" : "8px") : "0",
            border:
              isHighlighted && !isToday
                ? "2px solid rgba(255, 77, 79, 0.3)"
                : isToday
                  ? "2px solid rgba(71, 161, 221, 0.3)"
                  : "2px solid transparent",
            padding: compact ? "2px 6px" : "8px 16px",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onClick={handleDateClick}
        >
          {dayLabel}
        </div>
      )
    },
    [highlightedDate, onChange, isSameDay, compact]
  )
  const MonthHeaderComponent = useCallback(
    ({ date }: { date: Date; localizer: any }) => {
      const dayName = moment(date).format("dddd")

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontSize: compact ? "11px" : "13px",
            fontWeight: 600,
            color: "#262626",
          }}
        >
          {dayName}
        </div>
      )
    },
    [compact]
  )

  // Custom date cell component for month view
  const MonthDateCellComponent = useCallback(
    ({ date }: { date: Date }) => {
      const today = new Date()
      const isToday = isSameDay(date, today)
      const isHighlighted = highlightedDate && isSameDay(date, highlightedDate)
      const dayNumber = date.getDate().toString()
      const markSize = compact ? 18 : 24

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
            padding: compact ? "1px 2px" : "4px",
          }}
          onClick={handleDateClick}
        >
          <span
            style={{
              fontSize: compact ? "11px" : "14px",
              fontWeight: isToday || isHighlighted ? 600 : 400,
              color: isToday ? "#fff" : isHighlighted ? "#fff" : "#262626",
              backgroundColor: isToday ? "#47a1dd" : isHighlighted ? "#ff4d4f" : "transparent",
              borderRadius: isToday || isHighlighted ? "50%" : "0",
              width: isToday || isHighlighted ? markSize : "auto",
              height: isToday || isHighlighted ? markSize : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: isToday || isHighlighted ? markSize : "auto",
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
    [highlightedDate, onChange, isSameDay, compact]
  )

  return (
    <div
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      className={cn(compact && "rbc-compact", className)}
    >
      {/* External Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: compact ? "8px" : "16px",
          padding: "0",
          background: "transparent",
          border: "none",
          flexShrink: 0,
        }}
      >
        {/* Navigation */}
        <Space size={compact ? 4 : undefined}>
          <Button
            size={compact ? "small" : "middle"}
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigate("PREV")}
            style={{ display: "flex", alignItems: "center" }}
          />
          <Button
            size={compact ? "small" : "middle"}
            onClick={() => handleNavigate("TODAY")}
            type="primary"
          >
            Hôm nay
          </Button>
          <Button
            size={compact ? "small" : "middle"}
            icon={<ArrowRightOutlined />}
            onClick={() => handleNavigate("NEXT")}
            iconPosition="end"
            style={{ display: "flex", alignItems: "center" }}
          />
        </Space>

        {/* Current date/period label */}
        <div
          style={{
            fontSize: compact ? "14px" : "18px",
            fontWeight: 600,
            color: "#262626",
          }}
        >
          {getCurrentLabel()}
        </div>

        {/* View switcher */}
        <Space size={compact ? 4 : undefined}>
          <Button
            size={compact ? "small" : "middle"}
            type={currentView === Views.MONTH ? "primary" : "default"}
            onClick={() => handleViewChange(Views.MONTH)}
          >
            Tháng
          </Button>
          <Button
            size={compact ? "small" : "middle"}
            type={currentView === Views.WEEK ? "primary" : "default"}
            onClick={() => handleViewChange(Views.WEEK)}
          >
            Tuần
          </Button>
          <Button
            size={compact ? "small" : "middle"}
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
        events={monthCappedEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: compact ? "calc(100% - 40px)" : "calc(100% - 60px)" }}
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
        min={new Date(1970, 0, 1, 6, 0, 0)}
        max={new Date(1970, 0, 1, 23, 59, 59)}
        scrollToTime={new Date(1970, 0, 1, 6, 0, 0)}
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
          timeGutterHeader: () => null,
          timeGutterWrapper: (e: any) => {
            return (
              <span
                className={cn(
                  e.children.props.className,
                  "text-center",
                  compact ? "w-[36px]" : "w-[40px]"
                )}
              >
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
