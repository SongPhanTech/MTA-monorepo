import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useStore } from "@tanstack/react-store"
import type { Prisma } from "@workspace/db/client"
import {
  useDeleteStudentSubjectScore,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { diffArrays } from "@workspace/libs"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useOpenSubjectClassReExamStudents } from "@workspace/libs/api/training"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Col, Flex, Form, Input, message, Row, Select, Tooltip } from "antd"
import _ from "lodash"
import { CircleX, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { dangKyThiLaiStore } from "../.."

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

export default function CaNhanThiLai() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
    fixedClassId: undefined,
  })

  const { subjectClassId, studentIds = [] } = useStore(dangKyThiLaiStore)
  const { mutateAsync: deleteStudentSubjectScore } = useDeleteStudentSubjectScore()
  const { data: subjectClassData } = useFindUniqueSubjectClass(
    {
      where: {
        id: subjectClassId,
      },
      select: {
        subjectId: true,
        subjectClassStudent: {
          where: {
            deletedAt: null,
          },
          select: {
            studentId: true,
          },
        },
      },
    },
    {
      enabled: !!subjectClassId,
    }
  )

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    where: {
      active: true,
      trainingObjectTypeId,
    },
  })

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: { code: "asc" },
    where: {
      active: true,
      trainingCourseId: filters.trainingCourseId,
    },
  })

  const { data: res, refetch } = useOpenSubjectClassReExamStudents(
    {
      search: filters.searchText || undefined,
      trainingObjectTypeId: trainingObjectTypeId || "",
      trainingCourseId: filters.trainingCourseId,
      fixedClassId: filters.fixedClassId,
      subjectVersionId: subjectClassData?.subjectId || "",
      page: currentPage,
      pageSize: numberOfPages,
    },
    {
      query: {
        enabled: !!trainingObjectTypeId && !!subjectClassData?.subjectId,
      },
    }
  )

  const { data: studentList = [] } = useFindManyStudent(
    {
      where: {
        deletedAt: null,
        subjectClassStudent: {
          some: {
            subjectClassId,
          },
        },
        ...(filters.searchText && {
          userProfile: {
            fullname: { contains: filters.searchText, mode: "insensitive" },
          },
        }),
        ...((filters.trainingCourseId || filters.fixedClassId) && {
          fixedClass: {
            ...(filters.trainingCourseId && {
              trainingCourseId: {
                equals: filters.trainingCourseId,
              },
            }),
            ...(filters.fixedClassId && {
              id: {
                equals: filters.fixedClassId,
              },
            }),
          },
        }),
      },
      include: {
        fixedClass: {
          include: {
            trainingCourse: true,
          },
        },
        subjectClassStudent: true,
        userProfile: true,
      },
    },
    {
      enabled: !!subjectClassId,
    }
  )

  // queryKey /api/subject-class/open-subject-class-reexam

  const handleSaveStudentClass = async () => {
    try {
      if (!subjectClassData) return

      // Lấy danh sách students hiện có trong database
      const existingStudents = subjectClassData.subjectClassStudent.map((s) => ({
        studentId: s.studentId,
      }))

      // Chuyển studentIds được chọn thành format tương tự
      const selectedStudents = studentIds.map((id) => ({ studentId: id }))

      // So sánh để tìm sự khác biệt
      const { onlyInA, onlyInB } = diffArrays(existingStudents, selectedStudents, "studentId")

      // onlyInA: Students cần XÓA (có trong DB nhưng không được chọn)
      const idsToDelete = onlyInA.map((s: { studentId: string }) => s.studentId)

      // onlyInB: Students MỚI cần THÊM (được chọn nhưng chưa có trong DB)
      const idsToCreate = onlyInB.map((s: { studentId: string }) => s.studentId)

      // Nếu không có thay đổi, không cần làm gì
      if (idsToDelete.length === 0 && idsToCreate.length === 0) {
        message.info("Không có thay đổi nào để lưu!")
        return
      }

      // Query để lấy attendanceScore và midtermScore cho students mới
      let studentsData: Prisma.StudentGetPayload<{
        select: {
          id: true
          subjectClassStudent: true
        }
      }>[] = []

      if (idsToCreate.length > 0) {
        const studentsRes = await sqlTransaction([
          {
            model: "Student",
            operation: "findMany",
            data: {
              where: {
                id: { in: idsToCreate },
                subjectClassStudent: {
                  some: {
                    subjectVersionId: subjectClassData.subjectId,
                  },
                },
              },
              select: {
                id: true,
                subjectClassStudent: {
                  where: {
                    subjectVersionId: subjectClassData.subjectId,
                    attendanceScore: {
                      not: null,
                    },
                    midtermScore: {
                      not: null,
                    },
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
        ])

        if (studentsRes.status !== 200) {
          throw new Error("Có lỗi xảy ra khi kiểm tra điều kiện đăng ký thi lại!")
        }

        studentsData = studentsRes.data[0] as Prisma.StudentGetPayload<{
          select: {
            id: true
            subjectClassStudent: true
          }
        }>[]
      }

      // Tạo transaction operations
      const operations: any[] = []

      // Thêm operation xóa nếu có ids cần xóa
      if (idsToDelete.length > 0) {
        operations.push({
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              subjectClassId,
              studentId: {
                in: idsToDelete,
              },
            },
          },
        })
      }

      // Thêm operations tạo mới CHỈ cho những ids CHƯA TỒN TẠI
      if (studentsData.length > 0) {
        // biome-ignore lint/suspicious/useIterableCallbackReturn: <>
        studentsData?.map((student: any) => {

          operations.push({
            model: "StudentSubjectScore",
            operation: "create",
            data: {
              data: {
                studentId: student.id,
                subjectClassId: subjectClassId,
                subjectVersionId: subjectClassData.subjectId,
                attendanceScore: student?.subjectClassStudent?.[0]?.attendanceScore,
                midtermScore: student?.subjectClassStudent?.[0]?.midtermScore,
              },
            },
          })
        })
      }

      // Chỉ thực hiện transaction nếu có thay đổi
      if (operations.length > 0) {
        const res = await sqlTransaction(operations)
        if (res.status !== 200) {
          throw new Error("Có lỗi xảy ra khi lưu đăng ký thi lại!")
        }
      }

      message.success("Lưu đăng ký thi lại thành công!")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "StudentSubjectScore"],
      })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
      queryClient.invalidateQueries({
        queryKey: ["/api/subject-class/open-subject-class-reexam"],
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra khi gán lớp!")
    }
  }

  const data = useMemo(
    () => (res?.status === 200 ? [...res.data.data, ...studentList] : [...studentList]),
    [res, studentList]
  )
  const countData = useMemo(() => (res?.status === 200 ? res.data.data.length : 0), [res])

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  useEffect(() => {
    if (subjectClassData) {
      dangKyThiLaiStore.setState((prev) => ({
        ...prev,
        studentIds: subjectClassData.subjectClassStudent.map((s) => s.studentId),
      }))
    }
  }, [subjectClassData])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleRowSelection = (ids: string[]) => {
    dangKyThiLaiStore.setState((prev) => ({
      ...prev,
      studentIds: ids,
    }))
  }

  const handleCancel = async (id: string) => {
    if (!id) return
    try {
      let res = await deleteStudentSubjectScore({
        where: {
          id: id,
        },
      })
      if (res) {
        message.success("Huỷ đăng ký thi lại thành công")
        refetch()
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi huỷ đăng ký thi lại!")
    }
  }
  return (
    <Row gutter={[4, 0]}>
      <Col span={6}>
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
          placeholder="Chọn khoá"
          className="w-full"
          options={trainingCourseData.map((i) => ({
            value: i.id,
            label: i.name,
          }))}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          onChange={(value) => handleFilterChange("trainingCourseId", value)}
        />
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
      <Col span={2} className="text-right">
        <Button type="primary" className="h-[32px] px-4" onClick={handleSaveStudentClass}>
          Lưu
        </Button>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          className="mt-0"
          data={data}
          onRow={(record) => ({
            onClick: () => {
              const isSelected = studentIds.includes(record.id)
              if (isSelected) {
                handleRowSelection(studentIds.filter((key) => key !== record.id))
              } else {
                handleRowSelection([...studentIds, record.id])
              }
            },
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={{
            selectedRowKeys: studentIds,
            onChange: (selectedRowKeys) => {
              handleRowSelection(selectedRowKeys as string[])
            },
            type: "checkbox",
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
              width: 150,
              render: (_, record) => <p className="text-left">{record?.userProfile?.fullname}</p>,
            },
            {
              title: "Lớp",
              align: "center",
              width: 150,
              render: (_, record) => <p>{record?.fixedClass?.code}</p>,
            },
            {
              title: "Khoá",
              align: "center",
              width: 80,
              render: (_, record) => <p>{record?.fixedClass?.trainingCourse?.name}</p>,
            },
            {
              title: "Điểm",
              align: "center",
              width: 50,
              render: (_, record: any) => record?.diem_cuoi ?? "-",
            },
            {
              title: "Hoãn thi",
              align: "center",
              dataIndex: "hoan_thi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Lý do",
              align: "center",
              width: 80,
              render: (_, record: any) => {
                return record?.ly_do_hoan_thi || ""
              },
            },
            {
              title: "Thao tác",
              align: "center",
              width: 50,
              render: (_, record: any) => {
                return (
                  <Flex justify="center">
                    <Tooltip title={"Huỷ đăng ký"} placement="top">
                      <CircleX
                        size={16}
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleCancel(record?.subjectClassStudent?.[0]?.id || "")}
                      />
                    </Tooltip>
                  </Flex>
                )
              },
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countData,
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
