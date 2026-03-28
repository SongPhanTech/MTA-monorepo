import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_SucKhoe } from "@workspace/db"
import { useCreateDM_SucKhoe, useUpdateDM_SucKhoe } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function SucKhoeModal() {
  const [form] = Form.useForm<DM_SucKhoe>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_SucKhoe>>({
    tag: "SucKhoeModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_SucKhoe } = useCreateDM_SucKhoe()
  const { mutateAsync: updateDM_SucKhoe } = useUpdateDM_SucKhoe()

  async function onOk(output: DM_SucKhoe) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_SucKhoe({
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
        await createDM_SucKhoe({
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
      title={input?.id ? "Cập nhật sức khỏe" : "Thêm mới sức khỏe"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên sức khỏe" name="name" required form={form}>
          <Input placeholder="Nhập tên loại sức khỏe" />
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
