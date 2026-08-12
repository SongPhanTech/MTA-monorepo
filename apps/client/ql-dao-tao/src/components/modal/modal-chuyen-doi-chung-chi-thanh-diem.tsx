import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import type { StudentSubjectScore } from "@workspace/db/client"
import {
  useCreateManyStudentSubjectScore,
  useFindManyCertificate,
  useFindManyStudent,
  useFindUniqueCertificate,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Modal, message, Row, Typography } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title } = Typography

interface ConvertCertificateInput {
  studentIds: string[]
  studentNames: string[]
  studentCodes?: string[]
}

const ModalChuyenDoiChungChiThanhDiem = () => {
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<ConvertCertificateInput>({
    tag: "ModalChuyenDoiChungChiThanhDiem",
  })

  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null)
  // const [selectedSubjectClassIds, setSelectedSubjectClassIds] = useState<string[]>([])
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  // Lấy danh sách sinh viên
  const { data: students = [] } = useFindManyStudent(
    {
      where: {
        id: {
          in: input?.studentIds || [],
        },
      },
      include: {
        userProfile: true,
      },
    },
    { enabled: !!input?.studentIds && input.studentIds.length > 0 }
  )

  // Lấy danh sách chứng chỉ
  const { data: certificates = [] } = useFindManyCertificate({
    include: {
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  })

  const { data: selectedCertificate } = useFindUniqueCertificate(
    {
      where: {
        id: selectedCertificateId ?? "",
      },
      include: {
        subjects: {
          select: {
            subjectId: true,
            subject: {
              select: {
                subjectVersion: {
                  select: {
                    id: true,
                    name: true,
                  },
                  where: {
                    trainingObjectTypeId,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!selectedCertificateId && !!trainingObjectTypeId,
    }
  )

  const { mutateAsync: createManyStudentSubjectScore } = useCreateManyStudentSubjectScore()

  const handleSubmit = async () => {
    if (!selectedCertificateId) {
      message.warning("Vui lòng chọn chứng chỉ")
      return
    }


    // if (selectedSubjectClassIds.length === 0) {
    //     message.warning('Vui lòng chọn ít nhất một lớp môn học để phiên điểm')
    //     return
    // }

    if (!input?.studentIds || input.studentIds.length === 0) {
      message.warning("Không có học viên nào được chọn")
      return
    }

    try {
      showSpinner()

      // Tạo danh sách bản ghi StudentSubjectScore

      const records: StudentSubjectScore[] = []

      // input.studentIds.forEach((studentId) => {
      //     selectedSubjectClassIds.forEach((subjectClassId) => {
      //         const subjectClass = [].find((sc: any) => sc.id === subjectClassId)

      //         if (subjectClass) {
      //             records.push({
      //                 studentId,
      //                 subjectClassId,
      //                 subjectVersionId: subjectClass.subjectId,
      //                 finalScore: subjectClass.finalScore,
      //                 examScore: subjectClass.finalScore,
      //                 exempted: true, // Được miễn học do chuyển điểm từ chứng chỉ
      //             })
      //         }
      //     })
      // })

      if (records.length === 0) {
        message.warning("Không có bản ghi nào để tạo")
        return
      }

      await createManyStudentSubjectScore({
        data: records,
      })

      message.success(
        `Đã chuyển đổi thành công ${records.length} bản ghi điểm cho ${input.studentIds.length} học viên`
      )

      // Reset state
      setSelectedCertificateId(null)
      // setSelectedSubjectClassIds([])
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

  const handleClose = () => {
    setSelectedCertificateId(null)
    // setSelectedSubjectClassIds([])
    onClose()
  }

  return (
    <Modal
      title="Chuyển đổi chứng chỉ thành điểm môn học"
      open={isOpen}
      onCancel={handleClose}
      onOk={handleSubmit}
      width={1400}
      className="top-1"
      okText="Xác nhận chuyển đổi"
      cancelText="Hủy"
      destroyOnHidden
    >
      <div className="mb-4">
        <Title level={5}>Danh sách học viên được chọn ({students.length})</Title>
        <Table
          rowKey="id"
          dataSource={students}
          pagination={false}
          size="small"
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã SV",
              dataIndex: ["userProfile", "code"],
              width: 120,
              align: "center",
            },
            {
              title: "Họ và tên",
              align: "left",
              render: (_, record: any) =>
                `${record.userProfile?.lastName || ""} ${record.userProfile?.firstName || ""}`.trim(),
            },
            {
              title: "Ngày sinh",
              render: (_, record) =>
                record.userProfile?.dateOfBirth
                  ? dayjs(record.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                  : "",
            },
          ]}
        />
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Title level={5}>1. Chọn chứng chỉ</Title>
          <Table
            rowKey="id"
            data={certificates}
            pagination={false}
            rowSelection={{
              type: "radio" as const,
              selectedRowKeys: selectedCertificateId ? [selectedCertificateId] : [],
              onChange: (selectedKeys: React.Key[]) => {
                setSelectedCertificateId(selectedKeys[0] as string)
                // setSelectedSubjectClassIds([]) // Reset lớp môn học khi đổi chứng chỉ
              },
            }}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Tên chứng chỉ",
                dataIndex: "name",
                align: "left",
              },
              {
                title: "Môn phiên điểm: điểm phiên",
                align: "center",
                width: 250,
                render: (_, record) =>
                  record?.subjects?.map((e: any) => (
                    <p>
                      {e?.subject?.name}: {e?.finalScore} điểm
                    </p>
                  )),
              },
            ]}
          />
        </Col>
      </Row>
    </Modal>
  )
}

export default ModalChuyenDoiChungChiThanhDiem
