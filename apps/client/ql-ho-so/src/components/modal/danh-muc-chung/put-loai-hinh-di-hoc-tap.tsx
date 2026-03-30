import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_LoaiHinhDiHocTap } from "@workspace/db"
import { useCreateDM_LoaiHinhDiHocTap, useUpdateDM_LoaiHinhDiHocTap } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function LoaiHinhDiHocTapModal() {
  const [form] = Form.useForm<DM_LoaiHinhDiHocTap>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_LoaiHinhDiHocTap>>({
    tag: "LoaiHinhDiHocTapModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_LoaiHinhDiHocTap } = useCreateDM_LoaiHinhDiHocTap()
  const { mutateAsync: updateDM_LoaiHinhDiHocTap } = useUpdateDM_LoaiHinhDiHocTap()

  async function onOk(output: DM_LoaiHinhDiHocTap) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_LoaiHinhDiHocTap({
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
        await createDM_LoaiHinhDiHocTap({
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
      title={input?.id ? "Cập nhật loại hình đi học tập" : "Thêm mới loại hình đi học tập"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên loại hình đi học tập" name="name" required form={form}>
          <Input placeholder="Nhập tên loại hình đi học tập" />
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
