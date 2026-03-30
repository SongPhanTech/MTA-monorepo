import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_TinhTrangDiHocTap } from "@workspace/db"
import { useCreateDM_TinhTrangDiHocTap, useUpdateDM_TinhTrangDiHocTap } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TinhTrangDiHocTapModal() {
  const [form] = Form.useForm<DM_TinhTrangDiHocTap>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_TinhTrangDiHocTap>>({
    tag: "TinhTrangDiHocTapModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_TinhTrangDiHocTap } = useCreateDM_TinhTrangDiHocTap()
  const { mutateAsync: updateDM_TinhTrangDiHocTap } = useUpdateDM_TinhTrangDiHocTap()

  async function onOk(output: DM_TinhTrangDiHocTap) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_TinhTrangDiHocTap({
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
        await createDM_TinhTrangDiHocTap({
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
        input?.id
          ? "Cập nhật các trường đào tạo bậc đại học"
          : "Thêm mới các trường đào tạo bậc đại học"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên tình trạng đi học tập" name="name" required form={form}>
          <Input placeholder="Nhập tên tình trạng đi học tập" />
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
