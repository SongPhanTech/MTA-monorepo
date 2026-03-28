import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DoiTuongChinhSach } from "@workspace/db"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutDoiTuongChinhSachModal() {
  const [form] = Form.useForm<DoiTuongChinhSach>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<DoiTuongChinhSach> & { onSave: (val: DoiTuongChinhSach) => void }
  >({
    tag: "PutDoiTuongChinhSachModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(output: any) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(
        isEdit
          ? "Cập nhật đối tượng chính sách thành công"
          : "Thêm mới đối tượng chính sách thành công"
      )
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  // Nếu muốn set lại dữ liệu khi edit
  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          ngayBatDau: formData.ngayBatDau ? dayjs(formData.ngayBatDau) : "",
          ngayKetThuc: formData.ngayKetThuc ? dayjs(formData.ngayKetThuc) : "",
        })
      }
    }
  }, [isOpen, input, form])

  const isEdit = input && Object.keys(input).some((key) => key !== "onSave")

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={isEdit ? "Cập nhật đối tượng chính sách" : "Thêm mới đối tượng chính sách"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Đối tượng" name="tenDoiTuong" required form={form}>
          <Input placeholder="Nhập đối tượng chính sách" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Bắt đầu từ" name="ngayBatDau" required form={form}>
          <DatePicker
            placeholder="Chọn ngày bắt đầu"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Kết thúc vào" name="ngayKetThuc" required form={form}>
          <DatePicker
            placeholder="Chọn ngày kết thúc"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabledDate={(current) => {
              const startTime = form.getFieldValue("ngayBatDau")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ghi chú" name="ghiChu" required form={form}>
          <Input placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
