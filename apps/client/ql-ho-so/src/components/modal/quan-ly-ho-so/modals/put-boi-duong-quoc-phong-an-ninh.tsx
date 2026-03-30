import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { BoiDuongQuocPhongAnNinh } from "@workspace/db"
import { Col, DatePicker, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutBoiDuongQuocPhongModal() {
  const [form] = Form.useForm<BoiDuongQuocPhongAnNinh>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<BoiDuongQuocPhongAnNinh> & { onSave: (val: BoiDuongQuocPhongAnNinh) => void }
  >({
    tag: "PutBoiDuongQuocPhongModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(output: BoiDuongQuocPhongAnNinh) {
    try {
      showSpinner()
      const dataToSave: BoiDuongQuocPhongAnNinh = { ...output }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit
          ? "Cập nhật bồi dưỡng quốc phòng an ninh thành công"
          : "Thêm mới bồi dưỡng quốc phòng an ninh thành công"
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
          thoiGianBatDau: formData.thoiGianBatDau ? dayjs(formData.thoiGianBatDau) : "",
          thoiGianKetThuc: formData.thoiGianKetThuc ? dayjs(formData.thoiGianKetThuc) : "",
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
      title={
        isEdit
          ? "Cập nhật lớp bồi dưỡng quốc phòng an ninh"
          : "Thêm mới lớp bồi dưỡng quốc phòng an ninh"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên lớp bồi dưỡng" name="name" required form={form}>
          <Input placeholder="Nhập tên lớp bồi dưỡng" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian bắt đầu" name="thoiGianBatDau" required form={form}>
          <DatePicker
            placeholder="Chọn thời gian bắt đầu"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian kết thúc" name="thoiGianKetThuc" required form={form}>
          <DatePicker
            placeholder="Chọn thời gian kết thúc"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            disabledDate={(current) => {
              const startTime = form.getFieldValue("thoiGianBatDau")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
