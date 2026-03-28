import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { CapBac } from "@workspace/db"
import { useFindManyDM_CapBac } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutCapBacModal() {
  const [form] = Form.useForm<CapBac>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<CapBac> & { onSave: (val: CapBac) => void }
  >({
    tag: "PutCapBacModal",
    onClose: form.resetFields,
  })

  const { data = [] } = useFindManyDM_CapBac()

  async function onOk(output: CapBac) {
    try {
      showSpinner()
      if (input?.onSave) {
        input.onSave(output)
      }
      message.success(isEdit ? "Cập nhật cấp bậc thành công" : "Thêm mới cấp bậc thành công")
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
      title={isEdit ? "Cập nhật cấp bậc" : "Thêm mới cấp bậc"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Cấp bậc" name="capBacId" required form={form}>
          <Select
            placeholder="Chọn cấp bậc"
            options={data.map((i) => ({ label: i.sTen, value: i.Id }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Nơi ra quyết định" name="noiRaQuyetDinh" form={form} required>
          <Input placeholder="Nhập nơi ra quyết định" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Cấp ra quyết định" name="capRaQuyetDinh" form={form} required>
          <Input placeholder="Nhập cấp ra quyết định" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ngày nhận quyết định" name="ngayNhanQuyetDinh" required form={form}>
          <DatePicker
            placeholder="Chọn ngày nhận quyết định"
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
