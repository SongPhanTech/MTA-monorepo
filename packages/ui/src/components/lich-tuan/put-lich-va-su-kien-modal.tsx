import { CalendarOutlined } from '@ant-design/icons'
import { PeriodType } from '@workspace/db/client'
import {
    useCreateClassSchedule,
    useDeleteClassSchedule,
    useDeleteManyClassSchedule,
    useFindManyUserProfile,
    useFindUniqueClassSchedule,
    useUpdateClassSchedule,
    useUpdateManyClassSchedule,
} from '@workspace/db/hooks'
import { Button, Checkbox, Col, DatePicker, Form, Input, Row, Select, Tooltip, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { FormItem, InputSuggestion, PutFormModal, type PutModalFormType } from '../commons'
import { CollapsibleField } from './collapsible-field'
import { TYPE_WORK_SCHEDULE_COLOR_OPTIONS } from './lich-tuan'
export type PutLichVaSuKienFormType = {
    id?: string
    startTime?: Dayjs
    endTime?: Dayjs
    content?: string
    location?: string
    host?: string[]
    attendees?: string[]
    color?: string
    note?: string
    type?: PeriodType // PERSONAL, WEEKLY, OTHER
    allDay?: boolean
} & PutModalFormType

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
        source?: 'single-day' | 'multi-day' // single-day: chỉ 1 ngày, multi-day: nhiều ngày
        type: PeriodType //PERSONAL, WEEKLY, OTHER
    }>({
        tag: 'PutLichVaSuKienModal',
    })
    const userIdLogin = window?.contextData?.userId || ''
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [form] = Form.useForm<PutLichVaSuKienFormType>()
    const isSingleDaySchedule = payload?.source === 'single-day' // Kiểm tra có phải lịch 1 ngày không
    const allDayValue = Form.useWatch('allDay', form)
    const { data: event } = useFindUniqueClassSchedule(
        {
            where: {
                id: payload?.id,
            },
            include: {
                userProfiles: true,
            },
        },
        {
            enabled: !!payload?.id,
        }
    )

    const { data: profiles = [] } = useFindManyUserProfile({
        include: {
            
        },
    })

    const { mutateAsync: deleteClassSchedule } = useDeleteClassSchedule({
        onError: (error: any) => {
            message.error(`Xóa sự kiện thất bại: ${error.message}`)
        },
    })
    const { mutateAsync: deleteManyClassSchedule } = useDeleteManyClassSchedule({
        // Không hiển thị lỗi khi xóa hàng loạt vì đã có phương án dự phòng
    })
    const { mutateAsync: updateClassSchedule } = useUpdateClassSchedule({
        onError: (error: any) => {
            message.error(`Cập nhật sự kiện thất bại: ${error.message}`)
        },
    })
    const { mutateAsync: updateManyClassSchedule } = useUpdateManyClassSchedule({
        // Không hiển thị lỗi khi cập nhật hàng loạt vì đã có phương án dự phòng
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
        if (!values.content || values.content.trim() === '') {
            message.error('Vui lòng nhập nội dung công việc')
            return
        }

        let finalStartTime = values.startTime
        let finalEndTime = values.endTime

        // Handle all day events
        if (values.allDay) {
            if (values.startTime) {
                finalStartTime = dayjs(values.startTime).startOf('day')
            }
            if (values.endTime) {
                finalEndTime = dayjs(values.endTime).endOf('day')
            }
        }

        if (isSingleDaySchedule && payload?.slot?.startTime) {
            const baseDate = dayjs(payload.slot.startTime)
            if (values.allDay) {
                finalStartTime = baseDate.startOf('day')
                finalEndTime = baseDate.endOf('day')
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
            message.error('Vui lòng chọn thời gian bắt đầu và kết thúc')
            return
        }

        if (dayjs(finalStartTime).isAfter(finalEndTime)) {
            message.error('Thời gian bắt đầu không thể lớn hơn thời gian kết thúc')
            return
        }
        if (isSingleDaySchedule && !dayjs(finalStartTime).isSame(finalEndTime, 'day')) {
            message.error('Lịch này chỉ có thể trong cùng một ngày')
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
            const defaultHost =
                payload?.type === PeriodType.WEEK && userIdLogin ? [userIdLogin] : []

            form.resetFields()
            // Set default values for new event
            const slotStartTime = payload?.slot?.startTime
                ? dayjs(payload.slot.startTime)
                : undefined
            const slotEndTime = payload?.slot?.endTime ? dayjs(payload.slot.endTime) : undefined

            // Calculate smart default times based on current time
            let defaultStartTime = slotStartTime
            let defaultEndTime = slotEndTime
            let defaultAllDay = false

            if (slotStartTime && !payload?.id) {
                // For new events, check if this is a multi-day selection
                const isMultiDaySelection =
                    slotStartTime && slotEndTime && !slotStartTime.isSame(slotEndTime, 'day')

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
                        const slotDate = slotStartTime.startOf('day')

                        if (slotDate.isSameOrAfter(now, 'day')) {
                            if (slotDate.isSame(now, 'day')) {
                                // For today, use smart timing based on current time
                                const currentMinutes = now.minute()
                                let roundedTime = now

                                if (currentMinutes < 30) {
                                    // Round to 30 minutes of current hour
                                    roundedTime = now.minute(30).second(0).millisecond(0)
                                } else {
                                    // Round to next hour at 00 minutes
                                    roundedTime = now
                                        .add(1, 'hour')
                                        .minute(0)
                                        .second(0)
                                        .millisecond(0)
                                }

                                // If rounded time is in the past or current time, add 30 minutes
                                const smartStartTime = roundedTime.isBefore(now)
                                    ? roundedTime.add(30, 'minute')
                                    : roundedTime

                                defaultStartTime = slotDate
                                    .hour(smartStartTime.hour())
                                    .minute(smartStartTime.minute())
                                    .second(0)
                                    .millisecond(0)

                                // End time is 1 hour after start time
                                defaultEndTime = defaultStartTime.add(1, 'hour')
                                defaultAllDay = false
                            } else {
                                // For future dates (tomorrow and beyond), start at 6:00 AM
                                defaultStartTime = slotDate
                                    .hour(6)
                                    .minute(0)
                                    .second(0)
                                    .millisecond(0)
                                defaultEndTime = defaultStartTime.add(1, 'hour')
                                defaultAllDay = false
                            }
                        } else {
                            // For past dates, use reasonable default (9 AM - 10 AM)
                            defaultStartTime = slotDate.hour(9).minute(0).second(0).millisecond(0)
                            defaultEndTime = defaultStartTime.add(1, 'hour')
                            defaultAllDay = false
                        }
                    }
                }
            }

            form.setFieldsValue({
                color: TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value || '#b3d4fc',
                type: payload?.type || PeriodType.WEEK,
                host: defaultHost,
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
                const hostData = separateProfilesAndCustomText(values.host || [])
                const attendeesData = separateProfilesAndCustomText(values.attendees || [])
                if (payload?.id) {
                    // Update the main event
                    // Close modal immediately before mutation if requested
                    if (!keepOpen && typeof onClose === 'function') {
                        onClose()
                    }
                    await updateClassSchedule({
                        where: { id: payload.id },
                        data: {
                            notes: values.content?.trim() || '',
                            startTime: dayjs(finalStartTime).toISOString(),
                            endTime: dayjs(finalEndTime).toISOString(),
                            location: values.location?.trim() || '',
                            host: hostData.customTexts,
                            attendees: attendeesData.customTexts,
                            hostProfile: {
                                set: hostData.profileIds.map((id) => ({ id })),
                            },
                            attendeesProfile: {
                                set: attendeesData.profileIds.map((id) => ({
                                    id,
                                })),
                            },
                            type: (event?.periodType as PeriodType) || PeriodType.WEEK,
                        },
                    })
                    // Show success message
                    message.success('Cập nhật sự kiện thành công')
                } else {
                    // Create the main event
                    const baseData = {
                        content: values.content?.trim() || '',
                        startTime: dayjs(finalStartTime).toISOString(),
                        endTime: dayjs(finalEndTime).toISOString(),
                        color:
                            values.color || TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value || '#b3d4fc',
                        note: values.note?.trim() || '',
                        location: values.location?.trim() || '',
                        host: hostData.customTexts,
                        attendees: attendeesData.customTexts,
                        hostProfile: {
                            connect: hostData.profileIds.map((id) => ({
                                id,
                            })),
                        },
                        attendeesProfile: {
                            connect: attendeesData.profileIds.map((id) => ({
                                id,
                            })),
                        },
                        type: (payload?.type as PeriodType) || PeriodType.WEEK,
                    }

                    // Close modal immediately before mutation if requested
                    if (!keepOpen && typeof onClose === 'function') {
                        onClose()
                    }
                    await createClassSchedule({ data: baseData })
                    // Show success message
                    message.success('Tạo sự kiện thành công')
                }
                // message.success(
                //     `${payload?.id ? 'Cập nhật' : 'Thêm mới'} thành công`
                // )
            } catch (error) {
                // console.error('Save error:', error)
                message.error(`${payload?.id ? 'Cập nhật' : 'Thêm mới'} thất bại`)
                setIsLoading(false)
                // Don't close modal on error, let user retry
            } finally {
                // Ensure loading state is always reset
                setIsLoading(false)
            }
        }, 0) // Execute in next tick to avoid blocking UI
    }

    const handleDelete = async () => {
        console.log('Delete handler called:', {
            payloadId: payload?.id,
        })

        if (!payload?.id || isDeleting) {
            // console.error('No payload.id found or already deleting')
            return
        }

        setIsDeleting(true)

        // Regular single event deletion without confirmation
        try {
            console.log('Deleting regular single event:', payload.id)
            await deleteClassSchedule({ where: { id: payload.id } })
            message.success('Xóa công việc thành công')
        } catch (error) {
            // console.error('Regular delete failed:', error)
            message.error('Xóa công việc thất bại')
        } finally {
            setIsDeleting(false)
        }
        onClose()
    }

    useEffect(() => {
        if (payload?.id && event) {
            const hostValues = combineProfilesAndCustomText(event.hostProfile, event.host)
            const attendeesValues = combineProfilesAndCustomText(
                event.attendeesProfile,
                event.attendees
            )

            // Kiểm tra có phải sự kiện cả ngày (00:00 đến 23:59)
            const isAllDay = (() => {
                if (!event.startTime || !event.endTime) return false

                const startTime = dayjs(event.startTime)
                const endTime = dayjs(event.endTime)

                // Bắt đầu lúc 00:00:00?
                const isStartOfDay = startTime.isSame(startTime.startOf('day'))

                // Kết thúc lúc 23:59 hoặc cuối ngày?
                const isEndAtNightTime = endTime.hour() === 23 && endTime.minute() === 59
                const isEndOfDay = endTime.isSame(endTime.endOf('day'))

                const isValidEndTime = isEndAtNightTime || isEndOfDay

                console.log('Kiểm tra cả ngày:', {
                    startTime: event.startTime,
                    endTime: event.endTime,
                    startHour: startTime.hour(),
                    startMinute: startTime.minute(),
                    endHour: endTime.hour(),
                    endMinute: endTime.minute(),
                    isStartOfDay,
                    isEndAtNightTime,
                    isEndOfDay,
                    isValidEndTime,
                    result: isStartOfDay && isValidEndTime,
                })

                return isStartOfDay && isValidEndTime
            })()

            form.setFieldsValue({
                id: payload.id,
                content: event.notes || '',
                startTime: event.startTime ? dayjs(event.startTime) : undefined,
                endTime: event.endTime ? dayjs(event.endTime) : undefined,
                note: event.notes || '',
                location: event?.location ?? event?.room?.name ?? '',
                host: hostValues,
                attendees: attendeesValues,
                type: event.periodType || PeriodType.WEEK,
                allDay: isAllDay,
            })
        } else if (!payload?.id && isOpen) {
            // Chỉ reset form khi modal mở và không có ID (tạo mới)
            const defaultHost =
                payload?.type === PeriodType.WEEK && userIdLogin ? [userIdLogin] : []

            form.resetFields()
            // Set giá trị mặc định sau khi reset
            const slotStartTime = payload?.slot?.startTime
                ? dayjs(payload.slot.startTime)
                : undefined
            const slotEndTime = payload?.slot?.endTime ? dayjs(payload.slot.endTime) : undefined

            // Calculate smart default times based on current time
            let defaultStartTime = slotStartTime
            let defaultEndTime = slotEndTime
            let defaultAllDay = false

            if (slotStartTime && !payload?.id) {
                // For new events, check if this is a multi-day selection
                const isMultiDaySelection =
                    slotStartTime && slotEndTime && !slotStartTime.isSame(slotEndTime, 'day')

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
                        const slotDate = slotStartTime.startOf('day')

                        if (slotDate.isSameOrAfter(now, 'day')) {
                            if (slotDate.isSame(now, 'day')) {
                                // For today, use smart timing based on current time
                                const currentMinutes = now.minute()
                                let roundedTime = now

                                if (currentMinutes < 30) {
                                    // Round to 30 minutes of current hour
                                    roundedTime = now.minute(30).second(0).millisecond(0)
                                } else {
                                    // Round to next hour at 00 minutes
                                    roundedTime = now
                                        .add(1, 'hour')
                                        .minute(0)
                                        .second(0)
                                        .millisecond(0)
                                }

                                // If rounded time is in the past or current time, add 30 minutes
                                const smartStartTime = roundedTime.isBefore(now)
                                    ? roundedTime.add(30, 'minute')
                                    : roundedTime

                                defaultStartTime = slotDate
                                    .hour(smartStartTime.hour())
                                    .minute(smartStartTime.minute())
                                    .second(0)
                                    .millisecond(0)

                                // End time is 1 hour after start time
                                defaultEndTime = defaultStartTime.add(1, 'hour')
                                defaultAllDay = false
                            } else {
                                // For future dates (tomorrow and beyond), start at 6:00 AM
                                defaultStartTime = slotDate
                                    .hour(6)
                                    .minute(0)
                                    .second(0)
                                    .millisecond(0)
                                defaultEndTime = defaultStartTime.add(1, 'hour')
                                defaultAllDay = false
                            }
                        } else {
                            // For past dates, use reasonable default (9 AM - 10 AM)
                            defaultStartTime = slotDate.hour(9).minute(0).second(0).millisecond(0)
                            defaultEndTime = defaultStartTime.add(1, 'hour')
                            defaultAllDay = false
                        }
                    }
                }
            }

            form.setFieldsValue({
                color: TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value || '#b3d4fc',
                type: payload?.type || PeriodType.WEEK,
                host: defaultHost,
                startTime: defaultStartTime,
                endTime: defaultEndTime,
                allDay: defaultAllDay, // Use calculated allDay value based on selection type
            })
        }
    }, [
        payload?.id,
        event,
        form,
        isOpen,
        payload?.type,
        payload?.slot,
        userIdLogin,
        combineProfilesAndCustomText,
        isSingleDaySchedule,
    ])
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
            closable={false}
            width={480}
            initialValues={undefined}
            footer={
                <div className="flex justify-between gap-2">
                    {!!payload?.id && payload?.id === event?.createdBy ? (
                        <Button
                            danger
                            type="primary"
                            disabled={isLoading || isDeleting}
                            loading={isDeleting}
                            onClick={handleDelete}
                        >
                            Xoá
                        </Button>
                    ) : (
                        <p />
                    )}
                    {(!payload?.id || (!!payload?.id && payload?.id === event?.createdBy)) && (
                        <div className="flex gap-2">
                            <Button onClick={onClose}>Huỷ</Button>
                            <Button
                                type="primary"
                                onClick={() => form.submit()}
                                loading={isLoading}
                            >
                                Lưu
                            </Button>
                            {isSingleDaySchedule && !payload?.id && (
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        form.validateFields().then((values) =>
                                            onFinish(values, true)
                                        )
                                    }}
                                    loading={isLoading}
                                >
                                    Lưu & Tiếp tục
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            {/* Hiển thị ngày cho lịch 1 ngày */}
            {isSingleDaySchedule && payload?.slot?.startTime && (
                <Col span={24}>
                    <div
                        style={{
                            background: '#f5f5f5',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e8e8e8',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#333333',
                        }}
                    >
                        📅 {dayjs(payload.slot.startTime).format('dddd DD/MM/YYYY ')}
                    </div>
                </Col>
            )}

            <Col span={24}>
                <FormItem
                    name="content"
                    form={form}
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập nội dung công việc',
                        },
                        {
                            whitespace: true,
                            message: 'Nội dung công việc không được để trống',
                        },
                    ]}
                >
                    <Input.TextArea
                        disabled={isLoading}
                        rows={3}
                        style={{ resize: 'none' }}
                        placeholder="Nhập nội dung công việc"
                    />
                </FormItem>
            </Col>

            <CollapsibleField
                title=""
                icon={<CalendarOutlined />}
                summary={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        {(() => {
                            const startTime = form.getFieldValue('startTime')
                            const endTime = form.getFieldValue('endTime')
                            const allDay = form.getFieldValue('allDay')
                            const color =
                                form.getFieldValue('color') ||
                                TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value ||
                                '#b3d4fc'

                            const formatTime = (date: Dayjs) => {
                                if (!date) return ''
                                return allDay
                                    ? date.format('DD/MM/YYYY')
                                    : date.format('DD/MM/YYYY HH:mm')
                            }

                            return (
                                <>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            border: `2px solid ${color}`,
                                        }}
                                    />
                                    <span>
                                        {startTime && endTime
                                            ? (() => {
                                                  // Check if same day
                                                  if (
                                                      startTime.format('DD/MM/YYYY') ===
                                                      endTime.format('DD/MM/YYYY')
                                                  ) {
                                                      // Same day - show date once with time range
                                                      if (allDay) {
                                                          return startTime.format('DD/MM/YYYY')
                                                          // biome-ignore lint/style/noUselessElse: <explanation>
                                                      } else {
                                                          return `${startTime.format('DD/MM/YYYY')} ${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`
                                                      }
                                                      // biome-ignore lint/style/noUselessElse: <explanation>
                                                  } else {
                                                      // Different days - show full range
                                                      return `${formatTime(startTime)} - ${formatTime(endTime)}`
                                                  }
                                              })()
                                            : startTime
                                              ? formatTime(startTime)
                                              : 'Chưa chọn thời gian'}
                                    </span>
                                    {allDay && <span style={{ color: '#47a1dd' }}>• Cả ngày</span>}
                                </>
                            )
                        })()}
                    </div>
                }
            >
                <Row gutter={[12, 12]}>
                    <Col span={10}>
                        <FormItem name="startTime" form={form}>
                            <DatePicker
                                disabled={isLoading}
                                className="w-full"
                                format={{
                                    format: allDayValue ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm',
                                    type: 'mask',
                                }}
                                placeholder="Chọn thời điểm bắt đầu"
                                needConfirm={false}
                                showTime={
                                    !allDayValue
                                        ? {
                                              defaultValue: dayjs('00:00', 'HH:mm'),
                                          }
                                        : false
                                }
                                onChange={(date) => {
                                    const endTime = form.getFieldValue('endTime')
                                    if (endTime && date && endTime.isBefore(date)) {
                                        form.setFieldsValue({
                                            endTime: undefined,
                                        })
                                    }
                                }}
                            />
                        </FormItem>
                    </Col>
                    <Col span={10}>
                        <FormItem name="endTime" form={form}>
                            <DatePicker
                                needConfirm={false}
                                disabled={isLoading}
                                className="w-full"
                                format={{
                                    format: allDayValue ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm',
                                    type: 'mask',
                                }}
                                placeholder="Chọn thời điểm kết thúc"
                                showTime={
                                    !allDayValue
                                        ? {
                                              defaultValue: dayjs('00:00', 'HH:mm'),
                                          }
                                        : false
                                }
                                disabledDate={(current) => {
                                    const startTime = form.getFieldValue('startTime')
                                    return (
                                        startTime && current && current.isBefore(startTime, 'day')
                                    )
                                }}
                                disabledTime={(current) => {
                                    const startTime = form.getFieldValue('startTime')
                                    if (allDayValue) return {}

                                    if (
                                        !startTime ||
                                        !current ||
                                        !current.isSame(startTime, 'day')
                                    ) {
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
                    <Col span={4}>
                        <FormItem name="color" form={form}>
                            <Select
                                disabled={isLoading}
                                value={
                                    form.getFieldValue('color') ||
                                    TYPE_WORK_SCHEDULE_COLOR_OPTIONS[0]?.value ||
                                    '#b3d4fc'
                                }
                                onChange={(value) => form.setFieldsValue({ color: value })}
                                suffixIcon={null}
                                className="text-center"
                                style={{
                                    textAlign: 'center',
                                }}
                                dropdownStyle={{
                                    textAlign: 'center',
                                }}
                                options={TYPE_WORK_SCHEDULE_COLOR_OPTIONS?.map((opt) => ({
                                    label: (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: '13px',
                                                    height: '13px',
                                                    borderRadius: '50%',
                                                    backgroundColor: opt?.value,
                                                    border: `2px solid ${opt?.value}`,
                                                    minHeight: '13px',
                                                    minWidth: '13px',
                                                }}
                                            />
                                        </div>
                                    ),
                                    value: opt.value,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={10}>
                        <FormItem name="allDay" form={form} valuePropName="checked">
                            <Checkbox
                                onChange={(e) => {
                                    const checked = e.target.checked
                                    form.setFieldsValue({ allDay: checked })

                                    const startTime = form.getFieldValue('startTime')
                                    const endTime = form.getFieldValue('endTime')

                                    if (checked && startTime && endTime) {
                                        form.setFieldsValue({
                                            startTime: dayjs(startTime).startOf('day'),
                                            endTime: dayjs(endTime).endOf('day'),
                                        })
                                    }
                                }}
                            >
                                Cả ngày
                            </Checkbox>
                        </FormItem>
                    </Col>
                </Row>
            </CollapsibleField>

            <Col span={24}>
                <FormItem name="host" form={form}>
                    <Select
                        disabled={isLoading}
                        mode="tags"
                        allowClear
                        className="w-full modern-borderless-input"
                        placeholder="Chọn người chủ trì hoặc nhập tên tùy chỉnh"
                        maxTagCount={2}
                        maxTagPlaceholder={(omittedValues) => (
                            <Tooltip
                                styles={{ root: { pointerEvents: 'none' } }}
                                title={omittedValues
                                    .map(({ value }) => {
                                        const profile = profiles.find((p) => p.id === value)
                                        return profile
                                            ? profile.fullname ||
                                                  `${profile.firstName} ${profile.lastName}`
                                            : value
                                    })
                                    .join(', ')}
                            >
                                <span>+{omittedValues.length}</span>
                            </Tooltip>
                        )}
                        options={(() => {
                            // Sort profiles: logged-in user first for PERSONAL type
                            const sortedProfiles = [...profiles]
                            if (payload?.type === PeriodType.PERSONAL && userIdLogin) {
                                sortedProfiles.sort((a, b) => {
                                    if (a.id === userIdLogin) return -1
                                    if (b.id === userIdLogin) return 1
                                    return 0
                                })
                            }
                            return sortedProfiles.map((profile) => ({
                                label: (
                                    <span style={{ color: '#333333' }}>
                                        {profile.fullname ||
                                            `${profile.firstName} ${profile.lastName}`}
                                        {profile.organization?.name && (
                                            <span
                                                style={{
                                                    // color: '#1890ff',
                                                    marginLeft: '8px',
                                                }}
                                                className="text-primary"
                                            >
                                                ({profile.organization.name})
                                            </span>
                                        )}
                                    </span>
                                ),
                                value: profile.id,
                            }))
                        })()}
                        showSearch
                        filterOption={(input, option) => {
                            // Find the profile data by option value (profile.id)
                            const profile = profiles.find((p) => p.id === option?.value)
                            if (!profile) return false

                            const fullname =
                                profile.fullname || `${profile.firstName} ${profile.lastName}`
                            const orgName = profile.organization?.name || ''
                            const searchText = `${fullname} ${orgName}`.toLowerCase()

                            return searchText.includes(input.toLowerCase())
                        }}
                        tokenSeparators={[',', ';']}
                        onDeselect={(value) => {
                            // Prevent removing logged-in user for PERSONAL type
                            if (payload?.type === PeriodType.WEEK && value === userIdLogin) {
                                setTimeout(() => {
                                    const currentHosts = form.getFieldValue('host') || []
                                    if (!currentHosts.includes(userIdLogin)) {
                                        form.setFieldsValue({
                                            host: [...currentHosts, userIdLogin],
                                        })
                                    }
                                }, 0)
                            }
                        }}
                        onClear={() => {
                            if (payload?.type === PeriodType.WEEK && userIdLogin) {
                                setTimeout(() => {
                                    form.setFieldsValue({ host: [userIdLogin] })
                                }, 0)
                            }
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem name="attendees" form={form}>
                    <Select
                        disabled={isLoading}
                        mode="tags"
                        allowClear
                        className="w-full modern-borderless-input"
                        placeholder="Chọn thành phần tham dự hoặc nhập tên tùy chỉnh"
                        maxTagCount={2}
                        maxTagPlaceholder={(omittedValues) => (
                            <Tooltip
                                styles={{ root: { pointerEvents: 'none' } }}
                                title={omittedValues
                                    .map(({ value }) => {
                                        const profile = profiles.find((p) => p.id === value)
                                        return profile
                                            ? profile.fullname ||
                                                  `${profile.firstName} ${profile.lastName}`
                                            : value
                                    })
                                    .join(', ')}
                            >
                                <span>+{omittedValues.length}</span>
                            </Tooltip>
                        )}
                        options={profiles.map((profile) => ({
                            label: (
                                <span style={{ color: '#333333' }}>
                                    {profile.fullname || `${profile.firstName} ${profile.lastName}`}
                                    {profile.organization?.name && (
                                        <span
                                            style={{
                                                marginLeft: '8px',
                                            }}
                                            className="text-primary"
                                        >
                                            ({profile.organization.name})
                                        </span>
                                    )}
                                </span>
                            ),
                            value: profile.id,
                        }))}
                        showSearch
                        filterOption={(input, option) => {
                            // Find the profile data by option value (profile.id)
                            const profile = profiles.find((p) => p.id === option?.value)
                            if (!profile) return false

                            const fullname =
                                profile.fullname || `${profile.firstName} ${profile.lastName}`
                            const orgName = profile.organization?.name || ''
                            const searchText = `${fullname} ${orgName}`.toLowerCase()

                            return searchText.includes(input.toLowerCase())
                        }}
                        tokenSeparators={[',', ';']}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem name="location" form={form}>
                    <InputSuggestion
                        disabled={isLoading}
                        className="w-full modern-borderless-input"
                        placeholder="Nhập địa điểm"
                        suggestionKey="event_location"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem name="note" form={form}>
                    <Input.TextArea
                        disabled={isLoading}
                        rows={3}
                        className="w-full modern-borderless-input"
                        placeholder="Nhập ghi chú"
                        style={{ resize: 'none' }}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export { PutLichVaSuKienModal }
