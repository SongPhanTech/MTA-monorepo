import { Button, Col, Flex, Modal, Row, Tag, Tooltip, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { getWarningLevelColor } from "@hooks/getWarningLevelColor"
import useSpinner from "@hooks/spinner"
import { $Enums, type AcademicWarning, type StudentSemesterResult } from "@workspace/db/client"
import { useFindManyAcademicWarning } from "@workspace/db/hooks"
import { useSqlTransaction } from "@workspace/libs/api/model"
import { useExportStudentDecreaseAcademicWarningJson } from "@workspace/libs/api/training"
import { normalizeVietnamese } from "@workspace/libs/utils"
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
  const [filters, setFilters] = useState<FilterProps>({ name: "", fixedClass: undefined })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: sqlTransaction } = useSqlTransaction()

  const { data: decreaseStudents = [], isFetching: isLoadingStudents } =
    useExportStudentDecreaseAcademicWarningJson<any[] | { data: any[] }>(
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

  const classOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of decreaseStudentData)
      for (const s of group.students ?? [])
        if (s?.fixedClass?.code) map.set(s.fixedClass.code, s.fixedClass.name ?? s.fixedClass.code)
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [decreaseStudentData])

  const filteredDecreaseStudentData = useMemo(() => {
    const studentIdsWithWarnings = new Set(
      (academicWarningData ?? []).map((warning: AcademicWarning) => warning.studentId)
    )
    const kw = normalizeVietnamese((filters.name ?? "").trim())
    const cls = Array.isArray(filters.fixedClass)
      ? filters.fixedClass
      : filters.fixedClass
        ? [filters.fixedClass]
        : []
    return decreaseStudentData.map((record) => ({
      ...record,
      students: (record.students || []).filter(
        (s: any) =>
          s.decreaseAcademicWarning &&
          !studentIdsWithWarnings.has(s.id) &&
          (!kw || normalizeVietnamese(s?.userProfile?.fullname ?? "").includes(kw)) &&
          (cls.length === 0 || cls.includes(s?.fixedClass?.code))
      ),
    }))
  }, [decreaseStudentData, academicWarningData, filters])

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
          await sqlTransaction({
            data: selectedRecords
              .filter((record: any) => !!record.studentSemesterResult)
              .flatMap((record: any) => {
                const previousLevel = record.previousAcademicWarningLevel ?? 0
                const newLevel = Math.max(0, previousLevel - 1)
                return [
                  {
                    model: "AcademicWarning",
                    operation: "create",
                    data: {
                      data: {
                        studentId: record.id,
                        semesterId,
                        level: newLevel,
                        decreasedFrom: previousLevel,
                        description: record.reason,
                      },
                    },
                  },
                  {
                    model: "Student",
                    operation: "update",
                    data: {
                      where: { id: record.id },
                      data: { academicWarningLevel: newLevel },
                    },
                  },
                  {
                    model: "StudentSemesterResult",
                    operation: "update",
                    data: {
                      where: {
                        studentId_semesterId: { studentId: record.id, semesterId },
                      },
                      data: { academicWarningLevel: newLevel },
                    },
                  },
                ]
              }),
          })
          await refetch()
          setSelectedRowKeys([])
          queryClient.invalidateQueries({
            queryKey: ["zenstack", "AcademicWarning"],
          })
          queryClient.invalidateQueries({
            queryKey: ["zenstack", "Student"],
          })
          queryClient.invalidateQueries({
            queryKey: ["zenstack", "StudentSemesterResult"],
          })
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
          loading={isLoadingStudents}
          rowKey="courseId"
          headerTitleKey="courseName"
          childrenFieldName="students"
          defaultExpandAll
          data={filteredDecreaseStudentData}
          rowSelection={rowSelection}
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
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
              dataIndex: "name",
              type: "input",
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
              dataIndex: "fixedClass",
              type: "select",
              options: classOptions,
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
          pagination={false}
        />
      </Col>
    </Row>
  )
}

export default GiamCanhCaoHocTap
