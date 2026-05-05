import { DownloadOutlined } from "@ant-design/icons"
import { Button, Flex, Modal, message } from "antd"
import { TemplateHandler } from "easy-template-x"
import PizZip from "pizzip"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { getMinioUrl } from "@workspace/libs/utils"
import { saveFile } from "@/utils/saveFile"

export type SurveyDocxTemplateVariant = "KHOA" | "BO_MON" | "GIANG_VIEN"

// Use the same MinIO helper as other template-based exports in this app.
const TEMPLATE_KEYS: Record<SurveyDocxTemplateVariant, string> = {
  GIANG_VIEN: "mta/template/TongHopPhieuGiangVien.docx",
  KHOA: "mta/template/TongHopPhieuKhoa.docx",
  BO_MON: "mta/template/TongHopPhieuBomom.docx",
}

type AnswerItem = {
  id: string
  answer: string
  description: string
  count: number
}

type ModalExportDocxTemplateInput = {
  variant: SurveyDocxTemplateVariant

  surveyName?: string
  trainingObjectTypeName?: string

  lecturerName?: string
  lecturerCode?: string

  departmentName?: string
  departmentCode?: string

  organizationName?: string
  organizationCode?: string

  questions: Array<{ name?: string; answers: AnswerItem[] }>
  fileName?: string
}

const calcPercent = (answers: AnswerItem[]) => {
  const total = (answers || []).reduce((s, i) => s + Number(i?.count || 0), 0)
  return (answers || []).map((i) => {
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
  items: Array<{ answer: string; percent: number; total: number; countRaw: number; count: string }>,
  order: number
) => {
  const found = items.find((p) => Number(p.answer) === order)
  if (found) return found.count

  const total = items[0]?.total ?? 0
  return formatCell({ percent: 0, count: 0, total })
}

const buildAverageRow = (questions: ModalExportDocxTemplateInput["questions"]) => {
  if (!questions?.length) return null
  const first = questions[0]
  if (!first?.answers?.length) return null

  const base = first.answers.map((a) => ({
    ...a,
    count: 0,
  }))

  questions.forEach((q) => {
    q.answers?.forEach((a, idx) => {
      base[idx].count = Number(base[idx].count || 0) + Number(a?.count || 0)
    })
  })

  return {
    id: "DGTB",
    name: "Trung bình chung",
    answers: base,
  }
}

const buildDocxData = (input: ModalExportDocxTemplateInput) => {
  if (!input) return {}

  const dataRows = input.questions.map((q, idx) => {
    const answersWithPercent = calcPercent(q.answers || [])

    return {
      ...q,
      index: idx + 1,
      answers: answersWithPercent.map((a) => ({
        ...a,
        description: a.description || "",
      })),
      // Useful for fixed-column templates (1..5)
      muc1: getCellByOrder(answersWithPercent as any, 1),
      muc2: getCellByOrder(answersWithPercent as any, 2),
      muc3: getCellByOrder(answersWithPercent as any, 3),
      muc4: getCellByOrder(answersWithPercent as any, 4),
      muc5: getCellByOrder(answersWithPercent as any, 5),
    }
  })

  const avgRow = buildAverageRow(input.questions)
  const dgtbAnswers = avgRow ? calcPercent(avgRow.answers as AnswerItem[]) : []

  return {
    ...input,
    questions: dataRows,
    data: dataRows,
    dgtb: {
      ...avgRow,
      answers: dgtbAnswers,
      muc1: getCellByOrder(dgtbAnswers as any, 1),
      muc2: getCellByOrder(dgtbAnswers as any, 2),
      muc3: getCellByOrder(dgtbAnswers as any, 3),
      muc4: getCellByOrder(dgtbAnswers as any, 4),
      muc5: getCellByOrder(dgtbAnswers as any, 5),
    },
    lecturerName: input.lecturerName,
    lecturerCode: input.lecturerCode,
    departmentName: input.departmentName,
    departmentCode: input.departmentCode,
    organizationName: input.organizationName,
    organizationCode: input.organizationCode,
    surveyName: input.surveyName,
    trainingObjectTypeName: input.trainingObjectTypeName,
    soTieuChi: input.questions.length,
  }
}

const defaultFileName = (variant: SurveyDocxTemplateVariant, surveyName?: string) => {
  const name = (surveyName || "").trim().replace(/[\\/:*?"<>|]+/g, "_")
  if (variant === "GIANG_VIEN") return `Bao_cao_khao_sat_giang_vien_${name || "bao_cao"}.docx`
  if (variant === "BO_MON") return `Bao_cao_khao_sat_bo_mon_${name || "bao_cao"}.docx`
  return `Bao_cao_khao_sat_khoa_${name || "bao_cao"}.docx`
}

const variantLabel: Record<SurveyDocxTemplateVariant, string> = {
  GIANG_VIEN: "Giảng viên",
  BO_MON: "Bộ môn",
  KHOA: "Khoa",
}

const ModalExportDocxTemplate = () => {
  const { isOpen, onClose, input } = useDisclosure<ModalExportDocxTemplateInput>({
    tag: "ModalExportDocxTemplate",
  })

  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (!input) return
    console.log("[ModalExportDocxTemplate] input", input)
  }, [isOpen, input])

  const templateUrl = useMemo(() => {
    if (!input) return ""
    return getMinioUrl(TEMPLATE_KEYS[input.variant])
  }, [input])

  const fileName = useMemo(() => {
    if (!input) return ""
    return input.fileName || defaultFileName(input.variant, input.surveyName)
  }, [input])

  const title = useMemo(() => {
    if (!input) return "Xuất file Word"
    return `Xuất báo cáo khảo sát (${variantLabel[input.variant]})`
  }, [input])

  const handleDownload = async () => {
    if (!input) return
    if (!templateUrl) return

    setIsDownloading(true)
    try {
      const res = await fetch(templateUrl)
      if (!res.ok) {
        message.error("Không tải được file mẫu")
        return
      }

      const templateBuffer = await res.arrayBuffer()
      const payload = buildDocxData(input)

      const repaired = new PizZip(templateBuffer).generate({ type: "arraybuffer" })
      const repairedBlob = new Blob([repaired], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      const handler = new TemplateHandler()
      const doc = await handler.process(repairedBlob, payload)

      saveFile(fileName, doc)
      onClose()
    } catch (e) {
      console.error("[ModalExportDocxTemplate] export failed", e)
      const errText = e instanceof Error ? e.message : String(e)
      message.error(`Không thể xuất file Word: ${errText}`)
    } finally {
      setIsDownloading(false)
    }
  }

  if (!input) return null

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={title}
      destroyOnClose
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            loading={isDownloading}
          >
            Tải xuống
          </Button>
        </Flex>
      }
    >
      <div className="text-sm text-gray-600">
        Bấm <b>Tải xuống</b> để xuất file Word theo mẫu.
      </div>
    </Modal>
  )
}

export default ModalExportDocxTemplate
