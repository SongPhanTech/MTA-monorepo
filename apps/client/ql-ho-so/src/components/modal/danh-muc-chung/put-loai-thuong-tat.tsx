import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_LoaiThuongTat } from "@workspace/db"
import { useCreateDM_LoaiThuongTat, useUpdateDM_LoaiThuongTat } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function LoaiThuongTatModal() {
  const [form] = Form.useForm<DM_LoaiThuongTat>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_LoaiThuongTat>>({
    tag: "LoaiThuongTatModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_LoaiThuongTat } = useCreateDM_LoaiThuongTat()
  const { mutateAsync: updateDM_LoaiThuongTat } = useUpdateDM_LoaiThuongTat()

  async function onOk(output: DM_LoaiThuongTat) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_LoaiThuongTat({
          where: {
            id: input.id,
          },
          data: {
            name: output.name.trim(),
            description: output.description,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createDM_LoaiThuongTat({
          data: {
            name: output.name.trim(),
            description: output.description,
          },
        })
        message.success("Thêm mới thành công")
      }
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (input && isOpen) {
      form.setFieldsValue({
        name: input.name,
        description: input.description,
      })
    }
  }, [input, isOpen, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={input?.id ? "Cập nhật loại thương tật" : "Thêm mới loại thương tật"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên loại thương tật" name="name" required form={form}>
          <Input placeholder="Nhập tên loại thương tật" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Mô tả" name="description" form={form}>
          <Input.TextArea rows={3} placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
