import DatePicker from "@components/commons/date-picker"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useFindUniqueArchivedCertificate, useUpdateStudentSubjectScore } from "@workspace/db/hooks"
import { Button, Modal, message } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type DraftValue = {
  semesterId: dayjs.Dayjs | null
}

type DraftValues = Record<string, DraftValue>

const initializeDrafts = (records: any[]): DraftValues =>
  records.reduce(
    (acc, record) => ({
      ...acc,
      [record.id]: {
        semesterId: record?.semesterId ? dayjs(record.semesterId) : null,
      },
    }),
    {}
  )

const ModalPhienDiemKyHoc = () => {
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<{
    isEditMode?: boolean
    archivedCertificateId: string
  }>({
    tag: "ModalPhienDiemKyHoc",
  })

  const { data } = useFindUniqueArchivedCertificate(
    {
      where: {
        id: input?.archivedCertificateId,
      },
      include: {
        student: {
          include: {
            userProfile: {
              select: {
                fullname: true,
              },
            },
          },
        },
        studentSubjectScore: {
          include: {
            studentSubjectScore: {
              include: {
                subjectVersion: {
                  include: {
                    trainingBlocks: {
                      select: {
                        semester: true,
                      },
                    },
                  },
                },
                semester: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!input?.archivedCertificateId,
    }
  )

  const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()

  const [draftValues, setDraftValues] = useState<DraftValues>({})
  const [displayRecords, setDisplayRecords] = useState<any[]>([])

  const rawRecords = data?.studentSubjectScore?.map((item) => item.studentSubjectScore) ?? []

  useEffect(() => {
    setDisplayRecords(rawRecords)
    setDraftValues(initializeDrafts(rawRecords))
  }, [data])

  const handleChangeDraft = (id: string, key: keyof DraftValue, value: any) => {
    setDraftValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }))
  }

  const handleSave = async (id: string) => {
    const draft = draftValues[id]
    if (!draft) return

    try {
      showSpinner()
      await updateStudentSubjectScore({
        where: { id },
        data: {
          semesterId: draft.semesterId ? draft.semesterId.toISOString() : null,
        },
      })

      setDisplayRecords((prev) =>
        prev.map((record) =>
          record.id === id
            ? { ...record, semesterId: draft.semesterId ? draft.semesterId.toISOString() : null }
            : record
        )
      )
      message.success("Cập nhật kỳ học thành công")
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const renderEditableDate = (record: any, key: keyof DraftValue) => {
    return (
      <DatePicker
        className="w-full"
        value={draftValues?.[record.id]?.[key] || null}
        onChange={(v) => handleChangeDraft(record.id, key, v)}
      />
    )
  }

  return (
    <Modal
      title={`Phiên điểm kỳ học - ${data?.student?.userProfile?.fullname || ""}`}
      open={isOpen}
      onCancel={onClose}
      className="top-2"
      width={700}
      footer={null}
    >
      <Table
        rowKey="id"
        pagination={false}
        dataSource={displayRecords}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          {
            title: "Tên môn học",
            width: 150,
            render: (_, record) => record?.subjectVersion?.name || "",
          },
          {
            title: "Học kỳ dự kiến",
            width: 180,
            align: "center",
            render: (_, record) =>
              record?.subjectVersion?.trainingBlocks?.[0]?.semester ?? "",
          },
          {
            title: "Kỳ học",
            width: 180,
            align: "center",
            render: (_, record) =>
              renderEditableDate(record, "semesterId"),
          },
          {
            title: "Thao tác",
            width: 100,
            align: "center",
            hidden: !input?.isEditMode,
            render: (_: any, record: any) => (
              <Button type="primary" size="small" onClick={() => handleSave(record.id)}>
                Lưu
              </Button>
            ),
          },
        ]}
      />
    </Modal>
  )
}

export default ModalPhienDiemKyHoc
