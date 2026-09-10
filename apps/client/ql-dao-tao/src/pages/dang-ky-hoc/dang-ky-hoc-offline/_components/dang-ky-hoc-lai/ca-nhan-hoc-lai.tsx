import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useStore } from "@tanstack/react-store"
import {
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { diffArrays } from "@workspace/libs"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useOpenSubjectClassRetakeStudents } from "@workspace/libs/api/training"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Col, Form, Input, message, Row, Select } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { dangKyHocLaiStore } from "../.."

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

export default function CaNhanHocLai() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
    fixedClassId: undefined,
  })

  const { subjectClassId, studentIds = [] } = useStore(dangKyHocLaiStore)
  const initedSubjectClassIdRef = useRef<string | undefined>()
  const selectedRecordsRef = useRef(new Map<string, any>())
  const lastSubjectClassIdRef = useRef(subjectClassId)
  if (lastSubjectClassIdRef.current !== subjectClassId) {
    lastSubjectClassIdRef.current = subjectClassId
    selectedRecordsRef.current.clear()
  }

  const { data: subjectClassData } = useFindUniqueSubjectClass(
    {
      where: { id: subjectClassId },
      select: {
        id: true,
        subjectId: true,
        subjectClassStudent: {
          where: { deletedAt: null },
          select: {
            studentId: true,
          },
        },
      },
    },
    { enabled: !!subjectClassId }
  )

  const { id: semesterId } = useSemesterStore()
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
    orderBy: {
      code: "asc",
    },
    where: {
      active: true,
      trainingCourseId: filters.trainingCourseId,
    },
  })

  const { data: res, refetch } = useOpenSubjectClassRetakeStudents(
    {
      search: filters.searchText || undefined,
      trainingCourseId: filters.trainingCourseId,
      fixedClassId: filters.fixedClassId,
      trainingObjectTypeId: trainingObjectTypeId || "",
      subjectVersionId: subjectClassData?.subjectId || "",
      page: currentPage,
      pageSize: numberOfPages,
    },
    { query: { enabled: !!trainingObjectTypeId && !!subjectClassData?.subjectId } }
  )
  const { data: studentList = [] } = useFindManyStudent(
    {
      where: {
        deletedAt: null,
        subjectClassStudent: {
          some: { subjectClassId },
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

  const handleSaveStudentClass = async () => {
    try {
      if (!subjectClassId || !subjectClassData || subjectClassData.id !== subjectClassId) return

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
      if (idsToCreate.length > 0) {
        operations.push({
          model: "StudentSubjectScore",
          operation: "createMany",
          data: {
            data: idsToCreate.map((studentId: string) => ({
              studentId,
              subjectClassId: subjectClassId,
              subjectVersionId: subjectClassData.subjectId,
            })),
          },
        })
      }

      // Chỉ thực hiện transaction nếu có thay đổi
      if (operations.length > 0) {
        const res = await sqlTransaction(operations)
        if (res.status !== 200) {
          throw new Error("Có lỗi xảy ra khi lưu đăng ký học!")
        }
      }

      message.success("Lưu đăng ký học lại thành công!")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "StudentSubjectScore"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
      queryClient.invalidateQueries({
        queryKey: ["/api/subject-class/open-subject-class-retake-students"],
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra khi gán lớp!")
    }
  }

  const data = useMemo(() => {
    const eligible = res?.status === 200 ? res.data.data : []
    const byId = new Map<string, any>()
    for (const student of studentList) {
      byId.set(student.id, student)
    }
    for (const student of eligible) {
      const existing = byId.get(student.id)
      byId.set(student.id, existing ? { ...existing, ...student } : student)
    }
    for (const student of byId.values()) {
      selectedRecordsRef.current.set(student.id, student)
    }
    for (const id of studentIds) {
      if (!byId.has(id)) {
        const cached = selectedRecordsRef.current.get(id)
        if (cached) byId.set(id, cached)
      }
    }
    return Array.from(byId.values())
  }, [res, studentList, studentIds])
  const countData = useMemo(() => {
    if (res?.status !== 200) return studentList.length
    const eligibleIds = new Set(res.data.data.map((student) => student.id))
    const extraEnrolled = studentList.filter((student) => !eligibleIds.has(student.id)).length
    return res.data.data.length + extraEnrolled
  }, [res, studentList])

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  useEffect(() => {
    if (!subjectClassId) {
      initedSubjectClassIdRef.current = undefined
      dangKyHocLaiStore.setState((prev) => ({
        ...prev,
        studentIds: [],
      }))
      return
    }
    if (!subjectClassData || subjectClassData.id !== subjectClassId) return
    if (initedSubjectClassIdRef.current === subjectClassId) return
    initedSubjectClassIdRef.current = subjectClassId
    setCurrentPage(1)
    dangKyHocLaiStore.setState((prev) => ({
      ...prev,
      studentIds: subjectClassData.subjectClassStudent.map((s) => s.studentId),
    }))
  }, [subjectClassId, subjectClassData])

  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1)
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleSelectStudent = (studentId: string, selected: boolean) => {
    dangKyHocLaiStore.setState((prev) => {
      const current = prev.studentIds ?? []
      if (selected) {
        if (current.includes(studentId)) return prev
        return { ...prev, studentIds: [...current, studentId] }
      }
      return { ...prev, studentIds: current.filter((id) => id !== studentId) }
    })
  }

  const handleSelectStudents = (ids: string[], selected: boolean) => {
    dangKyHocLaiStore.setState((prev) => {
      const current = prev.studentIds ?? []
      if (selected) {
        return { ...prev, studentIds: [...new Set([...current, ...ids])] }
      }
      const removing = new Set(ids)
      return { ...prev, studentIds: current.filter((id) => !removing.has(id)) }
    })
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
            onClick: (event) => {
              const target = event.target as HTMLElement
              if (target.closest(".ant-checkbox-wrapper, .ant-checkbox")) return
              handleSelectStudent(record.id, !studentIds.includes(record.id))
            },
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={{
            selectedRowKeys: studentIds,
            preserveSelectedRowKeys: true,
            onSelect: (record, selected) => {
              handleSelectStudent(record.id, selected)
            },
            onSelectAll: (selected, _selectedRows, changeRows) => {
              handleSelectStudents(
                changeRows.map((row) => row.id),
                selected
              )
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
              render: (_, record) => <p>{record?.fixedClass?.trainingCourse?.name}</p>,
            },
            {
              title: "Điểm",
              align: "center",
              width: 50,
              render: (_, record: any) => record?.diem_cuoi ?? "-",
            },
            {
              title: "Cấm thi",
              align: "center",
              dataIndex: "cam_thi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Đình chỉ thi",
              align: "center",
              dataIndex: "dinh_chi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Lý do",
              align: "center",
              width: 120,
              render: (_, record: any) =>
                record?.reason ??
                record?.ly_do_cam_thi ??
                record?.ly_do_dinh_chi ??
                record?.ly_do_hoan_thi,
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
