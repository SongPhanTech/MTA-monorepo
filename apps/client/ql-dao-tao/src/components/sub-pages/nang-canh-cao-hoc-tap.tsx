import { DownloadOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Modal, Row, Tooltip, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type AcademicWarning,
  type Student,
  type StudentSemesterResult,
} from "@workspace/db/client"
import { useFindManyAcademicWarning, useFindUniqueSemester } from "@workspace/db/hooks"
import {
  exportStudentAcademicWarningExcel,
  useExportStudentAcademicWarningJson,
} from "@workspace/libs/api/training"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { saveAs } from "file-saver"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useSqlTransaction } from "@workspace/libs/api/model"
import { docxTemplate } from "../../../src/utils/docx-template"
import { Download } from "lucide-react"

dayjs.locale("vi")
interface NangCanhCaoHocTapProps {
  semesterId: string
  trainingObjectTypeId: string
}

const NangCanhCaoHocTap = ({ semesterId, trainingObjectTypeId }: NangCanhCaoHocTapProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterProps>({ name: "", fixedClass: undefined })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: sqlTransaction } = useSqlTransaction()

  const { data: students = [], isFetching: isLoadingStudents } =
    useExportStudentAcademicWarningJson<any[] | { data: any[] }>(
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

  const classOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of studentData)
      for (const s of group.students ?? [])
        if (s?.fixedClass?.code) map.set(s.fixedClass.code, s.fixedClass.name ?? s.fixedClass.code)
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [studentData])

  const filteredStudentData = useMemo(() => {
    const studentIdsWithWarnings = new Set(
      (academicWarningData ?? []).map((warning: AcademicWarning) => warning.studentId)
    )
    const kw = normalizeVietnamese((filters.name ?? "").trim())
    const cls = Array.isArray(filters.fixedClass)
      ? filters.fixedClass
      : filters.fixedClass
        ? [filters.fixedClass]
        : []
    return studentData.map((record) => ({
      ...record,
      students: (record.students || []).filter(
        (student: any) =>
          !studentIdsWithWarnings.has(student.id) &&
          (!kw || normalizeVietnamese(student?.userProfile?.fullname ?? "").includes(kw)) &&
          (cls.length === 0 || cls.includes(student?.fixedClass?.code))
      ),
    }))
  }, [studentData, academicWarningData, filters])

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
  const { data: currentSemester } = useFindUniqueSemester(
    { where: { id: semesterId } },
    { enabled: !!semesterId }
  )
  const handleExportPhuLucIII = async () => {
    if (!filteredStudentData || filteredStudentData.length === 0) {
      message.warning("Không có dữ liệu để xuất")
      return
    }

    try {
      showSpinner()

      let globalIndex = 0
      const list = filteredStudentData.flatMap((course: any) =>
        (course.students || []).map((record: any) => {
          const result = record.studentSemesterResult
          const currentLevel = result?.academicWarningLevel ?? 0
          const severity =
            record.academicWarningRule?.length > 0
              ? Math.max(...record.academicWarningRule.map((r: any) => r.severity))
              : 1

          return {
            index: ++globalIndex,
            fullname: record.userProfile?.fullname || "",
            className: record.fixedClass?.name || "",
            gpaHK: Number(result?.gpaBase10),
            gpaTL: Number(result?.cumulativeGpaBase10),
            debtHK: result?.failedCredits ?? 0,
            debtTL: result?.totalFailedCredits ?? 0,
            oldLevel: currentLevel,
            newLevel: currentLevel + severity,
            reason: record.reason || "",
          }
        })
      )

      const mappedData = {
        totalCount: globalIndex,
        semesterInfo: currentSemester?.name || "",
        list,
      }

      const exportRes = await docxTemplate({
        fileName: "Phu_luc_III_CBHT.docx",
        path: "Phu_luc_III_CBHT.docx",
        prefix: "/mta/template",
        data: mappedData as Record<string, unknown>,
      })

      if (exportRes && exportRes.status >= 200 && exportRes.status < 300) {
        saveAs(exportRes.data, "Phu_luc_III_CBHT.docx")
      } else {
        message.error(`Xuất file thất bại: Status ${exportRes?.status}`)
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      message.error(`Lỗi xuất file: ${msg}`)
    } finally {
      hideSpinner()
    }
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
            queryKey: ["zenstack", "AcademicWarning"],
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
          <Button type="primary" onClick={handleExportPhuLucIII}>
            <Download />
            Tải Phụ lục III
          </Button>
          <Button type="primary" onClick={handleApproved}>
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
          data={filteredStudentData}
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

export default NangCanhCaoHocTap
