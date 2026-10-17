import Table from "@components/commons/table"
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { useArchivedCertificateStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import { formatDate, formatDateVN } from "@lib/utils"
import { $Enums, ArchivedCertificate } from "@workspace/db/client"
import {
  useCreateManyArchivedCertificateSubjectScore,
  useDeleteManyArchivedCertificateSubjectScore,
  useFindManyCertificate,
  useUpdateArchivedCertificate,
} from "@workspace/db/hooks"
import { useDeleteArchivedCertificate } from "@workspace/libs/api/training"
import {
  confirmViolations,
  useCertificateExpirationCheck,
} from "./utils/check-certificate-expiration"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getMinioUrl } from "@workspace/libs/utils"
import {
  Button,
  Flex,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Tag,
  Tooltip,
  Upload,
  message,
} from "antd"
import axios from "axios"
import { saveAs } from "file-saver"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import DatePicker from "@components/commons/date-picker"
import { queryClient } from "@api/index"

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
  description?: string
}

type DraftValues = Record<string, DraftValue>

type SubjectScoreDraft = {
  subjectVersionId: string
  finalScore: number
}

const OPTIONAL_SUBJECT_SCORE_HINT = "Không chọn môn: chỉ ghi nhận chứng chỉ"

type DocFileItem = {
  id?: string
  name: string
  path: string
  size: bigint
  mimeType?: string
}

type CurriculumSubject = {
  id: string
  name: string
  code?: string | null
  credit?: number | null
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
        description: cert?.description || "",
      },
    }),
    {}
  )

const initializeSubjectScoreDrafts = (certificates: any[]): Record<string, SubjectScoreDraft[]> =>
  certificates.reduce(
    (acc, cert) => ({
      ...acc,
      [cert.id]:
        (cert.subjectScores || []).map((s: any) => ({
          subjectVersionId: s.subjectVersionId,
          finalScore: s.finalScore,
        })) || [],
    }),
    {}
  )

function getCurriculumSubjects(cert: any): CurriculumSubject[] {
  const student = cert?.student
  const curriculumVersion = student?.curriculumVersion || student?.fixedClass?.curriculumVersion
  if (!curriculumVersion?.trainingBlocks) return []

  const map = new Map<string, CurriculumSubject>()
  for (const block of curriculumVersion.trainingBlocks) {
    for (const tbs of block.subjects || []) {
      const sv = tbs.subject
      if (!sv?.id || map.has(sv.id)) continue
      map.set(sv.id, {
        id: sv.id,
        name: sv.name,
        code: sv.code,
        credit: sv.credit,
      })
    }
  }
  return [...map.values()]
}

const ModalDanhSachChungChi = () => {
  const { showSpinner, hideSpinner } = useSpinner()

  const { getArchivedCertificateStatusStatusLabel, getArchivedCertificateStatusColor } =
    useArchivedCertificateStatusOptions()

  const { isOpen, onClose, input } = useDisclosure<StudentCertificatesInput>({
    tag: "ModalDanhSachChungChi",
  })

  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
  const { mutateAsync: deleteManySubjectScores } = useDeleteManyArchivedCertificateSubjectScore()
  const { mutateAsync: createManySubjectScores } = useCreateManyArchivedCertificateSubjectScore()
  const { mutateAsync: deleteArchivedCertificates } = useDeleteArchivedCertificate()

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
  const [draftSubjectScores, setDraftSubjectScores] = useState<Record<string, SubjectScoreDraft[]>>(
    {}
  )
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
    setDraftSubjectScores(initializeSubjectScoreDrafts(certificates))
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

    const subjectScores = draftSubjectScores[certId] || []

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
        description: draft.description?.trim() || null,
      }

      const files = draftDocFiles[certId] || []
      const originalFiles: any[] =
        displayCertificates.find((c) => c.id === certId)?.documentFiles || []
      const keptIds = files.filter((f) => !!f.id).map((f) => f.id!)
      const disconnectIds = originalFiles
        .filter((f: any) => !keptIds.includes(f.id))
        .map((f: any) => ({ id: f.id }))
      const newFiles = files.filter((f) => !f.id)

      const updated = await updateArchivedCertificate({
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
        include: { documentFiles: true },
      })

      // Xóa mapping cũ (hard delete vì unique archivedCertificateId+subjectVersionId), tạo lại theo draft
      await deleteManySubjectScores({
        where: { archivedCertificateId: certId },
      })
      if (subjectScores.length) {
        await createManySubjectScores({
          data: subjectScores.map((s) => ({
            archivedCertificateId: certId,
            subjectVersionId: s.subjectVersionId,
            finalScore: s.finalScore,
          })),
        })
      }

      const curriculumSubjects = getCurriculumSubjects(cert)
      const subjectMap = new Map(curriculumSubjects.map((s) => [s.id, s]))
      const savedDocumentFiles = ((updated as any)?.documentFiles || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        size: f.size ? BigInt(f.size) : BigInt(0),
        mimeType: f.mimeType || "",
      }))

      setDraftDocFiles((prev) => ({
        ...prev,
        [certId]: savedDocumentFiles,
      }))
      setDisplayCertificates((prev) =>
        prev.map((c) =>
          c.id === certId
            ? {
                ...c,
                ...saveData,
                issuedDate: draft.issuedDate ? draft.issuedDate.toISOString() : null,
                expiredDate: draft.expiredDate ? draft.expiredDate.toISOString() : null,
                documentFiles: savedDocumentFiles,
                subjectScores: subjectScores.map((s, idx) => ({
                  id: `temp-${idx}`,
                  subjectVersionId: s.subjectVersionId,
                  finalScore: s.finalScore,
                  subjectVersion: subjectMap.get(s.subjectVersionId) || {
                    id: s.subjectVersionId,
                    name: s.subjectVersionId,
                  },
                })),
              }
            : c
        )
      )
      setEditingCertId(null)
      queryClient.invalidateQueries({ queryKey: ["ArchivedCertificate"] })
      message.success("Cập nhật chứng chỉ thành công")
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleDelete = async (certId: string) => {
    try {
      showSpinner()
      const res = await deleteArchivedCertificates({
        data: { archivedCertificateIds: [certId] },
      })
      if (res?.status !== 200) {
        message.error(res?.data?.message || "Không thể xóa chứng chỉ")
        return
      }
      setDisplayCertificates((prev) => prev.filter((c) => c.id !== certId))
      if (editingCertId === certId) setEditingCertId(null)
      queryClient.invalidateQueries({ queryKey: ["ArchivedCertificate"] })
      message.success("Xóa chứng chỉ thành công")
    } catch (error: any) {
      message.error(
        error?.info?.message || error?.data?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại"
      )
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

  const renderEditableNote = (value: string | null | undefined, cert: any) => {
    if (editingCertId !== cert.id) return value || "-"
    return (
      <Input
        className="w-full"
        value={draftValues?.[cert.id]?.description ?? ""}
        onChange={(e) => handleChangeDraft(cert.id, "description", e.target.value)}
        placeholder="Nhập ghi chú"
      />
    )
  }

  const renderSubjectScores = (cert: any) => {
    const isEditing = editingCertId === cert.id
    const curriculumSubjects = getCurriculumSubjects(cert)

    if (!isEditing) {
      const scores = cert.subjectScores || []
      if (!scores.length) {
        return <span className="text-gray-500 text-xs">{OPTIONAL_SUBJECT_SCORE_HINT}</span>
      }
      return (
        <div className="flex flex-col gap-0.5 text-xs text-left">
          {scores.map((s: any) => (
            <div key={s.id || s.subjectVersionId}>
              {s.subjectVersion?.code ? `${s.subjectVersion.code} - ` : ""}
              {s.subjectVersion?.name || "?"}: <b>{s.finalScore}</b>
            </div>
          ))}
        </div>
      )
    }

    const scores = draftSubjectScores[cert.id] || []
    const selectedIds = new Set(scores.map((s) => s.subjectVersionId))
    const available = curriculumSubjects.filter((s) => !selectedIds.has(s.id))

    return (
      <div className="flex flex-col gap-1 py-1">
        {!scores.length && (
          <span className="text-gray-500 text-xs">{OPTIONAL_SUBJECT_SCORE_HINT}</span>
        )}
        {scores.map((item, idx) => (
          <div key={`${item.subjectVersionId}-${idx}`} className="flex items-center gap-1">
            <Select
              className="flex-1 min-w-0"
              size="small"
              value={item.subjectVersionId}
              options={curriculumSubjects
                .filter((s) => s.id === item.subjectVersionId || !selectedIds.has(s.id))
                .map((s) => ({
                  label: `${s.code ? `${s.code} - ` : ""}${s.name}`,
                  value: s.id,
                }))}
              onChange={(value: string) => {
                const next = [...scores]
                next[idx] = { ...next[idx], subjectVersionId: value }
                setDraftSubjectScores((prev) => ({ ...prev, [cert.id]: next }))
              }}
            />
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              size="small"
              className="w-[64px]"
              value={item.finalScore}
              onChange={(value) => {
                const next = [...scores]
                next[idx] = { ...next[idx], finalScore: value ?? 0 }
                setDraftSubjectScores((prev) => ({ ...prev, [cert.id]: next }))
              }}
            />
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                setDraftSubjectScores((prev) => ({
                  ...prev,
                  [cert.id]: scores.filter((_, i) => i !== idx),
                }))
              }}
            />
          </div>
        ))}
        {available.length > 0 && (
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            className="px-0 self-start"
            onClick={() => {
              setDraftSubjectScores((prev) => ({
                ...prev,
                [cert.id]: [
                  ...(prev[cert.id] || []),
                  { subjectVersionId: available[0].id, finalScore: 0 },
                ],
              }))
            }}
          >
            Thêm môn
          </Button>
        )}
        {!curriculumSubjects.length && (
          <span className="text-orange-500 text-xs">SV chưa có CTĐT / không có môn</span>
        )}
      </div>
    )
  }

  return (
    <Modal
      title={`Danh sách chứng chỉ - ${input?.studentName || ""}`}
      open={isOpen}
      onCancel={onClose}
      width={showLanguageScoreColumns ? 1900 : 1500}
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
            title: "Điểm phiên",
            width: 280,
            align: "left",
            render: (_, cert) => renderSubjectScores(cert),
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
            title: "Ghi chú",
            dataIndex: "description",
            align: "left",
            width: 180,
            render: (description: string, cert: ArchivedCertificate) =>
              renderEditableNote(description, cert),
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
            width: 200,
            align: "center",
            hidden: !input?.isEditMode,
            render: (_: any, cert: any) => {
              const isEditing = editingCertId === cert.id
              const isApproved = cert.status === "APPROVED"

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
                <Flex justify="center" gap={8}>
                  <Button size="small" onClick={() => setEditingCertId(cert.id)}>
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: isApproved ? "Xóa chứng chỉ đã duyệt?" : "Xác nhận xóa",
                        content: isApproved
                          ? "Hệ thống sẽ gỡ điểm phiên đã ghi từ chứng chỉ này. Bạn có chắc chắn muốn xóa?"
                          : "Bạn có chắc chắn muốn xóa chứng chỉ này không?",
                        okText: "Xóa",
                        okButtonProps: { danger: true },
                        cancelText: "Hủy",
                        onOk: () => handleDelete(cert.id),
                      })
                    }}
                  >
                    Xóa
                  </Button>
                </Flex>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}

export default ModalDanhSachChungChi
