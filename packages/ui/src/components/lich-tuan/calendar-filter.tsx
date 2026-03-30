// @ts-nocheck
import { Calendar, Select } from "antd"
import { useEffect, useState } from "react"
import { dayjs } from ".."

interface EventData {
  date: string
  color: string
  title?: string
}

interface CalendarFilterProps {
  defaultDate?: dayjs.Dayjs
  value?: dayjs.Dayjs
  onChange?: (date: dayjs.Dayjs) => void
  events?: EventData[]
}

export const CalendarFilter: React.FC<CalendarFilterProps> = ({
  defaultDate,
  value,
  onChange,
  events = [],
}) => {
  const [yearOptions, setYearOptions] = useState(() => {
    const currentYear = dayjs().year()
    return Array.from({ length: 20 }, (_, i) => {
      const year = currentYear - 10 + i
      return { label: year.toString(), value: year }
    })
  })

  const [selectedDate, setSelectedDate] = useState(() => value || defaultDate || dayjs())

  useEffect(() => {
    if (value && !value.isSame(selectedDate)) {
      setSelectedDate(value)
    }
  }, [value, selectedDate])

  const getEventsForDate = (date: dayjs.Dayjs): EventData[] => {
    const dateStr = date.format("YYYY-MM-DD")
    return events.filter((event) => event.date === dateStr)
  }

  const dateCellRender = (date: dayjs.Dayjs) => {
    const dayEvents = getEventsForDate(date)
    if (dayEvents.length === 0) return null

    return (
      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 1,
          justifyContent: "center",
          maxWidth: "90%",
          width: "fit-content",
        }}
      >
        {dayEvents.slice(0, 3).map((event, index) => (
          <div
            key={`${event.date}-${index}`}
            title={event.title || "Event"}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: event.color,
              flexShrink: 0,
            }}
          />
        ))}
        {dayEvents.length > 3 && (
          <div
            title={`+${dayEvents.length - 3} more events`}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: "#999",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 6,
                color: "#fff",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              +
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Calendar
      fullscreen={false}
      value={selectedDate}
      onSelect={(date) => {
        setSelectedDate(date)
        onChange?.(date)
      }}
      dateCellRender={dateCellRender}
      headerRender={({ value, onChange }) => {
        const current = value.clone()

        const selectYear = (year: number) => {
          onChange(current.year(year))
        }

        const selectMonth = (month: number) => {
          onChange(current.month(month))
        }

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              padding: "18px 0px",
              paddingTop: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <Select
                showSearch
                value={current.month()}
                onChange={selectMonth}
                style={{ width: "100%" }}
                // dropdownStyle={{ textAlign: 'center' }}
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value !== undefined && Number.parseInt(input, 10) === option.value + 1)
                }
                options={[
                  "Tháng 1",
                  "Tháng 2",
                  "Tháng 3",
                  "Tháng 4",
                  "Tháng 5",
                  "Tháng 6",
                  "Tháng 7",
                  "Tháng 8",
                  "Tháng 9",
                  "Tháng 10",
                  "Tháng 11",
                  "Tháng 12",
                ].map((m, i) => ({
                  label: m, // giữ nguyên là string
                  value: i,
                }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                showSearch
                value={current.year()}
                onChange={selectYear}
                style={{ width: "100%" }}
                options={yearOptions}
                filterOption={(input, option) => {
                  const typed = input.toLowerCase()
                  return option?.label.toLowerCase().startsWith(typed) ?? false
                }}
                onSearch={(input) => {
                  const year = Number(input)
                  if (!Number.isNaN(year)) {
                    onChange(value.clone().year(year))
                    if (!yearOptions.some((opt) => opt.value === year)) {
                      setYearOptions((prev) => [
                        ...prev,
                        {
                          label: year.toString(),
                          value: year,
                        },
                      ])
                    }
                  }
                }}
              />
            </div>
          </div>
        )
      }}
    />
  )
}
