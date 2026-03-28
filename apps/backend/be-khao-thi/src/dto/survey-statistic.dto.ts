import { z } from "@hono/zod-openapi"

export const AnswerStatisticSchema = z.object({
  id: z.string(),
  answer: z.string(),
  description: z.string().nullable(),
  count: z.number(),
})

export const QuestionStatisticSchema = z.object({
  id: z.string(),
  name: z.string(),
  answers: z.array(AnswerStatisticSchema),
})

export const SurveyStatisticSchema = z.object({
  surveyId: z.string(),
  surveyName: z.string(),
  questions: z.array(QuestionStatisticSchema),
})
