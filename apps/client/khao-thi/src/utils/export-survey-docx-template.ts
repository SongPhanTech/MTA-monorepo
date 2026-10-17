import { message } from "antd"
import { TemplateHandler } from "easy-template-x"
import PizZip from "pizzip"
import { fetchMinio, getMinioUrl } from "@workspace/libs/utils"
import { saveFile } from "@/utils/saveFile"

import type { SurveyDocxTemplateVariant } from "@/constants/constants"
import {
  formatSpecialAnswerCell,
  getSpecialChoiceLabel,
  type SpecificChoiceItem,
} from "@/utils/survey-specific-choice"

const TEMPLATE_KEYS: Record<SurveyDocxTemplateVariant, string> = {
  GIANG_VIEN: "mta/template/TongHopPhieuGiangVien.docx",
  KHOA: "mta/template/TongHopPhieuKhoa.docx",
  BO_MON: "mta/template/TongHopPhieuBomon.docx",
}

const toUpperVi = (value?: string) => (value || "").trim().toLocaleUpperCase("vi-VN")

type AnswerItem = {
  id: string
  answer: string
  description?: string | null
  count: number
}

type AnswerWithPercent = Omit<AnswerItem, "count"> & {
  total: number
  percent: number
  countRaw: number
  count: string
}

export type ExportSurveyDocxTemplateInput = {
  variant: SurveyDocxTemplateVariant

  surveyName?: string
  trainingObjectTypeName?: string
  semesterName?: string
  trainingSystemName?: string

  lecturerName?: string
  lecturerCode?: string

  departmentName?: string
  departmentCode?: string

  organizationName?: string
  organizationCode?: string

  questions: Array<{
    id?: string
    name?: string
    answers: AnswerItem[]
    specificChoice?: SpecificChoiceItem[]
  }>
  fileName?: string
}

const calcPercent = (answers: AnswerItem[]) => {
  const total = (answers || []).reduce((s, i) => s + Number(i?.count || 0), 0)
  return (answers || []).map((i): AnswerWithPercent => {
    const count = Number(i?.count || 0)
    const percent = total === 0 ? 0 : Number(((count / total) * 100).toFixed(2))
    return {
      ...i,
      total,
      percent,
      countRaw: count,
      count: `${percent}% (${count}/${total})`,
    }
  })
}

const formatCell = ({ percent, count, total }: { percent: number; count: number; total: number }) =>
  `${percent}% (${count}/${total})`

const getCellByOrder = (
  items: AnswerWithPercent[],
  order: number,
  specificChoice?: SpecificChoiceItem[]
) => {
  // Prefer matching by numeric answer value (1..5)
  const foundByAnswer = items.find((p) => Number(p.answer) === order)
  const foundByIndex = items[order - 1]
  const found = foundByAnswer || foundByIndex
  const percentText = found
    ? found.count
    : formatCell({ percent: 0, count: 0, total: items[0]?.total ?? 0 })

  if (!specificChoice?.length) return percentText

  const label = getSpecialChoiceLabel(
    specificChoice,
    order - 1,
    found?.answer ?? String(order)
  )
  return formatSpecialAnswerCell(label, percentText)
}

type AverageRow = {
  id: string
  name: string
  answers: AnswerItem[]
}

const buildAverageRow = (
  questions: ExportSurveyDocxTemplateInput["questions"]
): AverageRow | null => {
  if (!questions?.length) return null
  const first = questions[0]
  if (!first?.answers?.length) return null

  // Cộng theo giá trị answer để không phụ thuộc thứ tự mảng
  const acc = new Map<string, AnswerItem>()
  first.answers.forEach((a) => {
    acc.set(String(a.answer), { ...a, count: 0 })
  })

  questions.forEach((q) => {
    q.answers?.forEach((a) => {
      const key = String(a.answer)
      const cur = acc.get(key) ?? { ...a, count: 0 }
      cur.count = Number(cur.count || 0) + Number(a?.count || 0)
      acc.set(key, cur)
    })
  })

  const base: AnswerItem[] = first.answers.map(
    (a) => acc.get(String(a.answer)) ?? { ...a, count: 0 }
  )

  return {
    id: "DGTB",
    name: "Trung bình chung",
    answers: base,
  }
}

const buildDocxData = (input: ExportSurveyDocxTemplateInput) => {
  if (!input) return {}

  const questions = input.questions || []

  const dataRows = questions.map((q, idx) => {
    const answersWithPercent = calcPercent(q.answers || [])
    const specificChoice = q.specificChoice || []
    const isSpecial = specificChoice.length > 0

    return {
      ...q,
      index: isSpecial ? `${idx + 1} *` : idx + 1,
      answers: answersWithPercent.map((a) => ({
        ...a,
        description: a.description || "",
      })),
      muc1: getCellByOrder(answersWithPercent, 1, specificChoice),
      muc2: getCellByOrder(answersWithPercent, 2, specificChoice),
      muc3: getCellByOrder(answersWithPercent, 3, specificChoice),
      muc4: getCellByOrder(answersWithPercent, 4, specificChoice),
      muc5: getCellByOrder(answersWithPercent, 5, specificChoice),
    }
  })

  const avgRow = buildAverageRow(questions)
  const dgtbAnswers = avgRow ? calcPercent(avgRow.answers) : []

  return {
    ...input,
    questions: dataRows,
    data: dataRows,
    dgtb: {
      ...avgRow,
      answers: dgtbAnswers,
      muc1: getCellByOrder(dgtbAnswers, 1),
      muc2: getCellByOrder(dgtbAnswers, 2),
      muc3: getCellByOrder(dgtbAnswers, 3),
      muc4: getCellByOrder(dgtbAnswers, 4),
      muc5: getCellByOrder(dgtbAnswers, 5),
    },
    dgtb1: getCellByOrder(dgtbAnswers, 1),
    dgtb2: getCellByOrder(dgtbAnswers, 2),
    dgtb3: getCellByOrder(dgtbAnswers, 3),
    dgtb4: getCellByOrder(dgtbAnswers, 4),
    dgtb5: getCellByOrder(dgtbAnswers, 5),
    lecturerName: input.lecturerName,
    lecturerCode: input.lecturerCode,
    departmentName: input.departmentName,
    departmentCode: input.departmentCode,
    organizationName: input.organizationName,
    organizationCode: input.organizationCode,
    surveyName: toUpperVi(input.surveyName),
    trainingObjectTypeName: toUpperVi(input.trainingObjectTypeName),
    semesterName: toUpperVi(input.semesterName),
    trainingSystemName: toUpperVi(input.trainingSystemName),
    soTieuChi: questions.length,
  }
}

const defaultFileName = (variant: SurveyDocxTemplateVariant, surveyName?: string) => {
  const name = (surveyName || "").trim().replace(/[\\/:*?"<>|]+/g, "_")
  if (variant === "GIANG_VIEN") return `Bao_cao_khao_sat_giang_vien_${name || "bao_cao"}.docx`
  if (variant === "BO_MON") return `Bao_cao_khao_sat_bo_mon_${name || "bao_cao"}.docx`
  return `Bao_cao_khao_sat_khoa_${name || "bao_cao"}.docx`
}

export async function exportSurveyDocxTemplate(input: ExportSurveyDocxTemplateInput) {
  const templateUrl = getMinioUrl(TEMPLATE_KEYS[input.variant])
  const fileName = input.fileName || defaultFileName(input.variant, input.surveyName)

  if (!templateUrl) {
    message.error("Không xác định được đường dẫn file mẫu")
    return
  }

  try {
    // fetchMinio: cache: no-store + query v=timestamp để lấy bản template mới sau khi upload đè
    const res = await fetchMinio(TEMPLATE_KEYS[input.variant])
    if (!res.ok) {
      message.error("Không tải được file mẫu")
      return
    }

    const templateBuffer = await res.arrayBuffer()
    const payload = buildDocxData({
      ...input,
      questions: input.questions || [],
    })

    const repaired = new PizZip(templateBuffer).generate({ type: "arraybuffer" })
    const repairedBlob = new Blob([repaired], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const handler = new TemplateHandler()
    const doc = await handler.process(repairedBlob, payload)

    saveFile(fileName, doc)
  } catch (e) {
    console.error(e)
    message.error(`Không thể xuất file Word`)
  }
}
