import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import { cn } from "@lib/utils"
import { $Enums } from "@workspace/db"
import {
  useCreateFAQ,
  useDeleteFAQ,
  useFindFirstFAQ,
  useFindManyFAQ,
  useUpdateFAQ,
} from "@workspace/db/hooks"
import { Button, Col, Form, Input, Modal, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTopics } from "@/hooks/useTopics"

type FAQFormType = {
  topicId: string
  question: string
  answer: string
}
const PutCauHoi = () => {
  const { selectableTopicOptions } = useTopics()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutCauHoi",
  })
  const { mutateAsync: create } = useCreateFAQ()
  const { mutateAsync: update } = useUpdateFAQ()
  const { mutateAsync: deleteFAQ } = useDeleteFAQ()

  const { data: detail } = useFindFirstFAQ({
    where: {
      id,
    },
  })

  const { data: allFAQs } = useFindManyFAQ({
    select: {
      id: true,
      question: true,
    },
  })

  const [form] = Form.useForm<FAQFormType>()

  useEffect(() => {
    if (isOpen && !id) {
      form.resetFields()
    }
  }, [isOpen, id, form])

  useEffect(() => {
    if (id && detail) {
      form.setFieldsValue({
        topicId: detail.topicId || undefined,
        question: detail.question || undefined,
        answer: detail.answer || undefined,
      })
    }
  }, [id, detail, form])

  const onFinish = async (values: FAQFormType) => {
    try {
      const trimmedQuestion = values.question?.trim()
      if (!trimmedQuestion) {
        message.error("Vui lòng nhập câu hỏi")
        return
      }

      if (allFAQs && allFAQs.length > 0) {
        const isDuplicate = allFAQs.some((faq) => {
          if (id && faq.id === id) {
            return false
          }
          return faq.question?.trim().toLowerCase() === trimmedQuestion.toLowerCase()
        })

        if (isDuplicate) {
          message.error("Câu hỏi này đã tồn tại trong hệ thống. Vui lòng nhập câu hỏi khác.")
          return
        }
      }

      if (id) {
        await update({
          where: {
            id,
          },
          data: {
            topicId: values.topicId,
            question: values.question,
            answer: values.answer,
          },
        })
        message.success("Cập nhật tài liệu thành công")
      } else {
        await create({
          data: {
            topicId: values.topicId,
            question: values.question,
            answer: values.answer,
          },
        })
        message.success("Thêm tài liệu thành công")
      }
      onClose()
    } catch (_error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }
  const _handleDelete = async () => {
    if (!id) return
    try {
      await deleteFAQ({ where: { id } })
      message.success("Xoá tài liệu thành công")
      onClose()
    } catch (_error) {
      message.error("Xoá thất bại")
    }
  }
  return (
    <Modal
      title={
        id && detail?.status === $Enums.DocumentStatus.APPROVE
          ? "Chi tiết"
          : id
            ? "Chỉnh sửa"
            : "Thêm mới"
      }
      open={isOpen}
      className={cn("min-w-[50vw]")}
      onCancel={onClose}
      okText={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : "Đồng ý"}
      cancelText={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : "Hủy"}
      onOk={id && detail?.status === $Enums.DocumentStatus.APPROVE ? undefined : form.submit}
      footer={
        id ? (
          <div className="flex justify-end items-center">
            {/* <Popconfirm
                            title="Xác nhận xoá câu hỏi?"
                            description="Hành động này sẽ không thể hoàn tác."
                            okText="Đồng ý"
                            cancelText="Hủy"
                            onConfirm={handleDelete}
                        >
                            <Button
                                //   danger
                                type="default"
                                className="w-[30px] h-[30px] p-0"
                            >
                                <Trash2 className="w-full h-[18px]" />
                            </Button>
                        </Popconfirm> */}
            {detail?.status === $Enums.DocumentStatus.APPROVE ? (
              <Button onClick={onClose}>Đóng</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={onClose}>Hủy</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  Đồng ý
                </Button>
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Col span={24}>
          <FormItem
            form={form}
            name={"topicId"}
            label="Loại câu hỏi"
            rules={[{ required: true, message: "Vui lòng chọn loại câu hỏi" }]}
          >
            <Select
              options={selectableTopicOptions.map((topic) => ({
                value: topic.id,
                label: topic.name,
              }))}
              placeholder="Chọn loại câu hỏi"
            />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem
            form={form}
            name={"question"}
            label="Câu hỏi"
            rules={[{ required: true, message: "Vui lòng nhập câu hỏi" }]}
          >
            <Input />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem
            form={form}
            name={"answer"}
            label="Câu trả lời"
            rules={[{ required: true, message: "Vui lòng nhập câu trả lời" }]}
          >
            <Input.TextArea rows={6} />
          </FormItem>
        </Col>
      </Form>
    </Modal>
  )
}

export default PutCauHoi
