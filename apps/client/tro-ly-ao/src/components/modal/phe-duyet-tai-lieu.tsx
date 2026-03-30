import FormItem from "@components/commons/form-item"
import { cn } from "@lib/utils"
import { $Enums } from "@workspace/db"
import { useUpdateDocument } from "@workspace/db/hooks"
import { Col, Form, Input, Modal, message, Radio } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { fetchChungkingAndVectorizeDocument } from "@/api/chunking_and_vectorize"

type PheDuyetTaiLieuFormType = {
  status: $Enums.DocumentStatus
  reason: string
}
const PheDuyetTaiLieu = () => {
  const {
    isOpen,
    onClose,
    input: documentId,
  } = useDisclosure<string>({
    tag: "PheDuyetTaiLieu",
  })
  const { mutateAsync: update } = useUpdateDocument()

  const [form] = Form.useForm<PheDuyetTaiLieuFormType>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const status = Form.useWatch("status", form)

  const onFinish = async (values: PheDuyetTaiLieuFormType) => {
    setIsSubmitting(true)
    try {
      if (!documentId) {
        message.error("Không tìm thấy tài liệu phê duyệt")
        setIsSubmitting(false)
        return
      }

      if (values.status === $Enums.DocumentStatus.APPROVE) {
        const result = await fetchChungkingAndVectorizeDocument(documentId)

        if ((result as any)?.error === "True") {
          message.error("Đã xảy ra lỗi khi phê duyệt tài liệu")
          return
        }
      }

      await update({
        where: {
          id: documentId,
        },
        data: {
          status: values.status,
          reason: values.status === $Enums.DocumentStatus.APPROVE ? null : values.reason,
        },
      })

      if (values.status === $Enums.DocumentStatus.APPROVE) {
        message.success("Phê duyệt tài liệu thành công")
      } else {
        message.success("Từ chối tài liệu")
      }
      onClose()
    } catch (_error) {
      message.error("Phê duyệt không thành công, vui lòng kiểm tra lại")
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Modal
      title="Phê duyệt tài liệu"
      open={isOpen}
      className={cn("min-w-[30vw]")}
      okText="Đồng ý"
      cancelText="Hủy"
      onCancel={onClose}
      onOk={form.submit}
      confirmLoading={isSubmitting}
    >
      <div className="flex gap-4 justify-between">
        <Form form={form} onFinish={onFinish} layout="vertical" className={cn("mt-4", "w-full")}>
          <Col span={24}>
            <FormItem form={form} name={"status"} label="Trạng thái" required>
              <Radio.Group buttonStyle="solid">
                <Radio.Button value={$Enums.DocumentStatus.APPROVE}>Phê duyệt</Radio.Button>
                <Radio.Button value={$Enums.DocumentStatus.DENY}>Từ chối</Radio.Button>
              </Radio.Group>
            </FormItem>
          </Col>
          {status === $Enums.DocumentStatus.DENY && (
            <Col span={24}>
              <FormItem form={form} name={"reason"} label="Lý do từ chối">
                <Input.TextArea placeholder="Nhập lý do từ chối" />
              </FormItem>
            </Col>
          )}
        </Form>
      </div>
    </Modal>
  )
}

export default PheDuyetTaiLieu
