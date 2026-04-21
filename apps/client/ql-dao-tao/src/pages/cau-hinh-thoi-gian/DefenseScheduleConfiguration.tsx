import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import {
  useCreateDefenseSession,
  useDeleteDefenseSession,
  useFindManyDefenseSession,
  useUpdateDefenseSession,
} from "@workspace/db/hooks"
import { Button, Col, Flex, Form, message, Modal, Row, TimePicker } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import { useState } from "react"
import EditOutlined from "@components/icons/edit"
import DeleteIcon from "@components/icons/delete"

dayjs.extend(utc)

interface FormValues {
  time: Dayjs | null
}

type DefenseSessionRecord = {
  id: string
  startTime: Date | string
}

/** Giá trị từ API (TIME → Date): luôn đọc phần giờ theo UTC để khớp cách lưu, tránh lệch +1h khi format theo local. */
function formatSessionTimeDisplay(startTime: Date | string | null | undefined): string {
  if (startTime === null || startTime === undefined) {
    return ""
  }
  return dayjs.utc(startTime).format("HH:mm")
}

function timeKeyFromStored(startTime: Date | string): string {
  return dayjs.utc(startTime).format("HH:mm")
}

function timeKeyFromPicker(picked: Dayjs): string {
  return picked.format("HH:mm")
}

/** Lưu đúng hai chữ số giờ/phút người chọn (không phụ thuộc múi giờ máy khi hiển thị lại). */
function toDefenseSessionStartTime(picked: Dayjs): Date {
  return new Date(Date.UTC(1970, 0, 1, picked.hour(), picked.minute(), 0, 0))
}

export default function DefenseScheduleConfigurationPage({
  isThesis: _isThesis,
}: {
  isThesis: boolean
}) {
  const { showSpinner, hideSpinner } = useSpinner()
  const [form] = Form.useForm<FormValues>()

  const { data: rawData = [], refetch } = useFindManyDefenseSession({
    orderBy: { startTime: "asc" },
  })

  const { mutateAsync: createSession } = useCreateDefenseSession()
  const { mutateAsync: updateSession } = useUpdateDefenseSession()
  const { mutateAsync: deleteSession } = useDeleteDefenseSession()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<DefenseSessionRecord | null>(null)

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const picked = values.time ? dayjs(values.time) : null
      if (!picked || !picked.isValid()) {
        message.error("Vui lòng chọn thời gian bắt đầu!")
        return
      }

      const newKey = timeKeyFromPicker(picked)
      const isDuplicated = rawData.some((item) => {
        if (editingRow?.id === item.id) {
          return false
        }
        return timeKeyFromStored(item.startTime) === newKey
      })

      if (isDuplicated) {
        message.error("Thời gian này đã tồn tại thời gian bảo vệ khác!")
        return
      }

      const timeToSave = toDefenseSessionStartTime(picked)

      showSpinner()

      if (editingRow) {
        await updateSession({
          where: { id: editingRow.id },
          data: { startTime: timeToSave },
        })
      } else {
        await createSession({
          data: {
            startTime: timeToSave,
          },
        })
      }

      message.success("Lưu thời gian bảo vệ thành công!")
      setIsModalOpen(false)
      setEditingRow(null)
      form.resetFields()
      await refetch()
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return
      }
      console.error("Save failed:", error)
      message.error("Lưu thời gian bảo vệ thất bại. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      showSpinner()
      await deleteSession({ where: { id } })
      message.success("Xóa thời gian bảo vệ thành công!")
      await refetch()
    } catch (error) {
      console.error("Delete failed:", error)
      message.error("Xóa thời gian bảo vệ thất bại.")
    } finally {
      hideSpinner()
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingRow(null)
    form.resetFields()
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="end">
            <Button
              type="primary"
              onClick={() => {
                setEditingRow(null)
                form.resetFields()
                setIsModalOpen(true)
              }}
            >
              Thêm mới
            </Button>
          </Flex>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            data={rawData}
            pagination={false}
            locale={{ emptyText: "Chưa có thời gian bảo vệ" }}
            columns={[
              {
                title: "STT",
                width: 80,
                align: "center",
                render: (_: unknown, __: unknown, index: number) => index + 1,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "startTime",
                align: "center" as const,
                render: (startTime) => formatSessionTimeDisplay(startTime),
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center" as const,
                fixed: "right" as const,
                render: (_: unknown, record) => {
                  const row = record as DefenseSessionRecord
                  if (!row?.id) {
                    return null
                  }

                  return (
                    <div className="flex justify-center gap-3" key={row.id}>
                      <EditOutlined
                        className="text-sm text-blue-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingRow(row)
                          const u = dayjs.utc(row.startTime)
                          form.setFieldsValue({
                            time: dayjs()
                              .hour(u.hour())
                              .minute(u.minute())
                              .second(0)
                              .millisecond(0),
                          })
                          setIsModalOpen(true)
                        }}
                      />

                      <DeleteIcon
                        title="Xóa thời gian bảo vệ"
                        popConfirm={{
                          title: "Xóa thời gian bảo vệ",
                          description: "Bạn có chắc chắn muốn xóa thời gian bảo vệ này?",
                          onConfirm: () => handleDelete(row.id),
                          onPopupClick: (e) => e.stopPropagation(),
                        }}
                      />
                    </div>
                  )
                },
              },
            ]}
          />
        </Col>
      </Row>
      <Modal
        open={isModalOpen}
        title={editingRow ? "Chỉnh sửa thời gian bảo vệ" : "Thêm mới thời gian bảo vệ"}
        onCancel={handleCancel}
        onOk={handleSave}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="time"
            label="Thời gian bắt đầu"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn thời gian bắt đầu!",
              },
            ]}
          >
            <TimePicker format="HH:mm" className="w-full" placeholder="Chọn thời gian bắt đầu" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
