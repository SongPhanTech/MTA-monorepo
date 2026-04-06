import Table from "@components/commons/table"
// import DeleteIcon from '@components/icons/delete'
// import EditIcon from '@components/icons/edit'
import { useArchivedCertificateStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import { $Enums, ArchivedCertificate } from "@workspace/db/client"
import { useUpdateArchivedCertificate } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
// import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, DatePicker, Flex, InputNumber, Modal, Switch, Tag, message } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

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
  const { can, canSome } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()

  const {
    archivedCertificateStatusOptions,
    getArchivedCertificateStatusStatusLabel,
    getArchivedCertificateStatusColor,
  } = useArchivedCertificateStatusOptions()

  const { isOpen, onClose, input } = useDisclosure<StudentCertificatesInput>({
    tag: "ModalDanhSachChungChi",
  })

  const { onOpen: onOpenEdit } = useDisclosure<string>({
    tag: "PutCertificateArchivedModal",
  })

  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()

  const [showLanguageScoreColumns, setShowLanguageScoreColumns] = useState(false)
  const [displayCertificates, setDisplayCertificates] = useState<any[]>([])
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [draftValues, setDraftValues] = useState<DraftValues>({})

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateArchivedCertificate({
        where: { id },
        data: { status: "CANCEL" },
      })
      message.success("Xóa chứng chỉ thành công")
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const certificates = input?.certificates || []

  useEffect(() => {
    setDisplayCertificates(certificates)
    setDraftValues(initializeDrafts(certificates))
    if (input?.isEditMode && certificates?.length) {
      setEditingCertId(input.certificates[0].id)
    } else {
      setEditingCertId(null)
    }
  }, [certificates, input?.isEditMode])

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

      await updateArchivedCertificate({
        where: { id: certId },
        data: saveData,
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
            dataIndex: "name",
            align: "center",
            render: (__, cert) => cert?.certificate?.name || "",
          },
          {
            title: "Điểm chứng chỉ",
            dataIndex: "score",
            align: "center",
            width: 100,
            render: (score: number, cert: ArchivedCertificate) =>
              cert.status === "APPROVED" ? score : renderEditableNumber(score, cert, "score"),
          },
          {
            title: "Điểm quy đổi",
            dataIndex: "finalScore",
            align: "center",
            width: 140,
            render: (finalScore: number, cert: ArchivedCertificate) =>
              cert.status === "APPROVED"
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
              cert.status === "APPROVED" ? date : renderEditableDate(date, cert, "issuedDate"),
          },
          {
            title: "Ngày hết hạn",
            dataIndex: "expiredDate",
            align: "center",
            width: 150,
            render: (date: string, cert: ArchivedCertificate) =>
              cert.status === "APPROVED" ? date : renderEditableDate(date, cert, "expiredDate"),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            fixed: "right",
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
            hidden: !input?.isEditMode,
            render: (_: any, cert: any) => {
              const isEditing = editingCertId === cert.id

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
          // {
          //     title: 'Thao tác',
          //     width: 150,
          //     align: 'center',
          //     hidden: !canSome(
          //         QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //         'SUA',
          //         'XOA'
          //     ),
          //     render: (_, cert) => {
          //         return (
          //             <Row className="justify-center gap-2">
          //                 {can(
          //                     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //                     'SUA'
          //                 ) &&
          //                     cert.status === 'PENDING' && (
          //                         <EditIcon
          //                             onClick={() => {
          //                                 onOpenEdit(cert.id)
          //                                 // onClose()
          //                             }}
          //                             className="text-sm text-blue-700 cursor-pointer"
          //                         />
          //                     )}
          //                 {can(
          //                     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //                     'XOA'
          //                 ) &&
          //                     cert.status === 'PENDING' && (
          //                         <DeleteIcon
          //                             popConfirm={{
          //                                 onConfirm: () => handleDelete(cert.id),
          //                             }}
          //                         />
          //                     )}
          //             </Row>
          //         )
          //     },
          // },
        ]}
      />
    </Modal>
  )
}

export default ModalDanhSachChungChi
