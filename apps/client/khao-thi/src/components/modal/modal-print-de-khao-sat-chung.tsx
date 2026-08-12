import { FileWordOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons"
import { toRoman } from "@lib/utils"
import { useFindUniqueSurvey, useUpdateSurvey } from "@workspace/db/hooks"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getMinioUrl, getRuntimeEnv } from "@workspace/libs/utils"
import { OnlyOfficeViewer } from "@workspace/ui"
import { Button, Modal, Space, Spin, message } from "antd"
import axios from "axios"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { buildSurveyFormDocxBlob, toDocxFileName } from "@/utils/export-survey-form-docx"
import {
  DEFAULT_SURVEY_PRINT_FORM_CONTENT,
  parseSurveyPrintFormDocMeta,
  surveyPrintObjectName,
  type SurveyPrintFormDocMeta,
} from "@/utils/survey-print-form-template"

dayjs.locale("vi")

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

type GroupedSurveyQuestion = {
  id: string
  name: string
  question: {
    id: string
    name: string
    type: string
  }[]
}

const buildMinioApiBases = (rawModelBase: string) => {
  const trimmed = rawModelBase.replace(/\/+$/, "")
  if (!trimmed) return []

  const fixedModelEndpoint = trimmed.endsWith("/api/model") ? trimmed : `${trimmed}/api/model`
  const legacyModelEndpoint = `${fixedModelEndpoint}/api/model`

  const toMinioBase = (modelEndpoint: string) => modelEndpoint.replace(/\/model$/, "/minio")

  // On current production gateway, minio is typically exposed via legacy prefix first.
  const bases = [toMinioBase(legacyModelEndpoint), toMinioBase(fixedModelEndpoint)]
  return Array.from(new Set(bases))
}

const ModalPrintExamSurvey = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPrintExamSurvey",
  })

  const [docMeta, setDocMeta] = useState<SurveyPrintFormDocMeta | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveRequestRef = useRef(false)

  const { data: survey, refetch } = useFindUniqueSurvey(
    {
      where: {
        id: input?.id,
      },
      include: {
        surveyChoice: true,
        surveyQuestion: {
          include: {
            surveyQuestionGroup: true,
            specificChoice: true,
          },
        },
      },
    },
    { enabled: !!input?.id && isOpen }
  )

  const { mutateAsync: updateSurvey } = useUpdateSurvey()

  const grouped = useMemo(() => {
    const groupedMap = (survey?.surveyQuestion ?? []).reduce<Record<string, GroupedSurveyQuestion>>(
      (acc: any, item: any, index: number) => {
        const groupId = item.surveyQuestionGroupId

        if (!acc[groupId]) {
          acc[groupId] = {
            ...item,
            id: item.surveyQuestionGroup.id,
            name: item.surveyQuestionGroup.name,
            question: [],
            isParent: true,
          }
        }

        acc[groupId].question.push({
          ...item,
          id: item.id,
          name: item.name,
          type: item.type,
          isParent: false,
          index: index + 1,
        })

        return acc
      },
      {}
    )

    return Object.values(groupedMap).map((i: any, index) => {
      return { ...i, index: toRoman(index + 1) }
    }) as GroupedSurveyQuestion[]
  }, [survey])

  const uploadBlobToSurveyPrintPath = useCallback(
    async (blob: Blob, version: number): Promise<SurveyPrintFormDocMeta> => {
      if (!survey?.id) throw new Error("Survey missing")

      const objectName = surveyPrintObjectName(survey.id)
      const resPresignedUrl = await generatePresignedUrl({
        path: "khao-thi/survey-print",
        extension: "docx",
        name: survey.id,
        flat: true,
      })

      if (resPresignedUrl.status !== 200) {
        throw new Error(
          "message" in resPresignedUrl.data
            ? resPresignedUrl.data.message
            : "Không thể tạo presigned URL"
        )
      }

      const { url, fileName } = resPresignedUrl.data
      await axios.put(url, blob, {
        headers: { "Content-Type": DOCX_CONTENT_TYPE },
      })

      const meta: SurveyPrintFormDocMeta = {
        objectName,
        filePath: fileName,
        version,
      }

      await updateSurvey({
        where: { id: survey.id },
        data: { printFormTemplate: meta },
      })

      return meta
    },
    [survey, updateSurvey]
  )

  const uploadSurveyPrintDocx = useCallback(
    async (version: number): Promise<SurveyPrintFormDocMeta> => {
      if (!survey?.id) throw new Error("Survey missing")

      const blob = await buildSurveyFormDocxBlob({
        ...DEFAULT_SURVEY_PRINT_FORM_CONTENT,
        title: survey.name,
        choices: survey.surveyChoice ?? [],
        groups: grouped.map((group) => ({
          id: group.id,
          name: group.name,
          questions: group.question ?? [],
        })),
      })

      return uploadBlobToSurveyPrintPath(blob, version)
    },
    [grouped, survey, uploadBlobToSurveyPrintPath]
  )

  const storedDocMeta = useMemo(
    () => parseSurveyPrintFormDocMeta(survey?.printFormTemplate),
    [survey?.printFormTemplate]
  )

  const uploadSurveyPrintDocxRef = useRef(uploadSurveyPrintDocx)
  uploadSurveyPrintDocxRef.current = uploadSurveyPrintDocx

  useEffect(() => {
    if (!isOpen) {
      setDocMeta(null)
      saveRequestRef.current = false
      return
    }
    if (!survey?.id) return

    let cancelled = false

    const ensureDoc = async () => {
      if (storedDocMeta) {
        if (!cancelled) setDocMeta(storedDocMeta)
        return
      }

      setPreparing(true)
      try {
        const meta = await uploadSurveyPrintDocxRef.current(1)
        if (!cancelled) {
          setDocMeta(meta)
          await refetch()
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) message.error("Không thể tạo mẫu phiếu Word")
      } finally {
        if (!cancelled) setPreparing(false)
      }
    }

    void ensureDoc()

    return () => {
      cancelled = true
    }
  }, [isOpen, survey?.id, storedDocMeta, refetch])

  const apiBase = getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") || ""
  const minioApiBases = useMemo(() => buildMinioApiBases(apiBase), [apiBase])
  // Use NEXT_PUBLIC_API_MODEL_BASE_URL as single source of truth for all model/minio endpoints.
  const callbackUrl =
    docMeta && minioApiBases.length > 0
      ? `${minioApiBases[0]}/onlyoffice-callback?objectName=${encodeURIComponent(docMeta.objectName)}`
      : undefined
  const documentUrl = docMeta ? getMinioUrl(docMeta.filePath) : ""
  const documentKey = docMeta ? `${survey?.id || "survey"}_${docMeta.version}` : undefined

  const handleDownload = () => {
    if (!docMeta) return
    const link = document.createElement("a")
    link.href = getMinioUrl(docMeta.filePath)
    link.download = toDocxFileName("Phieu khao sat", survey?.name)
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  const handleSaveFromEditor = () => {
    if (!docMeta || saving) return
    if (!window.docEditor?.downloadAs) {
      message.error("Editor chưa sẵn sàng, vui lòng thử lại")
      return
    }
    saveRequestRef.current = true
    setSaving(true)
    window.docEditor.downloadAs("docx")
  }

  const handleDownloadAsUrl = useCallback(
    async (fileUrl: string) => {
      // Ignore accidental downloadAs if user didn't click Lưu mẫu
      if (!saveRequestRef.current) {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = toDocxFileName("Phieu khao sat", survey?.name)
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        return
      }

      saveRequestRef.current = false
      try {
        if (!docMeta?.objectName) throw new Error("Missing objectName")

        let saveOk = false
        let lastStatus = 0
        for (const base of minioApiBases) {
          const saveUrl = `${base}/onlyoffice-save-from-url?objectName=${encodeURIComponent(docMeta.objectName)}`
          const res = await fetch(saveUrl, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: fileUrl }),
          })
          lastStatus = res.status
          if (res.ok) {
            saveOk = true
            break
          }
          // If not found, keep trying fallback base. Other errors stop early.
          if (res.status !== 404) break
        }
        if (!saveOk) throw new Error(`Save from URL failed: ${lastStatus}`)

        const nextVersion = (docMeta.version ?? 0) + 1
        const meta: SurveyPrintFormDocMeta = {
          ...docMeta,
          version: nextVersion,
        }
        await updateSurvey({
          where: { id: survey?.id || "" },
          data: { printFormTemplate: meta },
        })
        setDocMeta(meta)
        await refetch()
        message.success("Đã lưu mẫu phiếu khảo sát")
      } catch (error) {
        console.error(error)
        message.error("Không thể lưu mẫu phiếu")
      } finally {
        setSaving(false)
      }
    },
    [docMeta, minioApiBases, refetch, survey?.id, survey?.name, updateSurvey]
  )

  const handleRegenerate = () => {
    if (!survey?.id) return
    Modal.confirm({
      title: "Tạo lại mẫu từ dữ liệu?",
      content:
        "Phiếu sẽ được tạo lại từ câu hỏi hiện tại. Các chỉnh sửa (shape, định dạng) trên file Word sẽ bị ghi đè.",
      okText: "Tạo lại",
      cancelText: "Hủy",
      onOk: async () => {
        setPreparing(true)
        try {
          const nextVersion = (docMeta?.version ?? 0) + 1
          const meta = await uploadSurveyPrintDocx(nextVersion)
          setDocMeta(meta)
          await refetch()
          message.success("Đã tạo lại mẫu phiếu")
        } catch (error) {
          console.error(error)
          message.error("Không thể tạo lại mẫu phiếu")
        } finally {
          setPreparing(false)
        }
      },
    })
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="100vw"
      style={{ top: 0, maxWidth: "100vw", paddingBottom: 0 }}
      styles={{
        body: {
          padding: "8px 16px 0",
          height: "calc(100vh - 72px)",
          overflow: "hidden",
        },
      }}
      className="survey-print-fullscreen-modal"
      wrapClassName="survey-print-fullscreen-wrap"
      destroyOnClose
      title={
        <div className="flex items-center justify-between w-[95%] pr-2">
          <span>Xem / chỉnh sửa đề khảo sát</span>
          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRegenerate}
              size="small"
              disabled={!survey?.id || preparing || saving}
            >
              Tạo lại từ dữ liệu
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveFromEditor}
              size="small"
              type="primary"
              loading={saving}
              disabled={!docMeta || preparing}
            >
              Lưu mẫu
            </Button>
            <Button
              icon={<FileWordOutlined />}
              onClick={handleDownload}
              size="small"
              disabled={!docMeta || preparing || saving}
            >
              Tải file Word
            </Button>
          </Space>
        </div>
      }
    >
      {/* <div className="mb-2 text-xs text-neutral-500 shrink-0">
        Chỉnh sửa trên OnlyOffice (có thể vẽ line/shape). Sau khi sửa, bấm <b>Lưu mẫu</b> trên thanh
        tiêu đề modal để lưu — không dùng nút Save trong OnlyOffice khi chạy local.
      </div> */}
      {preparing || !docMeta || !documentUrl ? (
        <div className="flex items-center justify-center h-[calc(100%-2rem)]">
          <Spin tip="Đang chuẩn bị mẫu phiếu..." />
        </div>
      ) : (
        <OnlyOfficeViewer
          key={documentKey}
          uri={documentUrl}
          title={survey?.name || "Phieu khao sat"}
          fileType="docx"
          mode="edit"
          callbackUrl={callbackUrl}
          documentKey={documentKey}
          onDownloadAsUrl={handleDownloadAsUrl}
          allowDownload
          containerClassName="w-full h-[calc(100%-2rem)]"
          editorHeight="100%"
        />
      )}
      <style>{`
        .survey-print-fullscreen-wrap {
          overflow: hidden;
        }
        .survey-print-fullscreen-wrap .ant-modal {
          max-width: 100vw !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          top: 0 !important;
        }
        .survey-print-fullscreen-modal .ant-modal-content {
          border-radius: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .survey-print-fullscreen-modal .ant-modal-header {
          flex-shrink: 0;
        }
        .survey-print-fullscreen-modal .ant-modal-body {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </Modal>
  )
}

export default ModalPrintExamSurvey
