import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import { cn, formatDate } from "@lib/utils"
import { diemPhongThiStore, kythiStore } from "@pages/quan-ly-diem/nhap-diem-theo-phach"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import type { Prisma } from "@workspace/db/client"
import { useCountExamList, useFindManyExamList } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Flex, Input, Row } from "antd"
import _ from "lodash"
import { useCallback, useMemo, useState } from "react"

export default function PhongThi({ setActiveKey }: { setActiveKey: (key: string) => void }) {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: session } = useSession()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    searchText: "",
    examType: undefined,
  })

  const { examId } = useStore(kythiStore)
  const { selectedExamListId } = useStore(diemPhongThiStore)

  const where: Prisma.ExamListWhereInput = useMemo(() => {
    return {
      examRoom: {
        exam: {
          id: examId,
          subjectClass: {
            some: {
              trainingObjectTypeId,
              semesterId,
              ...(filters.examType && filters.examType.length > 0
                ? {
                    examType: {
                      in: filters.examType,
                    },
                  }
                : {}),
            },
          },
          lockExamSessions: true,
        },
        roomId: {
          not: null,
        },
      },
    }
  }, [examId, trainingObjectTypeId, semesterId, filters])

  const { data = [], refetch } = useFindManyExamList(
    {
      where,
      include: {
        examPapers: {
          include: {
            studentSubjectScore: true,
          },
        },
        examRoom: {
          include: {
            exam: {
              include: {
                subjectVersion: true,
                subjectClass: true,
              },
            },
            room: {
              include: {
                building: {
                  include: {
                    trainingLocation: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            examPapers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!examId }
  )

  const { data: count } = useCountExamList({
    where: {
      ...where,
      deletedAt: null,
    },
  })
  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const debouncedSearch = useCallback(
    _.debounce((value: string) => {
      setFilters((prev) => ({
        ...prev,
        searchText: value,
      }))
    }, 500),
    []
  )

  return (
    <div className="bg-white">
      <Row gutter={[16, 16]}>
        <Flex gap={8}>
          <Input
            placeholder="Tìm kiếm"
            className="w-60"
            allowClear
            onChange={(e) => debouncedSearch(e.target.value)}
          />
          <Select
            allowClear
            mode="multiple"
            placeholder="Chọn hình thức thi"
            className="w-60"
            options={examTypeOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                examType: value,
              }))
            }
          />
        </Flex>
        <Col span={24}>
          <Table
            rowKey="id"
            filters={filters}
            setFilters={setFilters}
            onRow={(record) => {
              return {
                onClick: () => {
                  diemPhongThiStore.setState({ selectedExamListId: record.id })
                  debouncedRefetch()
                },
                onDoubleClick: () => {
                  setActiveKey("2")
                },
                className: cn(selectedExamListId === record.id ? "bg-orange-200" : ""),
              }
            }}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Phòng thi",
                dataIndex: "name",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) => record?.examRoom?.room?.name || "",
              },
              {
                title: "Khu vực",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) =>
                  `${record?.examRoom?.room?.building?.name} ${record?.examRoom?.room?.building?.trainingLocation?.name}`,
              },
              {
                title: "Hình thức thi",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) => {
                  return getExamTypeLabel(record?.examRoom?.exam?.subjectClass?.[0]?.examType) || ""
                },
              },
              {
                title: "Ca thi",
                width: 150,
                align: "center",
                render: (_, record) => `${record?.start || ""}`,
              },
              {
                title: "Ngày thi",
                width: 150,
                align: "center",
                render: (_, record) =>
                  `${formatDate(record?.examRoom?.exam?.subjectClass[0]?.examDate) || ""}`,
              },
              {
                title: "Số thí sinh",
                width: 150,
                align: "center",
                render: (_, record) => {
                  return record?._count?.examPapers || 0
                },
              },
            ]}
            data={data}
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
