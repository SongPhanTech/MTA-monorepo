import FormItem from "@components/commons/form-item"
import { cn } from "@lib/utils"
import {
  useCreateDocumentClassification,
  useFindFirstDocumentClassification,
  useUpdateDocumentClassification,
} from "@workspace/db/hooks"
import { Col, Form, Input, Modal, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type DocumentClassificationFormType = {
  name: string
  description?: string
}

const PutDocumentClassification = () => {
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutDocumentClassification",
  })
  const { mutateAsync: create } = useCreateDocumentClassification()
  const { mutateAsync: update } = useUpdateDocumentClassification()

  const { data: detail } = useFindFirstDocumentClassification({
    where: {
      id,
    },
  })

  const [form] = Form.useForm<DocumentClassificationFormType>()

  useEffect(() => {
    if (isOpen && !id) {
      form.resetFields()
    }
  }, [isOpen, id, form])

  useEffect(() => {
    if (id && detail) {
      form.setFieldsValue({
        name: detail.name || undefined,
        description: detail.description || undefined,
      })
    }
  }, [id, detail, form])

  const onFinish = async (values: DocumentClassificationFormType) => {
    try {
      if (id) {
        await update({
          where: {
            id,
          },
          data: {
            name: values.name,
            description: values.description,
          },
        })
        message.success("Cập nhật loại tài liệu thành công")
      } else {
        await create({
          data: {
            name: values.name,
            description: values.description,
          },
        })
        message.success("Thêm loại tài liệu thành công")
      }
      onClose()
    } catch (_error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  return (
    <Modal
      title={id ? "Chỉnh sửa loại tài liệu" : "Thêm loại tài liệu mới"}
      open={isOpen}
      className={cn("min-w-[40vw]")}
      onCancel={onClose}
      okText="Đồng ý"
      cancelText="Hủy"
      onOk={form.submit}
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Col span={24}>
          <FormItem
            form={form}
            name={"name"}
            label="Tên loại tài liệu"
            rules={[{ required: true, message: "Vui lòng nhập tên loại tài liệu" }]}
          >
            <Input placeholder="Nhập tên loại tài liệu (VD: Mới ban hành, Còn hiệu lực, Hết hạn...)" />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name={"description"} label="Mô tả">
            <Input.TextArea rows={4} placeholder="Nhập mô tả cho loại tài liệu" />
          </FormItem>
        </Col>
      </Form>
    </Modal>
  )
}

export default PutDocumentClassification
