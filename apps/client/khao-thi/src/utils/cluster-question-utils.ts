import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import type { Prisma, QuestionType } from "@workspace/db/client"
import { QuestionType as QuestionTypeEnum } from "@workspace/db/client"
import {
  CLUSTER_QUESTION_TYPE,
  type SubQuestionFormItem,
} from "../components/modal/cluster-sub-questions-form"

export type QuestionPreviewInput = {
  content?: string | null
  type?: QuestionType
  subQuestions?: Array<{
    id: string
    content: string
    multipleChoiceOptions?: Array<{ id: string; content: string }>
  }>
}

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

export function renderQuestionPreviewHtml(question: QuestionPreviewInput) {
  let html = question.content ? renderWithMath(question.content) : "<i>Chưa có nội dung</i>"

  if ((question.subQuestions?.length ?? 0) > 0 && question.type === CLUSTER_QUESTION_TYPE) {
    html += `<div class="mt-3 space-y-2 border-t border-gray-200 pt-2">${(
      question.subQuestions ?? []
    )
      .map((sub, subIndex) => {
        const { prefix, body } = formatClusterSubLabel(subIndex, sub.content)
        const options = (sub.multipleChoiceOptions ?? [])
          .map(
            (o) =>
              `<div class="text-gray-600 pl-2"><span>${o.content ? renderWithMath(o.content) : ""}</span></div>`
          )
          .join("")
        return `<div class="text-xs"><div class="font-medium text-gray-700 mb-1">${prefix}${body ? ` <span>${renderWithMath(body)}</span>` : ""}</div>${options}</div>`
      })
      .join("")}</div>`
  }

  return html
}

export type QuestionExamInput = Omit<QuestionPreviewInput, "subQuestions"> & {
  multipleChoiceOptions?: Array<{ id?: string; content?: string | null; isCorrect?: boolean }>
  fillInBlankSlots?: Array<{ order: number; correctAnswer: string }>
  orderingItems?: Array<{ id?: string; content?: string | null; correctOrder?: number }>
  explanation?: string | null
  subQuestions?: Array<{
    id: string
    content: string
    type?: QuestionType
    multipleChoiceOptions?: Array<{ content?: string | null; isCorrect?: boolean }>
    fillInBlankSlots?: Array<{ order: number; correctAnswer: string }>
    orderingItems?: Array<{ content?: string | null; correctOrder?: number }>
    explanation?: string | null
  }>
}

const stripParagraphTags = (html: string) =>
  html.replace(/<p[^>]*>/g, "").replace(/<\/p>/g, " ").trim()

function renderOptionsBlock(
  multipleChoiceOptions?: QuestionExamInput["multipleChoiceOptions"],
  orderingItems?: QuestionExamInput["orderingItems"]
) {
  return [
    ...(multipleChoiceOptions ?? []).map(
      (o) =>
        `<div style="margin-left:20px">${o.content ? stripParagraphTags(renderWithMath(o.content)) : ""}</div>`
    ),
    ...(orderingItems ?? []).map(
      (o) =>
        `<div style="margin-left:20px">${o.content ? stripParagraphTags(renderWithMath(o.content)) : ""}</div>`
    ),
  ].join("")
}

/** In/tải đề & đáp án — cùng style inline với câu thường */
export function renderQuestionExamHtml(question: QuestionExamInput) {
  let html = question.content ? stripParagraphTags(renderWithMath(question.content)) : ""

  if (question.type === CLUSTER_QUESTION_TYPE && question.subQuestions?.length) {
    html += question.subQuestions
      .map((sub, i) => {
        const { prefix, body } = formatClusterSubLabel(i, sub.content)
        const subText = body ? ` ${stripParagraphTags(renderWithMath(body))}` : ""
        return `<div style="margin-top:8px"><strong>${prefix}</strong>${subText}${renderOptionsBlock(sub.multipleChoiceOptions, sub.orderingItems)}</div>`
      })
      .join("")
    return html
  }

  return html + renderOptionsBlock(question.multipleChoiceOptions, question.orderingItems)
}

function answerTextForOne(question: QuestionExamInput): string {
  if (question.multipleChoiceOptions?.length) {
    return question.multipleChoiceOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.content ?? "")
      .join(", ")
  }
  if (question.orderingItems?.length) {
    return [...question.orderingItems]
      .sort((a, b) => (a.correctOrder ?? 0) - (b.correctOrder ?? 0))
      .map((_, i) => String.fromCharCode(65 + i))
      .join(" → ")
  }
  if (question.fillInBlankSlots?.length) {
    return [...question.fillInBlankSlots]
      .sort((a, b) => a.order - b.order)
      .map((s) => s.correctAnswer)
      .join(", ")
  }
  return question.explanation ?? ""
}

export function renderQuestionAnswerHtml(question: QuestionExamInput): string {
  if (question.type === CLUSTER_QUESTION_TYPE && question.subQuestions?.length) {
    return question.subQuestions
      .map((sub, i) => {
        const { prefix } = formatClusterSubLabel(i, sub.content)
        return `<div style="margin-top:4px"><strong>${prefix}</strong> ${stripParagraphTags(renderWithMath(answerTextForOne(sub)))}</div>`
      })
      .join("")
  }
  return stripParagraphTags(renderWithMath(answerTextForOne(question)))
}

export function plainQuestionAnswerText(question: QuestionExamInput): string {
  if (question.type === CLUSTER_QUESTION_TYPE && question.subQuestions?.length) {
    return question.subQuestions
      .map((sub, i) => {
        const { prefix } = formatClusterSubLabel(i, sub.content)
        return `${prefix} ${answerTextForOne(sub)}`
      })
      .join("\n")
  }
  return answerTextForOne(question)
}
