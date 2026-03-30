import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_TrinhDoQuanLyNhaNuoc } from "@workspace/db"
import {
  useCreateDM_TrinhDoQuanLyNhaNuoc,
  useUpdateDM_TrinhDoQuanLyNhaNuoc,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrinhDoQuanLyNhaNuocModal() {
  const [form] = Form.useForm<DM_TrinhDoQuanLyNhaNuoc>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_TrinhDoQuanLyNhaNuoc>>({
    tag: "TrinhDoQuanLyNhaNuocModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_TrinhDoQuanLyNhaNuoc } = useCreateDM_TrinhDoQuanLyNhaNuoc()
  const { mutateAsync: updateDM_TrinhDoQuanLyNhaNuoc } = useUpdateDM_TrinhDoQuanLyNhaNuoc()

  async function onOk(output: DM_TrinhDoQuanLyNhaNuoc) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_TrinhDoQuanLyNhaNuoc({
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
        await createDM_TrinhDoQuanLyNhaNuoc({
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
      title={
        input?.id ? "Cập nhật trình độ quản lý nhà nước" : "Thêm mới trình độ quản lý nhà nước"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên trình độ" name="name" required form={form}>
          <Input placeholder="Nhập tên trình độ" />
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
