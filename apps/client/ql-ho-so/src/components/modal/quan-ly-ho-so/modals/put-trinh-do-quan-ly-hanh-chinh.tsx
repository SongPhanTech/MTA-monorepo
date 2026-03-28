import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { Col, Form, Input } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function PutTrinhDoQuanLyHanhChinhModal() {
  const [form] = Form.useForm()

  const { isOpen, onClose, input } = useDisclosure({
    tag: "PutTrinhDoQuanLyHanhChinhModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  async function onOk(output: any) {}

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title={
        input ? "Cập nhật trình độ quản lý hành chính" : "Thêm mới trình độ quản lý hành chính "
      }
      className="w-[40vw]"
      layout="vertical"
    >
      <Col span={24}>
        <FormItem label="Hình thức đào tạo" name="academicDegreeTypeId" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem label="Trình độ" name="linhVuc" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Cơ sở đào tạo" name="truongId" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian bắt đầu" name="nationalityId" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem label="Thời gian kết thúc" name="year" required form={form}>
          <Input placeholder="Nhập lĩnh vực" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}
