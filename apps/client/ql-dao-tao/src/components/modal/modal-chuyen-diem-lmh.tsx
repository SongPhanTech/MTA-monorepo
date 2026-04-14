import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { SubjectVersionType } from "@workspace/db/client"
import {
  useFindManySubjectClass,
  useUpdateStudentSubjectScore,
  useUpdateStudentThesisRegistration,
} from "@workspace/db/hooks"
import { Select } from "@workspace/ui"
import { Button, Col, Flex, Form, message, Row } from "antd"
import dayjs from "dayjs"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface ModalFormType {
  subjectClassId: string
}
const ModalChuyenDiemLopMonHoc = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    allStudentsInClasses: any[]
  }>({ tag: "ModalChuyenDiemLopMonHoc" })
  const [form] = Form.useForm<ModalFormType>()
  const [displayStudents, setDisplayStudents] = useState<any[]>([])
  const { data: subjectClasses } = useFindManySubjectClass({
    where: {
      subject: {
        type: SubjectVersionType.Thesis,
      },
    },
    include: {
      subject: true,
      subjectClassStudent: {
        include: {
          student: {
            include: {
              userProfile: true,
              fixedClass: true,
            },
          },
        },
      },
    },
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateSubjectScore } = useUpdateStudentSubjectScore()
  const { mutateAsync: updateRegistration } = useUpdateStudentThesisRegistration()
  const handleAssignScore = () => {
    const selectedId = form.getFieldValue("subjectClassId")
    const targetClass = subjectClasses?.find((c) => c.id === selectedId)
    const sourceStudents = input?.allStudentsInClasses || []

    if (!targetClass) {
      message.warning("Vui lòng chọn lớp môn học và lấy danh sách trước.")
      return
    }

    const updatedList = targetClass.subjectClassStudent.map((targetScore) => {
      const sourceStudent = sourceStudents.find((s) => s.id === targetScore.studentId)

      const defenseScore =
        sourceStudent?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore

      if (defenseScore !== undefined && defenseScore !== null) {
        return {
          ...targetScore,
          finalScore: defenseScore,
          isUpdated: true,
        }
      }
      return targetScore
    })

    setDisplayStudents(updatedList)
    message.success("Đã gán điểm bảo vệ vào danh sách. Vui lòng nhấn 'Lưu' để cập nhật hệ thống.")
  }
  const columns = [
    {
      title: "Mã sinh viên",
      key: "code",
      width: 80,
      render: (__: any, record: any) => record.student?.code,
    },
    {
      title: "Họ tên",
      width: 120,
      render: (__: any, record: any) => record.student?.userProfile?.fullname,
      key: "fullname",
    },
    {
      title: "Ngày sinh",
      width: 80,
      render: (_: any, record: any) =>
        record.student?.userProfile?.dateOfBirth
          ? dayjs(record.student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
      key: "dob",
    },
    {
      title: "Lớp quản lý",
      width: 120,
      dataIndex: ["student", "fixedClass", "name"],
      key: "fixedClass",
      render: (__: any, record: any) => record.student?.fixedClass?.name,
    },
    {
      title: "Điểm TX ",
      width: 80,
      dataIndex: "finalScore",
      key: "finalScore",
      align: "center" as const,
      render: (__: any, record: any) => record.attendanceScore?.toString() || "",
    },
    {
      title: "Điểm ĐK",
      width: 80,
      dataIndex: "midtermScore",
      key: "midtermScore",
      align: "center" as const,
      render: (__: any, record: any) => record.midtermScore?.toString() || "",
    },
    {
      title: "Điểm thi",
      width: 80,
      dataIndex: "examScore",
      key: "examScore",
      align: "center" as const,
      render: (__: any, record: any) => record.examScore?.toString() || "",
    },
    {
      title: "Điểm HP",
      width: 80,
      dataIndex: "finalScore",
      key: "finalScore",
      align: "center" as const,
      render: (__: any, record: any) => record.finalScore?.toString() || "",
    },
  ]
  const handleFetchStudents = async () => {
    const selectedId = form.getFieldValue("subjectClassId")
    console.log("selectedId", selectedId)
    if (!selectedId) {
      message.warning("Vui lòng chọn một lớp môn học trước khi lấy danh sách.")
      return
    }

    const targetClass = subjectClasses?.find((item) => item.id === selectedId)

    if (targetClass) {
      const studentList = targetClass.subjectClassStudent || []
      setDisplayStudents(studentList)

      if (studentList.length === 0) {
        message.info("Lớp môn học này hiện chưa có sinh viên nào.")
      } else {
        message.success(`Đã tải danh sách ${studentList.length} sinh viên.`)
      }
    } else {
      message.error("Không tìm thấy dữ liệu cho lớp môn học đã chọn.")
    }
  }

  const onOk = async () => {
    try {
      showSpinner()

      const studentsToSave = displayStudents.filter((s) => s.isUpdated)

      const updatePromises = studentsToSave.map(async (item) => {
        await updateSubjectScore({
          data: { finalScore: item.finalScore },
          where: { id: item.id },
        })

        const sourceStudent = input?.allStudentsInClasses.find((s: any) => s.id === item.studentId)
        const registrationId = sourceStudent?.thesisRegistrations?.[0]?.id

        if (registrationId) {
          await updateRegistration({
            data: { studentSubjectScoreId: item.id },
            where: { id: registrationId },
          })
        }
      })

      await Promise.all(updatePromises)
      message.success("Đã cập nhật điểm và liên kết hồ sơ thành công!")
      onClose()
    } catch (error) {
      message.error("Có lỗi xảy ra trong quá trình lưu dữ liệu.")
    } finally {
      hideSpinner()
    }
  }
  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      maskClosable={true}
      onCancel={onClose}
      title="Chuyển điểm sang lớp môn học"
      layout="horizontal"
      className="w-[1100px]"
    >
      <div className="py-4">
        <Row gutter={16} align="middle">
          <Col span={24}>
            <Form.Item
              name="subjectClassId"
              label="Lớp môn học luận văn/đề án"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Select
                className="w-[500px]"
                options={subjectClasses?.map((item) => ({
                  label: `${item.code} - ${item.name}`,
                  value: item.id,
                }))}
                placeholder="Chọn lớp môn học"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Flex gap={12}>
              <Button
                type="primary"
                onClick={async () => {
                  await handleFetchStudents()
                }}
              >
                Lấy danh sách sinh viên
              </Button>

              <Button
                type="primary"
                onClick={async () => {
                  handleAssignScore()
                }}
              >
                Gán điểm sang lớp môn học
              </Button>
            </Flex>
          </Col>
        </Row>

        <div className="mt-6 mx-auto w-full max-w-[1000px]">
          <h3 className="mb-4 font-bold">
            Danh sách sinh viên  trong lớp môn học:
          </h3>
          <div className="overflow-x-auto">
            <Table
              dataSource={displayStudents}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total) => `Tổng cộng ${total} sinh viên`,
                position: ["bottomRight"],
              }}
              bordered
            />
          </div>
        </div>
      </div>
    </PutFormModal>
  )
}

export default ModalChuyenDiemLopMonHoc
