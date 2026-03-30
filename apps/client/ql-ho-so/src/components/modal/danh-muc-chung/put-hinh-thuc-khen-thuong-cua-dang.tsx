import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DM_HinhThucKhenThuongDang } from "@workspace/db"
import {
  useCreateDM_HinhThucKhenThuongDang,
  useUpdateDM_HinhThucKhenThuongDang,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function HinhThucKhenThuongCuaDangModal() {
  const [form] = Form.useForm<DM_HinhThucKhenThuongDang>()

  const { isOpen, onClose, input } = useDisclosure<Partial<DM_HinhThucKhenThuongDang>>({
    tag: "HinhThucKhenThuongCuaDangModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDM_HinhThucKhenThuongDang } = useCreateDM_HinhThucKhenThuongDang()
  const { mutateAsync: updateDM_HinhThucKhenThuongDang } = useUpdateDM_HinhThucKhenThuongDang()

  async function onOk(output: DM_HinhThucKhenThuongDang) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateDM_HinhThucKhenThuongDang({
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
        await createDM_HinhThucKhenThuongDang({
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
          ? "Cập nhật hình thức khen thưởng của Đảng"
          : "Thêm mới hình thức khen thưởng của Đảng"
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Tên hình thức khen thưởng của Đảng" name="name" required form={form}>
          <Input placeholder="Nhập tên hình thức khen thưởng của Đảng" />
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
