import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useFindUniqueArchivedCertificate, useUpdateStudentSubjectScore } from "@workspace/db/hooks"
import { Button, SelectSemester } from "@workspace/ui"
import { Form, message, Modal } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ModalPhienDiemKyHoc = () => {
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()

  const [form] = Form.useForm<Record<string, { semesterId: string }>>()

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

  const tableData = data?.studentSubjectScore?.map((item) => item.studentSubjectScore) ?? []

  useEffect(() => {
    if (tableData.length === 0) return
    const initialValues = tableData.reduce(
      (acc, record) => {
        if (record?.semesterId) {
          acc[record.id] = { semesterId: record.semesterId }
        }
        return acc
      },
      {} as Record<string, { semesterId: string }>
    )
    form.setFieldsValue(initialValues)
  }, [data])

  const handleConfirm = async () => {
    const formValues = form.getFieldsValue()
    try {
      showSpinner()
      await Promise.all(
        Object.entries(formValues)
          .filter(([, value]) => !!value?.semesterId)
          .map(([studentSubjectScoreId, value]) =>
            updateStudentSubjectScore({
              where: { id: studentSubjectScoreId },
              data: { semesterId: value.semesterId },
            })
          )
      )
      message.success("Lưu phiên điểm thành công")
      onClose()
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      title={`Phiên điểm kỳ học - ${data?.student?.userProfile?.fullname || ""}`}
      open={isOpen}
      onCancel={onClose}
      className="top-2"
      width={700}
      footer={[
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          Lưu
        </Button>,
      ]}
    >
      <Form form={form}>
        <Table
          rowKey="id"
          pagination={false}
          data={tableData}
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
              render: (_, record) => record?.subjectVersion?.trainingBlocks?.[0]?.semester ?? "",
            },
            {
              title: "Kỳ học",
              width: 180,
              align: "center",
              render: (_, record) => {
                return (
                  <Form.Item className="m-0" name={[record.id, "semesterId"]}>
                    <SelectSemester />
                  </Form.Item>
                )
              },
            },
          ]}
        />
      </Form>
    </Modal>
  )
}

export default ModalPhienDiemKyHoc
