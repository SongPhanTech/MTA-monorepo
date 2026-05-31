import PutFormModal from "@components/commons/put-modal"
import type { Student } from "@workspace/db"
import { useFindUniqueStudent } from "@workspace/db/hooks"
import { Col, Form, Table } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import TableCollapse from "@components/commons/tableCollapse"
export type Student1 = Student
dayjs.locale("vi")

const ModalLearningResult = () => {
  const [form] = Form.useForm<Student1>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalLearningResult",
    onClose: form.resetFields,
  })

  const { data: learningResult } = useFindUniqueStudent({
    where: { id },
    include: {
      userProfile: true,
      subjectClassStudent: {
        include: {
          subjectVersion: true,
        },
      },
      fixedClass: {
        include: {
          curriculumVersion: {
            include: {
              trainingBlocks: {
                include: {
                  subjects: {
                    include: {
                      subject: {
                        include: {
                          studentSubjectScore: {
                            where: {
                              studentId: id,
                              finalScore: { not: null },
                            },
                            orderBy: {
                              finalScore: "desc",
                            },
                          },
                        },
                      },
                    },
                  },
                  trainingBlock: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const trainingBlocks = learningResult?.fixedClass?.curriculumVersion?.trainingBlocks ?? []

  const subjectsInCurriculumByBlock = trainingBlocks.map((block) => {
    const filteredSubjects = block.subjects
      .filter((s) => s.useForFinalScore !== false)
      .map((s) => ({
        id: s.subject.id,
        code: s.subject.code,
        name: s.subject.name,
        credit: s.subject.credit,
        finalScore: s.subject.studentSubjectScore?.[0]?.finalScore,
        attendanceScore: s.subject.studentSubjectScore?.[0]?.attendanceScore,
        examScore: s.subject.studentSubjectScore?.[0]?.examScore,
        midtermScore: s.subject.studentSubjectScore?.[0]?.midtermScore,
      }))

    return {
      id: block.trainingBlock.id,
      code: block.trainingBlock.code,
      name: block.trainingBlock.name,
      subjectsInCurriculum: filteredSubjects,
    }
  })

  const nonFinalSubjects = trainingBlocks.flatMap((block) =>
    block.subjects
      .filter((s) => s.useForFinalScore === false)
      .map((s) => ({
        id: s.subject.id,
        code: s.subject.code,
        name: s.subject.name,
        credit: s.subject.credit,
        finalScore: s.subject.studentSubjectScore?.[0]?.finalScore,
        attendanceScore: s.subject.studentSubjectScore?.[0]?.attendanceScore,
        examScore: s.subject.studentSubjectScore?.[0]?.examScore,
        midtermScore: s.subject.studentSubjectScore?.[0]?.midtermScore,
      }))
  )

  const subjectIdsInCurriculum = new Set(
    subjectsInCurriculumByBlock.flatMap((block) => block.subjectsInCurriculum.map((s) => s.id))
  )
  const subjectIdsInNonFinal = new Set(nonFinalSubjects.map((s) => s.id))

  const allCurriculumSubjectIds = new Set([...subjectIdsInCurriculum, ...subjectIdsInNonFinal])

  const studentSubjectScores = learningResult?.subjectClassStudent ?? []

  const scoredSubjects = studentSubjectScores.map((score) => ({
    id: score.subjectVersion?.id,
    code: score.subjectVersion?.code,
    name: score.subjectVersion?.name,
    credit: score.subjectVersion?.credit,
    attendanceScore: score.attendanceScore,
    midtermScore: score.midtermScore,
    examScore: score.examScore,
    finalScore: score.finalScore,
  }))

  const electiveSubjects = scoredSubjects.filter(
    (subject) => !allCurriculumSubjectIds.has(subject.id)
  )

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onClose}
      onCancel={onClose}
      maskClosable={true}
      title={`Chi tiết kết quả học tập - ${learningResult?.userProfile.fullname} - ${learningResult?.code} `}
      className="w-[80vw]"
    >
      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          MÔN HỌC CHƯƠNG TRÌNH ĐÀO TẠO
        </div>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          {learningResult?.fixedClass?.curriculumVersion?.name}
        </div>

        <TableCollapse
          rowKey="key"
          id="learning-result"
          headerTitleKey="name"
          defaultExpandAll
          data={subjectsInCurriculumByBlock}
          scroll={{ y: 500 }}
          childrenFieldName="subjectsInCurriculum"
          columns={[
            {
              title: "Mã môn học",
              dataIndex: "code",
              width: 145,
              align: "center",
              fixed: "left",
            },
            {
              title: "Tên môn học",
              dataIndex: "name",
              width: 200,
              fixed: "left",
            },
            {
              title: "Số TC",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thường xuyên",
              dataIndex: "attendanceScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm định kỳ",
              dataIndex: "midtermScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thi",
              dataIndex: "examScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm học phần",
              dataIndex: "finalScore",
              width: 80,
              align: "center",
              render: (record) => record?.toNumber(),
            },
          ]}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      </Col>

      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          MÔN HỌC TỰ CHỌN
        </div>
        <Table
          rowKey="key"
          id="learning-result"
          scroll={{ y: 500 }}
          dataSource={electiveSubjects}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã môn học",
              dataIndex: "code",
              width: 145,
              align: "center",
              fixed: "left",
            },
            {
              title: "Tên môn học",
              dataIndex: "name",
              width: 200,
              fixed: "left",
            },
            {
              title: "Số TC",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thường xuyên",
              dataIndex: "attendanceScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm định kỳ",
              dataIndex: "midtermScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thi",
              dataIndex: "examScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm học phần",
              dataIndex: "finalScore",
              width: 80,
              align: "center",
              render: (record) => record?.toNumber(),
            },
          ]}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      </Col>

      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          MÔN HỌC ĐIỀU KIỆN
        </div>
        <Table
          rowKey="key"
          id="learning-result"
          scroll={{ y: 500 }}
          dataSource={nonFinalSubjects}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã môn học",
              dataIndex: "code",
              width: 145,
              align: "center",
              fixed: "left",
            },
            {
              title: "Tên môn học",
              dataIndex: "name",
              width: 200,
              fixed: "left",
            },
            {
              title: "Số TC",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thường xuyên",
              dataIndex: "attendanceScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm định kỳ",
              dataIndex: "midtermScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm thi",
              dataIndex: "examScore",
              width: 80,
              align: "center",
            },
            {
              title: "Điểm học phần",
              dataIndex: "finalScore",
              width: 80,
              align: "center",
              render: (record) => record?.toNumber(),
            },
          ]}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      </Col>
    </PutFormModal>
  )
}

export default ModalLearningResult
