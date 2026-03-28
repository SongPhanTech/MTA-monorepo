import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { ChucVuDang } from "@workspace/db/client"
import { useFindManyDM_ChucVu } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const PutChucVuDangModal = () => {
  const [form] = Form.useForm<ChucVuDang>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<ChucVuDang> & { onSave: (val: ChucVuDang) => void }
  >({
    tag: "PutChucVuDangModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { data: chucVuDangData = [] } = useFindManyDM_ChucVu({
    where: {
      iNhomChucVu: 1,
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(values: ChucVuDang) {
    try {
      showSpinner()
      const dataToSave: ChucVuDang = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit ? "Cập nhật chức vụ Đảng thành công" : "Thêm mới chức vụ Đảng thành công"
      )
      onClose()
    } catch (error) {
      console.error("Error:", error)
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
      title={isEdit ? "Cập nhật chức vụ Đảng" : "Thêm mới chức vụ Đảng"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên Chức vụ Đảng" name="chucVuDangId" required form={form}>
          <Select
            placeholder="Chọn chức vụ Đảng"
            options={chucVuDangData.map((i) => {
              return {
                label: i.sTen,
                value: i.Id,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Nơi nhận chức vụ" name="address" required form={form}>
          <Input placeholder="Nhập nơi nhận chức vụ" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Ghi chú" name="description" form={form}>
          <Input.TextArea placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutChucVuDangModal
