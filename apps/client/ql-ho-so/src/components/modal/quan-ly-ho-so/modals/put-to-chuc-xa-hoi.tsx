import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { ToChucXaHoi } from "@workspace/db"
import { useFindManyDM_ToChucXaHoi } from "@workspace/db/hooks"
import { Col, DatePicker, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutToChucXaHoiModal() {
  const [form] = Form.useForm<ToChucXaHoi>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<ToChucXaHoi> & { onSave: (val: ToChucXaHoi) => void }
  >({
    tag: "PutToChucXaHoiModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data = [] } = useFindManyDM_ToChucXaHoi()

  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          tuNgay: formData.tuNgay ? dayjs(formData.tuNgay) : null,
          denNgay: formData.denNgay ? dayjs(formData.denNgay) : null,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: ToChucXaHoi) {
    try {
      showSpinner()
      const dataToSave: ToChucXaHoi = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật tổ chức xã hội thành công" : "Thêm mới tổ chức xã hội thành công"
      )
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
      title={isEdit ? "Cập nhật tổ chức xã hội" : "Thêm mới tổ chức xã hội"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên tổ chức" name="tenId" required form={form}>
          <Select
            placeholder="Chọn tổ chức"
            options={data.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Từ ngày" name="tuNgay" form={form}>
          <DatePicker
            placeholder="Từ ngày"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Đến ngày" name="denNgay" form={form}>
          <DatePicker
            placeholder="Đến ngày"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Công việc" name="congViec" form={form}>
          <Input placeholder="Nhập công việc" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
