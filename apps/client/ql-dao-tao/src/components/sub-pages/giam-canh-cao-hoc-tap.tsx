import { Button, Col, Flex, Modal, Row, Tag, Tooltip, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { getWarningLevelColor } from "@hooks/getWarningLevelColor"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type AcademicWarning,
  type Student,
  type StudentSemesterResult,
} from "@workspace/db/client"
import { useCreateAcademicWarning, useFindManyAcademicWarning } from "@workspace/db/hooks"
import { useExportStudentDecreaseAcademicWarningJson } from "@workspace/libs/api/training"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"

dayjs.locale("vi")

interface GiamCanhCaoHocTapProps {
  semesterId: string
  trainingObjectTypeId: string
}

const GiamCanhCaoHocTap = ({ semesterId, trainingObjectTypeId }: GiamCanhCaoHocTapProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: createAcademicWarning } = useCreateAcademicWarning()

  const { data: decreaseStudents = [] } = useExportStudentDecreaseAcademicWarningJson<
    any[] | { data: any[] }
  >(
    { semesterId, trainingObjectTypeId },
    { query: { enabled: !!semesterId && !!trainingObjectTypeId } },
    queryClient
  )

  const { data: academicWarningData, refetch } = useFindManyAcademicWarning({
    where: {
      semesterId,
      student: { fixedClass: { trainingCourse: { trainingObjectTypeId } } },
    },
  })

  const decreaseStudentData = useMemo(() => {
    if (!decreaseStudents) return []
    if (Array.isArray(decreaseStudents)) return decreaseStudents
    if (decreaseStudents.data && Array.isArray(decreaseStudents.data)) return decreaseStudents.data
    return []
  }, [decreaseStudents])

  const filteredDecreaseStudentData = useMemo(() => {
    const studentIdsWithWarnings = new Set(
      (academicWarningData ?? []).map((warning: AcademicWarning) => warning.studentId)
    )
    return decreaseStudentData.map((record) => ({
      ...record,
      students: (record.students || []).filter(
        (s: Student & { decreaseAcademicWarning?: boolean }) =>
          s.decreaseAcademicWarning && !studentIdsWithWarnings.has(s.id)
      ),
    }))
  }, [decreaseStudentData, academicWarningData])

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
    },
    getCheckboxProps: (record: any) => {
      const isHeaderRow = Array.isArray(record.students)
      return { style: isHeaderRow ? { display: "none" } : {} }
    },
  }

  const handleApprovedDecrease = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên để duyệt")
      return
    }

    const selectedRecords =
      filteredDecreaseStudentData?.flatMap((record: any) =>
        (record.students || []).filter((student: any) => selectedRowKeys.includes(student.id))
      ) || []

    Modal.confirm({
      title: "Xác nhận duyệt giảm cảnh cáo",
      content: `Bạn có chắc chắn muốn giảm cảnh cáo cho ${selectedRecords.length} sinh viên đã chọn?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          showSpinner()
          const promises = selectedRecords
            .filter((record: any) => !!record.studentSemesterResult)
            .map((record: any) => {
              const previousLevel = record.previousAcademicWarningLevel ?? 0
              return createAcademicWarning({
                data: {
                  student: { connect: { id: record.id } },
                  semester: { connect: { id: semesterId } },
                  level: Math.max(0, previousLevel - 1),
                  decreasedFrom: previousLevel,
                  description: record.reason,
                },
              })
            })

          await Promise.all(promises)
          await refetch()
          setSelectedRowKeys([])
          message.success("Duyệt giảm cảnh cáo thành công")
        } catch (error) {
          message.error("Đã xảy ra lỗi khi duyệt")
          console.error(error)
        } finally {
          hideSpinner()
        }
      },
    })
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Flex justify="end" gap={8}>
          <Button type="primary" onClick={handleApprovedDecrease}>
            <BookPlus />
            Duyệt
          </Button>
        </Flex>
      </Col>
      <Col span={24} className="mt-4">
        <TableCollapse
          rowKey="courseId"
          headerTitleKey="courseName"
          childrenFieldName="students"
          defaultExpandAll
          data={filteredDecreaseStudentData}
          rowSelection={rowSelection}
          columns={[
            {
              title: "Mã sinh viên",
              dataIndex: ["code"],
              width: 120,
              align: "center",
              render: (_, record) => record?.userProfile?.code ?? "",
            },
            {
              title: "Tên sinh viên",
              width: 200,
              render: (_, record) => record?.userProfile?.fullname ?? "",
            },
            {
              title: "Ngày sinh",
              width: 120,
              align: "center",
              render: (_, record) => {
                const date = record?.userProfile?.dateOfBirth
                return date ? dayjs(date).format("DD/MM/YYYY") : ""
              },
            },
            {
              title: "Lớp",
              width: 60,
              align: "center",
              render: (_, record) => (
                <Tooltip title={record?.fixedClass?.name}>
                  {record?.fixedClass?.code || "-"}
                </Tooltip>
              ),
            },
            {
              title: "Học kỳ",
              dataIndex: ["studentSemesterResult", "semesterIndexInCourse"],
              width: 40,
              align: "center",
            },
            {
              title: "TBHK",
              dataIndex: ["studentSemesterResult"],
              width: 0,
              align: "center",
              render: (result?: StudentSemesterResult) =>
                result?.baseScore === $Enums.AcademicRankingBaseType.Base10
                  ? Number(result.gpaBase10)
                  : Number(result?.gpaBase4 || 0),
            },
            {
              title: "Mức CCHT hiện tại",
              dataIndex: ["previousAcademicWarningLevel"],
              width: 130,
              align: "center",
              render: (value: number) => (
                <Tag color={getWarningLevelColor(value ?? 0)}>{value ?? 0}</Tag>
              ),
            },
            {
              title: "Lý do",
              dataIndex: ["reason"],
              width: 200,
              align: "center",
              render: (value?: string) => value?.split("\n").map((r) => <p>{r}</p>),
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: filteredDecreaseStudentData.reduce(
              (acc: number, course) => acc + (course.students?.length || 0),
              0
            ),
            onChange: (page, pageSize) => {
              if (numberOfPages === pageSize) {
                setCurrentPage(page)
              } else {
                setCurrentPage(1)
                setNumberOfPages(pageSize)
              }
            },
          }}
        />
      </Col>
    </Row>
  )
}

export default GiamCanhCaoHocTap
