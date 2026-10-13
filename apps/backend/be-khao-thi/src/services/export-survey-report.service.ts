import { PrismaClient } from "@workspace/db"
import ExcelJS from "exceljs"
import {
  buildSurveyObjectTypeProfileOrClauses,
  resolveMajorOrgFromSurveyObjectTypes,
  SURVEY_OBJECT_TYPE_REPORT_INCLUDE,
} from "../lib/survey-audience"

function buildSheetData(survey: any, answerCountMap: Record<string, number>) {
  const groupsMap = new Map<string, { id: string, name?: string, questions: any[] }>()

  groupsMap.set("ungrouped", {
    id: "ungrouped",
    name: "Nhóm câu hỏi",
    questions: [],
  })

  const questionOrder = new Map<string, number>()
  survey.surveyQuestion.forEach((q: any, idx: number) => questionOrder.set(q.id, idx))

  for (const q of survey.surveyQuestion) {
    if (q.surveyQuestionGroupId) {
      if (!groupsMap.has(q.surveyQuestionGroupId)) {
        groupsMap.set(q.surveyQuestionGroupId, {
          id: q.surveyQuestionGroupId,
          name: q.surveyQuestionGroup?.name || "Nhóm câu hỏi",
          questions: [],
        })
      }
    }
  }

  for (const q of survey.surveyQuestion) {
    const groupId = q.surveyQuestionGroupId ?? "ungrouped"
    const group = groupsMap.get(groupId)
    if (!group) continue

    const answersForQ = survey.surveyChoice.map((c: any) => {
      const key = `${q.id}-${c.id}`
      const count = answerCountMap[key] || 0
      return { id: c.id, answer: c.answer, description: c.description, count }
    })

    group.questions.push({
      id: q.id,
      name: q.name,
      answers: answersForQ,
      order: questionOrder.get(q.id) ?? 0,
    })
  }

  return Array.from(groupsMap.values())
    .filter((g) => g.questions.length > 0)
    .map((g) => {
      g.questions.sort((a: any, b: any) => a.order - b.order)
      return { groupId: g.id, groupName: g.name, questions: g.questions }
    })
}

const appendDataToSheet = (worksheet: ExcelJS.Worksheet, rowIndex: number, tData: any, surveyName: string, majorName: string = "", majorOrg: string = "") => {
  const titleStyle = {
    font: { name: "Times New Roman", bold: true, size: 14 },
    alignment: { horizontal: "left" as const, vertical: "middle" as const, wrapText: true as const },
  }

  const centerBoldStyle = {
    font: { name: "Times New Roman", bold: true, size: 12 },
    alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true as const },
  }

  const answerHeaders = tData?.[0]?.answers || tData?.[0]?.questions?.[0]?.answers || []
  const numAnswers = answerHeaders.length || 5

  if (rowIndex === 1) {
    worksheet.columns = [
      { width: 60 },
      ...Array.from({ length: numAnswers * 2 }).map(() => ({ width: 8 }))
    ]
  }

  const lastCol = 1 + numAnswers * 2
  const lastColLetter = worksheet.getColumn(lastCol).letter


  worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
  worksheet.getCell(`A${rowIndex}`).value = surveyName ? surveyName.toUpperCase() : `BẢNG TỔNG HỢP KẾT QUẢ KHẢO SÁT`
  worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
  rowIndex++

  if (majorOrg) {
    worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = majorOrg.toUpperCase()
    worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
    rowIndex++
  }

  if (majorName) {
    worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
    worksheet.getCell(`A${rowIndex}`).value = `CHUYÊN NGÀNH HỌC: ${majorName.toUpperCase()}`
    worksheet.getCell(`A${rowIndex}`).style = { ...titleStyle, alignment: { horizontal: "center" as const, vertical: "middle" as const } }
    rowIndex++
  }

  rowIndex++ 

  if (tData && tData.length > 0) {
    let qIndex = 1
    tData.forEach((group: any, gIndex: number) => {
      const romanize = (num: number) => {
        const lookup: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
        let roman = ''
        for (const i in lookup) {
          while (num >= lookup[i]) { roman += i; num -= lookup[i] }
        }
        return roman
      }

      const groupTitle = `${romanize(gIndex + 1)}. ${group.groupName || "NHẬN XÉT ĐÁNH GIÁ"}`.toUpperCase()

      worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
      worksheet.getCell(`A${rowIndex}`).value = groupTitle
      worksheet.getCell(`A${rowIndex}`).style = {
        font: { name: "Times New Roman", bold: true, italic: true, size: 12 },
        alignment: { horizontal: "left" as const, vertical: "middle" as const }
      }
      rowIndex++

      const currentAnswerHeaders = group.questions?.[0]?.answers || answerHeaders

      if (currentAnswerHeaders.length > 0) {
        const legendText = currentAnswerHeaders.map((a: any, idx: number) => `${idx + 1}. ${a.description}`).join("          ")
        worksheet.mergeCells(`A${rowIndex}:${lastColLetter}${rowIndex}`)
        worksheet.getCell(`A${rowIndex}`).value = legendText
        worksheet.getCell(`A${rowIndex}`).style = { font: { name: "Times New Roman", size: 11 }, alignment: { horizontal: "left" as const, wrapText: true as const } }
        rowIndex++
      }

      rowIndex++ 

      const tableHeaderStyle = {
        font: { name: "Times New Roman", bold: true, size: 14, color: { argb: "FF000000" } },
        fill: { type: "pattern", pattern: "none" } as ExcelJS.Fill,
        alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true as const },
        border: {
          top: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          left: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          right: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
          bottom: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FF000000" } },
        },
      }

      const headerRow1 = rowIndex
      worksheet.mergeCells(`A${headerRow1}:A${headerRow1 + 1}`)
      worksheet.getCell(`A${headerRow1}`).value = "Nội dung đánh giá"

      if (numAnswers > 0) {
        worksheet.mergeCells(headerRow1, 2, headerRow1, 1 + numAnswers)
        worksheet.getCell(headerRow1, 2).value = "Phương án trả lời"

        worksheet.mergeCells(headerRow1, 2 + numAnswers, headerRow1, 1 + numAnswers * 2)
        worksheet.getCell(headerRow1, 2 + numAnswers).value = "% trả lời"

        const headerRow2 = rowIndex + 1
        for (let i = 0; i < numAnswers; i++) {
          worksheet.getCell(headerRow2, 2 + i).value = i + 1
          worksheet.getCell(headerRow2, 2 + numAnswers + i).value = i + 1
        }
      }

      for (let r = headerRow1; r <= headerRow1 + 1; r++) {
        for (let c = 1; c <= 1 + numAnswers * 2; c++) {
          const cell = worksheet.getCell(r, c)
          cell.style = { ...centerBoldStyle, border: tableHeaderStyle.border }
        }
      }

      rowIndex += 2

      group.questions?.forEach((q: any) => {
        const rowValues: any[] = []
        rowValues.push(`${qIndex}. ${q.name || ""}`)

        let total = 0
        for (let i = 0; i < numAnswers; i++) {
          const count = Number(q.answers?.[i]?.count || 0)
          rowValues.push(count)
          total += count
        }

        const row = worksheet.getRow(rowIndex)
        row.values = rowValues

        if (numAnswers > 0) {
          const colStart = worksheet.getColumn(2).letter
          const colEnd = worksheet.getColumn(1 + numAnswers).letter

          for (let i = 0; i < numAnswers; i++) {
            const currCol = worksheet.getColumn(2 + i).letter
            row.getCell(2 + numAnswers + i).value = {
              formula: `IFERROR(${currCol}${rowIndex}/SUM(${colStart}${rowIndex}:${colEnd}${rowIndex})*100, 0)`
            } as any
          }
        }

        for (let c = 1; c <= 1 + numAnswers * 2; c++) {
          const cell = row.getCell(c)
          cell.border = tableHeaderStyle.border
          cell.font = { name: "Times New Roman", size: 11 }
          if (c > 1) cell.alignment = { horizontal: "center" as const, vertical: "middle" as const }
          else cell.alignment = { horizontal: "left" as const, vertical: "middle" as const, wrapText: true as const }
        }

        rowIndex++
        qIndex++
      })
      rowIndex++
    })
  }
  return rowIndex
}

export async function exportSurveyExcelReportService(prisma: PrismaClient, surveyId: string) {

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      surveyQuestion: {
        where: { type: "SINGLE_CHOICE" },
        include: { surveyQuestionGroup: true },
      },
      surveyChoice: { orderBy: { answer: "asc" } },
      surveyObjectType: { include: SURVEY_OBJECT_TYPE_REPORT_INCLUDE },
    },
  })

  if (!survey) return { buffer: null, surveyName: "" }

  // Đơn vị từ thiết lập đối tượng: chuyên ngành đã chọn, hoặc chuyên ngành của lớp QL
  const configOrgByMajor = resolveMajorOrgFromSurveyObjectTypes(survey.surveyObjectType)
  const singleConfigOrg =
    configOrgByMajor.size === 1 ? [...configOrgByMajor.values()][0] : ""

  let allProfiles: any[] = []
  for (const surveyObjectType of survey.surveyObjectType) {
    const orClauses = buildSurveyObjectTypeProfileOrClauses(surveyObjectType, {})
    if (!orClauses.length) continue

    const objectTypeProfiles = await prisma.userProfile.findMany({
      select: {
        id: true,
        educationAndTraining: {
          select: {
            fixedClass: {
              select: {
                curriculumVersion: {
                  select: {
                    curriculum: {
                      select: {
                        trainingMajor: {
                          select: {
                            name: true,
                            organization: { select: { sTen: true } },
                            trainingField: { select: { name: true } }
                          }
                        },
                        trainingField: { select: { name: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      where: { deletedAt: null, active: true, OR: orClauses },
    })
    allProfiles = [...allProfiles, ...objectTypeProfiles]
  }

  const profileToMajorMap = new Map<string, { majorName: string, orgName: string }>()
  for (const p of allProfiles) {
    if (profileToMajorMap.has(p.id)) continue

    let mName = "Khác"
    let org = ""

    const studentInfo = p.educationAndTraining?.[0]
    const curriculum = studentInfo?.fixedClass?.curriculumVersion?.curriculum
    if (curriculum) {
      mName = curriculum.trainingMajor?.name || curriculum.trainingField?.name || "Khác"
    }
    // Đơn vị = đơn vị chuyên ngành (từ HV hoặc từ thiết lập đối tượng / lớp QL)
    org =
      curriculum?.trainingMajor?.organization?.sTen ||
      configOrgByMajor.get(mName) ||
      singleConfigOrg ||
      ""
    profileToMajorMap.set(p.id, { majorName: mName, orgName: org })
  }

  const sessions = await prisma.surveySession.findMany({
    where: { surveyId },
    select: { id: true, profileId: true },
  })

  const sessionToMajorMap = new Map<string, string>()
  sessions.forEach(session => {
    if (session.profileId && profileToMajorMap.has(session.profileId)) {
      const { majorName } = profileToMajorMap.get(session.profileId)!
      sessionToMajorMap.set(session.id, majorName)
    }
  })

  const questionIds = survey.surveyQuestion.map(q => q.id)
  const responses = await prisma.surveyResponse.findMany({
    where: {
      surveySession: { surveyId },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    select: {
      surveySessionId: true,
      surveyQuestionId: true,
      surveyChoiceId: true,
    }
  })

  const globalAnswerCountMap: Record<string, number> = {}
  const majorAnswerCountMaps = new Map<string, Record<string, number>>()
  const majorsInfo = new Map<string, string>()

  for (const { majorName, orgName } of profileToMajorMap.values()) {
    if (!majorAnswerCountMaps.has(majorName)) {
      majorAnswerCountMaps.set(majorName, {})
      majorsInfo.set(majorName, orgName)
    }
  }

  for (const r of responses) {
    if (!r.surveyChoiceId) continue
    const key = `${r.surveyQuestionId}-${r.surveyChoiceId}`
    globalAnswerCountMap[key] = (globalAnswerCountMap[key] || 0) + 1

    const majorName = sessionToMajorMap.get(r.surveySessionId)
    if (majorName) {
      const mCountMap = majorAnswerCountMaps.get(majorName)!
      mCountMap[key] = (mCountMap[key] || 0) + 1
    }
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Ket qua khao sat")
  let currentRowIndex = 1
  const globalData = buildSheetData(survey, globalAnswerCountMap)
  if (globalData.length > 0) {
    const primaryMajorName =
      [...majorsInfo.keys()].find((n) => n !== "Khác" && majorsInfo.get(n)) ||
      [...majorsInfo.keys()].find((n) => n !== "Khác") ||
      [...majorsInfo.keys()][0] ||
      ""
    const primaryMajorOrg = primaryMajorName
      ? majorsInfo.get(primaryMajorName) || singleConfigOrg || ""
      : singleConfigOrg || ""
    currentRowIndex = appendDataToSheet(
      worksheet,
      currentRowIndex,
      globalData,
      survey.name,
      primaryMajorName,
      primaryMajorOrg
    )
    currentRowIndex += 3
  }

  for (const [majorName, mCountMap] of majorAnswerCountMaps.entries()) {
    const majorData = buildSheetData(survey, mCountMap)
    if (majorData.length > 0) {
      const orgName = majorsInfo.get(majorName) || ""
      currentRowIndex = appendDataToSheet(worksheet, currentRowIndex, majorData, survey.name, majorName, orgName)
      currentRowIndex += 3
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return { buffer: Buffer.from(buffer), surveyName: survey.name }
}
