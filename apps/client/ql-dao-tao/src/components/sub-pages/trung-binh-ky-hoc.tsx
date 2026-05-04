import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE, TRANG_THAI_HOC_VIEN } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useAcademicRankingBaseTypeOptions } from "@hooks/academicRankingBaseType"
import { getWarningLevelColor } from "@hooks/getWarningLevelColor"
import useSpinner from "@hooks/spinner"
import { useStudentTrainingTypeOptions } from "@hooks/studentTrainingType"
import type { AcademicRankingConvert, FixedClass } from "@workspace/db/client"
import { useCountStudent, useFindManyFixedClass, useFindManyStudent } from "@workspace/db/hooks"
import {
  useCalculateStudentSemesterResultJson,
  useExportStudentSemesterResult,
} from "@workspace/libs/api/training"
import {
  Select,
  SelectTrainingCourseStore,
  useSemesterStore,
  useTrainingCourseStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { Button, Checkbox, Col, Flex, Form, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import "dayjs/locale/vi"
import _ from "lodash"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

dayjs.locale("vi")

const DiemTrungBinhKyHoc = () => {
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    trainingCourseId: undefined,
    managementOrganizationId: undefined,
    fixedClassId: undefined,
  })
  const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
    useStudentTrainingTypeOptions()
  const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
  const { showSpinner, hideSpinner } = useSpinner()

  const [sorter, setSorter] = useState<{ field: string | null; order: "asc" | "desc" | null }>({
    field: null,
    order: null,
  })

  const DEFAULT_ORDER_BY = [
    { fixedClass: { code: "desc" as const } },
    { userProfile: { firstName: "asc" as const } },
    { userProfile: { lastName: "asc" as const } },
  ]

  const orderBy = useMemo(() => {
    // Nếu người dùng chọn sort tên
    if (sorter.field === "name" && sorter.order) {
      return [
        { userProfile: { firstName: sorter.order } },
        { userProfile: { lastName: sorter.order } },
        { fixedClass: { code: "desc" as const } },
      ]
    }
    // Mặc định ban đầu
    return DEFAULT_ORDER_BY
  }, [sorter])

  const where = useMemo(() => {
    return {
      deletedAt: null,
      OR: [
        {
          subjectClassStudent: {
            some: {
              subjectClass: {
                semesterId,
              },
            },
          },
        },
        {
          studentSemesterResult: {
            some: { semesterId },
          },
        },
      ],
      ...(filters.code
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name
        ? {
            userProfile: {
              fullname: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(trainingCourseId || filters.fixedClassId || filters.managementOrganizationId
        ? {
            fixedClass: {
              ...(trainingCourseId
                ? { trainingCourseId }
                : trainingObjectTypeId
                  ? { trainingCourse: { trainingObjectTypeId } }
                  : {}),
              ...(filters.fixedClassId ? { id: filters.fixedClassId } : {}),
              ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            },
          }
        : {}),
    }
  }, [filters, semesterId, trainingObjectTypeId, trainingCourseId])

  const { data: dataStudents, refetch } = useFindManyStudent(
    {
      where,
      include: {
        academicWarning: {
          where: { semesterId },
          select: { level: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        disciplinaryWarning: {
          where: { semesterId },
          select: { level: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        studentSemesterResult: {
          where: { semesterId },
          include: { rank: true },
        },
        userProfile: {
          select: {
            fullname: true,
            dateOfBirth: true,
          },
        },
        fixedClass: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: orderBy,
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!semesterId || !!trainingObjectTypeId }
  )

  const { data: count } = useCountStudent({ where }, { enabled: !!semesterId })

  const { data: fixedClassData = [] } = useFindManyFixedClass(
    {
      orderBy: { name: "asc" },
      where: {
        ...(filters.managementOrganizationId
          ? { managementOrganizationId: filters.managementOrganizationId }
          : {}),
        ...(trainingCourseId ? { trainingCourseId } : {}),
      },
    },
    { enabled: !!trainingCourseId }
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { mutateAsync: calculateSemesterResults } = useCalculateStudentSemesterResultJson()
  const { mutateAsync: exportExcel } = useExportStudentSemesterResult()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleSummaryClick = async () => {
    if (!semesterId) {
      message.warning("Vui lòng chọn học kỳ")
      return
    }

    if (!trainingCourseId) {
      message.warning("Vui lòng chọn khoá")
      return
    }

    try {
      showSpinner()
      const res = await calculateSemesterResults({
        params: { semesterId, trainingCourseId: trainingCourseId ?? "" },
      })

      if (res?.status === 400 || res?.status === 500) {
        message.error(res?.data?.message || "Đã xảy ra lỗi khi tổng kết học kỳ")
        return
      }

      message.success("Tổng kết kết quả học kỳ thành công, vui lòng chờ hệ thống cập nhật")

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        refetch()
      }, 5000)
    } catch (error) {
      console.error("Lỗi khi tổng kết kết quả học kỳ:", error)
      message.error("Có lỗi xảy ra khi tổng kết kết quả học kỳ")
    } finally {
      hideSpinner()
    }
  }

  const handleExportExcel = async () => {
    if (!semesterId) {
      message.warning("Vui lòng chọn học kỳ")
      return
    }

    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }

    const res = await exportExcel({
      data: { semesterId, trainingObjectTypeId },
    })

    if (res.status === 200) {
      message.success("Xuất file thành công")
      saveAs(res.data, "KET_QUA_HOC_TAP_HK.xlsx")
    } else {
      message.error(res.data?.message || "Xuất file thất bại")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm px-4">
      <Row>
        <Col span={24} className="mb-4 mt-2">
          <Row align="top" justify="space-between">
            <Col span={18}>
              <Flex gap={8}>
                <Col span={6}>
                  <SelectTrainingCourseStore className="w-full" />
                </Col>
                <Col span={8}>
                  <Form.Item className="mb-0" name="fixedClassId">
                    <Select
                      placeholder="Lớp quản lý"
                      notFoundContent={trainingCourseId ? "Không có dữ liệu" : "Vui lòng chọn khoá"}
                      options={fixedClassData.map((i: FixedClass) => ({
                        value: i.id,
                        label: `${i?.code} - ${i.name}`,
                      }))}
                      onChange={(val) => handleFilterChange("fixedClassId", val)}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Flex>
            </Col>
            <Col span={6}>
              <Flex justify="end" gap={4}>
                <Button type="primary" onClick={handleSummaryClick}>
                  Tổng kết kết quả học kỳ
                </Button>
                <Button type="primary" onClick={handleExportExcel}>
                  Xuất Excel
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            className="m-0"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={dataStudents}
            columns={[
              {
                title: "Mã SV",
                dataIndex: "code",
                width: 120,
                align: "center",
                fixed: "left",
                type: "input",
                render: (__, record) => record?.code,
              },
              {
                title: "Tên sinh viên",
                dataIndex: "name",
                width: 200,
                align: "center",
                fixed: "left",
                type: "input",
                sorter: true,
                showSorterTooltip: {
                  target: "sorter-icon",
                  title: "Nhấp để sắp xếp", // Dòng chữ bạn muốn hiển thị
                },
                render: (__, record) => record?.userProfile?.fullname,
              },
              {
                title: "Ngày sinh",
                width: 150,
                align: "center",
                render: (_, record) =>
                  record?.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },

              {
                title: "Lớp",
                width: 150,
                align: "center",
                render: (__, record) => (
                  <Tooltip title={record?.fixedClass?.name}>{record?.fixedClass?.code}</Tooltip>
                ),
              },
              {
                title: "Năm học thứ...",
                dataIndex: ["studentSemesterResult", "0", "studyYear"],
                width: 100,
                align: "center",
              },
              {
                title: "Học kỳ thứ.../ toàn khoá",
                dataIndex: ["studentSemesterResult", "0", "semesterIndexInCourse"],
                width: 120,
                align: "center",
              },
              {
                title: "Hệ số xét học bổng",
                dataIndex: ["studentSemesterResult", "0", "baseScore"],
                width: 100,
                align: "center",
                render: (value) => getAcademicRankingBaseTypeLabel(value),
              },
              {
                title: "Trung bình hệ 4",
                dataIndex: ["studentSemesterResult", "0", "gpaBase4"],
                width: 90,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              {
                title: "Tích luỹ hệ 4",
                dataIndex: ["studentSemesterResult", "0", "cumulativeGpaBase4"],
                width: 90,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              {
                title: "Trung bình hệ 10",
                dataIndex: ["studentSemesterResult", "0", "gpaBase10"],
                width: 90,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              {
                title: "Tích luỹ hệ 10",
                dataIndex: ["studentSemesterResult", "0", "cumulativeGpaBase10"],
                width: 90,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              {
                title: "Xếp loại học lực",
                dataIndex: ["studentSemesterResult", "0", "rank"],
                width: 140,
                align: "center",
                render: (rank?: AcademicRankingConvert) => rank?.classification || "-",
              },
              {
                title: "Điểm rèn luyện",
                dataIndex: ["studentSemesterResult", "0", "conductScore"],
                width: 120,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              {
                title: "Điểm học phần thấp nhất",
                dataIndex: ["studentSemesterResult", "0", "lowestFinalScore"],
                width: 120,
                align: "center",
                render: (value) =>
                  value !== null && value !== undefined
                    ? Number(value).toFixed(2).replace(".", ",")
                    : "-",
              },
              // {
              //   title: "Điểm tốt nghiệp thấp nhất",
              //   dataIndex: ["studentSemesterResult", "0", "lowestGraduationScore"],
              //   width: 130,
              //   align: "center",
              //   render: (value) =>
              //     value !== null && value !== undefined
              //       ? Number(value).toFixed(2).replace(".", ",")
              //       : "-",
              // },
              {
                title: "Tổng tín chỉ",
                dataIndex: ["studentSemesterResult", "0", "totalCredits"],
                width: 90,
                align: "center",
              },
              {
                title: "Số TC đăng ký",
                dataIndex: ["studentSemesterResult", "0", "registeredCredits"],
                width: 90,
                align: "center",
              },
              {
                title: "Tổng số tín chỉ thi lại",
                dataIndex: ["studentSemesterResult", "0", "reExamCredits"],
                width: 120,
                align: "center",
              },
              {
                title: "Tổng số tín chỉ học lại",
                dataIndex: ["studentSemesterResult", "0", "retakingCredits"],
                width: 120,
                align: "center",
              },
              {
                title: "Số TC đạt",
                dataIndex: ["studentSemesterResult", "0", "passedCredits"],
                width: 60,
                align: "center",
              },
              {
                title: "Số TC không đạt",
                dataIndex: ["studentSemesterResult", "0", "failedCredits"],
                width: 90,
                align: "center",
              },
              {
                title: "Tổng TC tích lũy",
                dataIndex: ["studentSemesterResult", "0", "accumulatedCredits"],
                width: 80,
                align: "center",
              },
              {
                title: "Tổng TC học kỳ",
                dataIndex: ["studentSemesterResult", "0", "totalCreditsByCurriculum"],
                width: 80,
                align: "center",
              },
              {
                title: "Tổng TC nợ",
                dataIndex: ["studentSemesterResult", "0", "totalFailedCredits"],
                width: 60,
                align: "center",
              },
              {
                title: "Chuẩn ngoại ngữ",
                dataIndex: ["studentSemesterResult", "0", "foreignLangPass"],
                align: "center",
                width: 90,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Lớp trưởng",
                dataIndex: ["studentSemesterResult", "0", "isClassMonitor"],
                align: "center",
                width: 80,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Bí thư",
                dataIndex: ["studentSemesterResult", "0", "isUnionLeader"],
                align: "center",
                width: 80,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Điểm thi đầu vào",
                dataIndex: ["studentSemesterResult", "0", "entryScore"],
                width: 80,
                align: "center",
              },
              {
                title: "Học lại / Cải thiện",
                dataIndex: ["studentSemesterResult", "0", "isImproving"],
                align: "center",
                width: 80,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Tạm ngưng có lý do",
                dataIndex: ["studentSemesterResult", "0", "postponeWithReason"],
                align: "center",
                width: 100,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Mức cảnh báo học tập",
                dataIndex: ["academicWarning", "0", "level"],
                width: 100,
                align: "center",
                render: (value: number) => {
                  const level = value ?? 0
                  return <Tag color={getWarningLevelColor(level)}>{level}</Tag>
                },
              },
              {
                title: "Mức cảnh cáo học đường",
                dataIndex: ["disciplinaryWarning", "0", "level"],
                width: 120,
                align: "center",
                render: (value: number) => {
                  const level = value ?? 0
                  return <Tag color={getWarningLevelColor(level)}>{level}</Tag>
                },
              },
              {
                title: "Đình chỉ học",
                dataIndex: ["studentSemesterResult", "0", "suspended"],
                align: "center",
                width: 80,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Đuổi học",
                dataIndex: ["studentSemesterResult", "0", "expelled"],
                align: "center",
                width: 80,
                render: (value) => {
                  return (
                    <div className="flex items-center justify-center">
                      <Checkbox checked={value} disabled />
                    </div>
                  )
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 80,
                fixed: "right",
                render: (value, record: any) => {
                  if (!record?.status) {
                    return <Tag color="error">Không hoạt động</Tag>
                  }

                  const trangThai =
                    TRANG_THAI_HOC_VIEN[record?.status as keyof typeof TRANG_THAI_HOC_VIEN]

                  if (!trangThai) {
                    return <Tag color="default">Không rõ</Tag>
                  }

                  return <Tag color={trangThai.color}>{trangThai.label}</Tag>
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
            onChange={(pagination, filters, sorterInfo: any) => {
              // Xử lý sort
              if (sorterInfo.columnKey === "name" || sorterInfo.field === "name") {
                setSorter({
                  field: "name",
                  order:
                    sorterInfo.order === "ascend"
                      ? "asc"
                      : sorterInfo.order === "descend"
                        ? "desc"
                        : null,
                })
              } else {
                setSorter({ field: null, order: null })
              }
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

export default DiemTrungBinhKyHoc
