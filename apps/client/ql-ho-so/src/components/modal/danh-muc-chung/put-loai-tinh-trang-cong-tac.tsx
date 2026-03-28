import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_LoaiTinhTrangCongTac } from "@workspace/db/client"
import {
  useCreateDM_LoaiTinhTrangCongTac,
  useUpdateDM_LoaiTinhTrangCongTac,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function LoaiTinhTrangCongTacModal() {
  const [form] = Form.useForm<DM_LoaiTinhTrangCongTac>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_LoaiTinhTrangCongTac>>({
    tag: "LoaiTinhTrangCongTacModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_LoaiTinhTrangCongTac } = useCreateDM_LoaiTinhTrangCongTac()
  const { mutateAsync: updateDM_LoaiTinhTrangCongTac } = useUpdateDM_LoaiTinhTrangCongTac()

  async function onOk(output: DM_LoaiTinhTrangCongTac) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_LoaiTinhTrangCongTac({
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
        await createDM_LoaiTinhTrangCongTac({
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
      title={input?.id ? "Cập nhật loại tình trạng công tác" : "Thêm mới loại tình trạng công tác"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên loại tình trạng công tác" name="name" required form={form}>
          <Input placeholder="Nhập tên loại tình trạng công tác" />
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
