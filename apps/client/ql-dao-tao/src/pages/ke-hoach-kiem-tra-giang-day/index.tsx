import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import DefaultLayout from "@layouts/default-layout"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, DatePicker, Flex, Form, Input, message, Modal, Row, TimePicker } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useState } from "react"
import {
  type LichKiemTraItem,
  saveToLocalStorage,
  getFromLocalStorage,
} from "@constants/ke-hoach-kem-tra"

export default function LichKiemTraKeHoach() {
  const { can } = useAbility()
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [data, setData] = useState<LichKiemTraItem[]>(() => getFromLocalStorage())
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
  function handleOpenModal() {
    form.resetFields()
    setIsModalOpen(true)
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const newItem: LichKiemTraItem = {
        id: generateId(),
        classDate: values.classDate.toISOString(),
        startTime: values.time[0].toISOString(),
        endTime: values.time[1].toISOString(),
        startPeriod: Number(values.startPeriod),
        endPeriod: Number(values.endPeriod),
        location: values.location ?? "",
        notes: values.notes ?? "",
      }
      setData((prev) => {
        const updated = [...prev, newItem]
        saveToLocalStorage(updated)
        return updated
      })
      setIsModalOpen(false)
      message.success("Đã thêm kế hoạch")
    })
  }

  function handleDelete(id: string) {
    setData((prev) => {
      const updated = prev.filter((i) => i.id !== id)
      saveToLocalStorage(updated)
      return updated
    })
    message.success("Đã xóa")
  }

  const pagedData = data.slice((currentPage - 1) * numberOfPages, currentPage * numberOfPages)

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="end">
            {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY, "THEM") && (
              <Button type="primary" onClick={handleOpenModal}>
                Thêm mới
              </Button>
            )}
          </Flex>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Ngày",
                dataIndex: "classDate",
                width: 150,
                align: "center",
                render: (_, record) =>
                  record.classDate ? dayjs(record.classDate).format("DD/MM/YYYY") : "-",
              },
              {
                title: "Thời gian",
                width: 150,
                align: "center",
                render: (_, record) =>
                  record.startTime && record.endTime
                    ? `${dayjs(record.startTime).format("HH:mm")} - ${dayjs(record.endTime).format("HH:mm")}`
                    : "-",
              },
              {
                title: "Tiết bắt đầu",
                dataIndex: "startPeriod",
                width: 120,
                align: "center",
              },
              {
                title: "Tiết kết thúc",
                dataIndex: "endPeriod",
                width: 120,
                align: "center",
              },
              {
                title: "Địa điểm",
                dataIndex: "location",
                align: "center",
                width: 250,
              },
              {
                title: "Nội dung",
                dataIndex: "notes",
                align: "center",
              },
              {
                title: "Thao tác",
                width: 80,
                align: "center",
                hidden: !can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_KIEM_TRA_GIANG_DAY, "XOA"),
                render: (_, record) => (
                  <Row className="justify-center">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_KIEM_TRA_GIANG_DAY, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(record.id),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
            data={pagedData}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: data.length,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>

      <Modal
        open={isModalOpen}
        title="Thêm kế hoạch"
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="classDate"
            label="Ngày"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>

          <Form.Item
            name="time"
            label="Thời gian"
            rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
          >
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item
            name="startPeriod"
            label="Tiết bắt đầu"
            rules={[{ required: true, message: "Vui lòng nhập tiết bắt đầu" }]}
          >
            <Input type="number" placeholder="VD: 1" />
          </Form.Item>

          <Form.Item
            name="endPeriod"
            label="Tiết kết thúc"
            rules={[{ required: true, message: "Vui lòng nhập tiết kết thúc" }]}
          >
            <Input type="number" placeholder="VD: 4" />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm">
            <Input placeholder="Nhập địa điểm" />
          </Form.Item>

          <Form.Item name="notes" label="Nội dung">
            <Input.TextArea placeholder="Nhập nội dung" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

LichKiemTraKeHoach.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
