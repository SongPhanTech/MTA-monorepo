import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { NuocNgoai } from "@workspace/db"
import { useFindManyDM_QuocGia } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutNuocNgoaiModal() {
  const [form] = Form.useForm<NuocNgoai>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<NuocNgoai> & { onSave: (val: NuocNgoai) => void }
  >({
    tag: "PutNuocNgoaiModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { data = [] } = useFindManyDM_QuocGia()

  const { showSpinner, hideSpinner } = useSpinner()

  // Load dữ liệu khi edit
  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: NuocNgoai) {
    try {
      showSpinner()
      const dataToSave: NuocNgoai = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật đi nước ngoài thành công" : "Thêm mới đi nước ngoài thành công"
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
      title={isEdit ? "Cập nhật đi nước ngoài" : "Thêm mới đi nước ngoài"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên nước" name="tenNuocId" required form={form}>
          <Select
            placeholder="Chọn tên nước"
            options={data.map((item) => ({ label: item.sTen, value: item.Id }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Từ ngày" name="tuNgay" required form={form}>
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
        <FormItem label="Đến ngày" name="denNgay" required form={form}>
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
        <FormItem label="Lý do" name="lyDo" required form={form}>
          <Input placeholder="Nhập lý do" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
