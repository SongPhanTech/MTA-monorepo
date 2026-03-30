import Table from "@components/commons/table"
import { useStore } from "@tanstack/react-store"
import {
  useCountFixedClass,
  useFindManyFixedClass,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, Row } from "antd"
import { Search } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { dangKyHocChoLopQuanLyStore } from "../.."

interface FilterProps {
  searchText: string | null
}

export default function LopQuanLyDaGhep() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(20)
  const { id: semesterId } = useSemesterStore()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })

  const { subjectClassId } = useStore(dangKyHocChoLopQuanLyStore)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: selectedSubjectClass } = useFindUniqueSubjectClass(
    {
      where: {
        id: subjectClassId as string,
      },
      select: {
        subjectId: true,
        fixedClasses: {
          select: {
            id: true,
          },
        },
      },
    },
    { enabled: !!semesterId && !!subjectClassId }
  )

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: {
        name: {
          contains: filters.searchText || undefined,
          mode: "insensitive",
        },
        subjectClasses: {
          some: {
            id: subjectClassId,
          },
        },
        trainingCourse: {
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
          },
        },
        curriculumVersion: {
          select: {
            curriculum: {
              select: {
                trainingMajor: true,
              },
            },
          },
        },
        subjectClasses: {
          where: {
            semesterId: semesterId as string,
            trainingObjectTypeId: trainingObjectTypeId as string,
            subjectId: selectedSubjectClass?.subjectId,
            cancelled: false,
            active: true,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    },
    {
      enabled: !!semesterId && !!subjectClassId && !!trainingObjectTypeId,
    }
  )

  const { data: countFixedClassAll = 0 } = useCountFixedClass(
    {
      where: {
        name: {
          contains: filters.searchText || undefined,
          mode: "insensitive",
        },
        subjectClasses: {
          some: {
            id: subjectClassId,
          },
        },
        trainingCourse: {
          trainingObjectTypeId,
        },
      },
    },
    {
      enabled: !!subjectClassId,
    }
  )

  useEffect(() => {
    if (fixedClasses && selectedSubjectClass) {
      const selectedSubjectClassFixedClassIds = selectedSubjectClass?.fixedClasses.map(
        (fc) => fc.id
      )
      const selectedKeys = fixedClasses
        .filter((item) => selectedSubjectClassFixedClassIds?.includes(item.id))
        .map((item) => item.id)
      setSelectedRowKeys(selectedKeys)
      if (
        !dangKyHocChoLopQuanLyStore.state.fixedClassesIds.compare(selectedKeys, (a, b) => a === b)
      ) {
        dangKyHocChoLopQuanLyStore.setState((prev) => ({
          ...prev,
          fixedClassesIds: selectedKeys as string[],
        }))
      }
    }
  }, [fixedClasses, selectedSubjectClass])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      return newFilters
    })
  }

  return (
    <div>
      <Row align="top" justify="space-between">
        <Col span={24}>
          <h3 className="text-lg">Lớp có môn theo KHGD</h3>
          <Form.Item className="m-0" name="searchText">
            <Input
              id="search"
              placeholder="Tìm kiếm..."
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
      </Row>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys)
            dangKyHocChoLopQuanLyStore.setState((prev) => ({
              ...prev,
              fixedClassesIds: selectedKeys as string[],
            }))
          },
          getCheckboxProps: (record) => ({
            disabled:
              record.subjectClasses.length > 0 && record.subjectClasses?.[0].id !== subjectClassId,
          }),
          columnWidth: 35,
        }}
        rowClassName={(record) =>
          record.subjectClasses.length > 0 && record.subjectClasses?.[0].id !== subjectClassId
            ? "bg-yellow-100"
            : ""
        }
        onRow={(record) => ({
          onClick: () => {
            if (
              record.subjectClasses.length > 0 &&
              record.subjectClasses?.[0].id !== subjectClassId
            )
              return
            const selectedKeys = [...selectedRowKeys]
            const index = selectedKeys.indexOf(record?.id)
            if (index > -1) {
              selectedKeys.splice(index, 1)
            } else {
              selectedKeys.push(record?.id)
            }
            setSelectedRowKeys(selectedKeys)
            dangKyHocChoLopQuanLyStore.setState((prev) => ({
              ...prev,
              fixedClassesIds: selectedKeys as string[],
            }))
          },
        })}
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
    </div>
  )
}
