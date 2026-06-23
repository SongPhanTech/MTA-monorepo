import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import type { DataTabEvaluationCriterionType } from "@components/sub-pages/tu-danh-gia-ctdt/criteria-evaluation"
import useSpinner from "@hooks/spinner"
import {
  type ParsedEvaluationSection,
  parseCriteriaEvaluationDocx,
} from "@/utils/parse-criteria-evaluation-docx"
import { $Enums } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Modal, message, Upload } from "antd"
import { useState } from "react"

interface ImportCriteriaEvaluationProps {
  data?: DataTabEvaluationCriterionType
  allData?: DataTabEvaluationCriterionType[]
  label?: string
  refetch?: () => void
}

type ImportPreview = {
  criterionCount: number
  skippedCount: number
  sections: ParsedEvaluationSection[]
}

const isEditableStatus = (status?: $Enums.EvaluationStatus | null) =>
  status !== $Enums.EvaluationStatus.SUBMITTED &&
  status !== $Enums.EvaluationStatus.APPROVED &&
  status !== $Enums.EvaluationStatus.COMPLETED

const calcEvidenceTagMap = (criterionData: any, standardOrder: number, criterionIdx: number) => {
  const tagToEvidenceId = new Map<string, string>()
  const analysis = criterionData?.analysisCriterions
  if (!analysis || typeof analysis !== "object") return tagToEvidenceId

  let evidenceCount = 0
  for (const req of analysis.requirementCriterions || []) {
    for (const evidence of req.evidences || []) {
      if (tagToEvidenceId.has(evidence.evidenceId)) continue
      evidenceCount++
      const tag = [standardOrder, criterionIdx + 1, evidenceCount]
        .map((value) => value.toString().padStart(2, "0"))
        .join(".")
      tagToEvidenceId.set(tag, evidence.evidenceId)
    }
  }

  return tagToEvidenceId
}

const restoreEvidenceTags = (html: string, tagToEvidenceId: Map<string, string>) => {
  if (!html) return html

  return html.replace(/\[PM\.(\d{2}\.\d{2}\.\d{2})\]/g, (match, tag: string) => {
    const evidenceId = tagToEvidenceId.get(tag)
    if (!evidenceId) return match
    return `<span data-evidence-id="${evidenceId}" data-type="evidence" style="cursor: pointer; color: red;" id="${evidenceId}">[PM.${tag}]</span>`
  })
}

const fetchCriterionWithEvidence = async (criterionId: string) => {
  const res = await sqlTransaction([
    {
      model: "CriterionPeriod",
      operation: "findUnique",
      data: {
        where: { id: criterionId },
        include: {
          analysisCriterions: {
            include: {
              requirementCriterions: {
                include: {
                  evidences: {
                    include: { evidence: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  ])

  return res?.status === 200 ? res.data[0] : null
}

const ImportCriteriaEvaluation = ({
  data,
  allData,
  label = "Nhập file",
  refetch,
}: ImportCriteriaEvaluationProps) => {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const { showSpinner, hideSpinner } = useSpinner()

  const standards = allData || (data ? [data] : [])

  const buildPreview = (sections: ParsedEvaluationSection[]): ImportPreview => {
    let criterionCount = 0
    let skippedCount = 0

    for (const section of sections) {
      const standard = standards.find((item) => (item.order || 0) === section.standardOrder)
      const criterion = standard?.criteria?.find(
        (item) => (item.order || 0) === section.criterionOrder
      )
      const evaluation = criterion?.evaluationCriterion

      if (!evaluation || !isEditableStatus(evaluation.status)) {
        skippedCount++
        continue
      }

      criterionCount++
    }

    return { criterionCount, skippedCount, sections }
  }

  const handleFile = async (file: File) => {
    try {
      const sections = await parseCriteriaEvaluationDocx(file)
      if (sections.length === 0) {
        message.warning("Không tìm thấy dữ liệu đánh giá tiêu chí trong file")
        return false
      }

      const nextPreview = buildPreview(sections)
      if (nextPreview.criterionCount === 0) {
        message.warning("Không có dữ liệu nào khớp với phiếu hiện tại hoặc tiêu chí đã khóa")
        return false
      }

      setPreview(nextPreview)
      message.success("Đọc file thành công, vui lòng xác nhận nhập dữ liệu")
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : "Không đọc được file Word")
    }

    return false
  }

  const handleImport = async () => {
    if (!preview) return

    try {
      showSpinner()
      const transitions: Parameters<typeof sqlTransaction>[0] = []
      const evidenceCache = new Map<string, any>()

      for (const section of preview.sections) {
        const standard = standards.find((item) => (item.order || 0) === section.standardOrder)
        const criterion = standard?.criteria?.find(
          (item) => (item.order || 0) === section.criterionOrder
        )
        const evaluation = criterion?.evaluationCriterion

        if (!evaluation?.id || !isEditableStatus(evaluation.status)) continue

        let criterionData = evidenceCache.get(criterion!.id)
        if (!criterionData) {
          criterionData = await fetchCriterionWithEvidence(criterion!.id)
          if (criterionData) evidenceCache.set(criterion!.id, criterionData)
        }

        const criterionIdx = (standard?.criteria || []).findIndex(
          (item) => item.id === criterion?.id
        )
        const tagToEvidenceId = calcEvidenceTagMap(
          criterionData,
          standard?.order || section.standardOrder,
          criterionIdx >= 0 ? criterionIdx : section.criterionOrder - 1
        )

        const restore = (html: string) => restoreEvidenceTags(html, tagToEvidenceId)

        transitions.push({
          model: "EvaluationCriterion",
          operation: "update",
          data: {
            where: { id: evaluation.id },
            data: {
              ...(section.currentSituation
                ? { currentSituation: restore(section.currentSituation) }
                : {}),
              ...(section.strengths ? { strengths: restore(section.strengths) } : {}),
              ...(section.weakness ? { weakness: restore(section.weakness) } : {}),
              ...(section.actionPlan ? { actionPlan: restore(section.actionPlan) } : {}),
              ...(section.score ? { score: section.score } : {}),
            },
          },
        })
      }

      if (transitions.length === 0) {
        message.warning("Không có dữ liệu để cập nhật")
        return
      }

      const res = await sqlTransaction(transitions)
      if (res.status !== 200) {
        message.error("Nhập file thất bại, vui lòng thử lại")
        return
      }

      await queryClient.invalidateQueries({ queryKey: ["zenstack", "EvaluationPeriod"] })
      await queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      refetch?.()

      message.success(`Đã cập nhật ${transitions.length} phiếu đánh giá từ file Word`)
      setPreview(null)
      setOpen(false)
    } catch (error) {
      console.error(error)
      message.error("Nhập file thất bại, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)} icon={<UploadOutlined />}>
        {label}
      </Button>

      <Modal
        title="Nhập file phiếu đánh giá tiêu chí"
        open={open}
        onCancel={() => {
          setOpen(false)
          setPreview(null)
        }}
        onOk={handleImport}
        okText="Nhập dữ liệu"
        cancelText="Hủy"
        okButtonProps={{ disabled: !preview }}
        destroyOnClose
      >
        <Upload.Dragger
          accept=".docx"
          maxCount={1}
          beforeUpload={handleFile}
          onRemove={() => setPreview(null)}
          showUploadList={{ showRemoveIcon: true }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Chọn hoặc kéo thả file Word đã xuất (.docx)</p>
          <p className="ant-upload-hint text-gray-500">
            Hệ thống sẽ khôi phục mô tả hiện trạng, điểm mạnh, điểm tồn tại, kế hoạch hành động, tự
            đánh giá và mã minh chứng từ file.
          </p>
        </Upload.Dragger>

        {preview && (
          <div className="mt-4 text-sm text-gray-700">
            <div>Sẽ cập nhật {preview.criterionCount} tiêu chí.</div>
            {preview.skippedCount > 0 && (
              <div className="text-orange-600">
                Bỏ qua {preview.skippedCount} tiêu chí không khớp hoặc đã khóa.
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

export default ImportCriteriaEvaluation
