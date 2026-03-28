import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { KyLuat } from "@workspace/db"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { TextArea } = Input

export default function PutKyLuatModal() {
  const [form] = Form.useForm<KyLuat>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<KyLuat> & { onSave: (val: KyLuat) => void }
  >({
    tag: "PutKyLuatModal",
    onClose: form.resetFields,
  })

  async function onOk(output: KyLuat) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(isEdit ? "Cập nhật kỷ luật thành công" : "Thêm mới kỷ luật thành công")
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
          ngayNhanQuyetDinh: formData.ngayNhanQuyetDinh ? dayjs(formData.ngayNhanQuyetDinh) : "",
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
      title={isEdit ? "Cập nhật thông tin kỷ luật" : "Thêm mới thông tin kỷ luật"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Hình thức kỷ luật" name="hinhThucKyLuat" required form={form}>
          <Input placeholder="Nhập hình thức kỷ luật" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Cấp kỷ luật" name="capKyLuat" required form={form}>
          <Input placeholder="Nhập cấp kỷ luật" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Số quyết định" name="soQuyetDinh" required form={form}>
          <Input placeholder="Nhập số quyết định" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Người ký" name="nguoiKy" required form={form}>
          <Input placeholder="Nhập người ký" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ngày nhận quyết định" name="ngayNhanQuyetDinh" required form={form}>
          <DatePicker
            placeholder="Chọn ngày nhận quyết định"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Lý do" name="lyDo" form={form}>
          <TextArea placeholder="Nhập lý do" rows={3} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
