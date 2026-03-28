import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_ChucDanhCMNVKySu, DM_TruongDaoTaoBacDH } from "@workspace/db"
import { useCreateDM_ChucDanhCMNVKySu, useUpdateDM_ChucDanhCMNVKySu } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ChucDanhNgachKySuModal() {
  const [form] = Form.useForm<DM_ChucDanhCMNVKySu>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_ChucDanhCMNVKySu>>({
    tag: "ChucDanhNgachKySuModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_ChucDanhCMNVKySu } = useCreateDM_ChucDanhCMNVKySu()
  const { mutateAsync: updateDM_ChucDanhCMNVKySu } = useUpdateDM_ChucDanhCMNVKySu()

  async function onOk(output: DM_TruongDaoTaoBacDH) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_ChucDanhCMNVKySu({
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
        await createDM_ChucDanhCMNVKySu({
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
      title={input?.id ? "Cập nhật chức danh  kỹ sư" : "Thêm mới chức danh kỹ sư"}
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên chức danh" name="name" required form={form}>
          <Input placeholder="Nhập tên chức danh" />
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
