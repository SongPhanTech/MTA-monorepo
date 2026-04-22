import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { $Enums } from "@workspace/db/client"
import {
  useCountSubjectClass,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Col, Form, Input, Row, Select } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useState } from "react"
import { dangKyHocChoLopQuanLyStore } from "../.."

interface FilterProps {
  searchText: string | null
  trainingCourseId?: string
}

export default function DangKyHocChoLopQuanLy() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKey, setSelectedRowKey] = useState<Key>("")

  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: undefined,
  })
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: {
      active: true,
      trainingObjectTypeId,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
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
      cancelled: false,
      active: true,
      status: "OFFICIAL",
      type: $Enums.SubjectClassType.NORMAL,
      ...(filters.trainingCourseId
        ? {
            fixedClasses: {
              some: {
                trainingCourseId: filters.trainingCourseId,
              },
            },
          }
        : {}),
    },
    include: {
      subject: true,
      fixedClasses: {
        select: {
          _count: {
            select: {
              students: {
                where: {
                  active: true,
                  status: "ENROLLED",
                  deletedAt: null,
                },
              },
            },
          },
          code: true,
          trainingCourse: {
            select: {
              code: true,
            },
          },
        },
      },
      _count: {
        select: {
          subjectClassStudent: {
            where: {
              student: {
                active: true,
                status: "ENROLLED",
                deletedAt: null,
              },
            },
          },
        },
      },
      trainingLocation: {
        select: {
          name: true,
        },
      },
      subjectClassTimes: true,
    },
    orderBy: {
      code: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: countSubjectClass = 0 } = useCountSubjectClass({
    where: {
      ...(filters.searchText && filters.searchText !== ""
        ? {
            name: {
              contains: filters.searchText,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.trainingCourseId
        ? {
            fixedClasses: {
              some: {
                trainingCourseId: filters.trainingCourseId,
              },
            },
          }
        : {}),
      semesterId,
      trainingObjectTypeId,
      cancelled: false,
      active: true,
      status: "OFFICIAL",
      type: $Enums.SubjectClassType.NORMAL,
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
    dangKyHocChoLopQuanLyStore.setState((prev) => ({ ...prev, subjectClassId: id }))
  }

  return (
    <div>
      <Row align="middle" justify="space-between" gutter={16}>
        <Col>
          <h3 className="text-lg m-0">Danh sách lớp môn học</h3>
        </Col>

        <Col>
          <Row gutter={8}>
            <Col>
              <Form.Item className="m-0" name="searchText">
                <Input
                  id="search"
                  placeholder="Tìm kiếm..."
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  style={{ height: 32, width: 300 }}
                  prefix={<Search size={15} style={{ color: "rgba(0, 0, 0, 0.25)" }} />}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col>
              <Select
                placeholder="Chọn khoá"
                style={{ width: 180 }}
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
          </Row>
        </Col>
      </Row>
      <Table
        rowKey="id"
        dataSource={subjectClassData}
        onRow={(record) => ({
          onClick: () => handleRowSelection(record.id),
          style: { cursor: "pointer" },
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
            dataIndex: "",
            width: 35,
            align: "center",
            render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
          },
          {
            title: "Mã LMH",
            dataIndex: "code",
            align: "center",
            width: 80,
          },
          {
            title: "Tên môn",
            dataIndex: "name",
            align: "center",
            width: 150,
            render: (text: string, record) => (
              <p className="text-left">
                {record?.subject?.name} ({record.subject?.credit} TC)
              </p>
            ),
          },
          // {
          //   title: "Khu vực",
          //   dataIndex: ["trainingLocation", "name"],
          //   align: "center",
          //   width: 100,
          // },
          {
            title: "Số SV đã ĐK",
            align: "center",
            width: 60,
            onCell: (record) => ({
              className: cn(
                record?._count?.subjectClassStudent === 0 ? "text-red-500" : "text-primary"
              ),
            }),
            render: (record) => record?._count?.subjectClassStudent ?? 0,
          },
          {
            title: "Lớp quản lý",
            align: "center",
            width: 120,
            render: (__, record) => {
              return record?.fixedClasses.length ? (
                <TextTruncate
                  arr={record?.fixedClasses.map((i: any) => {
                    return {
                      key: i?.id,
                      label: `${i.code} (${i?._count.students} SV)`,
                    }
                  })}
                  key="fixedClasses"
                />
              ) : (
                ""
              )
            },
          },
        ]}
        pagination={{
          current: currentPage,
          pageSize: numberOfPages,
          total: countSubjectClass,
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
    </div>
  )
}
