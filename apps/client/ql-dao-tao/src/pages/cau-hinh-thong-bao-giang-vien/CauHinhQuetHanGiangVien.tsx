import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditOutlined from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import {
  CONFIG_KEY,
  parseLecturerDeadlineCronSchedule,
  stringifyLecturerDeadlineCronSchedule,
  type LecturerDeadlineCronSchedule,
} from "@workspace/constant"
import type { ConfigKey } from "@workspace/db/client"
import { useCreateConfig, useFindUniqueConfig, useUpdateConfig } from "@workspace/db/hooks"
import { Alert, Button, Col, Flex, Form, Modal, Row, Switch, TimePicker, message } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useMemo, useState } from "react"

type GioQuetRow = {
  key: string
  hour: number
}

interface FormValues {
  time: Dayjs | null
}

const CONFIG_KEY_CRON = CONFIG_KEY.LECTURER_DEADLINE_CRON_SCHEDULE as ConfigKey

const formatGioHienThi = (hour: number) => `${String(hour).padStart(2, "0")}:00`

const rowsTuSchedule = (schedule: LecturerDeadlineCronSchedule): GioQuetRow[] =>
  schedule.hours.map((hour) => ({ key: String(hour), hour }))

export default function CauHinhQuetHanGiangVien() {
  const { showSpinner, hideSpinner } = useSpinner()
  const [form] = Form.useForm<FormValues>()

  const { data: configRow, refetch } = useFindUniqueConfig({
    where: { key: CONFIG_KEY_CRON },
  })

  const { mutateAsync: createConfig } = useCreateConfig()
  const { mutateAsync: updateConfig } = useUpdateConfig()

  const savedSchedule = useMemo(
    () => parseLecturerDeadlineCronSchedule(configRow?.value),
    [configRow?.value]
  )

  const [enabled, setEnabled] = useState(savedSchedule.enabled)
  const [rows, setRows] = useState<GioQuetRow[]>(() => rowsTuSchedule(savedSchedule))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHour, setEditingHour] = useState<number | null>(null)

  useEffect(() => {
    setEnabled(savedSchedule.enabled)
    setRows(rowsTuSchedule(savedSchedule))
  }, [savedSchedule])

  const luuSchedule = async (schedule: LecturerDeadlineCronSchedule) => {
    const value = stringifyLecturerDeadlineCronSchedule(schedule)

    showSpinner()
    try {
      if (configRow?.id) {
        await updateConfig({
          where: { id: configRow.id },
          data: { value },
        })
      } else {
        await createConfig({
          data: {
            key: CONFIG_KEY_CRON,
            value,
          },
        })
      }
      await refetch()
      message.success("Lưu cấu hình quét hạn thành công!")
    } catch (error) {
      console.error("Lưu cấu hình quét hạn thất bại:", error)
      message.error("Lưu cấu hình thất bại. Vui lòng thử lại.")
      throw error
    } finally {
      hideSpinner()
    }
  }

  const handleSaveEnabled = async (checked: boolean) => {
    setEnabled(checked)
    try {
      await luuSchedule({
        ...savedSchedule,
        enabled: checked,
        hours: rows.map((r) => r.hour),
      })
    } catch {
      setEnabled(!checked)
    }
  }

  const handleSaveHour = async () => {
    try {
      const values = await form.validateFields()
      const picked = values.time ? dayjs(values.time) : null
      if (!picked?.isValid()) {
        message.error("Vui lòng chọn giờ quét!")
        return
      }

      const hour = picked.hour()
      const trung = rows.some((row) => row.hour === hour && row.hour !== editingHour)
      if (trung) {
        message.error("Giờ quét này đã tồn tại!")
        return
      }

      const hoursMoi =
        editingHour === null
          ? [...rows.map((r) => r.hour), hour]
          : rows.map((r) => (r.hour === editingHour ? hour : r.hour))

      await luuSchedule({
        ...savedSchedule,
        enabled,
        hours: hoursMoi,
      })

      setIsModalOpen(false)
      setEditingHour(null)
      form.resetFields()
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return
      }
    }
  }

  const handleDeleteHour = async (hour: number) => {
    if (rows.length <= 1) {
      message.error("Phải giữ ít nhất một mốc giờ quét!")
      return
    }

    try {
      await luuSchedule({
        ...savedSchedule,
        enabled,
        hours: rows.filter((r) => r.hour !== hour).map((r) => r.hour),
      })
    } catch {
      // đã hiện message trong luuSchedule
    }
  }

  return (
    <>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Cron quét hạn nhập điểm & khảo sát cho giảng viên"
        description="Lịch chạy được lưu trong cấu hình hệ thống. Backend đọc lại trước mỗi lần lên lịch. Biến môi trường CRON_QUET_HAN_GV_ENABLED=false vẫn tắt hẳn cron trên server."
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Flex align="center" gap={8}>
              <span>Bật quét tự động:</span>
              <Switch checked={enabled} onChange={handleSaveEnabled} />
            </Flex>
            <Button
              type="primary"
              onClick={() => {
                setEditingHour(null)
                form.resetFields()
                setIsModalOpen(true)
              }}
            >
              Thêm mốc giờ
            </Button>
          </Flex>
        </Col>

        <Col span={24}>
          <Table
            rowKey="key"
            data={rows}
            pagination={false}
            locale={{ emptyText: "Chưa có mốc giờ quét" }}
            columns={[
              {
                title: "STT",
                width: 80,
                align: "center",
                render: (_, __, index: number) => index + 1,
              },
              {
                title: "Giờ quét (VN)",
                dataIndex: "hour",
                align: "center",
                render: (hour: number) => formatGioHienThi(hour),
              },
              {
                title: "Múi giờ",
                render: () => savedSchedule.timezone,
                align: "center",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <div className="flex justify-center gap-3">
                    <EditOutlined
                      className="text-sm text-blue-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingHour(record.hour)
                        form.setFieldsValue({
                          time: dayjs().hour(record.hour).minute(0).second(0).millisecond(0),
                        })
                        setIsModalOpen(true)
                      }}
                    />
                    <DeleteIcon
                      title="Xóa mốc giờ"
                      popConfirm={{
                        title: "Xóa mốc giờ quét",
                        description: "Bạn có chắc chắn muốn xóa mốc giờ này?",
                        onConfirm: () => handleDeleteHour(record.hour),
                        onPopupClick: (e) => e.stopPropagation(),
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Col>
      </Row>

      <Modal
        open={isModalOpen}
        title={editingHour === null ? "Thêm mốc giờ quét" : "Chỉnh sửa mốc giờ quét"}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingHour(null)
          form.resetFields()
        }}
        onOk={handleSaveHour}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="time"
            label="Giờ quét trong ngày"
            rules={[{ required: true, message: "Vui lòng chọn giờ quét!" }]}
          >
            <TimePicker
              format="HH:mm"
              className="w-full"
              placeholder="Chọn giờ (phút sẽ được làm tròn về :00)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
