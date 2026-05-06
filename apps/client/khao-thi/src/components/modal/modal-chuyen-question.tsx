import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import {
  useCreateQuestion,
  useFindManyExamFramework,
  useFindManyExamMatrix,
  useFindManyKnowledgeBlock,
  useFindManyQuestion,
  useUpdateQuestion,
} from "@workspace/db/hooks"
import { Col, Form, message, Row, Switch } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface MoveQuestionForm {
  examFrameworkId: string
  examMatrixId: string
  knowledgeBlockId: string
  keepOld: boolean
}

const MoveQuestionModal = () => {
  const [form] = Form.useForm<any>()
  const [keepOld, setKeepOld] = useState(true)

  const { isOpen, onClose, input } = useDisclosure<{
    questionIds: string[]
    onDone?: () => void
  }>({
    tag: "MoveQuestionModal",
    onClose: () => {
      form.resetFields()
      setKeepOld(true)
    },
  })

  const examFrameworkId = Form.useWatch("examFrameworkId", form) as string | undefined
  const examMatrixId = Form.useWatch("examMatrixId", form) as string | undefined
  const { mutateAsync: updateQuestion } = useUpdateQuestion()
  const { mutateAsync: createQuestion } = useCreateQuestion()

  const { data: selectedQuestions = [] } = useFindManyQuestion(
    {
      where: {
        id: { in: input?.questionIds || [] },
        deletedAt: null,
      },
      include: {
        multipleChoiceOptions: true,
        orderingItems: true,
        fillInBlankSlots: true,
      },
    },
    {
      enabled: !!input?.questionIds?.length,
    }
  )

  const { data: examFrameworks = [] } = useFindManyExamFramework()

  const { data: examMatrixs = [] } = useFindManyExamMatrix(
    {
      where: {
        examFrameworkId,
      },
    },
    {
      enabled: !!examFrameworkId,
    }
  )

  const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock(
    {
      where: {
        examMatrixId,
      },
    },
    {
      enabled: !!examMatrixId,
    }
  )

  async function onSubmit(values: MoveQuestionForm) {
    try {
      if (!input?.questionIds?.length) {
        message.error("Không có câu hỏi nào được chọn")
        return
      }
      if (!values.knowledgeBlockId) {
        message.error("Vui lòng chọn chuẩn đầu ra")
        return
      }

      const { knowledgeBlockId } = values

      await Promise.all(
        selectedQuestions.map((q) =>
          createQuestion({
            data: {
              content: q.content,
              explanation: q.explanation,
              type: q.type,
              difficult: q.difficult,
              point: q.point ?? 1,
              isAutoGraded: q.isAutoGraded ?? false,
              knowledgeBlockId,
              questionBankId: q.questionBankId,

              multipleChoiceOptions:
                q.multipleChoiceOptions?.length > 0
                  ? {
                      createMany: {
                        data: q.multipleChoiceOptions.map((opt, index) => ({
                          content: opt.content,
                          isCorrect: opt.isCorrect,
                          order: opt.order ?? index + 1,
                        })),
                      },
                    }
                  : undefined,

              orderingItems:
                q.orderingItems?.length > 0
                  ? {
                      createMany: {
                        data: q.orderingItems.map((item) => ({
                          content: item.content,
                          correctOrder: item.correctOrder,
                        })),
                      },
                    }
                  : undefined,

              fillInBlankSlots:
                q.fillInBlankSlots?.length > 0
                  ? {
                      createMany: {
                        data: q.fillInBlankSlots.map((slot, index) => ({
                          order: slot.order ?? index + 1,
                          correctAnswer: slot.correctAnswer,
                        })),
                      },
                    }
                  : undefined,
            },
          })
        )
      )
      if (!keepOld) {
        await Promise.all(
          input.questionIds.map((id) =>
            updateQuestion({
              where: { id },
              data: { deletedAt: new Date() },
            })
          )
        )
        message.success(`Đã chuyển ${selectedQuestions.length} câu hỏi`)
      } else {
        message.success(`Đã sao chép ${selectedQuestions.length} câu hỏi`)
      }

      input?.onDone?.()
      form.resetFields()
      onClose()
    } catch (error) {
      console.error(error)
      message.error("Chuyển câu hỏi thất bại")
    }
    await queryClient.invalidateQueries({
      queryKey: ["Question"],
    })
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onSubmit}
      onCancel={onClose}
      title="Chuyển câu hỏi tới"
      width={520}
      maskClosable
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <FormItem form={form} name="examFrameworkId" label="Khung đề" required>
            <Select
              placeholder="Chọn khung đề"
              options={examFrameworks.map((i) => ({
                value: i.id,
                label: i.name,
              }))}
            />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="examMatrixId" label="Ma trận đề" required>
            <Select
              placeholder="Chọn ma trận đề"
              disabled={!examFrameworkId}
              options={examMatrixs.map((i) => ({
                value: i.id,
                label: i.name,
              }))}
            />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="knowledgeBlockId" label="Chuẩn đầu ra" required>
            <Select
              placeholder="Chọn chuẩn đầu ra"
              disabled={!examMatrixId}
              options={knowledgeBlocks.map((i) => ({
                value: i.id,
                label: i.name,
              }))}
            />
          </FormItem>
        </Col>
        <Col span={24}>
          <div className="flex items-center gap-2">
            <Switch checked={keepOld} onChange={setKeepOld} />
            <span>Giữ lại câu hỏi cũ</span>
          </div>
        </Col>
      </Row>
    </PutFormModal>
  )
}

export default MoveQuestionModal
