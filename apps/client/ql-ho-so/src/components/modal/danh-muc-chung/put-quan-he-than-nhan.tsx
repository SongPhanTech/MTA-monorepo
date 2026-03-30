import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_QuanHeThanNhan } from "@workspace/db/client"
import { useCreateDM_QuanHeThanNhan, useUpdateDM_QuanHeThanNhan } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function QuanHeThanNhanModal() {
  const [form] = Form.useForm<DM_QuanHeThanNhan>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_QuanHeThanNhan>>({
    tag: "QuanHeThanNhanModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_QuanHeThanNhan } = useCreateDM_QuanHeThanNhan()
  const { mutateAsync: updateDM_QuanHeThanNhan } = useUpdateDM_QuanHeThanNhan()

  async function onOk(output: DM_QuanHeThanNhan) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_QuanHeThanNhan({
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
        await createDM_QuanHeThanNhan({
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
      title={input?.id ? "Cập nhật quan hệ thân nhân" : "Thêm mới quan hệ thân nhân"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên quan hệ thân nhân" name="name" required form={form}>
          <Input placeholder="Nhập tên quan hệ thân nhân" />
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
