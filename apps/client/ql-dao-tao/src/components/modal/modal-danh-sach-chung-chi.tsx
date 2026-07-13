import Table from "@components/commons/table"
// import DeleteIcon from '@components/icons/delete'
// import EditIcon from '@components/icons/edit'
import {
  CloseOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { useArchivedCertificateStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import { formatDate, formatDateVN } from "@lib/utils"
import { $Enums, ArchivedCertificate } from "@workspace/db/client"
import { useFindManyCertificate, useUpdateArchivedCertificate } from "@workspace/db/hooks"
import {
  confirmViolations,
  useCertificateExpirationCheck,
} from "./utils/check-certificate-expiration"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Flex, InputNumber, Modal, Switch, Tag, Tooltip, Upload, message } from "antd"
import axios from "axios"
import { saveAs } from "file-saver"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import DatePicker from "@components/commons/date-picker"

interface StudentCertificatesInput {
  studentId: string
  studentName: string
  certificates: any[]
  isEditMode?: boolean
}

type DraftValue = {
  score?: number
  finalScore?: number
  listeningScore?: number
  speakingScore?: number
  readingScore?: number
  writingScore?: number
  issuedDate: dayjs.Dayjs | null
  expiredDate: dayjs.Dayjs | null
}

type DraftValues = Record<string, DraftValue>

type DocFileItem = {
  id?: string
  name: string
  path: string
  size: bigint
  mimeType?: string
}

const initializeDrafts = (certificates: any[]): DraftValues =>
  certificates.reduce(
    (acc, cert) => ({
      ...acc,
      [cert.id]: {
        score: cert?.score,
        finalScore: cert?.finalScore,
        listeningScore: cert?.listeningScore,
        speakingScore: cert?.speakingScore,
        readingScore: cert?.readingScore,
        writingScore: cert?.writingScore,
        issuedDate: cert?.issuedDate ? dayjs(cert.issuedDate) : null,
        expiredDate: cert?.expiredDate ? dayjs(cert.expiredDate) : null,
      },
    }),
    {}
  )

const ModalDanhSachChungChi = () => {
  const { showSpinner, hideSpinner } = useSpinner()

  const { getArchivedCertificateStatusStatusLabel, getArchivedCertificateStatusColor } =
    useArchivedCertificateStatusOptions()

  const { isOpen, onClose, input } = useDisclosure<StudentCertificatesInput>({
    tag: "ModalDanhSachChungChi",
  })

  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()

  const { data: certificateForCheck = [] } = useFindManyCertificate({
    include: {
      subjects: { include: { subject: true } },
    },
  })
  const { runCheck } = useCertificateExpirationCheck(certificateForCheck as any)

  const [showLanguageScoreColumns, setShowLanguageScoreColumns] = useState(true)
  const [displayCertificates, setDisplayCertificates] = useState<any[]>([])
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [draftValues, setDraftValues] = useState<DraftValues>({})
  const [draftDocFiles, setDraftDocFiles] = useState<Record<string, DocFileItem[]>>({})
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null)

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const certificates = input?.certificates || []

  useEffect(() => {
    setDisplayCertificates(certificates)
    setDraftValues(initializeDrafts(certificates))
    setDraftDocFiles(
      certificates.reduce(
        (acc: Record<string, DocFileItem[]>, cert: any) => ({
          ...acc,
          [cert.id]: (cert.documentFiles || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            path: f.path,
            size: f.size ? BigInt(f.size) : BigInt(0),
            mimeType: f.mimeType || "",
          })),
        }),
        {}
      )
    )
    if (input?.isEditMode && certificates?.length) {
      setEditingCertId(input.certificates[0].id)
    } else {
      setEditingCertId(null)
    }
  }, [certificates, input?.isEditMode])

  const handleUploadFile = async (certId: string, file: File) => {
    try {
      setUploadingCertId(certId)
      const extension = file.name.split(".").pop() || ""
      const res = await generatePresignedUrl({ path: "tai-lieu-ctdt", extension })
      if (res.status !== 200) {
        throw new Error("message" in res.data ? res.data.message : "Không thể tạo presigned URL")
      }
      const { url, fileName } = res.data
      await axios.put(url, file)
      const newFile: DocFileItem = {
        name: file.name,
        path: fileName,
        size: BigInt(file.size || 0),
        mimeType: file.type,
      }
      setDraftDocFiles((prev) => ({
        ...prev,
        [certId]: [...(prev[certId] || []), newFile],
      }))
    } catch {
      message.error(`Không thể upload ${file.name}`)
    } finally {
      setUploadingCertId(null)
    }
  }

  const handleRemoveDocFile = (certId: string, index: number) => {
    setDraftDocFiles((prev) => ({
      ...prev,
      [certId]: (prev[certId] || []).filter((_, i) => i !== index),
    }))
  }

  const handleChangeDraft = (certId: string, key: keyof DraftValue, value: any) => {
    setDraftValues((prev) => ({
      ...prev,
      [certId]: {
        ...prev[certId],
        [key]: value,
      },
    }))
  }

  const handleSave = async (certId: string) => {
    const draft = draftValues[certId]
    if (!draft) return

    try {
      const cert = displayCertificates.find((c) => c.id === certId)
      if (cert?.certificateId && draft.expiredDate) {
        const violations = await runCheck([
          {
            studentId: cert.studentId || input?.studentId || "",
            studentName: input?.studentName || "",
            studentFixedClassId: cert.student?.fixedClassId ?? cert.student?.fixedClass?.id ?? null,
            certificateId: cert.certificateId,
            expiredDate: draft.expiredDate.toDate(),
          },
        ])
        if (violations.length > 0) {
          const proceed = await confirmViolations(violations)
          if (!proceed) return
        }
      }

      showSpinner()
      const saveData = {
        score: draft.score || 0,
        finalScore: draft.finalScore || 0,
        listeningScore: draft.listeningScore || 0,
        speakingScore: draft.speakingScore || 0,
        readingScore: draft.readingScore || 0,
        writingScore: draft.writingScore || 0,
        issuedDate: draft.issuedDate ? draft.issuedDate.toDate() : null,
        expiredDate: draft.expiredDate ? draft.expiredDate.toDate() : null,
      }

      const files = draftDocFiles[certId] || []
      const originalFiles: any[] =
        displayCertificates.find((c) => c.id === certId)?.documentFiles || []
      const keptIds = files.filter((f) => !!f.id).map((f) => f.id!)
      const disconnectIds = originalFiles
        .filter((f: any) => !keptIds.includes(f.id))
        .map((f: any) => ({ id: f.id }))
      const newFiles = files.filter((f) => !f.id)

      await updateArchivedCertificate({
        where: { id: certId },
        data: {
          ...saveData,
          documentFiles: {
            disconnect: disconnectIds,
            create: newFiles.map((f) => ({
              name: f.name,
              path: f.path,
              size: f.size,
              mimeType: f.mimeType,
            })),
          },
        } as any,
      })

      setDisplayCertificates((prev) =>
        prev.map((cert) =>
          cert.id === certId
            ? {
                ...cert,
                ...saveData,
                issuedDate: draft.issuedDate ? draft.issuedDate.toISOString() : null,
                expiredDate: draft.expiredDate ? draft.expiredDate.toISOString() : null,
              }
            : cert
        )
      )
      setEditingCertId(null)
      message.success("Cập nhật chứng chỉ thành công")
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const renderEditableNumber = (value: number | undefined, cert: any, key: keyof DraftValue) => {
    if (editingCertId !== cert.id) return value ?? "-"
    return (
      <InputNumber
        className="w-full"
        min={0}
        value={draftValues?.[cert.id]?.[key] as number | null}
        onChange={(v) => handleChangeDraft(cert.id, key, v)}
      />
    )
  }

  const renderEditableDate = (
    date: string | null,
    cert: any,
    key: "issuedDate" | "expiredDate"
  ) => {
    if (editingCertId !== cert.id) return date ? formatDate(date) : ""
    return (
      <DatePicker
        className="w-full"
        format="DD/MM/YYYY"
        value={draftValues?.[cert.id]?.[key] || null}
        onChange={(v) => handleChangeDraft(cert.id, key, v)}
      />
    )
  }

  return (
    <Modal
      title={`Danh sách chứng chỉ - ${input?.studentName || ""}`}
      open={isOpen}
      onCancel={onClose}
      width={showLanguageScoreColumns ? 1600 : 1200}
      footer={null}
      destroyOnClose
    >
      <Flex justify="end" align="center" className="mb-3" gap={8}>
        <span className="text-sm">Điểm ngoại ngữ</span>
        <Switch checked={showLanguageScoreColumns} onChange={setShowLanguageScoreColumns} />
      </Flex>

      <Table
        rowKey="id"
        dataSource={displayCertificates}
        pagination={false}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          {
            title: "Tên chứng chỉ",
            width: 150,
            dataIndex: "name",
            align: "center",
            render: (__, cert) => cert?.certificate?.name || "",
          },
          {
            title: "Điểm chứng chỉ",
            dataIndex: "score",
            align: "center",
            width: 120,
            render: (score: number, cert: ArchivedCertificate) =>
              cert.status === "APPROVED" ? score : renderEditableNumber(score, cert, "score"),
          },
          {
            title: "Điểm quy đổi",
            dataIndex: "finalScore",
            align: "center",
            width: 140,
            render: (finalScore: number, cert: ArchivedCertificate) =>
              cert.status === $Enums.ArchivedCertificateStatus.APPROVED
                ? finalScore
                : renderEditableNumber(finalScore, cert, "finalScore"),
          },
          ...((showLanguageScoreColumns
            ? [
                {
                  title: "Nghe",
                  align: "center",
                  width: 100,
                  render: (_: any, cert: any) =>
                    renderEditableNumber(cert?.listeningScore, cert, "listeningScore"),
                },
                {
                  title: "Nói",
                  align: "center",
                  width: 100,
                  render: (_: any, cert: any) =>
                    renderEditableNumber(cert?.speakingScore, cert, "speakingScore"),
                },
                {
                  title: "Đọc",
                  align: "center",
                  width: 100,
                  render: (_: any, cert: any) =>
                    renderEditableNumber(cert?.readingScore, cert, "readingScore"),
                },
                {
                  title: "Viết",
                  align: "center",
                  width: 100,
                  render: (_: any, cert: any) =>
                    renderEditableNumber(cert?.writingScore, cert, "writingScore"),
                },
              ]
            : []) as any[]),
          {
            title: "Ngày cấp",
            dataIndex: "issuedDate",
            align: "center",
            width: 150,
            render: (date: string, cert: ArchivedCertificate) =>
              cert.status === $Enums.ArchivedCertificateStatus.APPROVED
                ? formatDateVN(date)
                : renderEditableDate(date, cert, "issuedDate"),
          },
          {
            title: "Ngày hết hạn",
            dataIndex: "expiredDate",
            align: "center",
            width: 150,
            render: (date: string, cert: ArchivedCertificate) =>
              cert.status === $Enums.ArchivedCertificateStatus.APPROVED
                ? formatDateVN(date)
                : renderEditableDate(date, cert, "expiredDate"),
          },
          {
            title: "Minh chứng",
            align: "center",
            width: 200,
            render: (_, cert) => {
              const files: DocFileItem[] = draftDocFiles[cert.id] || []
              const isEditing = editingCertId === cert.id
              return (
                <div className="flex flex-col gap-1 items-start">
                  {files.map((file, idx) => (
                    <div key={`${file.path}-${idx}`} className="flex items-center gap-1 max-w-full">
                      <PaperClipOutlined className="text-gray-500 flex-shrink-0" />
                      <Tooltip title={file.name}>
                        <span
                          className="cursor-pointer text-blue-600 hover:underline text-xs truncate max-w-[120px]"
                          onClick={() =>
                            onOpenPreview({
                              uri: file.path,
                              name: file.name,
                              mimeType: file.name.split(".").pop() || file.mimeType,
                            })
                          }
                        >
                          {file.name}
                        </span>
                      </Tooltip>
                      <DownloadOutlined
                        className="cursor-pointer text-blue-500 text-[12px] flex-shrink-0"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const res = await axios.get(getMinioUrl(file.path), {
                              responseType: "blob",
                            })
                            saveAs(res.data, file.name)
                          } catch {
                            message.error(`Không thể tải ${file.name}`)
                          }
                        }}
                      />
                      {isEditing && (
                        <CloseOutlined
                          className="cursor-pointer text-red-500 text-[10px] flex-shrink-0"
                          onClick={() => handleRemoveDocFile(cert.id, idx)}
                        />
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <Upload
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      disabled={cert.status === $Enums.ArchivedCertificateStatus.APPROVED}
                      beforeUpload={(file: File) => {
                        if (file.size / 1024 / 1024 > 50) {
                          message.error(`${file.name} vượt quá 50MB`)
                          return Upload.LIST_IGNORE
                        }
                        handleUploadFile(cert.id, file)
                        return false
                      }}
                      showUploadList={false}
                    >
                      <Button
                        type="default"
                        icon={<UploadOutlined />}
                        size="small"
                        disabled={cert.status === $Enums.ArchivedCertificateStatus.APPROVED}
                        loading={uploadingCertId === cert.id}
                      >
                        Tải lên
                      </Button>
                    </Upload>
                  )}
                </div>
              )
            },
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 150,
            align: "center",
            render: (status: $Enums.ArchivedCertificateStatus) => {
              const label = getArchivedCertificateStatusStatusLabel(status)
              const color = getArchivedCertificateStatusColor(status)
              return <Tag color={color}>{label}</Tag>
            },
          },
          {
            title: "Thao tác",
            width: 160,
            align: "center",
            hidden: !input?.isEditMode || displayCertificates.every((c) => c.status === "APPROVED"),
            render: (_: any, cert: any) => {
              const isEditing = editingCertId === cert.id

              if (cert.status === "APPROVED") return null

              if (isEditing) {
                return (
                  <Flex justify="center" gap={8}>
                    <Button type="primary" size="small" onClick={() => handleSave(cert.id)}>
                      Lưu
                    </Button>
                    <Button size="small" onClick={() => setEditingCertId(null)}>
                      Hủy
                    </Button>
                  </Flex>
                )
              }

              return (
                <Button size="small" onClick={() => setEditingCertId(cert.id)}>
                  Sửa
                </Button>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}

export default ModalDanhSachChungChi
