import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_TinhTrangHonNhan } from "@workspace/db"
import { useCreateDM_TinhTrangHonNhan, useUpdateDM_TinhTrangHonNhan } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TinhTrangHonNhanModal() {
  const [form] = Form.useForm<DM_TinhTrangHonNhan>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_TinhTrangHonNhan>>({
    tag: "TinhTrangHonNhanModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_TinhTrangHonNhan } = useCreateDM_TinhTrangHonNhan()
  const { mutateAsync: updateDM_TinhTrangHonNhan } = useUpdateDM_TinhTrangHonNhan()

  async function onOk(output: DM_TinhTrangHonNhan) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_TinhTrangHonNhan({
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
        await createDM_TinhTrangHonNhan({
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
      title={input?.id ? "Cập nhật tình trạng hôn nhân" : "Thêm mới tình trạng hôn nhân"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên tình trạng hôn nhân" name="name" required form={form}>
          <Input placeholder="Nhập tên tình trạng hôn nhân" />
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
