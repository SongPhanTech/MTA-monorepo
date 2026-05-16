import { DownloadOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Modal, Row, Tooltip, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type AcademicWarning,
  type Student,
  type StudentSemesterResult,
} from "@workspace/db/client"
import { useCreateAcademicWarning, useFindManyAcademicWarning } from "@workspace/db/hooks"
import {
  exportStudentAcademicWarningExcel,
  useExportStudentAcademicWarningJson,
} from "@workspace/libs/api/training"
import { saveAs } from "file-saver"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useSqlTransaction } from "@workspace/libs/api/model"

dayjs.locale("vi")

interface NangCanhCaoHocTapProps {
  semesterId: string
  trainingObjectTypeId: string
}

const NangCanhCaoHocTap = ({ semesterId, trainingObjectTypeId }: NangCanhCaoHocTapProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: sqlTransaction } = useSqlTransaction()

  const { data: students = [] } = useExportStudentAcademicWarningJson<any[] | { data: any[] }>(
    { semesterId, trainingObjectTypeId },
    { query: { enabled: !!semesterId && !!trainingObjectTypeId } },
    queryClient
  )

  const studentData = useMemo(() => {
    if (!students) return []
    if (Array.isArray(students)) return students
    if (students.data && Array.isArray(students.data)) return students.data
    return []
  }, [students])

  const { data: academicWarningData, refetch } = useFindManyAcademicWarning({
    where: { semesterId },
  })

  const filteredStudentData = useMemo(() => {
    if (!academicWarningData) return studentData
    const studentIdsWithWarnings = new Set(
      academicWarningData.map((warning: AcademicWarning) => warning.studentId)
    )
    return studentData.map((record) => ({
      ...record,
      students: (record.students || []).filter(
        (student: Student) => !studentIdsWithWarnings.has(student.id)
      ),
    }))
  }, [studentData, academicWarningData])

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

  const handleApproved = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên để duyệt")
      return
    }

    const selectedRecords =
      filteredStudentData?.flatMap((record) =>
        (record.students || []).filter((student: Student) => selectedRowKeys.includes(student.id))
      ) || []

    Modal.confirm({
      title: "Xác nhận duyệt",
      content: `Bạn có chắc chắn muốn chấp nhận ${selectedRecords.length} sinh viên đã chọn?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          showSpinner()
          await sqlTransaction({
            data: selectedRecords.flatMap((record: any) => {
              const currentLevel = record.studentSemesterResult.academicWarningLevel ?? 0
              const severity =
                record.academicWarningRule?.length > 0
                  ? Math.max(...record.academicWarningRule.map((r: any) => r.severity))
                  : 1

              return [
                {
                  model: "AcademicWarning",
                  operation: "create",
                  data: {
                    data: {
                      studentId: record.id,
                      semesterId: semesterId,
                      level: currentLevel + severity,
                      increasedFrom: currentLevel,
                      description: record.reason,
                    },
                  },
                },
                {
                  model: "Student",
                  operation: "update",
                  data: {
                    where: { id: record.id },
                    data: { academicWarningLevel: currentLevel + severity },
                  },
                },
              ]
            }),
          })

          await refetch()
          setSelectedRowKeys([])
          queryClient.invalidateQueries({
            queryKey: ["AcademicWarning"],
          })
          message.success("Duyệt thành công")
        } catch (error) {
          message.error("Đã xảy ra lỗi khi duyệt")
          console.error(error)
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const handleExportExcel = async () => {
    try {
      showSpinner()
      const res = await exportStudentAcademicWarningExcel({ semesterId, trainingObjectTypeId })
      if (res.status === 200) {
        saveAs(res.data, "Danh_sach_canh_cao_hoc_tap.xlsx")
        message.success("Xuất Excel thành công")
      } else {
        message.error("Đã xảy ra lỗi khi xuất Excel")
      }
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error)
      message.error("Đã xảy ra lỗi khi xuất Excel")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Flex justify="end" gap={8}>
          <Button type="primary" onClick={handleExportExcel}>
            <DownloadOutlined />
            Xuất Excel
          </Button>
          <Button type="primary" onClick={handleApproved}>
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
          data={filteredStudentData}
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
              dataIndex: ["userProfile", "fullname"],
              width: 200,
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
            total: filteredStudentData.reduce(
              (acc, course) => acc + (course.students?.length || 0),
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

export default NangCanhCaoHocTap
