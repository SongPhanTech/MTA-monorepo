import type { Prisma, QuestionType } from "@workspace/db/client"
import { QuestionType as QuestionTypeEnum } from "@workspace/db/client"
import { CLUSTER_QUESTION_TYPE, type SubQuestionFormItem } from "../components/modal/cluster-sub-questions-form"

export function mapSubQuestionFromDb(
  sub: Prisma.QuestionGetPayload<{
    include: {
      multipleChoiceOptions: true
      fillInBlankSlots: true
      orderingItems: true
    }
  }>
): SubQuestionFormItem {
  let options: SubQuestionFormItem["multipleChoiceOptions"] = []

  switch (sub.type) {
    case QuestionTypeEnum.SINGLE_CHOICE:
    case QuestionTypeEnum.MULTIPLE_CHOICE:
      options =
        sub.multipleChoiceOptions
          ?.sort((a, b) => a.order - b.order)
          .map((i) => ({
            id: i.id,
            key: String(i.order),
            content: i.content,
            isCorrect: i.isCorrect,
          })) || []
      break
    case QuestionTypeEnum.FILL_IN_BLANK:
      options =
        sub.fillInBlankSlots
          ?.sort((a, b) => a.order - b.order)
          .map((s) => ({
            key: String(s.order),
            content: s.correctAnswer,
          })) || []
      break
    case QuestionTypeEnum.ORDERING:
      options =
        sub.orderingItems?.map((o) => ({
          id: o.id,
          key: String(o.id),
          content: o.content,
          correctOrder: o.correctOrder,
        })) || []
      break
    default:
      options = []
  }

  return {
    id: sub.id,
    type: sub.type,
    content: sub.content,
    difficult: sub.difficult ?? "D1",
    point: sub.point,
    explanation: sub.explanation ?? undefined,
    multipleChoiceOptions: options,
  }
}

export function buildSubQuestionCreateData(
  sq: SubQuestionFormItem,
  order: number,
  questionBankId: string,
  parentQuestionId?: string
) {
  const base = {
    content: sq.content?.trim() || "",
    type: sq.type,
    difficult: sq.difficult,
    point: sq.point ?? 0,
    explanation: sq.explanation,
    questionBankId,
    parentQuestionId,
    order,
    isAutoGraded: true,
  }

  if (sq.type === QuestionTypeEnum.SINGLE_CHOICE || sq.type === QuestionTypeEnum.MULTIPLE_CHOICE) {
    return {
      ...base,
      multipleChoiceOptions: {
        createMany: {
          data: sq.multipleChoiceOptions.map((o, i) => ({
            content: o.content,
            isCorrect: !!o.isCorrect,
            order: i + 1,
          })),
        },
      },
    }
  }

  if (sq.type === QuestionTypeEnum.FILL_IN_BLANK) {
    return {
      ...base,
      fillInBlankSlots: {
        createMany: {
          data: sq.multipleChoiceOptions.map((o, i) => ({
            order: i + 1,
            correctAnswer: o.content,
          })),
        },
      },
    }
  }

  if (sq.type === QuestionTypeEnum.ORDERING) {
    return {
      ...base,
      orderingItems: {
        createMany: {
          data: sq.multipleChoiceOptions
            .filter((o) => o.content && o.correctOrder !== undefined)
            .map((o) => ({
              content: o.content,
              correctOrder: Number(o.correctOrder),
            })),
        },
      },
    }
  }

  return base
}

export function validateSubQuestion(sq: SubQuestionFormItem, index: number): string | null {
  const label = `Câu ${String.fromCharCode(97 + index)})`

  if (sq.type === QuestionTypeEnum.SINGLE_CHOICE || sq.type === QuestionTypeEnum.MULTIPLE_CHOICE) {
    if (!sq.multipleChoiceOptions?.length || sq.multipleChoiceOptions.some((o) => !o.content)) {
      return `${label}: Vui lòng nhập đầy đủ đáp án`
    }
    const correct = sq.multipleChoiceOptions.filter((o) => o.isCorrect)
    if (
      correct.length === 0 ||
      (sq.type === QuestionTypeEnum.SINGLE_CHOICE && correct.length > 1) ||
      (sq.type === QuestionTypeEnum.MULTIPLE_CHOICE && correct.length < 2)
    ) {
      return `${label}: Vui lòng chọn đúng đáp án`
    }
  }

  return null
}

export async function updateSubQuestion(
  id: string,
  sq: SubQuestionFormItem,
  order: number,
  questionBankId: string,
  updateQuestion: (args: {
    where: { id: string }
    data: Record<string, unknown>
  }) => Promise<unknown>
) {
  const base = {
    content: sq.content?.trim() || "",
    type: sq.type,
    difficult: sq.difficult,
    point: sq.point ?? 0,
    explanation: sq.explanation,
    questionBankId,
    order,
    isAutoGraded: true,
  }

  if (sq.type === QuestionTypeEnum.SINGLE_CHOICE || sq.type === QuestionTypeEnum.MULTIPLE_CHOICE) {
    await updateQuestion({
      where: { id },
      data: {
        ...base,
        multipleChoiceOptions: {
          upsert: sq.multipleChoiceOptions.map((o, index) => ({
            where: { id: o.id || "" },
            update: {
              content: o.content,
              isCorrect: !!o.isCorrect,
              order: index + 1,
            },
            create: {
              content: o.content,
              isCorrect: !!o.isCorrect,
              order: index + 1,
            },
          })),
        },
      },
    })
    return
  }

  await updateQuestion({ where: { id }, data: base })
}

export { CLUSTER_QUESTION_TYPE }

export function formatClusterSubLabel(index: number, content?: string) {
  const label = String.fromCharCode(97 + index)
  const text = (content || "").trim()
  if (!text || new RegExp(`^${label}\\)\\s*$`, "i").test(text)) {
    return { prefix: `${label})`, body: "" }
  }
  return {
    prefix: `${label})`,
    body: text.replace(new RegExp(`^${label}\\)\\s*`, "i"), ""),
  }
}
