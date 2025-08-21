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
