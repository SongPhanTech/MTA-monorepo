import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_TrinhDoLyLuanChinhTri } from "@workspace/db"
import {
  useCreateDM_TrinhDoLyLuanChinhTri,
  useUpdateDM_TrinhDoLyLuanChinhTri,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrinhDoLyLuanChinhTriModal() {
  const [form] = Form.useForm<DM_TrinhDoLyLuanChinhTri>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_TrinhDoLyLuanChinhTri>>({
    tag: "TrinhDoLyLuanChinhTriModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_TrinhDoLyLuanChinhTri } = useCreateDM_TrinhDoLyLuanChinhTri()
  const { mutateAsync: updateDM_TrinhDoLyLuanChinhTri } = useUpdateDM_TrinhDoLyLuanChinhTri()

  async function onOk(output: DM_TrinhDoLyLuanChinhTri) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_TrinhDoLyLuanChinhTri({
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
        await createDM_TrinhDoLyLuanChinhTri({
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
        input?.id ? "Cập nhật trình độ lý luận chính trị" : "Thêm mới trình độ lý luận chính trị"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên trình độ lý luận chính trị" name="name" required form={form}>
          <Input placeholder="Nhập tên trình độ lý luận chính trị" />
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
