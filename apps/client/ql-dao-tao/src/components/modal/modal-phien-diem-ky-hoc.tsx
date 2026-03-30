import Table from "@components/commons/table"
import { useFindUniqueArchivedCertificate } from "@workspace/db/hooks"
import { Modal } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ModalPhienDiemKyHoc = () => {
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
        studentSubjectScore: {
          include: {
            studentSubjectScore: {
              include: {
                subjectVersion: true,
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

  return (
    <Modal
      title="Phiên điểm kỳ học"
      open={isOpen}
      onCancel={onClose}
      className="top-2"
      width={700}
      footer={null}
    >
      <Table
        rowKey="id"
        pagination={false}
        dataSource={tableData}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          {
            title: "Tên môn học",
            render: (_, record: any) => record?.subjectVersion?.name || "-",
          },
          {
            title: "Học kỳ dự kiến",
            width: 180,
            align: "center",
            render: (_, record: any) => record?.semester?.name || "-",
          },
        ]}
      />
    </Modal>
  )
}

export default ModalPhienDiemKyHoc
