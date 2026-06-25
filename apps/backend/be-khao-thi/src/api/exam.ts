import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  ErrorMessageResponseSchema,
  SuccessMessageResponseSchema,
} from "../dto/common-response.dto"
import { ExamBankQuestionsResultSchema, GenExamBankResultSchema } from "../dto/exam-openapi.dto"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { $Enums, createId, type Prisma } from "@workspace/db"
import { getRandomQuestionIDs } from "@workspace/db/sql"
import { questionTypeLabels } from "@workspace/libs/constants"
import { prisma } from ".."
import { models } from "@workspace/db/zod"

const app = new OpenAPIHono({ strict: false })

const genRandomExamQuestionByRule = createRoute({
  operationId: "gen-exam-bank",
  path: "/random-exam-question-by-rule",
  tags: ["Đề thi"],
  summary: "Sinh đề thi theo cấu trúc đề thi",
  description: "Lấy theo testStructureRule đã được tạo",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              examId: z.string().openapi("examId", {
                description: "ID của đề thi",
              }),
              nOfnExamBank: z.number().openapi("nOfnExamBank", {
                description: "Số lượng đề thi",
              }),
              replace: z.boolean().default(false).openapi("replace", {
                description: "Xoá đề thi cũ nếu có",
              }),
            })
            .openapi("gen-exam-bank"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Sinh đề thi thành công",
      content: {
        "application/json": {
          schema: GenExamBankResultSchema,
        },
      },
    },
    400: {
      description: "Không đủ câu hỏi theo cấu trúc đề",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy kỳ thi hoặc cấu trúc đề",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(genRandomExamQuestionByRule, async (c) => {
  const { examId, nOfnExamBank, replace } = c.req.valid("json")

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      testStructureRules: {
        include: {
          knowledgeBlock: true,
          exam: {
            include: { questionBank: true },
          },
        },
      },
    },
  })
  if (!exam) {
    return c.json({ message: "Kỳ thi không tồn tại" }, 404)
  }

  if (!exam.testStructureRules.length) {
    return c.json({ message: "Cấu trúc đề thi không tồn tại" }, 404)
  }

  if (replace) {
    await prisma.examBank.deleteMany({
      where: { examId: examId },
    })
  }

  const existsExamBankCodes = (
    await prisma.examBank.findMany({
      where: { examId: examId },
      select: { examCode: true },
    })
  ).map(({ examCode }) => examCode)

  const maxLength = (existsExamBankCodes.length + nOfnExamBank).toString().length

  const examBankCodes = Array.from(
    { length: existsExamBankCodes.length + nOfnExamBank },
    (_, i) => {
      return (i + 1).toString().padStart(maxLength, "0")
    }
  ).filter((value) => !existsExamBankCodes.includes(value))

  const examBanks = Array.from({ length: nOfnExamBank }, (_, i) => {
    const id = createId()
    const questions: Prisma.ExamBankQuestionCreateManyInput[] = []
    return { id, examId, questions, examCode: examBankCodes[i] || "" }
  })

  for (const examBank of examBanks) {
    for (const rule of exam.testStructureRules) {
      if (!rule.exam?.questionBankId) {
        continue
      }
      const questionIds = await prisma.$queryRawTyped(
        getRandomQuestionIDs(
          rule.exam.questionBankId,
          rule.questionType,
          rule.questionPoint,
          rule.knowledgeBlockId,
          rule.count
        )
      )

      if (questionIds.length < rule.count) {
        const ruleInfo = [
          rule.knowledgeBlock.name,
          questionTypeLabels[rule.questionType],
          rule.questionPoint,
        ]
          .filter(Boolean)
          .join(" - ")

        return c.json({ message: `Không đủ câu hỏi cho ${ruleInfo} điểm` }, 400)
      }
      examBank.questions.push(
        ...questionIds.map(({ id }, idx) => ({
          examBankId: examBank.id,
          questionId: id,
          order: examBank.questions.length + idx + 1,
        }))
      )
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.examBank.createMany({
      data: examBanks.map(({ questions, ...examBank }) => examBank),
    })
    await tx.examBankQuestion.createMany({
      data: examBanks.flatMap((examBank) => examBank.questions),
    })
  })

  return c.json({ success: true, message: "Success" }, 200)
})

const getExamBankWithGrouping = createRoute({
  operationId: "get-exam-bank-with-grouping",
  path: "/exam-bank/questions",
  tags: ["Đề thi"],
  summary: "Lấy câu hỏi của đề thi có nhóm theo loại",
  description:
    "Truyền isGroup=true để nhóm câu hỏi trắc nghiệm và tự luận riêng, false để lấy tuần tự theo order",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.string().openapi("id", { description: "ID của ExamBank" }),
              isGroup: z.boolean().openapi("isGroup", {
                description: "true: nhóm trắc nghiệm / tự luận | false: theo thứ tự",
              }),
            })
            .openapi("get-exam-bank-with-grouping"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Dữ liệu đề thi với câu hỏi đã xử lý",
      content: {
        "application/json": {
          schema: ExamBankQuestionsResultSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy ExamBank",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(getExamBankWithGrouping, async (c) => {
  const { id, isGroup } = c.req.valid("json")

  const examBank = await prisma.examBank.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: {
            include: {
              multipleChoiceOptions: { orderBy: { order: "asc" } },
              fillInBlankSlots: { orderBy: { order: "asc" } },
              orderingItems: true,
              subQuestions: {
                where: { deletedAt: null },
                orderBy: { order: "asc" },
                include: {
                  multipleChoiceOptions: { orderBy: { order: "asc" } },
                  fillInBlankSlots: { orderBy: { order: "asc" } },
                  orderingItems: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!examBank) {
    return c.json({ message: "Đề thi không tồn tại" }, 404)
  }

  if (isGroup) {
    const listQuestionChoice = examBank.questions.filter(
      (q) => q.question?.type !== $Enums.QuestionType.ESSAY
    )
    const listQuestionEssay = examBank.questions.filter(
      (q) => q.question?.type === $Enums.QuestionType.ESSAY
    )
    return c.json({ isGroup, listQuestionChoice, listQuestionEssay }, 200)
  }

  return c.json({ isGroup, questions: examBank.questions }, 200)
})

const sinhdethuCong = createRoute({
  operationId: "single-topic-generation",
  path: "/single-topic-generation",
  tags: ["Đề thi"],
  summary: "Sinh đề thủ công (1 đề)",
  description: "Sinh 1 đề duy nhất theo ma trận cấu hình",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: models.ExamBankScalarSchema.extend({
            examFrameworkId: z.string().nonempty(),
            examMatrixId: z.string().nonempty(),
            examId: z.string().nonempty(),
            examTime: z.number().optional(),
            subjectClassId: z.string(),
            isNote: z.boolean(),
            description: z.string().optional(),
            isGroup: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Sinh đề thủ công thành công",
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(sinhdethuCong, async (c) => {
  const body = c.req.valid("json")

  function getRandomItems<T>(arr: T[], n: number): T[] {
    const copy: any = [...arr]
    const result: T[] = []
    while (result.length < n) {
      const idx = Math.floor(Math.random() * copy.length)
      result.push(copy[idx])
      copy.splice(idx, 1)
    }
    return result
  }

  function shuffleWithConstraints(questions: any[]): any[] {
    const arr = [...questions]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    const hasImage = (q: any): boolean =>
      typeof q.content === "string" && q.content.includes("<img")

    const result: any[] = []
    const remaining = [...arr]

    while (remaining.length > 0) {
      const prev = result[result.length - 1]
      let pickedIdx = -1

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i]
        const sameBlock =
          prev?.knowledgeBlockId && candidate.knowledgeBlockId === prev.knowledgeBlockId
        const bothHaveImage = prev && hasImage(prev) && hasImage(candidate)

        if (!sameBlock && !bothHaveImage) {
          pickedIdx = i
          break
        }
      }

      if (pickedIdx === -1) pickedIdx = 0
      result.push(remaining[pickedIdx])
      remaining.splice(pickedIdx, 1)
    }

    return result
  }

  const matrixData: any = await prisma.knowledgeBlock.findMany({
    where: {
      examMatrixId: body?.examMatrixId,
      deletedAt: null,
    },
    include: {
      questions: {
        where: {
          deletedAt: null,
          parentQuestionId: null,
        },
        include: {
          subQuestions: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            include: {
              multipleChoiceOptions: { orderBy: { order: "asc" } },
              fillInBlankSlots: { orderBy: { order: "asc" } },
              orderingItems: true,
            },
          },
        },
      },
      configExams: true,
    },
  })

  if (!matrixData.length) {
    return c.json({ message: "Chưa có ma trận đề" }, 400)
  }

  let questions: any = []

  for (const knowledgeBlock of matrixData) {
    if (knowledgeBlock.configExams.length) {
      for (const configExam of knowledgeBlock.configExams) {
        const listRamdom = knowledgeBlock.questions.filter(
          (i: any) =>
            i?.difficult === configExam.difficult &&
            (configExam.type == null || i?.type === configExam.type) &&
            i?.point === configExam.point
        )

        if (listRamdom.length < configExam.quantity) {
          return c.json({ message: "Không đúng số câu hỏi" }, 400)
        }

        const selected = getRandomItems(listRamdom, configExam.quantity)
        questions = [...questions, ...selected]
      }
    }
  }

  questions = shuffleWithConstraints(questions)

  await prisma.examBank.create({
    data: {
      examCode: body?.examCode,
      explain: body.explain,
      examDay: body.examDay,
      examTime: body.examTime,
      examMatrixId: body?.examMatrixId,
      examId: body?.examId,
      examType: body?.examType,
      subjectClassId: body?.subjectClassId,
      isNote: body.isNote,
      isGroup: body.isGroup,
      description: body.description,
      questions: {
        createMany: {
          data: questions.map((item: any) => ({
            questionId: item.id,
          })),
        },
      },
    },
  })

  return c.json({ message: "Success" })
})

export default app
