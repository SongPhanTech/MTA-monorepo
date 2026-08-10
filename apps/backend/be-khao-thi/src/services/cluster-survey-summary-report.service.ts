import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { PrismaClient } from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"
import { getCurrentDateForReport } from "../utils"

export type ClusterSurveySummaryReportInput = {
  positiveChoiceIds: string[]
  highChoiceIds: string[]
  highThreshold: number
  concernChoiceIds: string[]
  concernThreshold: number
  doiTuongTieuDe?: string
  doiTuongMoTa?: string
  doiTuongChiTiet?: string
  phamVi?: string
  hocKyNamHoc?: string
  diaDiem?: string
  date?: string
  month?: string
  year?: string | number
  vaiTroNguoiKi?: string
  tenNguoiKi?: string
}

const formatVnInt = (value: number) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")

const formatVnPct = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
}

const formatCount = (value: number) => (value < 10 ? String(value).padStart(2, "0") : String(value))

const choiceLabel = (choices: { id: string; description: string; answer: string }[], ids: string[]) =>
  choices
    .filter((c) => ids.includes(c.id))
    .map((c) => `"${c.description || c.answer}"`)
    .join(", ")
    .replace(/, ([^,]*)$/, " và $1")

async function loadSummaryReportTemplate(prisma: PrismaClient): Promise<Buffer> {
  // Fetch trực tiếp MinIO (không dùng cache) để nhận template mới sau khi upload
  try {
    const { getMinioUrl } = await import("@workspace/libs/utils")
    const url = getMinioUrl("/mta/template/BaoCaoKhaoSatCum.docx")
    const res = await fetch(url)
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer())
    }
  } catch {
    // fallback below
  }

  try {
    return await getTemplateBuffer(prisma, "BaoCaoKhaoSatCum.docx")
  } catch {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const candidates = [
      path.join(process.cwd(), "templates/BaoCaoKhaoSatCum.docx"),
      path.join(process.cwd(), "apps/backend/be-khao-thi/templates/BaoCaoKhaoSatCum.docx"),
      path.join(here, "../../templates/BaoCaoKhaoSatCum.docx"),
    ]

    for (const candidate of candidates) {
      try {
        return await fs.readFile(candidate)
      } catch {
        // try next
      }
    }

    throw new Error("Không tìm thấy template BaoCaoKhaoSatCum.docx trên MinIO hoặc local")
  }
}

export async function buildClusterSurveySummaryReport(
  prisma: PrismaClient,
  clusterSurveyId: string,
  input: ClusterSurveySummaryReportInput
) {
  const {
    positiveChoiceIds,
    highChoiceIds,
    highThreshold,
    concernChoiceIds,
    concernThreshold,
  } = input

  if (!positiveChoiceIds.length || !highChoiceIds.length || !concernChoiceIds.length) {
    throw new Error("Vui lòng chọn đủ các mức đánh giá cho thống kê")
  }

  const cluster = await prisma.clusterSurvey.findUnique({
    where: { id: clusterSurveyId },
    include: {
      surveyChoice: { orderBy: { answer: "asc" } },
      surveyObjectType: true,
      surveys: {
        where: { deletedAt: null },
        include: {
          lecture: { include: { userProfile: true } },
          semester: { include: { schoolYear: true } },
          subjectClass: {
            include: {
              subjectClassStudent: { where: { deletedAt: null }, select: { id: true } },
            },
          },
          surveySessions: {
            where: { deletedAt: null },
            select: { id: true },
          },
          trainingObjectType: true,
        },
      },
    },
  })

  if (!cluster) {
    throw new Error("Không tìm thấy đợt khảo sát")
  }

  const surveyIds = cluster.surveys.map((s) => s.id)
  const questionIds = (
    await prisma.surveyQuestion.findMany({
      where: {
        clusterSurvey: { some: { id: clusterSurveyId } },
        type: "SINGLE_CHOICE",
        deletedAt: null,
      },
      select: { id: true },
    })
  ).map((q) => q.id)

  const responses =
    surveyIds.length && questionIds.length
      ? await prisma.surveyResponse.groupBy({
          by: ["surveyChoiceId", "surveySessionId"],
          where: {
            surveyChoiceId: { not: null },
            surveyQuestionId: { in: questionIds },
            surveySession: {
              surveyId: { in: surveyIds },
              deletedAt: null,
            },
          },
          _count: { _all: true },
        })
      : []

  const sessionToSurvey = new Map<string, string>()
  const sessions = surveyIds.length
    ? await prisma.surveySession.findMany({
        where: { surveyId: { in: surveyIds }, deletedAt: null },
        select: { id: true, surveyId: true },
      })
    : []
  sessions.forEach((s) => sessionToSurvey.set(s.id, s.surveyId))

  const surveyToLecture = new Map<string, string>()
  cluster.surveys.forEach((s) => {
    if (s.lectureId) surveyToLecture.set(s.id, s.lectureId)
  })

  // Aggregate response counts by choice (overall) and by lecture+choice
  let totalAnswers = 0
  let positiveAnswers = 0
  const lectureTotals = new Map<string, number>()
  const lectureChoiceCounts = new Map<string, Map<string, number>>()

  for (const row of responses) {
    const choiceId = row.surveyChoiceId
    if (!choiceId) continue
    const count = row._count._all
    totalAnswers += count
    if (positiveChoiceIds.includes(choiceId)) positiveAnswers += count

    const surveyId = sessionToSurvey.get(row.surveySessionId)
    const lectureId = surveyId ? surveyToLecture.get(surveyId) : undefined
    if (!lectureId) continue

    lectureTotals.set(lectureId, (lectureTotals.get(lectureId) || 0) + count)
    if (!lectureChoiceCounts.has(lectureId)) lectureChoiceCounts.set(lectureId, new Map())
    const choiceMap = lectureChoiceCounts.get(lectureId)!
    choiceMap.set(choiceId, (choiceMap.get(choiceId) || 0) + count)
  }

  const sumChoicePct = (choiceMap: Map<string, number>, total: number, ids: string[]) => {
    if (!total) return 0
    const sum = ids.reduce((acc, id) => acc + (choiceMap.get(id) || 0), 0)
    return (sum / total) * 100
  }

  let soGiangVienCao = 0
  let soGiangVienThap = 0
  let soGiangVienCanXemXet = 0

  const lecturerIds = Array.from(
    new Set(cluster.surveys.map((s) => s.lectureId).filter(Boolean) as string[])
  )

  for (const lectureId of lecturerIds) {
    const total = lectureTotals.get(lectureId) || 0
    const choiceMap = lectureChoiceCounts.get(lectureId) || new Map()
    const highPct = total ? sumChoicePct(choiceMap, total, highChoiceIds) : 0
    const concernPct = total ? sumChoicePct(choiceMap, total, concernChoiceIds) : 0

    if (concernPct >= concernThreshold) {
      soGiangVienCanXemXet += 1
    } else if (highPct >= highThreshold) {
      soGiangVienCao += 1
    } else {
      soGiangVienThap += 1
    }
  }

  const tongGiangVien = lecturerIds.length
  const tongPhieu =
    cluster.surveys.reduce((acc, s) => acc + (s.subjectClass?.subjectClassStudent?.length || 0), 0) ||
    sessions.length
  const tyLeHaiLong = totalAnswers === 0 ? 0 : (positiveAnswers / totalAnswers) * 100
  // Scale positive count to "phiếu" denominator for display like sample
  const soPhieuHaiLong =
    tongPhieu > 0 && totalAnswers > 0
      ? Math.round((positiveAnswers / totalAnswers) * tongPhieu)
      : positiveAnswers

  const sampleSurvey = cluster.surveys.find((s) => s.semester) || cluster.surveys[0]
  const semesterName = sampleSurvey?.semester?.name || ""
  const schoolYearName = sampleSurvey?.semester?.schoolYear?.name || ""
  const kyMatch =
    semesterName.match(/HK\s*([12])/i) ||
    semesterName.match(/học\s*k[ỳy]\s*([12])/i) ||
    semesterName.match(/(?:^|[^\d])([12])(?:$|[^\d])/)
  const kyNumber = kyMatch?.[1]
  const defaultHocKyNamHoc =
    kyNumber && schoolYearName
      ? `Học kỳ ${kyNumber} năm học ${schoolYearName}`
      : kyNumber
        ? `Học kỳ ${kyNumber}`
        : [semesterName, schoolYearName ? `năm học ${schoolYearName}` : ""]
            .filter(Boolean)
            .join(" ")
            .trim()

  const objectTypeNames = cluster.surveyObjectType.map((o) => o.name).filter(Boolean)
  const trainingName = sampleSurvey?.trainingObjectType?.name || ""
  const defaultDoiTuong = [...objectTypeNames, trainingName].filter(Boolean).join(" - ") || "học viên"

  const today = getCurrentDateForReport()

  const templateData = {
    diaDiem: input.diaDiem?.trim() || "Hà Nội",
    date: input.date?.trim() || today.date,
    month: input.month?.trim() || today.month,
    year: String(input.year ?? today.year),
    vaiTroNguoiKi: input.vaiTroNguoiKi?.trim() || "TRƯỞNG BAN",
    tenNguoiKi: input.tenNguoiKi?.trim() || "",
    doiTuongTieuDe: input.doiTuongTieuDe?.trim() || defaultDoiTuong.toUpperCase(),
    doiTuongMoTa: input.doiTuongMoTa?.trim() || defaultDoiTuong,
    doiTuongChiTiet: input.doiTuongChiTiet?.trim() || defaultDoiTuong,
    phamVi: input.phamVi?.trim() || "100% học phần trong thời khóa biểu học kỳ",
    hocKyNamHoc: input.hocKyNamHoc?.trim() || defaultHocKyNamHoc || cluster.name,
    tongPhieu: formatVnInt(tongPhieu),
    soPhieuHaiLong: formatVnInt(soPhieuHaiLong),
    tyLeHaiLong: formatVnPct(tyLeHaiLong),
    tenMucHaiLong: choiceLabel(cluster.surveyChoice, positiveChoiceIds),
    tenMucCao: choiceLabel(cluster.surveyChoice, highChoiceIds),
    tenMucCanXemXet: choiceLabel(cluster.surveyChoice, concernChoiceIds),
    nguongCao: String(highThreshold),
    nguongCanXemXet: String(concernThreshold),
    soGiangVienCao: formatCount(soGiangVienCao),
    soGiangVienThap: formatCount(soGiangVienThap),
    soGiangVienCanXemXet: formatCount(soGiangVienCanXemXet),
    tongGiangVien: String(tongGiangVien),
  }

  const docxBuffer = await loadSummaryReportTemplate(prisma)
  const templateZip = new PizZip(docxBuffer)
  const document = new Docxtemplater(templateZip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  document.render(templateData)

  const fileName = `Bao_cao_thong_ke_khao_sat_${cluster.name}.docx`
  const buffer = document.getZip().generate({ type: "nodebuffer" }) as Buffer

  return { buffer, fileName, templateData }
}
