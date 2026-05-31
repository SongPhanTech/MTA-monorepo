import type { WorkScheduleParticipant } from "@/types/work-schedule-form"
import { Avatar, Button, Checkbox, Divider, Input, Select } from "antd"
import { SearchOutlined, UserOutlined } from "@ant-design/icons"
import { useMemo, useState } from "react"

type ParticipantSelectProps = {
  participants: WorkScheduleParticipant[]
  value: string[]
  onChange: (value: string[]) => void
}

export function ParticipantSelect({ participants, value, onChange }: ParticipantSelectProps) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return participants

    return participants.filter(
      (participant) =>
        participant.fullName.toLowerCase().includes(keyword) ||
        participant.department.toLowerCase().includes(keyword)
    )
  }, [participants, search])

  const toggleParticipant = (participantId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, participantId])
      return
    }

    onChange(value.filter((id) => id !== participantId))
  }

  return (
    <Select
      mode="multiple"
      open={open}
      onOpenChange={setOpen}
      value={value}
      placeholder="Chọn người tham gia"
      optionLabelProp="label"
      maxTagCount="responsive"
      popupMatchSelectWidth={false}
      dropdownStyle={{ width: 420 }}
      tagRender={(props) => {
        const participant = participants.find((item) => item.id === props.value)
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-2 py-0.5 mr-1">
            <Avatar size={18} icon={<UserOutlined />} className="!bg-[#13ab55]" />
            <span>{participant?.fullName ?? props.label}</span>
          </span>
        )
      }}
      options={[]}
      onChange={onChange}
      dropdownRender={() => (
        <div className="p-2">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm theo tên hoặc đơn vị"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="mt-2 max-h-56 overflow-y-auto">
            {filteredParticipants.map((participant) => (
              <label
                key={participant.id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-[#f5f5f5]"
              >
                <Checkbox
                  checked={value.includes(participant.id)}
                  onChange={(event) => toggleParticipant(participant.id, event.target.checked)}
                />
                <div>
                  <div className="font-medium">{participant.fullName}</div>
                  <div className="text-xs text-gray-500">{participant.department}</div>
                </div>
              </label>
            ))}
          </div>

          <Divider className="!my-2" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Đã chọn {value.length} / {participants.length} người
            </span>
            <Button type="primary" size="small" className="!bg-[#13ab55]" onClick={() => setOpen(false)}>
              Xong
            </Button>
          </div>
        </div>
      )}
    />
  )
}
