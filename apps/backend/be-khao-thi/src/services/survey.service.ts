import {
  type DM_DonVi,
  getOrganizationAndAllChildren,
  type Lecturer,
  type PrismaClient,
  type SubjectClass,
  type Survey,
  type SurveyChoice,
  type SurveyQuestion,
  type UserProfile,
} from "@workspace/db"
import { models } from "@workspace/db/zod"
import { prisma } from ".."

// Define the surveyReportTable type (replace fields with actual structure as needed)
type surveyReportTable = {
  stt: number
  cDoituong: string
  cPhatRa: string
  cThuVao: string
  cGhiChu: string
}

export const calculateSurveyReport = async (surveyId: string) => {
  const survey = await prisma.survey.findFirstOrThrow({
    where: { id: surveyId },
  })
  if (!survey) {
    throw new Error("Survey not found")
  }

  const surveySessions = await prisma.surveySession.findMany({
    where: { surveyId },
  })

  let stt = 1
  // Calculate report data
  const reportData: surveyReportTable[] = []

  for (const session of surveySessions) {
    reportData.push({
      stt,
      cDoituong: "session.cDoituong",
      cPhatRa: "session.cPhatRa",
      cThuVao: "session.cThuVao",
      cGhiChu: "session.cGhiChu",
    })
    stt++
  }

  return reportData
}

import { z } from "zod"

const AnswerStatSchema = z.object({
  id: z.string(),
  answer: z.string(),
  description: z.string().nullable(),
  count: z.number(),
  total: z.number(),
  rate: z.number(),
  sRate: z.string(),
  summary: z.string(),
})

const QuestionStatSchema = z.object({
  id: z.string(),
  name: z.string(),
  answers: z.array(AnswerStatSchema),
})

const AverageLecturerSchema = models.SurveyChoiceSchema.extend({
  totalCount: z.number(),
})

const AverageSchema = z.object({
  totalRate: z.number(),
  average: z.number(),
})

export const SurveyStatsSchema = z.object({
  surveyId: z.string(),
  lecture: z.string().optional().nullable(),
  subjectClassId: z.string().optional().nullable(),
  subjectClassName: z.string().optional().nullable(),
  lectureId: z.string().optional().nullable(),
  questions: z.array(QuestionStatSchema),
  average: z.array(AverageSchema),
})
export const SurveyStatsLecSchema = z.object({
  questions: z.array(QuestionStatSchema),
  average: z.array(AverageSchema),
})

export const LecturerSurveyStatsSchema = z.object({
  lecture: models.LecturerScalarSchema.extend({
    userProfile: models.UserProfileScalarSchema.nullish(),
  }),
  average: z.array(AverageLecturerSchema),
})

export const OrgazationsSurveyStatsSchema = z.object({
  organization: models.DM_DonViScalarSchema,
  average: z.array(AverageLecturerSchema),
})

export type SurveyStats = z.infer<typeof SurveyStatsSchema>

export const getSurveyStats = async (
  prisma: PrismaClient,
  survey: Survey & {
    subjectClass?: SubjectClass | null
    lecture?: (Lecturer & { userProfile: UserProfile | null }) | null
  },
  questions: SurveyQuestion[],
  choices: SurveyChoice[]
) => {
  const questionIds = questions.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId", "surveyChoiceId"],
    where: {
      surveySession: { surveyId: survey.id },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId"],
    where: {
      surveySession: { surveyId: survey.id },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyQuestionId: true },
  })

  const questionCountMap = new Map(
    responseCounts.map((i) => [i.surveyQuestionId, i._count.surveyQuestionId])
  )

  const questionsStatistics = questions.map((question) => {
    const answers = choices.map((choice) => {
      const key = `${question.id}-${choice.id}`
      const rate = Number(
        ((answerCountMap[key] || 0) / (questionCountMap.get(question.id) || 1)).toFixed(1)
      )
      const sRate = `${rate}%`
      const summary = `${answerCountMap[key]}/${questionCountMap.get(question.id)} (${rate})`
      return {
        id: choice.id,
        answer: choice.answer,
        description: choice.description,
        count: answerCountMap[key] || 0,
        total: questionCountMap.get(question.id) || 0,
        rate,
        sRate,
        summary,
      }
    })
    return {
      id: question.id,
      name: question.name,
      answers,
    }
  })

  const average = choices.map((choice) => {
    if (questionsStatistics.length === 0)
      return {
        average: 0,
        totalRate: 0,
      }

    const count = questionsStatistics.reduce((acc, curr) => {
      return acc + (curr.answers.find((i) => i.id === choice.id)?.count || 0)
    }, 0)

    // const average = Number((totalRate / questionsStatistics.length).toFixed(2))
    return { average: 0, totalRate: count }
  })

  return {
    surveyId: survey.id,
    subjectClassId: survey?.subjectClass?.id,
    subjectClassName: `${survey?.subjectClass?.code} - ${survey?.subjectClass?.name}`,
    lecture: survey.lecture?.userProfile?.fullname,
    lectureId: survey.lecture?.id,
    questions: questionsStatistics,
    average,
  }
}

export const getLecturerSurveyStats = async (
  prisma: PrismaClient,
  lecture: Lecturer & { userProfile: UserProfile | null },
  // survey: Survey & {subjectClass?:SubjectClass |null, lecture?: (Lecturer & { userProfile: UserProfile | null }) | null },
  questions: SurveyQuestion[],
  choices: SurveyChoice[],
  clusterSurveyId: string
) => {
  const questionIds = questions.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyChoiceId"],
    where: {
      surveySession: {
        survey: {
          lectureId: lecture?.id,
          clusterSurveyId,
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = curr.surveyChoiceId
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const average = choices.map((i) => {
    return { ...i, totalCount: answerCountMap[i.id] || 0 }
  })

  return {
    lecture: lecture,
    average,
  }
}
export const getOrganizationsSurveyStats = async (
  prisma: PrismaClient,
  orga: DM_DonVi,
  questions: SurveyQuestion[],
  choices: SurveyChoice[],
  clusterSurveyId: string
) => {
  const questionIds = questions.map((q) => q.id)
  const organizations = await getOrganizationAndAllChildren(prisma, orga.Id)
  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyChoiceId"],
    where: {
      surveySession: {
        survey: {
          lecture: {
            userProfile: {
              sDM_DonViId: {
                in: organizations.map((i: DM_DonVi) => i.Id),
              },
            },
          },
          clusterSurveyId,
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = curr.surveyChoiceId
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const average = choices.map((i) => {
    return { ...i, totalCount: answerCountMap[i.id] || 0 }
  })

  return {
    organization: orga,
    average,
  }
}

export const getSurveyStatsforQuestion = async (
  prisma: PrismaClient,
  clusterSurveyId: string,
  lectureId: string,
  questions: SurveyQuestion[],
  choices: SurveyChoice[]
) => {
  const questionIds = questions.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId", "surveyChoiceId"],
    where: {
      surveySession: {
        survey: {
          clusterSurveyId,
          lectureId,
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId"],
    where: {
      surveySession: {
        survey: {
          clusterSurveyId,
          lectureId,
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyQuestionId: true },
  })

  const questionCountMap = new Map(
    responseCounts.map((i) => [i.surveyQuestionId, i._count.surveyQuestionId])
  )

  const questionsStatistics = questions.map((question) => {
    const answers = choices.map((choice) => {
      const key = `${question.id}-${choice.id}`
      const rate = Number(
        ((answerCountMap[key] || 0) / (questionCountMap.get(question.id) || 1)).toFixed(1)
      )
      const sRate = `${rate}%`
      const summary = `${answerCountMap[key]}/${questionCountMap.get(question.id)} (${rate})`
      return {
        id: choice.id,
        answer: choice.answer,
        description: choice.description,
        count: answerCountMap[key] || 0,
        total: questionCountMap.get(question.id) || 0,
        rate,
        sRate,
        summary,
      }
    })
    return {
      id: question.id,
      name: question.name,
      answers,
    }
  })

  const average = choices.map((choice) => {
    if (questionsStatistics.length === 0)
      return {
        average: 0,
        totalRate: 0,
      }

    const count = questionsStatistics.reduce((acc, curr) => {
      return acc + (curr.answers.find((i) => i.id === choice.id)?.count || 0)
    }, 0)

    // const average = Number((totalRate / questionsStatistics.length).toFixed(2))
    return { average: 0, totalRate: count }
  })

  return {
    questions: questionsStatistics,
    average,
  }
}

/** Batch counts theo surveyChoice cho nhiều GV; loại câu có specificChoice khỏi thang Likert. */
export const getSurveyChoiceCountsForLecturers = async (
  prisma: PrismaClient,
  clusterSurveyId: string,
  lectureIds: string[],
  choices: SurveyChoice[]
) => {
  const uniqueLectureIds = [...new Set(lectureIds.filter(Boolean))]
  if (!uniqueLectureIds.length) return []

  const [sessions, specialQuestions] = await Promise.all([
    prisma.surveySession.findMany({
      where: {
        survey: {
          clusterSurveyId,
          lectureId: { in: uniqueLectureIds },
        },
      },
      select: {
        id: true,
        survey: { select: { lectureId: true } },
      },
    }),
    prisma.surveyQuestion.findMany({
      where: {
        type: "SINGLE_CHOICE",
        specificChoice: { some: {} },
        OR: [
          { clusterSurvey: { some: { id: clusterSurveyId } } },
          { survey: { some: { clusterSurveyId } } },
        ],
      },
      select: { id: true },
    }),
  ])

  const specialQuestionIds = specialQuestions.map((q) => q.id)
  const sessionToLecture = new Map<string, string>()
  for (const session of sessions) {
    const lectureId = session.survey?.lectureId
    if (lectureId) sessionToLecture.set(session.id, lectureId)
  }
  const sessionIds = [...sessionToLecture.keys()]

  const countByLectureChoice = new Map<string, number>()
  if (sessionIds.length) {
    const answerCounts = await prisma.surveyResponse.groupBy({
      by: ["surveySessionId", "surveyChoiceId"],
      where: {
        surveySessionId: { in: sessionIds },
        surveyChoiceId: { not: null },
        ...(specialQuestionIds.length
          ? { surveyQuestionId: { notIn: specialQuestionIds } }
          : {}),
      },
      _count: { surveyChoiceId: true },
    })

    for (const row of answerCounts) {
      if (!row.surveyChoiceId) continue
      const lectureId = sessionToLecture.get(row.surveySessionId)
      if (!lectureId) continue
      const key = `${lectureId}:${row.surveyChoiceId}`
      countByLectureChoice.set(
        key,
        (countByLectureChoice.get(key) || 0) + row._count.surveyChoiceId
      )
    }
  }

  return uniqueLectureIds.map((lectureId) => ({
    lectureId,
    answers: choices.map((choice) => ({
      id: choice.id,
      answer: choice.answer,
      description: choice.description,
      count: countByLectureChoice.get(`${lectureId}:${choice.id}`) || 0,
    })),
  }))
}

export const getSurveyStatsforDonVi = async (
  prisma: PrismaClient,
  clusterSurveyId: string,
  organizations: string[],
  questions: SurveyQuestion[],
  choices: SurveyChoice[]
) => {
  const questionIds = questions.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId", "surveyChoiceId"],
    where: {
      surveySession: {
        survey: {
          clusterSurveyId,
          lecture: {
            userProfile: {
              sDM_DonViId: {
                in: organizations,
              },
            },
          },
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId"],
    where: {
      surveySession: {
        survey: {
          clusterSurveyId,
          lecture: {
            userProfile: {
              sDM_DonViId: {
                in: organizations,
              },
            },
          },
        },
      },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyQuestionId: true },
  })

  const questionCountMap = new Map(
    responseCounts.map((i) => [i.surveyQuestionId, i._count.surveyQuestionId])
  )

  const questionsStatistics = questions.map((question) => {
    const answers = choices.map((choice) => {
      const key = `${question.id}-${choice.id}`
      const rate = Number(
        ((answerCountMap[key] || 0) / (questionCountMap.get(question.id) || 1)).toFixed(1)
      )
      const sRate = `${rate}%`
      const summary = `${answerCountMap[key]}/${questionCountMap.get(question.id)} (${rate})`
      return {
        id: choice.id,
        answer: choice.answer,
        description: choice.description,
        count: answerCountMap[key] || 0,
        total: questionCountMap.get(question.id) || 0,
        rate,
        sRate,
        summary,
      }
    })
    return {
      id: question.id,
      name: question.name,
      answers,
    }
  })

  const average = choices.map((choice) => {
    if (questionsStatistics.length === 0)
      return {
        average: 0,
        totalRate: 0,
      }

    const count = questionsStatistics.reduce((acc, curr) => {
      return acc + (curr.answers.find((i) => i.id === choice.id)?.count || 0)
    }, 0)

    // const average = Number((totalRate / questionsStatistics.length).toFixed(2))
    return { average: 0, totalRate: count }
  })

  return {
    questions: questionsStatistics,
    average,
  }
}
