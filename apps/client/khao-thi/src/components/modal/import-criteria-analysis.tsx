import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import type { DataTabType } from "@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis"
import useSpinner from "@hooks/spinner"
import {
  type ParsedCriterionSection,
  parseCriteriaAnalysisDocx,
} from "@/utils/parse-criteria-analysis-docx"
import type { RequirementCriterion } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Modal, message, Upload } from "antd"
import { useState } from "react"

interface ImportCriteriaAnalysisProps {
  data?: DataTabType
  allData?: DataTabType[]
  label?: string
  refetch?: () => void
}

type ImportPreview = {
  requirementCount: number
  evidenceCount: number
  skippedCount: number
  sections: ParsedCriterionSection[]
}

const calcEvidenceTags = (stdData: DataTabType, stdIdx: number) => {
  const map = new Map<string, string>()
  const standardOrder = stdData.order || stdIdx

  for (const [criterionIdx, criterion] of (stdData.criteria || []).entries()) {
    const analysis = criterion?.analysisCriterions
    if (!analysis) continue

    let evidenceCount = 0
    for (const req of analysis.requirementCriterions || []) {
      for (const ev of req.evidences || []) {
        if (map.has(ev.evidenceId)) continue
        evidenceCount++
        const criterionOrder = criterion.order || criterionIdx + 1
        const tag = [standardOrder, criterionOrder, evidenceCount]
          .map((value) => value.toString().padStart(2, "0"))
          .join(".")
        map.set(ev.evidenceId, tag)
      }
    }
  }

  return map
}

const isEditableStatus = (status?: $Enums.EvaluationCriterionStatus | null) =>
  status !== $Enums.EvaluationCriterionStatus.SUBMITTED &&
  status !== $Enums.EvaluationCriterionStatus.APPROVED &&
  status !== $Enums.EvaluationCriterionStatus.COMPLETED

const normalizeRequirementName = (name: string) =>
  name
    .replace(/^\d+\.\s*/, "")
    .trim()
    .toLowerCase()

const findRequirement = (
  requirements: RequirementCriterion[] | undefined,
  row: ParsedCriterionSection["analysisRows"][number],
  rowIndex: number
) => {
  const sorted = [...(requirements || [])].sort((a, b) => a.order - b.order)

  const byOrder = sorted.find((item) => item.order === row.order)
  if (byOrder) return byOrder

  const byName = sorted.find(
    (item) =>
      item.name === row.name ||
      item.name === `${row.order}. ${row.name}` ||
      normalizeRequirementName(item.name) === normalizeRequirementName(row.name)
  )
  if (byName) return byName

  // ponytail: export numbers rows by index+1, not always req.order
  return sorted[rowIndex] ?? null
}

const ImportCriteriaAnalysis = ({
  data,
  allData,
  label = "Nhập file",
  refetch,
}: ImportCriteriaAnalysisProps) => {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const { showSpinner, hideSpinner } = useSpinner()

  const standards = allData || (data ? [data] : [])

  const buildPreview = (sections: ParsedCriterionSection[]): ImportPreview => {
    let requirementCount = 0
    let evidenceCount = 0
    let skippedCount = 0

    for (const section of sections) {
      const standard = standards.find((item) => (item.order || 0) === section.standardOrder)
      const criterion = standard?.criteria?.find(
        (item) => (item.order || 0) === section.criterionOrder
      )
      const analysis = criterion?.analysisCriterions

      if (!analysis || !isEditableStatus(analysis.status)) {
        skippedCount += section.analysisRows.length + section.evidenceRows.length
        continue
      }

      requirementCount += section.analysisRows.length
      evidenceCount += section.evidenceRows.length
    }

    return { requirementCount, evidenceCount, skippedCount, sections }
  }

  const handleFile = async (file: File) => {
    try {
      const sections = await parseCriteriaAnalysisDocx(file)
      if (sections.length === 0) {
        message.warning("Không tìm thấy dữ liệu phân tích tiêu chí trong file")
        return false
      }

      const nextPreview = buildPreview(sections)
      if (nextPreview.requirementCount === 0 && nextPreview.evidenceCount === 0) {
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

      for (const section of preview.sections) {
        const standard = standards.find((item) => (item.order || 0) === section.standardOrder)
        const criterion = standard?.criteria?.find(
          (item) => (item.order || 0) === section.criterionOrder
        )
        const analysis = criterion?.analysisCriterions

        if (!analysis || !isEditableStatus(analysis.status)) continue

        const evidenceTagMap = calcEvidenceTags(standard!, standard!.order || section.standardOrder)
        const tagToEvidenceId = new Map<string, string>()
        for (const [evidenceId, tag] of evidenceTagMap.entries()) {
          tagToEvidenceId.set(tag, evidenceId)
        }

        for (const [rowIndex, row] of section.analysisRows.entries()) {
          const requirement = findRequirement(analysis.requirementCriterions, row, rowIndex)
          if (!requirement) continue

          transitions.push({
            model: "RequirementCriterion",
            operation: "update",
            data: {
              where: { id: requirement.id },
              data: {
                name: row.name || requirement.name,
                questions: row.questions.length > 0 ? row.questions : requirement.questions,
                evidencePlaces: row.evidencePlaces,
                collectionMethod: row.collectionMethod,
                ...(row.note ? { description: row.note } : {}),
              },
            },
          })
        }

        for (const row of section.evidenceRows) {
          const evidenceId = tagToEvidenceId.get(row.tag)
          if (!evidenceId) continue

          transitions.push({
            model: "Evidence",
            operation: "update",
            data: {
              where: { id: evidenceId },
              data: {
                information: row.information,
                issuer: row.issuer,
              },
            },
          })
        }
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

      await queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      await queryClient.invalidateQueries({ queryKey: ["RequirementCriterion"] })
      await queryClient.invalidateQueries({ queryKey: ["Evidence"] })
      refetch?.()

      message.success(`Đã cập nhật ${transitions.length} bản ghi từ file Word`)
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
        title="Nhập file phiếu phân tích tiêu chí"
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
            Hệ thống sẽ cập nhật các yêu cầu, câu hỏi, nơi thu thập, phương pháp thu thập và thông
            tin minh chứng từ file.
          </p>
        </Upload.Dragger>

        {preview && (
          <div className="mt-4 text-sm text-gray-700">
            <div>Sẽ cập nhật {preview.requirementCount} yêu cầu.</div>
            <div>Sẽ cập nhật {preview.evidenceCount} minh chứng.</div>
            {preview.skippedCount > 0 && (
              <div className="text-orange-600">
                Bỏ qua {preview.skippedCount} dòng không khớp hoặc thuộc tiêu chí đã khóa.
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

export default ImportCriteriaAnalysis
