import { CheckCircleOutlined, FileAddOutlined, SaveOutlined } from "@ant-design/icons"
import { Button, Space } from "antd"

type WorkScheduleActionsProps = {
  onSaveDraft: () => void
  onSaveAndAddNew: () => void
  onSaveAndPublish: () => void
}

export function WorkScheduleActions({
  onSaveDraft,
  onSaveAndAddNew,
  onSaveAndPublish,
}: WorkScheduleActionsProps) {
  return (
    <Space wrap>
      <Button icon={<SaveOutlined />} onClick={onSaveDraft}>
        Lưu nháp
      </Button>
      <Button icon={<FileAddOutlined />} onClick={onSaveAndAddNew}>
        Lưu và thêm mới
      </Button>
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        className="!bg-[#13ab55] hover:!bg-[#10994d]"
        onClick={onSaveAndPublish}
      >
        Lưu và công bố
      </Button>
    </Space>
  )
}
