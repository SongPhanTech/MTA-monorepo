import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  useCountStudent,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, Row, Select } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useState } from "react"
import { dangKyHocChoCaNhanStore } from ".."

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

export default function DangKyHocChoCaNhan() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKey, setSelectedRowKey] = useState<Key>("")

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
    fixedClassId: undefined,
  })
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
      trainingCourse: {
        trainingObjectTypeId,
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
      fixedClassId: filters.fixedClassId,
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
        trainingCourse: { trainingObjectTypeId },
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
        },
        orderBy: {
          semester: {
            startDate: "desc",
          },
        },
      },
      fixedClass: {
        select: {
          code: true,
          trainingCourse: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
  })

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
      fixedClassId: filters.fixedClassId,
      fixedClass: {
        trainingCourseId: filters.trainingCourseId,
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleRowSelection = (id: string) => {
    setSelectedRowKey(id)
    dangKyHocChoCaNhanStore.setState((prev) => ({
      ...prev,
      studentId: id,
    }))
  }

  return (
    <Row gutter={[4, 0]}>
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
      <Col span={24}>
        <Table
          rowKey="id"
          className="mt-0"
          data={students}
          onRow={(record) => ({
            onClick: () => handleRowSelection(record.id),
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={{
            selectedRowKeys: [selectedRowKey],
            onChange: (selectedRowKeys) => {
              handleRowSelection(selectedRowKeys?.[0] as string)
            },
            type: "radio",
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
              title: "GPA tích luỹ",
              align: "center",
              // dataIndex: ['studentSemesterResult', 0, 'cumulativeGpaBase10'],
              width: 80,
              render: (_, record) =>
                record?.studentSemesterResult.length > 0 ? (
                  <span>
                    {Number(record.studentSemesterResult[0]?.cumulativeGpaBase10).toFixedSmart(2)}
                  </span>
                ) : (
                  <span>-</span>
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
