import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_HinhThucKhenThuongChinhQuyen } from "@workspace/db"
import {
  useCreateDM_HinhThucKhenThuongChinhQuyen,
  useUpdateDM_HinhThucKhenThuongChinhQuyen,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function HinhThucKhenThuongChinhQuyenModal() {
  const [form] = Form.useForm<DM_HinhThucKhenThuongChinhQuyen>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_HinhThucKhenThuongChinhQuyen>>({
    tag: "HinhThucKhenThuongChinhQuyenModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_HinhThucKhenThuongChinhQuyen } =
    useCreateDM_HinhThucKhenThuongChinhQuyen()
  const { mutateAsync: updateDM_HinhThucKhenThuongChinhQuyen } =
    useUpdateDM_HinhThucKhenThuongChinhQuyen()

  async function onOk(output: DM_HinhThucKhenThuongChinhQuyen) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_HinhThucKhenThuongChinhQuyen({
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
        await createDM_HinhThucKhenThuongChinhQuyen({
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
          ? "Cập nhật hình thức khen thưởng chính quyền"
          : "Thêm mới hình thức khen thưởng chính quyền"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên hình thức khen thưởng chính quyền" name="name" required form={form}>
          <Input placeholder="Nhập tên hình thức khen thưởng chính quyền" />
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
