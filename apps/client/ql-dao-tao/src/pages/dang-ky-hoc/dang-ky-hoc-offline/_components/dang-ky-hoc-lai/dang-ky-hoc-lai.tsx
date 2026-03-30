import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useStore } from "@tanstack/react-store"
import { $Enums } from "@workspace/db/client"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useState } from "react"
import { dangKyHocLaiStore } from "../.."

interface FilterProps {
  searchText: string | null
}

export default function DangKyHocLai() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(20)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })

  const { subjectClassId } = useStore(dangKyHocLaiStore)

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: subjectClassData = [], refetch } = useFindManySubjectClass(
    {
      where: {
        ...(filters.searchText
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
        type: $Enums.SubjectClassType.RETAKE,
        status: "OFFICIAL",
      },
      select: {
        _count: {
          select: {
            subjectClassStudent: {
              where: {
                student: {
                  status: "ENROLLED",
                  active: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            credit: true,
          },
        },
        name: true,
        code: true,
        id: true,
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: {
        code: "asc",
      },
    },
    {
      enabled: !!semesterId,
    }
  )
  const { data: countSubjectClass = 0 } = useCountSubjectClass(
    {
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
        type: $Enums.SubjectClassType.RETAKE,
      },
    },
    {
      enabled: !!semesterId,
    }
  )

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

  return (
    <Row>
      <Col span={12}>
        <Form.Item className="mb-1" name="searchText">
          <Input
            id="search"
            placeholder="Tìm kiếm LMH..."
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            className="h-8"
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Table
          className="m-0"
          rowKey="id"
          data={subjectClassData}
          onRow={(record) => {
            return {
              onClick: () => {
                if (subjectClassId === record?.id) {
                  dangKyHocLaiStore.setState((prev) => ({
                    ...prev,
                    subjectClassId: undefined,
                  }))
                  return
                }
                dangKyHocLaiStore.setState((prev) => ({
                  ...prev,
                  subjectClassId: record?.id,
                }))
              },
            }
          }}
          rowSelection={{
            selectedRowKeys: [subjectClassId as Key],
            onChange: (selectedRowKeys) => {
              dangKyHocLaiStore.setState((prev) => ({
                ...prev,
                subjectClassId: selectedRowKeys[0] as string,
              }))
            },
            columnWidth: 35,
            type: "radio",
          }}
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã LMH",
              align: "center",
              width: 100,
              render: (_, record) => record?.code,
            },
            {
              title: "Tên môn",
              align: "center",
              width: 200,
              render: (_, record) => <p className="text-left">{record?.name}</p>,
            },
            {
              title: "Số TC",
              align: "center",
              width: 80,
              render: (_, record) => record?.subject?.credit || 0,
            },
            {
              title: "Sĩ số",
              align: "center",
              width: 100,
              render: (record) => record?._count?.subjectClassStudent ?? 0,
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
      </Col>
    </Row>
  )
}
