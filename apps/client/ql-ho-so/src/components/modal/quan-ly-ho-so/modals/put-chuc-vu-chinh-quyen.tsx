import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { ChucVuChinhQuyen } from "@workspace/db/client"
import { useFindManyDM_ChucVu } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const PutChucVuChinhQuyenModal = () => {
  const [form] = Form.useForm<ChucVuChinhQuyen>()

  const { isOpen, onClose, input } = useDisclosure<
    Partial<ChucVuChinhQuyen> & { onSave: (val: ChucVuChinhQuyen) => void }
  >({
    tag: "PutChucVuChinhQuyenModal",
    onClose: () => {
      form.resetFields()
    },
  })

  const { data: chucVuChinhQuyenData = [] } = useFindManyDM_ChucVu({
    where: {
      iNhomChucVu: 0,
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(values: ChucVuChinhQuyen) {
    try {
      showSpinner()
      const dataToSave: ChucVuChinhQuyen = { ...values }
      if (input?.onSave) {
        input.onSave(dataToSave)
      }
      message.success(
        isEdit
          ? "Cập nhật chức vụ chính quyền thành công"
          : "Thêm mới chức vụ chính quyền thành công"
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
      title={isEdit ? "Cập nhật chức vụ chính quyền" : "Thêm mới chức vụ chính quyền"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên Chức vụ chính quyền" name="chucVuChinhQuyenId" required form={form}>
          <Select
            placeholder="Chọn chức vụ chính quyền"
            options={chucVuChinhQuyenData.map((i) => {
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

export default PutChucVuChinhQuyenModal
