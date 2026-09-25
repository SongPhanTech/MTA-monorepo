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
  subjectClassIds: string[]
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
    const selectedIds: string[] = form.getFieldValue("subjectClassIds") || []
    const sourceStudents = input?.allStudentsInClasses || []

    if (!selectedIds.length) {
      message.warning("Vui lòng chọn ít nhất một lớp môn học và lấy danh sách trước.")
      return
    }

    const allUpdated: any[] = []
    for (const selectedId of selectedIds) {
      const targetClass = subjectClasses?.find((c) => c.id === selectedId)
      if (!targetClass) {
        continue
      }
      const classLabel = `${targetClass.code} - ${targetClass.name}`
      const updatedList = (targetClass.subjectClassStudent || []).map((targetScore) => {
        const sourceStudent = sourceStudents.find((s) => s.id === targetScore.studentId)

        const defenseScore =
          sourceStudent?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore

        if (defenseScore !== undefined && defenseScore !== null) {
          return {
            ...targetScore,
            _subjectClassLabel: classLabel,
            attendanceScore: defenseScore,
            midtermScore: defenseScore,
            examScore: defenseScore,
            finalScore: defenseScore,
            manualFinalScore: defenseScore,
            isUpdated: true,
          }
        }
        return { ...targetScore, _subjectClassLabel: classLabel }
      })
      allUpdated.push(...updatedList)
    }

    if (allUpdated.length === 0) {
      message.warning("Không có dữ liệu lớp môn học để gán điểm.")
      return
    }

    setDisplayStudents(allUpdated)
    message.success("Đã gán điểm bảo vệ vào danh sách. Vui lòng nhấn 'Lưu' để cập nhật hệ thống.")
  }
  const columns = [
    {
      title: "Lớp môn học",
      width: 200,
      key: "subjectClassLabel",
      ellipsis: true,
      render: (__: any, record: any) => record._subjectClassLabel ?? "",
    },
    {
      title: "Mã sinh viên",
      key: "code",
      width: 80,
      render: (__: any, record: any) => record.student?.userProfile?.code,
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
    const selectedIds: string[] = form.getFieldValue("subjectClassIds") || []
    if (!selectedIds.length) {
      message.warning("Vui lòng chọn ít nhất một lớp môn học trước khi lấy danh sách.")
      return
    }

    const studentList = selectedIds.flatMap((id) => {
      const targetClass = subjectClasses?.find((item) => item.id === id)
      if (!targetClass) {
        return []
      }
      const classLabel = `${targetClass.code} - ${targetClass.name}`
      return (targetClass.subjectClassStudent || []).map((row) => ({
        ...row,
        _subjectClassLabel: classLabel,
      }))
    })

    setDisplayStudents(studentList)

    if (studentList.length === 0) {
      message.info("Các lớp môn học đã chọn hiện chưa có sinh viên nào.")
    } else {
      message.success(
        `Đã tải danh sách ${studentList.length} bản ghi điểm (có thể trùng sinh viên giữa các lớp).`
      )
    }
  }

  const onOk = async () => {
    try {
      showSpinner()

      const studentsToSave = displayStudents.filter((s) => s.isUpdated)

      const updatePromises = studentsToSave.map(async (item) => {
        await updateSubjectScore({
          data: {
            finalScore: item.finalScore,
            attendanceScore: item.attendanceScore,
            midtermScore: item.midtermScore,
            examScore: item.examScore,
            // manualFinalScore: item.manualFinalScore,
          },
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
              name="subjectClassIds"
              initialValue={[]}
              label="Lớp môn học luận văn/đề án"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              rules={[
                {
                  validator: async (_, value: string[]) => {
                    if (!value?.length) {
                      return Promise.reject(new Error("Vui lòng chọn ít nhất một lớp môn học."))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                className="w-full max-w-[700px]"
                maxTagCount="responsive"
                optionFilterProp="label"
                options={subjectClasses?.map((item) => ({
                  label: `${item.code} - ${item.name}`,
                  value: item.id,
                }))}
                placeholder="Chọn một hoặc nhiều lớp môn học"
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
          <h3 className="mb-4 font-bold">Danh sách sinh viên trong lớp môn học:</h3>
          <div className="overflow-x-auto">
            <Table
              dataSource={displayStudents}
              columns={columns}
              rowKey="id"
              // pagination={{
              //   pageSize: 10,
              //   showSizeChanger: true,
              //   showTotal: (total) => `Tổng cộng ${total} sinh viên`,
              //   position: ["bottomRight"],
              // }}
              bordered
            />
          </div>
        </div>
      </div>
    </PutFormModal>
  )
}

export default ModalChuyenDiemLopMonHoc
