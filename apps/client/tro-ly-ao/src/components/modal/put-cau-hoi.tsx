import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import { cn } from "@lib/utils"
import { $Enums } from "@workspace/db"
import { useCreateFAQ, useDeleteFAQ, useFindFirstFAQ, useUpdateFAQ } from "@workspace/db/hooks"
import {
  fetchGetSimilarDocumentsFqaSimilarAnswerGet,
  fetchGetSimilarDocumentsFqaSimilarQuestionGet,
} from "@api/qa/qaComponents"
import { Button, Col, Form, Input, Modal, message } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTopics } from "@/hooks/useTopics"

// Nguong diem tuong dong de xem la trung lap (0 - 1)
// BE tra ve cosine similarity, thuc te voi FAQ ngan chi dat ~0.5 - 0.7
// nen set nguong 0.5 de phat hien noi dung gan giong nhau.
const DUPLICATE_SCORE_THRESHOLD = 0.5

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

  const [form] = Form.useForm<FAQFormType>()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Goi OpenAPI kiem tra trung lap ngu nghia (cau hoi + cau tra loi)
  // API can id_fqa da ton tai va da duoc vectorize, nen:
  //  - Edit: kiem tra truoc khi update
  //  - Create: tao truoc roi kiem tra, neu trung thi xoa lai
  const checkSemanticDuplicate = async (
    faqId: string,
    topicType: string,
    selfId?: string
  ): Promise<{ duplicated: boolean; reason?: string }> => {
    try {
      const [similarQuestions, similarAnswers] = await Promise.all([
        fetchGetSimilarDocumentsFqaSimilarQuestionGet({
          queryParams: { id_fqa: faqId, topic_type: topicType },
        } as any).catch(() => [] as Array<{ id: string; score: number }>),
        fetchGetSimilarDocumentsFqaSimilarAnswerGet({
          queryParams: { id_fqa: faqId, topic_type: topicType },
        } as any).catch(() => [] as Array<{ id: string; score: number }>),
      ])

      const isOther = (r: { id: string; score: number }) =>
        r.id !== faqId && (!selfId || r.id !== selfId)

      const dupQ = (similarQuestions || []).find(
        (r) => isOther(r) && r.score >= DUPLICATE_SCORE_THRESHOLD
      )
      if (dupQ) {
        return {
          duplicated: true,
          reason: "Câu hỏi đã trùng hoặc gần giống một FAQ khác trong hệ thống.",
        }
      }

      const dupA = (similarAnswers || []).find(
        (r) => isOther(r) && r.score >= DUPLICATE_SCORE_THRESHOLD
      )
      if (dupA) {
        return {
          duplicated: true,
          reason: "Câu trả lời đã trùng hoặc gần giống một FAQ khác trong hệ thống.",
        }
      }

      return { duplicated: false }
    } catch (_err) {
      // Neu API loi, khong chan nguoi dung
      return { duplicated: false }
    }
  }

  // Hoi nguoi dung co muon luu du bi canh bao trung lap khong
  const confirmKeepDuplicate = (reason: string): Promise<boolean> =>
    new Promise((resolve) => {
      Modal.confirm({
        title: "Phát hiện nội dung trùng lặp",
        content: (
          <div>
            <p>{reason}</p>
            <p className="mt-2">Bạn có vẫn muốn lưu câu hỏi này không?</p>
          </div>
        ),
        okText: "Vẫn lưu",
        okButtonProps: { danger: true },
        cancelText: "Hủy",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })

  const onFinish = async (values: FAQFormType) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const trimmedQuestion = values.question?.trim()
      if (!trimmedQuestion) {
        message.error("Vui lòng nhập câu hỏi")
        return
      }

      const topicType = selectableTopicOptions.find((t) => t.id === values.topicId)?.type
      if (!topicType) {
        message.error("Không xác định được loại câu hỏi")
        return
      }

      if (id) {
        // Edit: kiem tra trung lap truoc khi update bang OpenAPI
        const check = await checkSemanticDuplicate(id, topicType, id)
        if (check.duplicated) {
          const keep = await confirmKeepDuplicate(
            check.reason || "Nội dung đã tồn tại trong hệ thống."
          )
          if (!keep) return
        }

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
        // Create: tao truoc, sau do kiem tra trung lap qua OpenAPI
        // Neu trung: hoi nguoi dung co muon giu lai khong — khong thi xoa rollback
        const created = await create({
          data: {
            topicId: values.topicId,
            question: values.question,
            answer: values.answer,
          },
        })

        const newId = (created as any)?.id as string | undefined
        if (newId) {
          const check = await checkSemanticDuplicate(newId, topicType, newId)
          if (check.duplicated) {
            const keep = await confirmKeepDuplicate(
              check.reason || "Nội dung đã tồn tại trong hệ thống."
            )
            if (!keep) {
              try {
                await deleteFAQ({ where: { id: newId } })
              } catch (_e) {
                // noop
              }
              return
            }
          }
        }

        message.success("Thêm tài liệu thành công")
      }
      onClose()
    } catch (_error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      setIsSubmitting(false)
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
      confirmLoading={isSubmitting}
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
                <Button onClick={onClose} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type="primary" loading={isSubmitting} onClick={() => form.submit()}>
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
