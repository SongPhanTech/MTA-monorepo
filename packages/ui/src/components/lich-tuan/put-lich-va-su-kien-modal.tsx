import { CalendarOutlined } from "@ant-design/icons"
import { type ClassSchedule, PeriodType } from "@workspace/db/client"
import {
  useCreateClassSchedule,
  useDeleteClassSchedule,
  useFindManyClassSchedule,
  useFindManySubjectClass,
  useFindManyUserProfile,
  useFindUniqueClassSchedule,
  useUpdateClassSchedule,
} from "@workspace/db/hooks"
import { cn } from "@workspace/ui/lib/utils"
import "@workspace/libs/utils"
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Table,
  Tabs,
} from "antd"
import locale from "antd/es/date-picker/locale/vi_VN"
import dayjs, { type Dayjs } from "dayjs"
import { type Key, useCallback, useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { FormItem, InputSuggestion, PutFormModal, type PutModalFormType } from "../commons"
import { useSemesterStore } from "../select-semester"
import { useTrainingObjectTypeStore } from "../select-training-object-type"
import { CollapsibleField } from "./collapsible-field"
import { TYPE_WORK_SCHEDULE_COLOR_OPTIONS } from "./lich-tuan"

export type PutLichVaSuKienFormType = {
  allDay?: boolean
} & ClassSchedule &
  PutModalFormType

const PutLichVaSuKienModal = () => {
  const {
    isOpen,
    onClose,
    input: payload,
  } = useDisclosure<{
    id?: string
    slot?: {
      startTime: Dayjs
      endTime: Dayjs
    }
    source?: "single-day" | "multi-day" // single-day: chỉ 1 ngày, multi-day: nhiều ngày
    periodType: PeriodType //PERSONAL, WEEKLY, OTHER
  }>({
    tag: "PutLichVaSuKienModal",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedSubjectClassId, setSelectedSubjectClassId] = useState<Key>()
  const [selectedClassSchedule, setSelectedClassSchedule] = useState<Key>()
  const [form] = Form.useForm<PutLichVaSuKienFormType>()
  const isSingleDaySchedule = payload?.source === "single-day" // Kiểm tra có phải lịch 1 ngày không
  const allDayValue = Form.useWatch("allDay", form)
  const { data: event } = useFindUniqueClassSchedule(
    {
      where: {
        id: payload?.id,
      },
      include: {
        userProfiles: true,
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    {
      enabled: !!payload?.id,
    }
  )

  const { data: profiles = [] } = useFindManyUserProfile({})

  const { mutateAsync: deleteClassSchedule } = useDeleteClassSchedule({
    onError: (error: any) => {
      message.error(`Xóa sự kiện thất bại: ${error.message}`)
    },
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()

  const { data: subjectClasses = [] } = useFindManySubjectClass(
    {
      where: {
        trainingObjectTypeId,
        semesterId,
        status: "OFFICIAL",
        cancelled: false,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        subjectClassTimes: {
          select: {
            dayOfWeek: true,
            startPeriod: true,
            endPeriod: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
        mainLecturer: {
          select: {
            userProfile: {
              select: {
                fullname: true,
              },
            },
          },
        },
        extraLecturer: {
          select: {
            userProfile: {
              select: {
                fullname: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjectClassStudent: true,
          },
        },
      },
    },
    {
      enabled: !!trainingObjectTypeId && !!semesterId && payload?.periodType === "CHECK",
    }
  )

  const { data: classSchedules = [] } = useFindManyClassSchedule(
    {
      where: {
        periodType: {
          not: "CHECK",
        },
        subjectClass: {
          trainingObjectTypeId,
          semesterId,
          status: "OFFICIAL",
          cancelled: false,
          deletedAt: null,
          id: selectedSubjectClassId ? String(selectedSubjectClassId) : undefined,
        },
      },
      select: {
        id: true,
        classDate: true,
        startPeriod: true,
        endPeriod: true,
        periodType: true,
        subjectClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        roomId: true,
        room: {
          select: {
            name: true,
          },
        },
      },
    },
    {
      enabled:
        !!trainingObjectTypeId &&
        !!semesterId &&
        payload?.periodType === "CHECK" &&
        !!selectedSubjectClassId,
    }
  )

  const { mutateAsync: updateClassSchedule } = useUpdateClassSchedule({
    onError: (error: any) => {
      message.error(`Cập nhật sự kiện thất bại: ${error.message}`)
    },
  })

  const { mutateAsync: createClassSchedule } = useCreateClassSchedule({
    onError: (error: any) => {
      message.error(`Tạo sự kiện thất bại: ${error.message}`)
    },
  })

  const separateProfilesAndCustomText = (values: string[]) => {
    const profileIds: string[] = []
    const customTexts: string[] = []
    values.forEach((value) => {
      const isProfileId = profiles.some((profile) => profile.id === value)
      if (isProfileId) {
        profileIds.push(value)
      } else {
        customTexts.push(value)
      }
    })

    return { profileIds, customTexts }
  }

  const combineProfilesAndCustomText = useCallback(
    (profileRelations: any[] = [], customTexts: string[] = []) => {
      const profileIds = profileRelations.map((profile) => profile.id)
      return [...profileIds, ...customTexts]
    },
    []
  )

  const onFinish = async (values: PutLichVaSuKienFormType, keepOpen = false) => {
    // Kiểm tra tên sự kiện (content) - bắt buộc phải có
    if (!values.notes || values.notes.trim() === "") {
      message.error("Vui lòng nhập nội dung công việc")
      return
    }

    let finalStartTime = values.startTime ? dayjs(values.startTime) : undefined
    let finalEndTime = values.endTime ? dayjs(values.endTime) : undefined

    // Handle all day events
    if (values.allDay) {
      if (values.startTime) {
        finalStartTime = dayjs(values.startTime).startOf("day")
      }
      if (values.endTime) {
        finalEndTime = dayjs(values.endTime).endOf("day")
      }
    }

    if (isSingleDaySchedule && payload?.slot?.startTime) {
      const baseDate = dayjs(payload.slot.startTime)
      if (values.allDay) {
        finalStartTime = baseDate.startOf("day")
        finalEndTime = baseDate.endOf("day")
      } else {
        if (values.startTime) {
          finalStartTime = baseDate
            .hour(dayjs(values.startTime).hour())
            .minute(dayjs(values.startTime).minute())
        }
        if (values.endTime) {
          finalEndTime = baseDate
            .hour(dayjs(values.endTime).hour())
            .minute(dayjs(values.endTime).minute())
        }
      }
    }

    // Validate required fields - use payload.slot if available
    if (!finalStartTime) {
      finalStartTime = payload?.slot?.startTime ? dayjs(payload.slot.startTime) : undefined
    }
    if (!finalEndTime) {
      finalEndTime = payload?.slot?.endTime ? dayjs(payload.slot.endTime) : undefined
    }

    if (!finalStartTime || !finalEndTime) {
      message.error("Vui lòng chọn thời gian bắt đầu và kết thúc")
      return
    }

    if (dayjs(finalStartTime).isAfter(finalEndTime)) {
      message.error("Thời gian bắt đầu không thể lớn hơn thời gian kết thúc")
      return
    }
    if (isSingleDaySchedule && !dayjs(finalStartTime).isSame(finalEndTime, "day")) {
      message.error("Lịch này chỉ có thể trong cùng một ngày")
      return
    }
    executeSave(values, keepOpen, finalStartTime, finalEndTime)
  }

  const executeSave = async (
    values: PutLichVaSuKienFormType,
    keepOpen: boolean,
    finalStartTime?: Dayjs,
    finalEndTime?: Dayjs
  ) => {
    // Don't close modal immediately, do it after API calls complete
    if (keepOpen) {
      // Clear form for next event when "Lưu & Tiếp tục"
      form.resetFields()
      // Set default values for new event
      const slotStartTime = payload?.slot?.startTime ? dayjs(payload.slot.startTime) : undefined
      const slotEndTime = payload?.slot?.endTime ? dayjs(payload.slot.endTime) : undefined

      // Calculate smart default times based on current time
      let defaultStartTime = slotStartTime
      let defaultEndTime = slotEndTime
      let defaultAllDay = false

      if (slotStartTime && !payload?.id) {
        // For new events, check if this is a multi-day selection
        const isMultiDaySelection =
          slotStartTime && slotEndTime && !slotStartTime.isSame(slotEndTime, "day")

        if (isMultiDaySelection) {
          // Multi-day selection: always use all-day and original slot times
          defaultStartTime = slotStartTime
          defaultEndTime = slotEndTime
          defaultAllDay = true
        } else {
          // Single day selection: check if user selected specific time slots
          const hasSpecificTimeSelection =
            slotStartTime &&
            slotEndTime &&
            !(
              slotStartTime.hour() === 0 &&
              slotStartTime.minute() === 0 &&
              slotEndTime.hour() === 23 &&
              slotEndTime.minute() === 59
            )

          if (hasSpecificTimeSelection) {
            // User selected specific time slots, use them directly
            defaultStartTime = slotStartTime
            defaultEndTime = slotEndTime
            defaultAllDay = false
          } else {
            // User clicked on day (no specific time), use smart timing
            const now = dayjs()
            const slotDate = slotStartTime.startOf("day")

            if (slotDate.isSameOrAfter(now, "day")) {
              if (slotDate.isSame(now, "day")) {
                // For today, use smart timing based on current time
                const currentMinutes = now.minute()
                let roundedTime = now

                if (currentMinutes < 30) {
                  // Round to 30 minutes of current hour
                  roundedTime = now.minute(30).second(0).millisecond(0)
                } else {
                  // Round to next hour at 00 minutes
                  roundedTime = now.add(1, "hour").minute(0).second(0).millisecond(0)
                }

                // If rounded time is in the past or current time, add 30 minutes
                const smartStartTime = roundedTime.isBefore(now)
                  ? roundedTime.add(30, "minute")
                  : roundedTime

                defaultStartTime = slotDate
                  .hour(smartStartTime.hour())
                  .minute(smartStartTime.minute())
                  .second(0)
                  .millisecond(0)

                // End time is 1 hour after start time
                defaultEndTime = defaultStartTime.add(1, "hour")
                defaultAllDay = false
              } else {
                // For future dates (tomorrow and beyond), start at 6:00 AM
                defaultStartTime = slotDate.hour(6).minute(0).second(0).millisecond(0)
                defaultEndTime = defaultStartTime.add(1, "hour")
                defaultAllDay = false
              }
            } else {
              // For past dates, use reasonable default (9 AM - 10 AM)
              defaultStartTime = slotDate.hour(9).minute(0).second(0).millisecond(0)
              defaultEndTime = defaultStartTime.add(1, "hour")
              defaultAllDay = false
            }
          }
        }
      }

      form.setFieldsValue({
        periodType: payload?.periodType || PeriodType.WEEK,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        allDay: defaultAllDay, // Use calculated allDay value based on selection type
      })
    }
    // Set loading state and handle API calls
    setIsLoading(true)

    // Wrap in setTimeout to avoid blocking UI
    setTimeout(async () => {
      try {
        // Separate profile IDs from custom text for host and attendees
        // const hostData = separateProfilesAndCustomText(values.host || [])
        // const attendeesData = separateProfilesAndCustomText(values.attendees || [])
        if (payload?.id) {
          await updateClassSchedule({
            where: { id: payload.id },
            data: {
              notes: values.notes?.trim() || "",
              startTime: dayjs(finalStartTime).toISOString(),
              endTime: dayjs(finalEndTime).toISOString(),
              location: values.location?.trim() || "",
              roomId: values.roomId || null,
              description: values.description?.trim() || "",
              subjectClassId: (selectedSubjectClassId as string) || null,
              startPeriod: values.startPeriod ?? 0,
              endPeriod: values.endPeriod ?? 0,
              // classDate = DATE ONLY
              // Set to 12:00 to avoid timezone date-shift
              classDate: dayjs(finalStartTime).hour(12).minute(0).second(0).millisecond(0).toDate(),
              periodType: (event?.periodType as PeriodType) || PeriodType.WEEK,
            },
          })
          // Show success message
          message.success("Cập nhật sự kiện thành công")
        } else {
          await createClassSchedule({
            data: {
              notes: values.notes?.trim() || "",
              startTime: dayjs(finalStartTime).toISOString(),
              endTime: dayjs(finalEndTime).toISOString(),
              description: values.description?.trim() || "",
              location: values.location?.trim() || "",
              roomId: values.roomId || null,
              subjectClassId: (selectedSubjectClassId as string) || null,
              startPeriod: values.startPeriod ?? 0,
              endPeriod: values.endPeriod ?? 0,
              classDate: dayjs(finalStartTime).hour(12).minute(0).second(0).millisecond(0).toDate(),
              periodType: (payload?.periodType as PeriodType) || PeriodType.WEEK,
            },
          })
          // Show success message
          message.success("Tạo sự kiện thành công")
        }
        // message.success(
        //     `${payload?.id ? 'Cập nhật' : 'Thêm mới'} thành công`
        // )
        if (!keepOpen && typeof onClose === "function") {
          onClose()
        }
      } catch (error) {
        // console.error('Save error:', error)
        message.error(`${payload?.id ? "Cập nhật" : "Thêm mới"} thất bại`)
        setIsLoading(false)
        // Don't close modal on error, let user retry
      } finally {
        // Ensure loading state is always reset
        setIsLoading(false)
      }
    }, 0) // Execute in next tick to avoid blocking UI
  }

  const handleDelete = async () => {
    if (!payload?.id || isDeleting) {
      // console.error('No payload.id found or already deleting')
      return
    }

    setIsDeleting(true)

    // Regular single event deletion without confirmation
    try {
      await deleteClassSchedule({ where: { id: payload.id } })
      message.success("Xóa sự kiện thành công")
    } catch (error) {
      // console.error('Regular delete failed:', error)
      message.error("Xóa sự kiện thất bại")
    } finally {
      setIsDeleting(false)
    }
    onClose()
  }

  useEffect(() => {
    if (payload?.id && event) {
      // const hostValues = combineProfilesAndCustomText(event.hostProfile, event.host)
      // Kiểm tra có phải sự kiện cả ngày (00:00 đến 23:59)
      const isAllDay = (() => {
        if (!event.startTime || !event.endTime) return false

        const startTime = dayjs(event.startTime)
        const endTime = dayjs(event.endTime)

        // Bắt đầu lúc 00:00:00?
        const isStartOfDay = startTime.isSame(startTime.startOf("day"))

        // Kết thúc lúc 23:59 hoặc cuối ngày?
        const isEndAtNightTime = endTime.hour() === 23 && endTime.minute() === 59
        const isEndOfDay = endTime.isSame(endTime.endOf("day"))

        const isValidEndTime = isEndAtNightTime || isEndOfDay
        return isStartOfDay && isValidEndTime
      })()

      form.setFieldsValue({
        id: payload.id,
        notes: event.notes || "",
        startTime: event.startTime ? dayjs(event.startTime) : undefined,
        endTime: event.endTime ? dayjs(event.endTime) : undefined,
        description: event.description || "",
        location: event?.location ?? event?.room?.name ?? "",
        // host: hostValues,
        userProfiles: [],
        periodType: event.periodType || PeriodType.WEEK,
        allDay: isAllDay,
      })
    } else if (!payload?.id && isOpen) {
      // Chỉ reset form khi modal mở và không có ID (tạo mới)
      form.resetFields()
      // Set giá trị mặc định sau khi reset
      const slotStartTime = payload?.slot?.startTime ? dayjs(payload.slot.startTime) : undefined
      const slotEndTime = payload?.slot?.endTime ? dayjs(payload.slot.endTime) : undefined

      // Calculate smart default times based on current time
      let defaultStartTime = slotStartTime
      let defaultEndTime = slotEndTime
      let defaultAllDay = false

      if (slotStartTime && !payload?.id) {
        // For new events, check if this is a multi-day selection
        const isMultiDaySelection =
          slotStartTime && slotEndTime && !slotStartTime.isSame(slotEndTime, "day")

        if (isMultiDaySelection) {
          // Multi-day selection: always use all-day and original slot times
          defaultStartTime = slotStartTime
          defaultEndTime = slotEndTime
          defaultAllDay = true
        } else {
          // Single day selection: check if user selected specific time slots
          const hasSpecificTimeSelection =
            slotStartTime &&
            slotEndTime &&
            !(
              slotStartTime.hour() === 0 &&
              slotStartTime.minute() === 0 &&
              slotEndTime.hour() === 23 &&
              slotEndTime.minute() === 59
            )

          if (hasSpecificTimeSelection) {
            // User selected specific time slots, use them directly
            defaultStartTime = slotStartTime
            defaultEndTime = slotEndTime
            defaultAllDay = false
          } else {
            // User clicked on day (no specific time), use smart timing
            const now = dayjs()
            const slotDate = slotStartTime.startOf("day")

            if (slotDate.isSameOrAfter(now, "day")) {
              if (slotDate.isSame(now, "day")) {
                // For today, use smart timing based on current time
                const currentMinutes = now.minute()
                let roundedTime = now

                if (currentMinutes < 30) {
                  // Round to 30 minutes of current hour
                  roundedTime = now.minute(30).second(0).millisecond(0)
                } else {
                  // Round to next hour at 00 minutes
                  roundedTime = now.add(1, "hour").minute(0).second(0).millisecond(0)
                }

                // If rounded time is in the past or current time, add 30 minutes
                const smartStartTime = roundedTime.isBefore(now)
                  ? roundedTime.add(30, "minute")
                  : roundedTime

                defaultStartTime = slotDate
                  .hour(smartStartTime.hour())
                  .minute(smartStartTime.minute())
                  .second(0)
                  .millisecond(0)

                // End time is 1 hour after start time
                defaultEndTime = defaultStartTime.add(1, "hour")
                defaultAllDay = false
              } else {
                // For future dates (tomorrow and beyond), start at 6:00 AM
                defaultStartTime = slotDate.hour(6).minute(0).second(0).millisecond(0)
                defaultEndTime = defaultStartTime.add(1, "hour")
                defaultAllDay = false
              }
            } else {
              // For past dates, use reasonable default (9 AM - 10 AM)
              defaultStartTime = slotDate.hour(9).minute(0).second(0).millisecond(0)
              defaultEndTime = defaultStartTime.add(1, "hour")
              defaultAllDay = false
            }
          }
        }
      }

      form.setFieldsValue({
        periodType: payload?.periodType || PeriodType.WEEK,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        allDay: defaultAllDay, // Use calculated allDay value based on selection type
      })
    }
  }, [payload?.id, event, form, isOpen, payload?.periodType, payload?.slot])
  return (
    <PutFormModal
      open={isOpen}
      form={form}
      maskClosable={true}
      onFinish={(values) => onFinish(values)}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      title="Lịch và sự kiện"
      closable={true}
      className={cn(payload?.periodType === "CHECK" ? "w-[85vw]" : "w-[600px]")}
      initialValues={undefined}
      // formProps={{
      //     disabled: payload?.periodType === 'CHECK',
      // }}
      footer={
        <div className="flex justify-between gap-2">
          {!!payload?.id && (
            <Button
              danger
              type="primary"
              disabled={isLoading || isDeleting}
              loading={isDeleting}
              onClick={handleDelete}
            >
              Xoá
            </Button>
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>Huỷ</Button>
            <Button type="primary" onClick={() => form.submit()} loading={isLoading}>
              Lưu
            </Button>
            {isSingleDaySchedule && !payload?.id && (
              <Button
                type="primary"
                onClick={() => {
                  form.validateFields().then((values) => onFinish(values, true))
                }}
                loading={isLoading}
              >
                Lưu & Tiếp tục
              </Button>
            )}
          </div>
        </div>
      }
    >
      {payload?.periodType === "CHECK" && (
        <Col span={24}>
          <Tabs>
            <Tabs.TabPane tab="Lớp môn học" key="1">
              <Table
                rowSelection={{
                  type: "radio",
                  onChange: (selectedRowKeys) => {
                    const selectedClass = selectedRowKeys[0]
                    if (!selectedClass) return
                    setSelectedSubjectClassId(selectedClass)
                  },
                  selectedRowKeys: selectedSubjectClassId ? [selectedSubjectClassId] : [],
                  getCheckboxProps(record) {
                    return {
                      disabled: false,
                    }
                  },
                }}
                onRow={(record) => {
                  return {
                    onClick: () => {
                      setSelectedSubjectClassId(record.id)
                    },
                  }
                }}
                rowKey={"id"}
                dataSource={subjectClasses}
                columns={[
                  {
                    title: "TT",
                    width: 35,
                    align: "center",
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: "Mã LMH",
                    dataIndex: "code",
                  },
                  {
                    title: "Môn học",
                    dataIndex: "name",
                  },
                  {
                    title: "Phòng học",
                    align: "center",
                    render: (_, record) => {
                      return record.room?.name || ""
                    },
                  },
                  {
                    title: "Thời khoá biểu",
                    width: 250,
                    align: "center",
                    render: (_, record) => {
                      return record.subjectClassTimes?.uniqueByKey?.("dayOfWeek")?.map?.((tkb) => {
                        return (
                          <p>
                            {tkb.dayOfWeek === 8 ? "CN" : `T${tkb.dayOfWeek}`} - {tkb.startPeriod} -{" "}
                            {tkb.endPeriod}
                          </p>
                        )
                      })
                    },
                  },
                  {
                    title: "Giảng viên 1",
                    render: (_, record) => {
                      return record.mainLecturer?.userProfile?.fullname || ""
                    },
                  },
                  {
                    title: "Giảng viên 2",
                    render: (_, record) => {
                      return record.extraLecturer?.userProfile?.fullname || ""
                    },
                  },
                  {
                    title: "Sĩ số",
                    render: (_, record) => {
                      return record._count?.subjectClassStudent || 0
                    },
                  },
                ]}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Tiết học" key="2">
              <Table
                rowSelection={{
                  type: "radio",
                  onChange: (selectedRowKeys) => {
                    const selectedSchedule = selectedRowKeys[0]
                    if (!selectedSchedule) return
                    setSelectedClassSchedule(selectedSchedule)
                  },
                  selectedRowKeys: selectedClassSchedule ? [selectedClassSchedule] : [],
                  getCheckboxProps(record) {
                    return {
                      disabled: false,
                    }
                  },
                }}
                rowKey={"id"}
                dataSource={classSchedules}
                onRow={(record) => {
                  return {
                    onClick: () => {
                      setSelectedClassSchedule(record.id)
                      form.setFieldsValue({
                        allDay: false,
                        startPeriod: record.startPeriod,
                        endPeriod: record.endPeriod,
                        classDate: record.classDate,
                        notes: `Kiểm tra giảng dạy lớp ${record.subjectClass?.name}`,
                        periodType: "CHECK",
                        roomId: record.roomId,
                        location: record.room?.name || "",
                        description: "",
                      })
                    },
                  }
                }}
                columns={[
                  {
                    title: "TT",
                    width: 35,
                    align: "center",
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: "Ngày học",
                    render: (_, record) => {
                      return dayjs(record.classDate).format("dddd DD/MM/YYYY")
                    },
                  },
                  // {
                  //   title: "Tiết học",
                  //   render: (_, record) => {
                  //     return (
                  //       <>
                  //         {record.startPeriod} - {record.endPeriod}
                  //       </>
                  //     )
                  //   },
                  // },
                ]}
              />
            </Tabs.TabPane>
          </Tabs>
        </Col>
      )}
      {/* Hiển thị ngày cho lịch 1 ngày */}
      {isSingleDaySchedule && payload?.slot?.startTime && (
        <Col span={24}>
          <div
            style={{
              background: "#f5f5f5",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 500,
              color: "#333333",
            }}
          >
            📅 {dayjs(payload.slot.startTime).format("dddd DD/MM/YYYY ")}
          </div>
        </Col>
      )}
      <CollapsibleField
        title=""
        icon={<CalendarOutlined />}
        defaultExpanded
        summary={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {(() => {
              const startTime = form.getFieldValue("startTime")
              const endTime = form.getFieldValue("endTime")
              const allDay = form.getFieldValue("allDay")
              const color =
                form.getFieldValue("color") ||
                TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value ||
                "#b3d4fc"

              const formatTime = (date: Dayjs) => {
                if (!date) return ""
                return allDay ? date.format("DD/MM/YYYY") : date.format("DD/MM/YYYY HH:mm")
              }

              return (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      border: `2px solid ${color}`,
                    }}
                  />
                  <span>
                    {startTime && endTime
                      ? (() => {
                          // Check if same day
                          if (startTime.format("DD/MM/YYYY") === endTime.format("DD/MM/YYYY")) {
                            // Same day - show date once with time range
                            if (allDay) {
                              return startTime.format("DD/MM/YYYY")
                              // biome-ignore lint/style/noUselessElse: <explanation>
                            } else {
                              return `${startTime.format("DD/MM/YYYY")} ${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                            }
                            // biome-ignore lint/style/noUselessElse: <explanation>
                          } else {
                            // Different days - show full range
                            return `${formatTime(startTime)} - ${formatTime(endTime)}`
                          }
                        })()
                      : startTime
                        ? formatTime(startTime)
                        : "Chưa chọn thời gian"}
                  </span>
                  {allDay && <span style={{ color: "#47a1dd" }}>• Cả ngày</span>}
                </>
              )
            })()}
          </div>
        }
      >
        <Row gutter={[12, 12]}>
          <Col span={8}>
            <FormItem name="startTime" form={form}>
              <DatePicker
                locale={locale}
                className="w-full"
                format={{
                  format: allDayValue ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm",
                  type: "mask",
                }}
                placeholder="Chọn thời điểm bắt đầu"
                needConfirm={false}
                showTime={
                  !allDayValue
                    ? {
                        defaultValue: dayjs("07:00", "HH:mm"),
                      }
                    : false
                }
                onChange={(date) => {
                  const endTime = form.getFieldValue("endTime")
                  if (endTime && date && endTime.isBefore(date)) {
                    form.setFieldsValue({
                      endTime: undefined,
                    })
                  }
                }}
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem name="endTime" form={form}>
              <DatePicker
                needConfirm={false}
                locale={locale}
                className="w-full"
                format={{
                  format: allDayValue ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm",
                  type: "mask",
                }}
                placeholder="Chọn thời điểm kết thúc"
                showTime={
                  !allDayValue
                    ? {
                        defaultValue: dayjs("17:00", "HH:mm"),
                      }
                    : false
                }
                disabledDate={(current) => {
                  const startTime = form.getFieldValue("startTime")
                  return startTime && current && current.isBefore(startTime, "day")
                }}
                disabledTime={(current) => {
                  const startTime = form.getFieldValue("startTime")
                  if (allDayValue) return {}

                  if (!startTime || !current || !current.isSame(startTime, "day")) {
                    return {}
                  }

                  const startHour = startTime.hour()
                  const startMinute = startTime.minute()

                  return {
                    disabledHours: () => {
                      const hours = []
                      for (let i = 0; i < startHour; i++) {
                        hours.push(i)
                      }
                      return hours
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === startHour) {
                        const minutes = []
                        for (let i = 0; i < startMinute; i++) {
                          minutes.push(i)
                        }
                        return minutes
                      }
                      return []
                    },
                  }
                }}
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem name="periodType" form={form}>
              <Select
                disabled
                suffixIcon={null}
                style={{
                  textAlign: "center",
                }}
                dropdownStyle={{
                  textAlign: "center",
                }}
                options={TYPE_WORK_SCHEDULE_COLOR_OPTIONS?.map((opt) => ({
                  label: (
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          display: "inline-block",
                          width: "13px",
                          height: "13px",
                          borderRadius: "50%",
                          backgroundColor: opt?.value,
                          border: `2px solid ${opt?.value}`,
                          minHeight: "13px",
                          minWidth: "13px",
                        }}
                      />
                      {` ${opt.label}`}
                    </div>
                  ),
                  value: opt.type,
                }))}
              />
            </FormItem>
          </Col>
          {payload?.periodType !== "CHECK" && (
            <Col span={10}>
              <FormItem name="allDay" form={form} valuePropName="checked">
                <Checkbox
                  onChange={(e) => {
                    const checked = e.target.checked
                    form.setFieldsValue({ allDay: checked })

                    const startTime = form.getFieldValue("startTime")
                    const endTime = form.getFieldValue("endTime")

                    if (checked && startTime && endTime) {
                      form.setFieldsValue({
                        startTime: dayjs(startTime).startOf("day"),
                        endTime: dayjs(endTime).endOf("day"),
                      })
                    }
                  }}
                >
                  Cả ngày
                </Checkbox>
              </FormItem>
            </Col>
          )}
        </Row>
      </CollapsibleField>
      <Col span={24}>
        <FormItem
          name="notes"
          form={form}
          rules={[
            {
              required: true,
              message: "Vui lòng nhập nội dung",
            },
            {
              whitespace: true,
              message: "Nội dung công việc không được để trống",
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            style={{ resize: "none" }}
            placeholder="Nhập nội dung công việc"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem name="location" form={form}>
          <InputSuggestion
            className="w-full modern-borderless-input"
            placeholder="Nhập địa điểm"
            suggestionKey="event_location"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem name="description" form={form}>
          <Input.TextArea
            rows={3}
            className="w-full modern-borderless-input"
            placeholder="Nhập ghi chú"
            style={{ resize: "none" }}
          />
        </FormItem>
      </Col>
      <style>
        {`
                .ant-input[disabled] {
                    background-color: #fff !important; /* giữ trắng */
                    color: rgba(0,0,0,0.85) !important; /* giữ màu chữ */
                    opacity: 1 !important; /* bỏ mờ */
                    cursor: default !important;
                }
                /* Select */
                .ant-select-disabled.ant-select {
                background-color: #fff !important;
                opacity: 1 !important;
                }
                .ant-select-disabled .ant-select-selector {
                background-color: #fff !important;
                color: rgba(0, 0, 0, 0.88) !important;
                opacity: 1 !important;
                cursor: default !important;
                }

                .ant-input-number-disabled {
                    background-color: #fff !important;
                    color: rgba(0, 0, 0, 0.88) !important;
                    opacity: 1 !important;
                    cursor: default !important;
                }
                .ant-input-number-disabled .ant-input-number-input {
                    color: rgba(0, 0, 0, 0.88) !important;
                    cursor: default !important;
                }

                /* DatePicker */
                .ant-picker-disabled {
                background-color: #fff !important;
                color: rgba(0, 0, 0, 0.88) !important;
                opacity: 1 !important;
                cursor: default !important;
                }

                /* TreeSelect */
                .ant-select-disabled.ant-select-tree {
                background-color: #fff !important;
                opacity: 1 !important;
                }
                .ant-select-disabled.ant-select-tree .ant-select-selector {
                background-color: #fff !important;
                color: rgba(0, 0, 0, 0.88) !important;
                opacity: 1 !important;
                cursor: default !important;
                }
                `}
      </style>
    </PutFormModal>
  )
}

export { PutLichVaSuKienModal }
