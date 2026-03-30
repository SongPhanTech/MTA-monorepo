import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_QuocGia } from "@workspace/db"
import { useCreateDM_QuocGia, useUpdateDM_QuocGia } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FormValues = {
  name: string
  description?: string
}
export default function QuocGiaModal() {
  const [form] = Form.useForm<FormValues>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_QuocGia>>({
    tag: "PutDanhMucQuocGiaModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_QuocGia } = useCreateDM_QuocGia()
  const { mutateAsync: updateDM_QuocGia } = useUpdateDM_QuocGia()

  async function onOk(values: FormValues) {
    try {
      showSpinner()

      const payload = {
        sTen: values.name.trim(),
        ...(values.description ? { sGhiChu: values.description } : {}),
      }

      if (input?.Id) {
        await updateDM_QuocGia({
          where: { Id: input.Id },
          data: payload,
        })
      } else {
        await createDM_QuocGia({
          data: payload,
        })
      }

      message.success(input?.Id ? "Cập nhật thành công" : "Thêm mới thành công")
      onClose()
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  useEffect(() => {
    if (isOpen && input?.Id) {
      form.setFieldsValue({
        name: input.sTen || "",
        description: input.sGhiChu || "",
      })
    }

    if (isOpen && !input?.Id) {
      form.resetFields()
    }
  }, [isOpen, input, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={input?.Id ? "Cập nhật quốc tịch" : "Thêm mới quốc tịch"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên quốc tịch" name="name" required form={form}>
          <Input placeholder="Nhập tên quốc tịch" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Mô tả" name="description" form={form}>
          <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
