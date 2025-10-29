import type {
    Lecturer,
    PrismaClient,
    Survey,
    SurveyChoice,
    SurveyQuestion,
    UserProfile,
} from '@workspace/db'
import { prisma } from '..'

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
        throw new Error('Survey not found')
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
            cDoituong: 'session.cDoituong',
            cPhatRa: 'session.cPhatRa',
            cThuVao: 'session.cThuVao',
            cGhiChu: 'session.cGhiChu',
        })
        stt++
    }

    return reportData
}

import { z } from 'zod'

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

export const SurveyStatsSchema = z.object({
    surveyId: z.string(),
    lecture: z.string().optional().nullable(),
    questions: z.array(QuestionStatSchema),
    average: z.array(z.number()),
})

export type SurveyStats = z.infer<typeof SurveyStatsSchema>

export const getSurveyStats = async (
    prisma: PrismaClient,
    survey: Survey & { lecture?: (Lecturer & { userProfile: UserProfile | null }) | null },
    questions: SurveyQuestion[],
    choices: SurveyChoice[]
) => {
    const questionIds = questions.map((q) => q.id)

    const answerCounts = await prisma.surveyResponse.groupBy({
        by: ['surveyQuestionId', 'surveyChoiceId'],
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
        by: ['surveyQuestionId'],
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
        if (questionsStatistics.length === 0) return 0

        const totalRate = questionsStatistics.reduce((acc, curr) => {
            return acc + (curr.answers.find((i) => i.id === choice.id)?.rate || 0)
        }, 0)

        const average = Number((totalRate / questionsStatistics.length).toFixed(1))
        return average
    })

    return {
        surveyId: survey.id,
        lecture: survey.lecture?.userProfile?.fullname,
        questions: questionsStatistics,
        average,
    }
}
