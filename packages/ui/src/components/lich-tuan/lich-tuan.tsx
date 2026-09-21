import { CalendarOutlined, TableOutlined } from "@ant-design/icons"
import { useSession } from "@workspace/auth/react"
import { STORAGE_KEY } from "@workspace/constant"
import { PeriodType, type Prisma, type UserProfile } from "@workspace/db"
import { useFindManyClassSchedule } from "@workspace/db/hooks"
import { useLocalStorage } from "@workspace/libs/hook/use-localstorage"
import { lightThemeCustom } from "@workspace/ui/assets/styles/theme/global-theme-custom"
import { Checkbox, Col, ConfigProvider, Modal, Row, Segmented } from "antd"
import viVN from "antd/locale/vi_VN"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { dayjs } from ".."
import ReactBigCalendarCustom, { type CustomCalendarEvent } from "../react-big-calendar"
import TableWeekCalendar from "../table-week-calendar"
import { CalendarFilter } from "./calendar-filter"

export const TYPE_WORK_SCHEDULE_COLOR_OPTIONS = [
  { label: "Lịch học lý thuyết", value: "#7bb3e6", type: PeriodType.THEORY },
  { label: "Lịch kiểm tra giảng dạy", value: "#b8e67b", type: PeriodType.CHECK },
  { label: "Lịch tuần học viện", value: "#c67be6", type: PeriodType.WEEK },
  { label: "Lịch thi", value: "#e699a8", type: PeriodType.EXAM },
  { label: "Lịch học thực hành", value: "#f5e080", type: PeriodType.PRACTICE },
  { label: "Lịch học thí nghiệm", value: "#f5b366", type: PeriodType.LAB },
]

export const PERIOD = {
  1: {
    startTime: dayjs().hour(7).minute(0),
    endTime: dayjs().hour(7).minute(45),
  },
  2: {
    startTime: dayjs().hour(7).minute(50),
    endTime: dayjs().hour(8).minute(35),
  },
  3: {
    startTime: dayjs().hour(8).minute(40),
    endTime: dayjs().hour(9).minute(25),
  },
  4: {
    startTime: dayjs().hour(9).minute(35),
    endTime: dayjs().hour(10).minute(20),
  },
  5: {
    startTime: dayjs().hour(10).minute(25),
    endTime: dayjs().hour(11).minute(10),
  },
  6: {
    startTime: dayjs().hour(11).minute(15),
    endTime: dayjs().hour(12).minute(0),
  },
  7: {
    startTime: dayjs().hour(12).minute(30),
    endTime: dayjs().hour(13).minute(15),
  },
  8: {
    startTime: dayjs().hour(13).minute(20),
    endTime: dayjs().hour(14).minute(5),
  },
  9: {
    startTime: dayjs().hour(14).minute(10),
    endTime: dayjs().hour(14).minute(55),
  },
  10: {
    startTime: dayjs().hour(15).minute(5),
    endTime: dayjs().hour(15).minute(50),
  },
  11: {
    startTime: dayjs().hour(15).minute(55),
    endTime: dayjs().hour(16).minute(40),
  },
  12: {
    startTime: dayjs().hour(16).minute(45),
    endTime: dayjs().hour(17).minute(30),
  },
  13: {
    startTime: dayjs().hour(18).minute(0),
    endTime: dayjs().hour(18).minute(45),
  },
  14: {
    startTime: dayjs().hour(18).minute(50),
    endTime: dayjs().hour(19).minute(35),
  },
  15: {
    startTime: dayjs().hour(19).minute(40),
    endTime: dayjs().hour(20).minute(25),
  },
  16: {
    startTime: dayjs().hour(20).minute(30),
    endTime: dayjs().hour(21).minute(15),
  },
  17: {
    startTime: dayjs().hour(21).minute(20),
    endTime: dayjs().hour(22).minute(5),
  },
  18: {
    startTime: dayjs().hour(22).minute(10),
    endTime: dayjs().hour(22).minute(55),
  },
}

// Utility functions
const isAllDayEvent = (startDate: Date, endDate: Date): boolean => {
  const isStartOfDay =
    startDate.getHours() === 0 && startDate.getMinutes() === 0 && startDate.getSeconds() === 0

  // Check if end is at 23:59 (any seconds) or 00:00:00 of next day
  const isEndOfDay =
    (endDate.getHours() === 23 && endDate.getMinutes() === 59) ||
    (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0)

  return isStartOfDay && isEndOfDay
}

const convertApiToCalendarEventReactBigCalendar = (
  apiData: Prisma.ClassScheduleGetPayload<{
    include: {
      subjectClass: {
        select: {
          id: true
          name: true
          code: true
          room: true
          mainLecturer: {
            select: {
              userProfile: {
                select: {
                  id: true
                  fullname: true
                  firstName: true
                  lastName: true
                }
              }
            }
          }
          extraLecturer: {
            select: {
              userProfile: {
                select: {
                  id: true
                  fullname: true
                  firstName: true
                  lastName: true
                }
              }
            }
          }
          subjectClassStudent: {
            select: {
              student: {
                select: {
                  id: true
                  userProfile: {
                    select: {
                      id: true
                      fullname: true
                      firstName: true
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }>[]
) => {
  return apiData.map((event) => {
    const startPeriod = PERIOD[event.startPeriod as keyof typeof PERIOD]
    const endPeriod = PERIOD[event.endPeriod as keyof typeof PERIOD]
    const start = event?.startTime
      ? dayjs(event?.startTime)
      : dayjs(event?.classDate)
          .set("hour", dayjs(startPeriod?.startTime).hour())
          .set("minute", dayjs(startPeriod?.startTime).minute())
    const end = event?.endTime
      ? dayjs(event?.endTime)
      : dayjs(event?.classDate)
          .set("hour", dayjs(endPeriod?.endTime).hour())
          .set("minute", dayjs(endPeriod?.endTime).minute())

    return {
      id: event.id,
      title: event?.subjectClass?.name ?? event?.notes ?? "",
      start: start.toDate(),
      end: end.toDate(),
      location: event.subjectClass?.room?.name || "",
      allDay: isAllDayEvent(start.toDate(), end.toDate()),
      color:
        TYPE_WORK_SCHEDULE_COLOR_OPTIONS.find((opt) => opt.type === event.periodType)?.value ||
        "#1890ff",
      description: event.notes || "",
      host:
        [
          event.subjectClass?.mainLecturer?.userProfile?.fullname,
          event.subjectClass?.extraLecturer?.userProfile?.fullname,
        ]
          .filter(Boolean)
          .join(", ") || "",
      attendees:
        event.subjectClass?.subjectClassStudent
          ?.map((student) => student.student.userProfile?.fullname)
          ?.filter(Boolean)
          .join(", ") || "",
      subjectClassId: event.subjectClass?.id,
    }
  })
}

const transformProfileDataTableCalendar = (profiles: UserProfile[]) => {
  return profiles?.map((profile: UserProfile) => ({
    id: profile.id,
    fullname: profile.fullname || undefined,
    firstname: profile.firstName || undefined,
    lastname: profile.lastName || undefined,
  }))
}

export type LichCongTacViewType = "calendar" | "table"

/**
 * Kiểu hiển thị lịch công tác (lịch / bảng), lưu trong localStorage.
 * Dùng chung cho cả LichCongTac và nơi đặt LichCongTacViewSwitcher ở ngoài (vd: header thẻ dashboard).
 */
export function useLichCongTacView() {
  return useLocalStorage<LichCongTacViewType>(STORAGE_KEY.VIEW_CALENDAR_TYPE, "calendar")
}

export function LichCongTacViewSwitcher({
  value,
  onChange,
  size = "middle",
  className = "",
}: {
  value: LichCongTacViewType
  onChange: (value: LichCongTacViewType) => void
  size?: "small" | "middle" | "large"
  className?: string
}) {
  return (
    <Segmented
      value={value}
      onChange={(v) => onChange(v as LichCongTacViewType)}
      className={`p-[3.5px] ${className}`}
      size={size}
      options={[
        {
          value: "calendar",
          className: "flex",
          icon: (
            <div className="flex h-full items-center">
              <CalendarOutlined size={20} />
            </div>
          ),
        },
        {
          value: "table",
          className: "flex",
          icon: (
            <div className="flex h-full items-center">
              <TableOutlined size={20} />
            </div>
          ),
        },
      ]}
    />
  )
}

export function LichCongTac({
  hiddenCalendarFilter = false,
  onlyMySchedule,
  enabled = true,
  compact = false,
  hideViewSwitcher = false,
  viewCalendarType: controlledView,
  onViewCalendarTypeChange,
}: {
  hiddenCalendarFilter?: boolean
  onlyMySchedule?: boolean
  /** Cho phép gọi query hay không (dùng để gác theo quyền xem). */
  enabled?: boolean
  /** Thu hẹp ô lịch + chiều cao theo parent (dashboard). */
  compact?: boolean
  /** Ẩn Segmented trong body — dùng khi đã đặt LichCongTacViewSwitcher ở header thẻ. */
  hideViewSwitcher?: boolean
  viewCalendarType?: LichCongTacViewType
  onViewCalendarTypeChange?: (value: LichCongTacViewType) => void
}) {
  const { data: profile } = useSession()
  const profileIdLogin = profile?.sDM_NhanVienId || undefined

  const [currentWeekOffsetTableCalendar, setCurrentWeekOffsetTableCalendar] = useState(0)
  const [filterDate, setFilterDate] = useState<Date | undefined>()
  const [selectedColors, setSelectedColors] = useState<string[]>(
    TYPE_WORK_SCHEDULE_COLOR_OPTIONS.map((opt) => opt.value)
  )
  const [storedView, setStoredView] = useLichCongTacView()
  const viewCalendarType = controlledView ?? storedView
  const setViewCalendarType = onViewCalendarTypeChange ?? setStoredView

  const { data: eventsDataTableCalendar = [] } = useFindManyClassSchedule(
    {
      where: {
        // ...(!onlyMySchedule && profileIdLogin
        //     ? {
        //           OR: [
        //               {
        //                   subjectClass: {
        //                       subjectClassStudent: {
        //                           some: {
        //                               student: {
        //                                   userProfileId: profileIdLogin,
        //                               },
        //                           },
        //                       },
        //                   },
        //               },
        //               {
        //                   lecturer: {
        //                       userProfileId: profileIdLogin,
        //                   },
        //               },
        //               {
        //                   subjectClass: {
        //                       mainLecturer: {
        //                           userProfileId: profileIdLogin,
        //                       },
        //                   },
        //               },
        //               {
        //                   subjectClass: {
        //                       extraLecturer: {
        //                           userProfileId: profileIdLogin,
        //                       },
        //                   },
        //               },
        //           ],
        //       }
        //     : {}),
        periodType: {
          in: selectedColors
            .map((color) => {
              const type = TYPE_WORK_SCHEDULE_COLOR_OPTIONS.find((opt) => opt.value === color)?.type
              return type
            })
            .filter(Boolean) as PeriodType[],
        },
      },
      include: {
        subjectClass: {
          select: {
            id: true,
            name: true,
            code: true,
            room: true,
            mainLecturer: {
              select: {
                userProfile: {
                  select: {
                    id: true,
                    fullname: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            extraLecturer: {
              select: {
                userProfile: {
                  select: {
                    id: true,
                    fullname: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            subjectClassStudent: {
              select: {
                student: {
                  select: {
                    id: true,
                    userProfile: {
                      select: {
                        id: true,
                        fullname: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: enabled && !!onlyMySchedule,
    }
  )

  // Convert events data to calendar filter format
  const calendarEvents = useMemo(() => {
    if (!eventsDataTableCalendar) return []

    const eventMap = new Map<string, { colors: Set<string>; titles: string[] }>()

    eventsDataTableCalendar.forEach((event) => {
      const color =
        TYPE_WORK_SCHEDULE_COLOR_OPTIONS.find((opt) => opt.type === event.periodType)?.value ||
        "#1890ff"
      const title = event?.subjectClass?.name ?? event?.notes ?? ""
      // Handle multi-day events
      const startPeriod = PERIOD[event.startPeriod as keyof typeof PERIOD]
      const endPeriod = PERIOD[event.endPeriod as keyof typeof PERIOD]
      const start = event?.startTime
        ? dayjs(event?.startTime)
        : dayjs(event?.classDate)
            .set("hour", dayjs(startPeriod?.startTime).hour())
            .set("minute", dayjs(startPeriod?.startTime).minute())
      const end = event?.endTime
        ? dayjs(event?.endTime)
        : dayjs(event?.classDate)
            .set("hour", dayjs(endPeriod?.endTime).hour())
            .set("minute", dayjs(endPeriod?.endTime).minute())
      let current = start

      while (current.isSameOrBefore(end, "day")) {
        const dateKey = current.format("YYYY-MM-DD")

        if (!eventMap.has(dateKey)) {
          eventMap.set(dateKey, { colors: new Set(), titles: [] })
        }

        const dayData = eventMap.get(dateKey)
        if (dayData) {
          dayData.colors.add(color)
          dayData.titles.push(title)
        }

        current = current.add(1, "day")
      }
    })

    return Array.from(eventMap.entries()).flatMap(([date, data]) => {
      return Array.from(data.colors).map((color, index) => ({
        date,
        color,
        title: data.titles[index] || data.titles[0] || "Sự kiện",
      }))
    })
  }, [eventsDataTableCalendar])

  const handleSelectSlotReactBigCalendar = (slotInfo: { start: Date; end: Date }) => {
    // Check if this is an all-day selection by checking if start is at beginning of day
    // and end is at start of next day
    const isAllDaySelection =
      slotInfo.start.getHours() === 0 &&
      slotInfo.start.getMinutes() === 0 &&
      slotInfo.start.getSeconds() === 0 &&
      slotInfo.end.getHours() === 0 &&
      slotInfo.end.getMinutes() === 0 &&
      slotInfo.end.getSeconds() === 0 &&
      slotInfo.end.getTime() > slotInfo.start.getTime()

    let adjustedEnd = new Date(slotInfo.end)

    // Only adjust end time for all-day selections
    if (isAllDaySelection) {
      // Adjust to 23:59:59.999 of the previous day for all-day events
      adjustedEnd = new Date(adjustedEnd.getTime() - 1)
    }

    const diffMs = adjustedEnd.getTime() - slotInfo.start.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    const source = diffDays >= 1 ? "multi-day" : "single-day"
  }

  const { onOpen: onOpenSubjectClass } = useDisclosure<{
    id: string
    mode: "edit" | "view"
    schedules?: Date[]
  }>({
    tag: "PutOneSubjectClassModal",
  })

  const handleSelectEventReactBigCalendar = (event: CustomCalendarEvent) => {
    if (event?.subjectClassId) {
      onOpenSubjectClass({
        id: event?.subjectClassId as string,
        mode: "view",
        schedules: [event.start],
      })
    } else {
      let source = "multi-day" // default
      if (event?.start && event?.end) {
        const diffMs = event.end.getTime() - event.start.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        source = diffDays >= 1 ? "multi-day" : "single-day"
      }
      Modal.info({
        title: event?.title,
        content: (
          <div>
            <p>
              <p>Ngày bắt đầu: {dayjs(event.start).format("DD/MM/YYYY")}</p>
              <p>Ngày kết thúc: {dayjs(event.end).format("DD/MM/YYYY")}</p>
              <p>
                Từ {dayjs(event.start).format("HH:mm")} đến {dayjs(event.end).format("HH:mm")}
              </p>
            </p>
            <p>Địa điểm: {event?.location || "-"}</p>
            <p>Giảng viên: {event?.host || "-"}</p>
          </div>
        ),
        // okButtonProps: { hidden: true },
        okText: "Đóng",
        okButtonProps: { className: "bg-primary text-white" },
      })
    }
  }

  const handleEventClickTableCalendar = (eventId: string, eventRecord?: any) => {
    let source = "single-day"
    if (eventRecord?.isWeekRow) source = "full-week"
    else if (eventRecord?.isMultiDayRow) source = "multi-day"
  }

  const handleCreateEventTableCalendar = (startTime: string, endTime: string) => {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    const source = diffDays >= 1 ? "multi-day" : "single-day"
  }

  const transformedEventsDataTableCalendar = useMemo(() => {
    if (!eventsDataTableCalendar) return []

    return eventsDataTableCalendar.map((event) => {
      const startPeriod = PERIOD[event.startPeriod as keyof typeof PERIOD]
      const endPeriod = PERIOD[event.endPeriod as keyof typeof PERIOD]
      const start = event?.startTime
        ? dayjs(event?.startTime)
        : dayjs(event?.classDate)
            .set("hour", dayjs(startPeriod?.startTime).hour())
            .set("minute", dayjs(startPeriod?.startTime).minute())
      const end = event?.endTime
        ? dayjs(event?.endTime)
        : dayjs(event?.classDate)
            .set("hour", dayjs(endPeriod?.endTime).hour())
            .set("minute", dayjs(endPeriod?.endTime).minute())
      return {
        id: event.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        content: event.subjectClass?.name || "",
        location: event.subjectClass?.room?.name || "",
        note: event.notes || undefined,
        color:
          TYPE_WORK_SCHEDULE_COLOR_OPTIONS.find((opt) => opt.type === event.periodType)?.value ||
          "#1890ff",
        host: [event.lecturerId, event.extraLecturerId].filter(Boolean) as string[],
        attendees: event?.subjectClass?.subjectClassStudent.map((scs) => scs.student.id),
        hostProfile: transformProfileDataTableCalendar(
          [
            event.subjectClass?.mainLecturer?.userProfile,
            event.subjectClass?.extraLecturer?.userProfile,
          ].filter(Boolean) as UserProfile[]
        ),
        attendeesProfile: transformProfileDataTableCalendar(
          event.subjectClass?.subjectClassStudent
            ?.map((scs) => scs.student.userProfile)
            .filter(Boolean) as UserProfile[]
        ),
        subjectClassId: event?.subjectClass?.id,
      }
    })
  }, [eventsDataTableCalendar])

  // ============ RENDER COMPONENTS ============
  // Shared component for both calendar types
  // Không dùng Checkbox.Group + Col (antd hay mất value khi tick lại)
  const renderColorCheckboxes = () => (
    <div className={compact ? "mx-0.5 mt-2 border-t border-[#f0f0f0] pt-2" : "mx-2 mt-4"}>
      <Row gutter={compact ? [4, 4] : [16, 16]}>
        {TYPE_WORK_SCHEDULE_COLOR_OPTIONS.map((opt) => (
          <Col span={24} key={opt.value}>
            <Checkbox
              checked={selectedColors.includes(opt.value)}
              onChange={(e) => {
                const checked = e.target.checked
                setSelectedColors((prev) =>
                  checked ? [...prev, opt.value] : prev.filter((c) => c !== opt.value)
                )
              }}
              className={
                compact
                  ? "min-w-0 [&_.ant-checkbox+span]:!ps-1.5 [&_.ant-checkbox+span]:break-words [&_.ant-checkbox+span]:text-[11px] [&_.ant-checkbox+span]:leading-snug"
                  : undefined
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: compact ? "2px" : "8px",
                marginInlineStart: 0,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: compact ? "8px" : "13px",
                  height: compact ? "8px" : "13px",
                  borderRadius: "50%",
                  backgroundColor: opt.value,
                  marginRight: compact ? "2px" : "4px",
                  flexShrink: 0,
                }}
              />
              {opt.label}
            </Checkbox>
          </Col>
        ))}
      </Row>
    </div>
  )

  const renderFilterColumn = () => (
    <Col
      span={6}
      className={
        compact
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-hidden"
          : undefined
      }
    >
      <div className={compact ? "min-w-0 shrink-0 overflow-x-hidden" : undefined}>
        <CalendarFilter
          value={filterDate ? dayjs(filterDate) : undefined}
          onChange={(date) => setFilterDate(date?.toDate())}
          events={calendarEvents}
        />
      </div>
      {compact ? (
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
          {renderColorCheckboxes()}
        </div>
      ) : (
        renderColorCheckboxes()
      )}
    </Col>
  )

  const rowClassName = compact ? "mt-1 min-h-0 min-w-0 flex-1 overflow-x-hidden" : "mt-4"
  const rowStyle = compact ? { height: "100%", marginLeft: 0, marginRight: 0 } : undefined

  // ReactBigCalendar view
  const renderCalendarView = () => (
    <Row gutter={compact ? [10, 8] : [16, 16]} className={rowClassName} style={rowStyle}>
      {!hiddenCalendarFilter && renderFilterColumn()}

      <Col
        span={!hiddenCalendarFilter ? 18 : 24}
        className={compact ? "h-full min-h-0 min-w-0 overflow-x-hidden" : undefined}
        style={compact ? { height: "100%", display: "flex", flexDirection: "column" } : undefined}
      >
        <ReactBigCalendarCustom
          events={convertApiToCalendarEventReactBigCalendar(eventsDataTableCalendar)}
          height={compact ? "100%" : 700}
          compact={compact}
          filterDate={filterDate}
          onSelectSlot={handleSelectSlotReactBigCalendar}
          onSelectEvent={handleSelectEventReactBigCalendar}
          onChange={setFilterDate}
        />
      </Col>
    </Row>
  )

  // TableWeekCalendar view — compact: có cột filter bên trái như view calendar
  const renderTableView = () => (
    <Row gutter={compact ? [10, 8] : [16, 16]} className={rowClassName} style={rowStyle}>
      {compact && !hiddenCalendarFilter && renderFilterColumn()}
      <Col
        span={compact && !hiddenCalendarFilter ? 18 : 24}
        className={compact ? "h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto" : undefined}
      >
        <TableWeekCalendar
          compact={compact}
          eventsData={transformedEventsDataTableCalendar}
          showWeekNavigation={true}
          // showAddButtons={canCreate}
          // showLockToggle={canUpdate}
          initialUnlockState={false}
          weekOffset={currentWeekOffsetTableCalendar}
          onWeekOffsetChange={setCurrentWeekOffsetTableCalendar}
          onEventClick={handleEventClickTableCalendar}
          onCreateEvent={handleCreateEventTableCalendar}
          // onCreateWeekEvent={handleCreateWeekEventTableCalendar}
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
          showDateFilter={!compact}
        />
      </Col>
    </Row>
  )

  return (
    <ConfigProvider theme={lightThemeCustom} locale={viVN}>
      <div
        className={compact ? "flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden" : undefined}
      >
        {!hideViewSwitcher ? (
          <div className="flex shrink-0 items-center justify-between">
            <div />
            <LichCongTacViewSwitcher
              value={viewCalendarType}
              onChange={setViewCalendarType}
              size={compact ? "small" : "middle"}
            />
          </div>
        ) : null}
        {viewCalendarType === "calendar" ? renderCalendarView() : renderTableView()}
      </div>
    </ConfigProvider>
  )
}
