import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_NuocCuDiHocTap } from "@workspace/db"
import { useCreateDM_NuocCuDiHocTap, useUpdateDM_NuocCuDiHocTap } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function CacNuocCuDiHocTapModal() {
  const [form] = Form.useForm<DM_NuocCuDiHocTap>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_NuocCuDiHocTap>>({
    tag: "CacNuocCuDiHocTapModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_NuocCuDiHocTap } = useCreateDM_NuocCuDiHocTap()
  const { mutateAsync: updateDM_NuocCuDiHocTap } = useUpdateDM_NuocCuDiHocTap()

  async function onOk(output: DM_NuocCuDiHocTap) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_NuocCuDiHocTap({
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
        await createDM_NuocCuDiHocTap({
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
  }, [input, form, isOpen])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={input?.id ? "Cập nhật các nước cử đi học tập" : "Thêm mới các nước cử đi học tập"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên nước" name="name" required form={form}>
          <Input placeholder="Nhập tên nước" />
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
