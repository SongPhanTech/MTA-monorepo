import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { useStore } from "@tanstack/react-store"
import type { StudentSubjectScore } from "@workspace/db"
import type { ScoreConvert } from "@workspace/db/client"
import {
  useCountStudent,
  useFindFirstTrainingCourseRegulation,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Col, Form, Input, message, Row, Select } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useEffect, useMemo, useState } from "react"
import { dangKyHocChoLopQuanLyStore } from "../.."

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

interface RegisterClassProps {
  hocLai?: boolean
}

export default function CaNhanTrongLopQuanLy({ hocLai }: RegisterClassProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(50)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
    fixedClassId: undefined,
  })
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { subjectClassId, fixedClassesIds } = useStore(dangKyHocChoLopQuanLyStore)

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: {
      code: "asc",
    },
    where: {
      active: true,
      trainingCourseId: filters.trainingCourseId,
      id: {
        in: fixedClassesIds,
      },
    },
  })

  const { data: students = [], refetch } = useFindManyStudent({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              {
                userProfile: {
                  fullname: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              },
              {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        id: filters.fixedClassId
          ? filters.fixedClassId
          : {
              in: fixedClassesIds,
            },
      },
      active: true,
      status: "ENROLLED",
      deletedAt: null,
    },
    include: {
      userProfile: {
        select: {
          fullname: true,
        },
      },
      studentSemesterResult: {
        select: {
          gpaBase10: true,
          cumulativeGpaBase10: true,
          totalFailedCredits: true,
        },
        orderBy: {
          semester: {
            startDate: "desc",
          },
        },
      },
      subjectClassStudent: {
        select: {
          finalScore: true,
        },
        orderBy: {
          finalScore: "desc",
        },
        where: {
          subjectClassId: subjectClassId || undefined,
        },
      },
      fixedClass: {
        select: {
          code: true,
          trainingCourse: {
            select: {
              name: true,
              scoreConverts: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        fixedClass: {
          code: "asc",
        },
      },
      {
        userProfile: {
          firstName: "asc",
        },
      },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: allStudentIds = [] } = useFindManyStudent({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              {
                userProfile: {
                  fullname: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              },
              {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        id: filters.fixedClassId
          ? filters.fixedClassId
          : {
              in: fixedClassesIds,
            },
      },
      active: true,
      status: "ENROLLED",
      deletedAt: null,
    },
    select: {
      id: true,
      studentSemesterResult: {
        select: {
          totalFailedCredits: true,
        },
        orderBy: {
          semester: {
            startDate: "desc",
          },
        },
      },
    },
  })

  const { data: selectedSubjectClass } = useFindUniqueSubjectClass(
    {
      where: {
        id: subjectClassId as string,
      },
      select: {
        id: true,
        subjectId: true,
        subjectClassStudent: {
          select: {
            studentId: true,
          },
        },
        subject: {
          select: {
            type: true,
          },
        },
      },
    },
    { enabled: !!semesterId && !!subjectClassId }
  )

  const { data: tcNoToiThieuLamDoAn } = useFindFirstTrainingCourseRegulation(
    {
      where: {
        code: "TC_NO_TOI_THIEU_LAM_DO_AN",
        trainingCourseId: fixedClassData?.[0]?.trainingCourseId,
      },
    },
    {
      enabled:
        (selectedSubjectClass?.subject?.type === "Project" ||
          selectedSubjectClass?.subject?.type === "Thesis") &&
        !!fixedClassData?.[0]?.trainingCourseId,
    }
  )

  const tcNoToiThieuLamDoAnValue = useMemo(() => {
    if (
      selectedSubjectClass?.subject?.type === "Project" ||
      selectedSubjectClass?.subject?.type === "Thesis"
    ) {
      return tcNoToiThieuLamDoAn?.value
    }
    return Number.POSITIVE_INFINITY
  }, [tcNoToiThieuLamDoAn, selectedSubjectClass])

  const { data: countStudents = 0 } = useCountStudent({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            OR: [
              {
                userProfile: {
                  fullname: {
                    contains: filters.searchText,
                    mode: "insensitive",
                  },
                },
              },
              {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        id: filters.fixedClassId
          ? filters.fixedClassId
          : {
              in: fixedClassesIds,
            },
      },
      active: true,
      status: "ENROLLED",
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  useEffect(() => {
    if (students && selectedSubjectClass) {
      const selectedSubjectClassFixedClassIds = selectedSubjectClass?.subjectClassStudent.map(
        (scs) => scs.studentId
      )
      const selectedKeys = students
        .filter((item) => selectedSubjectClassFixedClassIds?.includes(item.id))
        .map((item) => item.id)
      setSelectedRowKeys(selectedKeys)
      if (!dangKyHocChoLopQuanLyStore.state.studentIds.compare(selectedKeys, (a, b) => a === b)) {
        dangKyHocChoLopQuanLyStore.setState((prev) => ({
          ...prev,
          studentIds: selectedKeys as string[],
        }))
      }
    }
  }, [students, selectedSubjectClass])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleRowSelection = (ids: Key[]) => {
    setSelectedRowKeys(ids)
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const handleSaveDangKyHoc = async () => {
    if (!subjectClassId) {
      message.warning("Chưa chọn lớp môn học")
      return
    }
    try {
      showSpinner()
      const scoreRes = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "findMany",
          data: {
            where: {
              subjectClassId,
              OR: [
                { attendanceScore: { not: null } },
                { midtermScore: { not: null } },
                { examScore: { not: null } },
              ],
            },
          },
        },
      ])

      const studentSubjectScores = scoreRes.data[0] as StudentSubjectScore[]
      const studentIds = studentSubjectScores.map((s) => s.id)

      for (const studentId of studentIds) {
        if (!selectedRowKeys.includes(studentId)) {
          message.error("Không thể huỷ đăng ký SV đã có điểm, vui lòng thử lại")
          return
        }
      }

      const res = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              subjectClassId,
              attendanceScore: { not: null },
              midtermScore: { not: null },
              examScore: { not: null },
            },
          },
        },
        {
          model: "StudentSubjectScore",
          operation: "createMany",
          data: {
            data: selectedRowKeys.map((studentId) => ({
              subjectClassId: selectedSubjectClass?.id,
              studentId,
              subjectVersionId: selectedSubjectClass?.subjectId,
            })),
            skipDuplicates: true,
          },
        },
      ])
      if (res.status !== 200) throw new Error("Transaction failed")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "SubjectClass"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "FixedClass"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Student"],
      })
      message.success("Lưu danh sách đăng ký học thành công")
    } catch (error) {
      console.error(error)
      message.error("Lưu danh sách đăng ký học thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[4, 0]}>
      <Col span={24}>
        <h3 className="text-lg">Danh sách học viên</h3>
      </Col>

      <Col span={8}>
        <Form.Item className="mb-1" name="searchText">
          <Input
            id="search"
            placeholder="Tìm kiếm HV/SV..."
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            style={{ height: 32 }}
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Select
          placeholder="Chọn lớp"
          className="w-full"
          dropdownStyle={{
            width: "400px",
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={fixedClassData.map((i) => ({
            value: i.id,
            label: `${i.code} - ${i.name}`,
          }))}
          onChange={(value) => handleFilterChange("fixedClassId", value)}
        />
      </Col>
      <Col span={8} className="text-right">
        <Button
          type="primary"
          onClick={handleSaveDangKyHoc}
          disabled={!subjectClassId || fixedClassesIds.length === 0}
        >
          Lưu danh sách ĐKH
        </Button>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          scrollable
          maxHeight={"calc(100vh - 380px)"}
          data={students}
          onRow={(record) => ({
            onClick: () => {
              if (
                !!tcNoToiThieuLamDoAnValue &&
                record?.studentSemesterResult?.[0]?.totalFailedCredits >= tcNoToiThieuLamDoAnValue
              ) {
                return
              }
              if (!selectedRowKeys.includes(record.id)) {
                handleRowSelection([...selectedRowKeys, record.id])
              } else {
                handleRowSelection(selectedRowKeys.filter((key) => key !== record.id))
              }
            },
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: (selectedKeys, _, { type }) => {
              if (type === "all") {
                if (selectedRowKeys.length > 0) {
                  handleRowSelection([])
                } else {
                  handleRowSelection(allStudentIds.map((i) => i.id))
                }
              } else handleRowSelection(selectedKeys)
            },
            type: "checkbox",
            getCheckboxProps: (record) => ({
              disabled:
                !!tcNoToiThieuLamDoAnValue &&
                record?.studentSemesterResult?.[0]?.totalFailedCredits >= tcNoToiThieuLamDoAnValue,
            }),
            columnWidth: 35,
          }}
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã",
              dataIndex: "code",
              align: "center",
              width: 100,
            },
            {
              title: "Tên",
              align: "center",
              width: 200,
              render: (_, record) => <p className="text-left">{record?.userProfile?.fullname}</p>,
            },
            {
              title: "Lớp",
              align: "center",
              width: 80,
              render: (_, record) => <p>{record?.fixedClass?.code}</p>,
            },
            {
              title: "Khoá",
              align: "center",
              width: 80,
              // dataIndex: ['fixedClass', 'trainingCourse', 'name'],
              render: (_, record) => <p>{record?.fixedClass?.trainingCourse?.name}</p>,
            },
            {
              title: "GPA",
              align: "center",
              // dataIndex: ['studentSemesterResult', 0, 'cumulativeGpaBase10'],
              width: 50,
              render: (_, record) =>
                record?.studentSemesterResult.length > 0 ? (
                  <span>
                    {Number(record.studentSemesterResult[0]?.cumulativeGpaBase10).toFixedSmart(2)}
                  </span>
                ) : (
                  <span>-</span>
                ),
              // render: (text) => (text ? Number(text).toFixedSmart(2) : '-'),
            },
            {
              title: "TC nợ",
              align: "center",
              // dataIndex: ['studentSemesterResult', 0, 'cumulativeGpaBase10'],
              width: 60,
              render: (_, record) =>
                record?.studentSemesterResult.length > 0 ? (
                  <span>
                    {Number(record.studentSemesterResult[0]?.totalFailedCredits).toFixedSmart(2)}
                  </span>
                ) : (
                  <span>-</span>
                ),
              // render: (text) => (text ? Number(text).toFixedSmart(2) : '-'),
            },
            {
              title: "Điểm",
              align: "center",
              width: 50,
              // dataIndex: ['subjectClassStudent', 0, 'finalScore'],
              // render: (text) => (text ? Number(text).toFixedSmart(2) : '-'),
              render: (_, record) =>
                record?.subjectClassStudent.length > 0 ? (
                  <span>{Number(record.subjectClassStudent[0]?.finalScore).toFixedSmart(2)}</span>
                ) : (
                  <span>-</span>
                ),
            },
            {
              title: "Cải thiện",
              align: "center",
              width: 50,
              render: (_, record) => (
                <Checkbox
                  checked={
                    record?.subjectClassStudent.length > 0 &&
                    record?.subjectClassStudent[0]?.finalScore !== null
                      ? record?.fixedClass?.trainingCourse?.scoreConverts?.some(
                          (sc: ScoreConvert) =>
                            sc?.base10Min <= record.subjectClassStudent[0]?.finalScore &&
                            record.subjectClassStudent[0]?.finalScore <= sc?.base10Max &&
                            sc?.improvementRegister
                        )
                      : false
                  }
                />
              ),
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countStudents,
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
