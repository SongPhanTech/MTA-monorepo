import DatePicker from "@components/commons/date-picker"
import {
  WORK_SCHEDULE_EVENT_TYPES,
  WORK_SCHEDULE_HOST_UNITS,
  WORK_SCHEDULE_PARTICIPANT_ROLES,
  WORK_SCHEDULE_PARTICIPANTS,
} from "@constants/work-schedule-form-mock"
import type { WorkScheduleFormValues } from "@/types/work-schedule-form"
import type { WorkScheduleLeader } from "@/types/work-schedule"
import type { WorkScheduleValidationError } from "@/utils/work-schedule-validation"
import { Avatar, Col, Form, Input, Row, Select, TimePicker, Typography } from "antd"
import { UserOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { useMemo } from "react"
import { ParticipantSelect } from "./participant-select"

const { TextArea } = Input

type WorkScheduleFormProps = {
  leaders: WorkScheduleLeader[]
  values: WorkScheduleFormValues
  validationErrors?: WorkScheduleValidationError[]
  onChange: (patch: Partial<WorkScheduleFormValues>) => void
}

function getLeaderLabel(leader: WorkScheduleLeader) {
  return `${leader.rankTitle} ${leader.fullName}`
}

function getFieldError(
  errors: WorkScheduleValidationError[] | undefined,
  field: WorkScheduleValidationError["field"]
) {
  return errors?.find((error) => error.field === field)?.message
}

export function WorkScheduleForm({
  leaders,
  values,
  validationErrors,
  onChange,
}: WorkScheduleFormProps) {
  const leaderOptions = useMemo(
    () =>
      leaders.map((leader) => ({
        value: leader.id,
        label: getLeaderLabel(leader),
      })),
    [leaders]
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <Typography.Title level={5} className="!mb-4 !text-[#13ab55] uppercase tracking-wide">
        Thông tin lịch công tác
      </Typography.Title>

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Thủ trưởng"
          required
          validateStatus={getFieldError(validationErrors, "leaderId") ? "error" : undefined}
          help={getFieldError(validationErrors, "leaderId")}
        >
          <Select
            value={values.leaderId}
            options={leaderOptions}
            onChange={(leaderId) => onChange({ leaderId })}
            optionRender={(option) => {
              const leader = leaders.find((item) => item.id === option.value)
              if (!leader) return option.label

              return (
                <div className="flex items-center gap-2 py-1">
                  <Avatar size={28} icon={<UserOutlined />} className="!bg-[#13ab55]" />
                  <span>{getLeaderLabel(leader)}</span>
                </div>
              )
            }}
            labelRender={(option) => {
              const leader = leaders.find((item) => item.id === option.value)
              if (!leader) return option.label

              return (
                <div className="flex items-center gap-2">
                  <Avatar size={24} icon={<UserOutlined />} className="!bg-[#13ab55]" />
                  <span>{getLeaderLabel(leader)}</span>
                </div>
              )
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Loại lịch" required>
              <Select
                value={values.eventType}
                options={WORK_SCHEDULE_EVENT_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                onChange={(eventType) => onChange({ eventType })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Ngày" required>
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                value={dayjs(values.date)}
                onChange={(date) => {
                  if (!date) return
                  onChange({ date: date.format("YYYY-MM-DD") })
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Giờ bắt đầu"
              required
              validateStatus={getFieldError(validationErrors, "endTime") ? "error" : undefined}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={15}
                value={dayjs(values.startTime, "HH:mm")}
                onChange={(time) => {
                  if (!time) return
                  onChange({ startTime: time.format("HH:mm") })
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Giờ kết thúc"
              required
              validateStatus={getFieldError(validationErrors, "endTime") ? "error" : undefined}
              help={getFieldError(validationErrors, "endTime")}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={15}
                value={dayjs(values.endTime, "HH:mm")}
                onChange={(time) => {
                  if (!time) return
                  onChange({ endTime: time.format("HH:mm") })
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Nội dung công việc"
          required
          validateStatus={getFieldError(validationErrors, "content") ? "error" : undefined}
          help={getFieldError(validationErrors, "content")}
        >
          <TextArea
            rows={3}
            value={values.content}
            placeholder="Nhập nội dung công việc"
            onChange={(event) => onChange({ content: event.target.value })}
          />
        </Form.Item>

        <Form.Item
          label="Địa điểm"
          required
          validateStatus={getFieldError(validationErrors, "location") ? "error" : undefined}
          help={getFieldError(validationErrors, "location")}
        >
          <Input
            value={values.location}
            placeholder="Nhập địa điểm"
            onChange={(event) => onChange({ location: event.target.value })}
          />
        </Form.Item>

        <Form.Item
          label="Đơn vị chủ trì"
          required
          validateStatus={getFieldError(validationErrors, "hostUnitId") ? "error" : undefined}
          help={getFieldError(validationErrors, "hostUnitId")}
        >
          <Select
            value={values.hostUnitId}
            options={WORK_SCHEDULE_HOST_UNITS.map((unit) => ({
              value: unit.id,
              label: unit.name,
            }))}
            onChange={(hostUnitId) => onChange({ hostUnitId })}
          />
        </Form.Item>

        <Typography.Title level={5} className="!mb-3 !mt-2 !text-[#13ab55] uppercase tracking-wide">
          Thành phần tham dự
        </Typography.Title>

        <Form.Item
          label="Chọn người tham gia"
          required
          validateStatus={getFieldError(validationErrors, "participantIds") ? "error" : undefined}
          help={getFieldError(validationErrors, "participantIds")}
        >
          <ParticipantSelect
            participants={WORK_SCHEDULE_PARTICIPANTS}
            value={values.participantIds}
            onChange={(participantIds) => onChange({ participantIds })}
          />
        </Form.Item>

        <Form.Item label="Vai trò">
          <Select
            value={values.participantRoleId}
            options={WORK_SCHEDULE_PARTICIPANT_ROLES.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            onChange={(participantRoleId) => onChange({ participantRoleId })}
          />
        </Form.Item>
      </Form>
    </div>
  )
}
