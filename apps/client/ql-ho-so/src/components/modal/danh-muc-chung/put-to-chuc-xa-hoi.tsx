import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_ToChucXaHoi } from "@workspace/db"
import { useCreateDM_ToChucXaHoi, useUpdateDM_ToChucXaHoi } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ToChucXaHoiModal() {
  const [form] = Form.useForm<DM_ToChucXaHoi>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_ToChucXaHoi>>({
    tag: "ToChucXaHoiModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_ToChucXaHoi } = useCreateDM_ToChucXaHoi()
  const { mutateAsync: updateDM_ToChucXaHoi } = useUpdateDM_ToChucXaHoi()

  async function onOk(output: DM_ToChucXaHoi) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_ToChucXaHoi({
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
        await createDM_ToChucXaHoi({
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
      title={input?.id ? "Cập nhật tổ chức xã hội" : "Thêm mới tổ chức xã hội"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên tổ chức xã hội" name="name" required form={form}>
          <Input placeholder="Nhập tên tổ chức xã hội" />
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
