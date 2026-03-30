import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_ChucDanhCMNVNghienCuuVien } from "@workspace/db"
import {
  useCreateDM_ChucDanhCMNVNghienCuuVien,
  useUpdateDM_ChucDanhCMNVNghienCuuVien,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ChucDanhNgachNghienCuuModal() {
  const [form] = Form.useForm<DM_ChucDanhCMNVNghienCuuVien>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_ChucDanhCMNVNghienCuuVien>>({
    tag: "ChucDanhNgachNghienCuuModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_ChucDanhCMNVNghienCuuVien } =
    useCreateDM_ChucDanhCMNVNghienCuuVien()
  const { mutateAsync: updateDM_ChucDanhCMNVNghienCuuVien } =
    useUpdateDM_ChucDanhCMNVNghienCuuVien()

  async function onOk(output: DM_ChucDanhCMNVNghienCuuVien) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_ChucDanhCMNVNghienCuuVien({
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
        await createDM_ChucDanhCMNVNghienCuuVien({
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
          ? "Cập nhật chức danh ngạch nghiên cứu viên"
          : "Thêm mới chức danh ngạch nghiên cứu viên"
      }
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
