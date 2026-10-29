import { FileWordOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons"
import { useFindUniqueClusterSurvey, useUpdateClusterSurvey } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { OnlyOfficeViewer } from "@workspace/ui"
import { Button, Modal, Space, Spin, message } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { presignedGetObject } from "@workspace/libs/api/model"
import { buildSurveyFormDocxBlob, toDocxFileName } from "@/utils/export-survey-form-docx"
import {
  LECTURER_SURVEY_PRINT_FORM_CONTENT,
  parseSurveyFormDisplayContent,
  buildMinioApiBases,
  clusterSurveyPrintObjectName,
  parseSurveyPrintFormDocMeta,
  surveyPrintCallbackUrl,
  surveyPrintFileExists,
  surveyPrintProxyUrl,
  uploadSurveyPrintViaServer,
  type SurveyPrintFormDocMeta,
} from "@/utils/survey-print-form-template"

dayjs.locale("vi")

const ModalPrintExamClusterSurvey = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPrintExamClusterSurvey",
  })

  const [docMeta, setDocMeta] = useState<SurveyPrintFormDocMeta | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editorUri, setEditorUri] = useState<string>("")
  const saveRequestRef = useRef(false)

  const { data: clusterSurvey, refetch } = useFindUniqueClusterSurvey(
    {
      where: {
        id: input?.id,
      },
      include: {
        surveyChoice: true,
        surveyQuestion: {
          include: {
            specificChoice: true,
          },
        },
        surveys: {
          select: {
            formContent: true,
          },
          take: 1,
        },
      },
    },
    { enabled: !!input?.id && isOpen }
  )

  const { mutateAsync: updateClusterSurvey } = useUpdateClusterSurvey()

  const uploadBlobToClusterSurveyPrintPath = useCallback(
    async (blob: Blob, version: number): Promise<SurveyPrintFormDocMeta> => {
      if (!clusterSurvey?.id) throw new Error("ClusterSurvey missing")

      const objectName = clusterSurveyPrintObjectName(clusterSurvey.id)
      const apiBase = getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") || ""
      const bases = buildMinioApiBases(apiBase)
      const { filePath } = await uploadSurveyPrintViaServer(bases, objectName, blob)

      const meta: SurveyPrintFormDocMeta = {
        objectName,
        filePath,
        version,
      }

      await updateClusterSurvey({
        where: { id: clusterSurvey.id },
        data: { printFormTemplate: meta },
      })

      return meta
    },
    [clusterSurvey, updateClusterSurvey]
  )

  const uploadClusterSurveyPrintDocx = useCallback(
    async (version: number): Promise<SurveyPrintFormDocMeta> => {
      if (!clusterSurvey?.id) throw new Error("ClusterSurvey missing")

      const firstSurvey = clusterSurvey.surveys?.[0]
      const formContent = parseSurveyFormDisplayContent(
        firstSurvey?.formContent,
        LECTURER_SURVEY_PRINT_FORM_CONTENT
      )

      const blob = await buildSurveyFormDocxBlob({
        ...formContent,
        title: clusterSurvey.name,
        choices: clusterSurvey.surveyChoice ?? [],
        groups: [{ questions: clusterSurvey.surveyQuestion ?? [] }],
      })

      return uploadBlobToClusterSurveyPrintPath(blob, version)
    },
    [clusterSurvey, uploadBlobToClusterSurveyPrintPath]
  )

  const storedDocMeta = useMemo(
    () => parseSurveyPrintFormDocMeta(clusterSurvey?.printFormTemplate),
    [clusterSurvey?.printFormTemplate]
  )

  const uploadClusterSurveyPrintDocxRef = useRef(uploadClusterSurveyPrintDocx)
  uploadClusterSurveyPrintDocxRef.current = uploadClusterSurveyPrintDocx

  useEffect(() => {
    if (!isOpen) {
      setDocMeta(null)
      saveRequestRef.current = false
      return
    }
    if (!clusterSurvey?.id) return

    let cancelled = false

    const ensureDoc = async () => {
      setPreparing(true)
      try {
        const apiBase = getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") || ""
        const bases = buildMinioApiBases(apiBase)
        if (storedDocMeta) {
          const exists = await surveyPrintFileExists(bases, storedDocMeta.objectName)
          if (exists) {
            if (!cancelled) setDocMeta(storedDocMeta)
            return
          }
        }

        const meta = await uploadClusterSurveyPrintDocxRef.current(storedDocMeta?.version || 1)
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
  }, [isOpen, clusterSurvey?.id, storedDocMeta, refetch])

  const apiBase = getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL") || ""
  const minioApiBases = useMemo(() => buildMinioApiBases(apiBase), [apiBase])
  const rawCallbackUrl =
    docMeta && minioApiBases.length > 0
      ? surveyPrintCallbackUrl(minioApiBases[0], docMeta.objectName)
      : undefined
  const callbackUrl =
    rawCallbackUrl &&
    !rawCallbackUrl.startsWith("http://localhost") &&
    !rawCallbackUrl.startsWith("http://127.0.0.1")
      ? rawCallbackUrl
      : undefined
  const documentUrl =
    docMeta && minioApiBases.length > 0
      ? surveyPrintProxyUrl(minioApiBases[0], docMeta.objectName)
      : ""
    useEffect(() => {
    if (!isOpen || !docMeta?.objectName || !documentUrl) {
      setEditorUri("")
      return
    }

    const isLocal =
      documentUrl.startsWith("http://localhost") || documentUrl.startsWith("http://127.0.0.1")

    if (isLocal) {
      void presignedGetObject({ objectName: docMeta.objectName })
        .then((res) => {
          if (res.status === 200 && res.data && "url" in res.data && res.data.url) {
            setEditorUri(res.data.url)
          } else {
            setEditorUri(documentUrl)
          }
        })
        .catch(() => {
          setEditorUri(documentUrl)
        })
    } else {
      setEditorUri(documentUrl)
    }
  }, [isOpen, docMeta?.objectName, documentUrl])

  const documentKey = docMeta ? `${clusterSurvey?.id || "cluster"}_${docMeta.version}` : undefined

  const handleDownload = () => {
    if (!docMeta || !documentUrl) return
    const link = document.createElement("a")
    link.href = documentUrl
    link.download = toDocxFileName("Phieu khao sat giang vien", clusterSurvey?.name)
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
      if (!saveRequestRef.current) {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = toDocxFileName("Phieu khao sat giang vien", clusterSurvey?.name)
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
          if (res.status !== 404 && res.status !== 400) break
        }
        if (!saveOk) throw new Error(`Save from URL failed: ${lastStatus}`)

        const nextVersion = (docMeta.version ?? 0) + 1
        const meta: SurveyPrintFormDocMeta = {
          ...docMeta,
          version: nextVersion,
        }
        await updateClusterSurvey({
          where: { id: clusterSurvey?.id || "" },
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
    [docMeta, minioApiBases, refetch, clusterSurvey?.id, clusterSurvey?.name, updateClusterSurvey]
  )

  const handleRegenerate = () => {
    if (!clusterSurvey?.id) return
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
          const meta = await uploadClusterSurveyPrintDocx(nextVersion)
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
          <span>Xem / chỉnh sửa đề khảo sát cụm</span>
          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRegenerate}
              size="small"
              disabled={!clusterSurvey?.id || preparing || saving}
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
      {preparing || !docMeta || !editorUri ? (
        <div className="flex items-center justify-center h-[calc(100%-2rem)]">
          <Spin tip="Đang chuẩn bị mẫu phiếu..." />
        </div>
      ) : (
        <OnlyOfficeViewer
          key={documentKey}
          uri={editorUri}
          title={clusterSurvey?.name || "Phieu khao sat giang vien"}
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

export default ModalPrintExamClusterSurvey
