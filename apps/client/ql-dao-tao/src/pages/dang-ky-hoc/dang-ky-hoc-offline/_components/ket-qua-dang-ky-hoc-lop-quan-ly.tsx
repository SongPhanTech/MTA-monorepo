import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useExamTypeOptions } from "@hooks/examType"
import { useScheduleOptions } from "@hooks/subjectClassSchedule"
import type { ExamType, SubjectClassSchedule } from "@workspace/db/client"
import {
  useCountFixedClass,
  useFindManyFixedClass,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, Row } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useState } from "react"

interface FilterProps {
  searchText: string | null
  trainingCourseId: string | null
}

export default function KeQuaDangKyHocLopQuanLy({ hocLai = false }: { hocLai?: boolean }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKey, setSelectedRowKey] = useState<Key>("")
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: null,
  })
  const { id: semesterId } = useSemesterStore()

  const { getScheduleLabel } = useScheduleOptions()
  const { getExamTypeLabel } = useExamTypeOptions()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: {
        name: {
          contains: filters.searchText || undefined,
          mode: "insensitive",
        },
        trainingCourse: {
          id: filters.trainingCourseId || undefined,
          trainingObjectTypeId,
        },
      },
      orderBy: {
        code: "asc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      include: {
        trainingCourse: true,
        _count: {
          select: {
            students: {
              where: {
                active: true,
                status: "ENROLLED",
                deletedAt: null,
              },
            },
            subjectClasses: {
              where: {
                active: true,
                cancelled: false,
                status: "OFFICIAL",
                semesterId,
              },
            },
          },
        },
        curriculumVersion: {
          select: {
            curriculum: {
              select: {
                trainingMajor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!semesterId && !!trainingObjectTypeId,
    }
  )
  const { data: countFixedClassAll = 0 } = useCountFixedClass({
    where: {
      name: {
        contains: filters.searchText || undefined,
        mode: "insensitive",
      },
      trainingCourse: {
        id: filters.trainingCourseId || undefined,
        trainingObjectTypeId,
      },
    },
  })
  const { data: subjectClassData = [], refetch } = useFindManySubjectClass({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            name: {
              contains: filters.searchText,
              mode: "insensitive",
            },
          }
        : {}),
      semesterId,
      trainingObjectTypeId,
      fixedClasses: {
        some: {
          id: selectedRowKey as string,
        },
      },
      status: "OFFICIAL",
      active: true,
      cancelled: false,
      deletedAt: null,
    },
    include: {
      mainLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true,
            },
          },
        },
      },
      extraLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true,
            },
          },
        },
      },
      subject: true,
      fixedClasses: {
        include: {
          _count: true,
        },
      },
      room: {
        include: {
          building: true,
        },
      },
      trainingLocation: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  type SubjectClassData = (typeof subjectClassData)[number]

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  return (
    <Row gutter={[8, 8]}>
      <Col span={8}>
        <Row gutter={[8, 8]}>
          <Col span={8}>
            <Form.Item name="searchText" className="m-0">
              <Input
                id="search"
                placeholder="Nhập tên lớp..."
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
              onChange={(value) => handleFilterChange("trainingCourseId", value)}
            />
          </Col>
        </Row>
        <Table
          rowKey="id"
          rowClassName={(record) => (record?._count?.subjectClasses === 0 ? "bg-yellow-100" : "")}
          rowSelection={{
            type: "radio",
            selectedRowKeys: [selectedRowKey],
            onChange: (selectedRowKeys) => {
              setSelectedRowKey(selectedRowKeys?.[0] as string)
            },
          }}
          onRow={(record) => {
            return {
              onClick: () => setSelectedRowKey(record.id),
            }
          }}
          data={fixedClasses}
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Lớp QL",
              dataIndex: "code",
              align: "center",
              width: 100,
            },
            {
              title: "Khoá học",
              dataIndex: "trainingCourse",
              width: 100,
              align: "center",
              render: (record) => (record.name ? record.name : ""),
            },
            {
              title: "Chuyên ngành",
              dataIndex: ["curriculumVersion", "curriculum", "trainingMajor", "name"],
              width: 160,
              align: "center",
            },
            {
              title: "Số HV, SV",
              dataIndex: ["_count", "students"],
              align: "center",
              width: 80,
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countFixedClassAll,
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
      <Col span={16}>
        <Row gutter={[8, 8]}>
          <Col span={8}>
            <h3 className="text-lg m-0.5">Danh sách kết quả đăng ký lớp môn học</h3>
          </Col>
        </Row>
        <Table
          rowKey="id"
          data={subjectClassData}
          columns={[
            {
              title: "TT",
              dataIndex: "",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 80,
            },
            {
              title: "Lớp môn học",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Thời gian học",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (value: string) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Kíp học",
              dataIndex: "schedule",
              width: 150,
              align: "center",
              // filters: scheduleOptions.map((opt) => ({
              //     text: opt.label,
              //     value: opt.value,
              // })),
              filterSearch: true,
              render: (value: SubjectClassSchedule) => getScheduleLabel(value),
            },
            {
              title: "Giảng viên 1",
              dataIndex: ["mainLecturer", "userProfile"],
              width: 150,
              render: (record) => record && `${record.fullname}`,
            },
            {
              title: "Giảng viên 2",
              dataIndex: ["extraLecturer", "userProfile"],
              width: 150,
              render: (record) => record && `${record.fullname}`,
            },
            {
              title: "Số tín chỉ",
              dataIndex: ["subject", "credit"],
              align: "center",
              width: 100,
            },
            {
              title: "Hình thức thi",
              dataIndex: ["subject", "examType"],
              align: "center",
              width: 180,
              render: (value: ExamType) => getExamTypeLabel(value),
            },
            {
              title: "Địa điểm",
              dataIndex: ["trainingLocation", "name"],
              align: "center",
              width: 180,
            },
            {
              title: "Số SV max",
              dataIndex: "maxStudent",
              align: "center",
              width: 120,
            },
            {
              title: "Số SV đã ĐK",
              align: "center",
              fixed: "right",
              width: 120,
              render: (record: SubjectClassData) =>
                record?.fixedClasses?.reduce(
                  (acc: number, curr) => acc + (curr?._count?.students ?? 0),
                  0
                ),
            },
          ]}
          pagination={false}
        />
      </Col>
    </Row>
  )
}
