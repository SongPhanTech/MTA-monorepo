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

export const SurveyFieldGroupStatisticSchema = z.object({
  groupId: z.string(),
  groupName: z.string().optional(),
  answers: z.array(AnswerStatisticSchema),
  questions: z.array(QuestionStatisticSchema),
})

export const SurveyMajorCountItemSchema = z.object({
  name: z.string(),
  total: z.number(),
  taken: z.number(),
  organization: z.string().optional(),
})

export const SurveyMajorCountResponseSchema = z
  .array(SurveyMajorCountItemSchema)
  .openapi("SurveyMajorCountResponse")

export const SurveyStatisticsByFieldResponseSchema = z
  .object({
    surveyId: z.string(),
    surveyName: z.string(),
    data: z.array(SurveyFieldGroupStatisticSchema),
  })
  .openapi("SurveyStatisticsByFieldResponse")

export const GraduateSurveyReportResponseSchema = z
  .object({
    surveyInfo: z.object({
      id: z.string(),
      name: z.string(),
      courseName: z.string(),
      surveyDate: z.string(),
      reportLocationDate: z.string(),
      organizationHeader: z.string(),
      departmentHeader: z.string(),
      reportTitle: z.string(),
    }),
    sectionA: z.object({
      title: z.string(),
      introText: z.string(),
      totalMajors: z.number(),
      totalStudents: z.number(),
      totalTaken: z.number(),
      majors: z.array(
        z.object({
          name: z.string(),
          taken: z.number(),
          total: z.number(),
          organization: z.string().optional(),
        })
      ),
    }),
    sectionB: z.object({
      title: z.string(),
      fields: z.array(
        z.object({
          id: z.string(),
          key: z.string(),
          order: z.number(),
          title: z.string(),
          generalText: z.string(),
          standoutText: z.string(),
          standoutMajors: z.array(z.string()),
          agreeRatio: z.string(),
        })
      ),
    }),
    sectionC: z.object({
      title: z.string(),
      satisfactionPercent: z.number(),
      satisfiedCount: z.number(),
      totalCount: z.number(),
      text: z.string(),
    }),
    sectionD: z.object({
      title: z.string(),
      introText: z.string(),
      departments: z.array(
        z.object({
          name: z.string(),
          romanIndex: z.string(),
          majors: z.array(
            z.object({
              name: z.string(),
              arabicIndex: z.number(),
              categories: z.array(
                z.object({
                  title: z.string(),
                  items: z.array(
                    z.object({
                      text: z.string(),
                      countText: z.string(),
                    })
                  ),
                })
              ),
            })
          ),
        })
      ),
    }),
    recommendation: z.object({
      title: z.string(),
      text: z.string(),
      signTitle: z.string(),
    }),
  })
  .openapi("GraduateSurveyReportResponse")
