import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_XepLoaiDanhGiaCanBo } from "@workspace/db"
import {
  useCreateDM_XepLoaiDanhGiaCanBo,
  useUpdateDM_XepLoaiDanhGiaCanBo,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function XepLoaiDanhGiaCanBoModal() {
  const [form] = Form.useForm<DM_XepLoaiDanhGiaCanBo>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_XepLoaiDanhGiaCanBo>>({
    tag: "XepLoaiDanhGiaCanBoModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_XepLoaiDanhGiaCanBo } = useCreateDM_XepLoaiDanhGiaCanBo()
  const { mutateAsync: updateDM_XepLoaiDanhGiaCanBo } = useUpdateDM_XepLoaiDanhGiaCanBo()

  async function onOk(output: DM_XepLoaiDanhGiaCanBo) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_XepLoaiDanhGiaCanBo({
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
        await createDM_XepLoaiDanhGiaCanBo({
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
      title={input?.id ? "Cập nhật xếp loại đánh giá cán bộ" : "Thêm mới xếp loại đánh giá cán bộ"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên xếp loại đánh giá cán bộ" name="name" required form={form}>
          <Input placeholder="Nhập tên xếp loại đánh giá cán bộ" />
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
