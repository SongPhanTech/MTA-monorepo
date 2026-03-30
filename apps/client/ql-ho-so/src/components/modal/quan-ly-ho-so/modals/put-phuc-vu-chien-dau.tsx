import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ChienDau } from "@workspace/db"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutChienDauModal() {
  const [form] = Form.useForm<ChienDau>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<ChienDau> & { onSave: (val: ChienDau) => void }
  >({
    tag: "PutChienDauModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  // Load dữ liệu khi edit
  useEffect(() => {
    if (isOpen && input) {
      const { onSave, ...formData } = input
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue({
          ...formData,
          thoiGianBatDau: formData.thoiGianBatDau ? dayjs(formData.thoiGianBatDau) : null,
          thoiGianKetThuc: formData.thoiGianKetThuc ? dayjs(formData.thoiGianKetThuc) : null,
        })
      }
    }
  }, [isOpen, input, form])

  async function onOk(values: ChienDau) {
    try {
      showSpinner()
      const dataToSave: ChienDau = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật phục vụ chiến đấu thành công" : "Thêm mới phục vụ chiến đấu thành công"
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
      title={isEdit ? "Cập nhật phục vụ chiến đấu" : "Thêm mới phục vụ chiến đấu"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={12}>
        <FormItem label="Cương vị" name="cuongVi" required form={form}>
          <Input placeholder="Nhập cương vị" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Đơn vị" name="donVi" required form={form}>
          <Input placeholder="Nhập đơn vị" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Địa điểm" name="diaDiem" required form={form}>
          <Input placeholder="Nhập địa điểm" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Vai trò" name="vaiTro" required form={form}>
          <Input placeholder="Nhập vai trò" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Đối tượng" name="doiTuong" required form={form}>
          <Input placeholder="Nhập đối tượng" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem label="Từ tháng năm" name="thoiGianBatDau" required form={form}>
          <DatePicker
            placeholder="Chọn từ tháng năm"
            className="w-full"
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem label="Đến tháng năm" name="thoiGianKetThuc" required form={form}>
          <DatePicker
            placeholder="Chọn đến tháng năm"
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
