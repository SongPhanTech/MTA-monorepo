import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { KeKhaiTaiSan } from "@workspace/db"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutKeKhaiTaiSanModal() {
  const [form] = Form.useForm<KeKhaiTaiSan>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<KeKhaiTaiSan> & { onSave: (val: KeKhaiTaiSan) => void }
  >({
    tag: "PutKeKhaiTaiSanModal",
    onClose: form.resetFields,
  })

  async function onOk(output: KeKhaiTaiSan) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(
        isEdit ? "Cập nhật kê khai tài sản thành công" : "Thêm mới kê khai tài sản thành công"
      )
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          thoiGianKeKhai: formData.thoiGianKeKhai ? dayjs(formData.thoiGianKeKhai) : "",
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
      title={isEdit ? "Cập nhật kê khai tài sản" : "Thêm mới kê khai tài sản "}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên đợt" name="tenDot" required form={form}>
          <Input placeholder="Nhập tên đợt" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Loại" name="loai" required form={form}>
          <Input placeholder="Nhập loại" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian kê khai" name="thoiGianKeKhai" required form={form}>
          <DatePicker
            placeholder="Chọn thời gian kê khai"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
