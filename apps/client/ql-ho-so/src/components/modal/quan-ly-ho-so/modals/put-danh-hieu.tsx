import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DanhHieu } from "@workspace/db"
import { Col, DatePicker, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutDanhHieuModal() {
  const [form] = Form.useForm<DanhHieu>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<DanhHieu> & { onSave: (val: DanhHieu) => void }
  >({
    tag: "PutDanhHieuModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          thoiGian: formData.thoiGian ? dayjs(formData.thoiGian) : null,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: DanhHieu) {
    try {
      showSpinner()
      const dataToSave: DanhHieu = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(isEdit ? "Cập nhật danh hiệu thành công" : "Thêm mới danh hiệu thành công")
      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      hideSpinner()
    }
  }

  const isEdit = input && Object.keys(input).some((key) => key !== "onSave")

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={isEdit ? "Cập nhật danh hiệu" : "Thêm mới danh hiệu"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên danh hiệu" name="ten" required form={form}>
          <Input placeholder="Nhập tên danh hiệu" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ngày phong tặng danh hiệu" name="thoiGian" required form={form}>
          <DatePicker
            placeholder="Chọn ngày phong tặng danh hiệu"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
