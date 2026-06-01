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
  useCalculateStudentSchoolYearResult,
  useExportStudentYearResult,
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
    managementOrganizationId: undefined,
    fixedClassId: undefined,
  })
  const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
    useStudentTrainingTypeOptions()
  const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
  const { showSpinner, hideSpinner } = useSpinner()

  const where = useMemo(() => {
    return {
      deletedAt: null,
      OR: [
        {
          subjectClassStudent: {
            some: { subjectClass: { semesterId } },
          },
        },
        {
          studentYearResult: {
            some: { schoolYear: { semesters: { some: { id: semesterId } } } },
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
              ...(filters.fixedClassId ? { id: filters.fixedClassId } : {}),
              ...(trainingCourseId
                ? {
                    trainingCourse: {
                      id: trainingCourseId,
                    },
                  }
                : {
                    trainingCourse: {
                      trainingObjectTypeId,
                    },
                  }),
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
        studentYearResult: {
          where: { schoolYear: { semesters: { some: { id: semesterId } } } },
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
            unionSecretaryId: true,
            classMonitorId: true,
          },
        },
      },
      orderBy: [
        { fixedClass: { code: "desc" } },
        { userProfile: { firstName: "asc" } },
        { userProfile: { lastName: "asc" } },
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!semesterId || !!trainingObjectTypeId }
  )

  const { data: count } = useCountStudent(
    {
      where: {
        ...where,
        deletedAt: null,
      },
    },
    { enabled: !!semesterId }
  )

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: { name: "asc" },
    where: {
      ...(filters.managementOrganizationId
        ? { managementOrganizationId: filters.managementOrganizationId }
        : {}),
      ...(trainingCourseId ? { trainingCourseId } : {}),
    },
  })

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

  const { mutateAsync: calculateSchoolYearResult } = useCalculateStudentSchoolYearResult()
  const { mutateAsync: exportExcel } = useExportStudentYearResult()

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

    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }

    if (!trainingCourseId) {
      message.warning("Vui lòng chọn khoá")
      return
    }

    try {
      showSpinner()
      const res = await calculateSchoolYearResult({
        params: { semesterId, trainingCourseId: trainingCourseId ?? "" },
      })

      if (res?.status === 400 || res?.status === 500) {
        message.error(res?.data?.message || "Đã xảy ra lỗi khi tổng kết năm học")
        return
      }

      message.success("Tổng kết kết quả năm học thành công, vui lòng chờ hệ thống cập nhật")
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        refetch()
      }, 5000)
      refetch()
    } catch (error) {
      console.error("Lỗi khi tổng kết kết quả năm học:", error)
      message.error("Có lỗi xảy ra khi tổng kết kết quả năm học")
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
      saveAs(res.data, "KET_QUA_HOC_TAP_NAM.xlsx")
    } else {
      message.error(res.data?.message || "Xuất file thất bại")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm px-4">
      <Row>
        <Col span={24} className="mb-4">
          <Row align="top" justify="space-between">
            <Col span={18}>
              <Flex gap={8}>
                <Col span={4}>
                  <SelectTrainingCourseStore allowClear className="w-full" />
                </Col>
                <Col span={8}>
                  <Form.Item className="mb-0" name="fixedClassId">
                    <Select
                      placeholder="Lớp quản lý"
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
              <Flex justify="end" gap={5}>
                <Button type="primary" onClick={handleSummaryClick}>
                  Tổng kết kết quả năm học
                </Button>
                <Button type="primary" onClick={handleExportExcel}>
                  Xuất excel
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
                dataIndex: "fixedClass",
                width: 120,
                align: "center",
                render: (__, record) => (
                  <Tooltip title={record?.fixedClass?.name}>{record?.fixedClass.code}</Tooltip>
                ),
              },

              // {
              //   title: "Năm học thứ...",
              //   dataIndex: ["studentYearResult", "0", "studyYear"],
              //   width: 100,
              //   align: "center",
              // },
              {
                title: "Hệ số xét học bổng",
                dataIndex: ["studentYearResult", "0", "baseScore"],
                width: 100,
                align: "center",
                render: (value) => getAcademicRankingBaseTypeLabel(value),
              },
              {
                title: "Trung bình hệ 4",
                dataIndex: ["studentYearResult", "0", "gpaBase4"],
                width: 90,
                align: "center",
                render: (value) => value?.toString(),
              },
              {
                title: "Tích lỹ hệ 4",
                dataIndex: ["studentYearResult", "0", "cumulativeGpaBase4"],
                width: 90,
                align: "center",
                render: (value) => value?.toString(),
              },
              {
                title: "Trung bình hệ 10",
                dataIndex: ["studentYearResult", "0", "gpaBase10"],
                width: 90,
                align: "center",
                render: (value) => value?.toString(),
              },
              {
                title: "Tích lỹ hệ 10",
                dataIndex: ["studentYearResult", "0", "cumulativeGpaBase10"],
                width: 90,
                align: "center",
                render: (value) => value?.toString(),
              },
              {
                title: "Xếp loại học lực",
                dataIndex: ["studentYearResult", "0", "rank"],
                width: 140,
                align: "center",
                render: (rank?: AcademicRankingConvert) => rank?.classification || "-",
              },
              {
                title: "Điểm rèn luyện",
                dataIndex: ["studentYearResult", "0", "conductScore"],
                width: 120,
                align: "center",
                render: (value) => (
                  <div>{value}</div>
                  // <Tag color={getStudentTrainingTypeColor(value)}>
                  //     {getStudentTrainingTypeLabel(value)}
                  // </Tag>
                ),
              },
              {
                title: "Điểm học phần thấp nhất",
                dataIndex: ["studentYearResult", "0", "lowestFinalScore"],
                width: 120,
                align: "center",
              },
              {
                title: "Điểm tốt nghiệp thấp nhất",
                dataIndex: ["studentYearResult", "0", "lowestGraduationScore"],
                width: 130,
                align: "center",
              },
              {
                title: "Tổng tín chỉ",
                dataIndex: ["studentYearResult", "0", "totalCredits"],
                width: 90,
                align: "center",
              },
              {
                title: "Số TC đăng ký",
                dataIndex: ["studentYearResult", "0", "registeredCredits"],
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
                dataIndex: ["studentYearResult", "0", "passedCredits"],
                width: 60,
                align: "center",
              },
              {
                title: "Số TC không đạt",
                dataIndex: ["studentYearResult", "0", "failedCredits"],
                width: 90,
                align: "center",
              },
              {
                title: "Tổng TC tích lũy",
                dataIndex: ["studentYearResult", "0", "accumulatedCredits"],
                width: 80,
                align: "center",
              },
              {
                title: "Tổng TC học kỳ",
                dataIndex: ["studentYearResult", "0", "totalCreditsByCurriculum"],
                width: 80,
                align: "center",
              },
              {
                title: "Tổng TC nợ",
                dataIndex: ["studentYearResult", "0", "totalFailedCredits"],
                width: 60,
                align: "center",
              },
              {
                title: "Chuẩn ngoại ngữ",
                dataIndex: ["studentYearResult", "0", "foreignLangPass"],
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
                align: "center",
                width: 80,
                render: (_, record) => (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={record?.fixedClass?.classMonitorId === record?.id}
                      disabled
                    />
                  </div>
                ),
              },
              {
                title: "Bí thư",
                align: "center",
                width: 80,
                render: (_, record) => (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={record?.fixedClass?.unionSecretaryId === record?.id}
                      disabled
                    />
                  </div>
                ),
              },
              {
                title: "Điểm thi đầu vào",
                dataIndex: ["studentYearResult", "0", "entryScore"],
                width: 80,
                align: "center",
              },
              {
                title: "Học lại / Cải thiện",
                dataIndex: ["studentYearResult", "0", "isImproving"],
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
                dataIndex: ["studentYearResult", "0", "postponeWithReason"],
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
                dataIndex: ["studentYearResult", "0", "academicWarningLevel"],
                width: 100,
                align: "center",
                render: (value: number) => <Tag color={getWarningLevelColor(value)}>{value}</Tag>,
              },
              {
                title: "Mức cảnh cáo học đường",
                dataIndex: ["studentYearResult", "0", "disciplinaryWarningLevel"],
                width: 120,
                align: "center",
                render: (value: number) => <Tag color={getWarningLevelColor(value)}>{value}</Tag>,
              },
              {
                title: "Đình chỉ học",
                dataIndex: ["studentYearResult", "0", "suspended"],
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
                dataIndex: ["studentYearResult", "0", "expelled"],
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
          />
        </Col>
      </Row>
    </div>
  )
}

export default DiemTrungBinhKyHoc
