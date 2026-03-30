import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { QuaTrinhLuong } from "@workspace/db"
import { useFindManyDM_BacLuong, useFindManyDM_Ngach } from "@workspace/db/hooks"
import { Col, DatePicker, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutQuaTrinhLuongModal() {
  const [form] = Form.useForm<QuaTrinhLuong>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<QuaTrinhLuong> & { onSave: (val: QuaTrinhLuong) => void }
  >({
    tag: "PutQuaTrinhLuongModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { data: ngachList = [] } = useFindManyDM_Ngach()
  const { data: bacLuongList = [] } = useFindManyDM_BacLuong()

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

  async function onOk(values: QuaTrinhLuong) {
    try {
      showSpinner()
      const dataToSave: QuaTrinhLuong = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật quá trình lương thành công" : "Thêm mới quá trình lương thành công"
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
      title={isEdit ? "Cập nhật quá trình lương" : "Thêm mới quá trình lương"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={12}>
        <FormItem label="Ngạch" name="ngachId" required form={form}>
          <Select
            placeholder="Chọn ngạch"
            options={ngachList.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Bậc lương" name="bacLuongId" required form={form}>
          <Select
            placeholder="Chọn bậc lương"
            options={bacLuongList.map((i) => ({
              label: i.name,
              value: i.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Mã ngạch" name="maNgach" required form={form}>
          <Input placeholder="Nhập mã ngạch" />
        </FormItem>
      </Col>
      <Col span={12}>
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
      <Col span={12}>
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
      <Col span={12}>
        <FormItem label="Phụ cấp chức vụ" name="phuCapChucVu" form={form}>
          <Input placeholder="Nhập phụ cấp chức vụ" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Phụ cấp khác" name="phuCapKhac" form={form}>
          <Input placeholder="Nhập phụ cấp khác" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
