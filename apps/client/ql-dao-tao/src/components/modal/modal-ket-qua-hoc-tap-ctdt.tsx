import PutFormModal from "@components/commons/put-modal"
import TableCollapse from "@components/commons/tableCollapse"
import { Table, type ColumnsType } from "@components/commons/table"
import type { ColumnType } from "antd/es/table"
import { customTrainingFetch } from "@workspace/libs/api/custom-instance"
import { SubjectRequirementType } from "@workspace/db"
import { useQuery } from "@tanstack/react-query"
import { Col, Form, Tag } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

dayjs.locale("vi")

type TranscriptSubject = {
  id: string
  subjectVersionId: string
  code: string | null
  name: string
  credit: number
  type: string | null
  attendanceScore: number | null
  midtermScore: number | null
  examScore: number | null
  finalScore: number | null
  scoreBase4: number | null
  letter: string | null
  passed: boolean
  usedForGpa: boolean
  equivalentNote: string | null
}

type GraduationTranscript = {
  studentId: string
  fullname: string
  studentCode: string | null
  curriculumVersionName: string | null
  gpaBase10: number
  gpaBase4: number
  totalPassCredit: number
  requiredCredits: number | null
  accumulatedElectiveCredits: number
  electiveCreditsRequired: number
  curriculumBlocks: Array<{
    id: string
    code: string | null
    name: string
    subjectsInCurriculum: TranscriptSubject[]
  }>
  extraCurriculumSubjects: TranscriptSubject[]
  conditionalSubjects: TranscriptSubject[]
}

function formatScore(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return ""
  return Number(value)
}

const subjectColumns: ColumnType<TranscriptSubject>[] = [
  {
    title: "Mã môn học",
    width: 120,
    align: "center",
    render: (_value, record) => record?.code,
  },
  {
    title: "Tên môn học",
    width: 240,
    render: (_value, record) => (
      <div>
        <div>{record?.name}</div>
        {record?.equivalentNote ? (
          <div className="text-xs text-amber-700">{record.equivalentNote}</div>
        ) : null}
        {record?.passed && record?.usedForGpa === false && record?.type ? (
          <div className="text-xs text-gray-500">Không tính GPA</div>
        ) : null}
      </div>
    ),
  },
  {
    title: "Số TC",
    width: 80,
    align: "center",
    render: (_value, record) => record?.credit,
  },
  {
    title: "Điểm thường xuyên",
    width: 140,
    align: "center",
    render: (_value, record) => formatScore(record?.attendanceScore),
  },
  {
    title: "Điểm định kỳ",
    width: 120,
    align: "center",
    render: (_value, record) => formatScore(record?.midtermScore),
  },
  {
    title: "Điểm thi",
    width: 100,
    align: "center",
    render: (_value, record) => formatScore(record?.examScore),
  },
  {
    title: "Điểm học phần",
    width: 120,
    align: "center",
    render: (_value, record) => formatScore(record?.finalScore),
  },
  {
    title: "Loại môn",
    width: 120,
    align: "center",
    render: (_value, record) =>
      record?.type ? (
        <Tag color={record.type === SubjectRequirementType.Mandatory ? "blue" : "green"}>
          {record.type === SubjectRequirementType.Mandatory ? "Bắt buộc" : "Tự chọn"}
        </Tag>
      ) : null,
  },
]

const extraSubjectColumns: ColumnType<TranscriptSubject>[] = [
  {
    title: "TT",
    width: 60,
    align: "center",
    render: (_value, _record, index) => index + 1,
  },
  ...subjectColumns.filter((column) => column.title !== "Loại môn"),
]

const conditionalSubjectColumns: ColumnType<TranscriptSubject>[] = [
  {
    title: "TT",
    width: 60,
    align: "center",
    render: (_value, _record, index) => index + 1,
  },
  ...subjectColumns,
]

function toTableColumns(columns: ColumnType<TranscriptSubject>[]): ColumnsType {
  return columns as ColumnsType
}

const ModalLearningResult = () => {
  const [form] = Form.useForm()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalLearningResult",
    onClose: form.resetFields,
  })

  const {
    data: transcript,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["graduation-student-transcript", id],
    queryFn: async () => {
      if (!id) throw new Error("Thiếu mã sinh viên")
      const res = await customTrainingFetch<{
        status: number
        data: GraduationTranscript | { message?: string }
      }>(`/api/graduation/student-transcript?studentId=${encodeURIComponent(id)}`, {
        method: "GET",
      })
      if (res.status !== 200) {
        const message =
          res.data && "message" in res.data
            ? res.data.message
            : "Không lấy được bảng điểm xét tốt nghiệp"
        throw new Error(message)
      }
      return res.data as GraduationTranscript
    },
    enabled: isOpen && Boolean(id),
    refetchOnWindowFocus: false,
  })

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onClose}
      onCancel={onClose}
      maskClosable={true}
      confirmLoading={isFetching}
      title={`Chi tiết kết quả học tập - ${transcript?.fullname || ""} - ${transcript?.studentCode || ""}`}
      className="w-[80vw]"
    >
      <Col span={24}>
        {isError ? (
          <div className="mb-3 text-center text-red-600">
            {error instanceof Error ? error.message : "Không lấy được bảng điểm xét tốt nghiệp"}
          </div>
        ) : null}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          MÔN HỌC CHƯƠNG TRÌNH ĐÀO TẠO
        </div>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          {transcript?.curriculumVersionName}
        </div>
        {transcript ? (
          <div className="mb-3 flex flex-wrap justify-center gap-4 text-sm">
            <span>
              GPA hệ 10: <b>{transcript.gpaBase10.toFixed(2)}</b>
            </span>
            <span>
              GPA hệ 4: <b>{transcript.gpaBase4.toFixed(2)}</b>
            </span>
            <span>
              Tín chỉ tích lũy:{" "}
              <b>
                {transcript.totalPassCredit}
                {transcript.requiredCredits != null ? `/${transcript.requiredCredits}` : ""}
              </b>
            </span>
            <span>
              TC tự chọn:{" "}
              <b>
                {transcript.accumulatedElectiveCredits}/{transcript.electiveCreditsRequired}
              </b>
            </span>
          </div>
        ) : null}
        <TableCollapse
          rowKey="id"
          id="learning-result"
          headerTitleKey="name"
          defaultExpandAll
          loading={isFetching}
          data={transcript?.curriculumBlocks ?? []}
          scroll={{ y: 500 }}
          childrenFieldName="subjectsInCurriculum"
          columns={subjectColumns as never}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      </Col>

      <Col span={24}>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16, margin: 12 }}>
          MÔN HỌC NGOÀI CTĐT
        </div>
        <Table
          rowKey="id"
          id="learning-result-extra"
          scroll={{ y: 500 }}
          loading={isFetching}
          data={transcript?.extraCurriculumSubjects ?? []}
          columns={toTableColumns(extraSubjectColumns)}
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
          rowKey="id"
          id="learning-result-conditional"
          scroll={{ y: 500 }}
          loading={isFetching}
          data={transcript?.conditionalSubjects ?? []}
          columns={toTableColumns(conditionalSubjectColumns)}
          pagination={{
            hideOnSinglePage: true,
          }}
        />
      </Col>
    </PutFormModal>
  )
}

export default ModalLearningResult
