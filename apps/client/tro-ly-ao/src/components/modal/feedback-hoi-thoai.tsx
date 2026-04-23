import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { $Enums } from "@workspace/db"
import { useCreateConversationFeedback, useFindUniqueConversation } from "@workspace/db/hooks"
import { Col, Form, Input, Rate, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useUserSession } from "@/hooks/useUserSession"

type FeedbackFormType = {
  rating: number // 1..5
  comment?: string
}

// Map antd Rate (1..5) to FeedbackRating enum
const RATING_BY_STAR: Record<number, $Enums.FeedbackRating> = {
  1: $Enums.FeedbackRating.VERY_BAD,
  2: $Enums.FeedbackRating.BAD,
  3: $Enums.FeedbackRating.NORMAL,
  4: $Enums.FeedbackRating.GOOD,
  5: $Enums.FeedbackRating.VERY_GOOD,
}

const FeedbackHoiThoai = () => {
  const { sessionId } = useUserSession()
  const { isOpen, onClose, input } = useDisclosure<{ conversationId: string }>({
    tag: "FeedbackHoiThoai",
  })

  const conversationId = input?.conversationId

  const [form] = Form.useForm<FeedbackFormType>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lấy hội thoại + messages + topic để snapshot
  const { data: conversation } = useFindUniqueConversation(
    {
      where: { id: conversationId || "" },
      include: {
        topic: true,
        message: {
          orderBy: { createdAt: "asc" },
        },
      },
    },
    { enabled: !!conversationId && isOpen }
  )

  const { mutateAsync: createFeedback } = useCreateConversationFeedback()

  // Reset form mỗi lần mở
  useEffect(() => {
    if (isOpen) {
      form.resetFields()
      form.setFieldsValue({ rating: 5 })
    }
  }, [isOpen, form])

  // Nhãn hội thoại để hiển thị (ưu tiên name, sau đó câu hỏi đầu của user)
  const conversationLabel = useMemo(() => {
    if (!conversation) return ""
    if (conversation.name) return conversation.name
    const firstUserMessage = conversation.message?.find(
      (m: any) => m.sender === $Enums.MessageSender.USER
    )
    return firstUserMessage?.content || "Hội thoại"
  }, [conversation])

  const onFinish = async (values: FeedbackFormType) => {
    if (!conversationId || isSubmitting) return
    const ratingEnum = RATING_BY_STAR[values.rating]
    if (!ratingEnum) {
      message.error("Vui lòng chọn mức đánh giá")
      return
    }
    setIsSubmitting(true)
    try {
      const messagesSnapshot = (conversation?.message || []).map((m: any) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
      }))

      await createFeedback({
        data: {
          rating: ratingEnum,
          comment: values.comment?.trim() || null,
          conversationId,
          conversationNameSnapshot: conversationLabel || null,
          topicIdSnapshot: conversation?.topicId || null,
          topicNameSnapshot: (conversation as any)?.topic?.name || null,
          messagesSnapshot: messagesSnapshot.length > 0 ? messagesSnapshot : undefined,
          sessionId: sessionId || null,
        } as any,
      })
      message.success("Cảm ơn bạn đã gửi phản hồi!")
      onClose()
    } catch (error) {
      console.error(error)
      message.error("Gửi phản hồi thất bại, vui lòng thử lại sau")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PutFormModal<FeedbackFormType>
      open={isOpen}
      onCancel={onClose}
      title="Phản hồi về hội thoại"
      okText="Gửi phản hồi"
      cancelText="Hủy"
      width={600}
      confirmLoading={isSubmitting}
      form={form}
      onFinish={onFinish}
    >
      {conversationLabel && (
        <Col span={24}>
          <div className="mb-3 px-3 py-2 bg-gray-50 rounded text-sm text-gray-700 truncate">
            <span className="font-medium">Hội thoại:</span> {conversationLabel}
          </div>
        </Col>
      )}
      <Col span={24}>
        <FormItem
          form={form}
          name="rating"
          label="Mức độ hài lòng"
          rules={[{ required: true, message: "Vui lòng chọn mức đánh giá" }]}
        >
          <Rate />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="comment" label="Nội dung phản hồi (không bắt buộc)">
          <Input.TextArea
            rows={4}
            maxLength={1000}
            showCount
            placeholder="Chia sẻ thêm chi tiết về trải nghiệm của bạn..."
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default FeedbackHoiThoai
