import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useStore } from "@tanstack/react-store"
import type { ScoreConvert } from "@workspace/db/client"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Checkbox, Col, Form, Input, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { useCallback, useState } from "react"
import { dangKyHocChoCaNhanStore } from "../.."

interface FilterProps {
  searchText: string | null
  trainingCourseId: string | null
}

export default function KetQuaDangKyHoc() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingCourseId: null,
  })
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { studentId } = useStore(dangKyHocChoCaNhanStore)

  const { data: subjectClassData = [], refetch } = useFindManySubjectClass(
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
        subjectClassStudent: {
          some: {
            studentId: studentId as string,
          },
        },
        cancelled: false,
        active: true,
        status: "OFFICIAL",
      },
      include: {
        subject: {
          include: {
            // Lấy điểm cao nhất của sinh viên trong các lần đăng ký học cải thiện
            studentSubjectScore: {
              where: {
                studentId: studentId as string,
              },
              orderBy: {
                finalScore: "desc",
              },
              select: {
                finalScore: true,
                student: {
                  select: {
                    fixedClass: {
                      select: {
                        trainingCourse: {
                          select: {
                            scoreConverts: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        subjectClassStudent: {
          where: {
            studentId: studentId as string,
          },
          select: {
            id: true,
          },
        },
        fixedClasses: {
          select: {
            _count: {
              select: {
                students: {
                  where: {
                    active: true,
                    deletedAt: null,
                    status: "ENROLLED",
                  },
                },
              },
            },
            students: {
              where: {
                id: studentId as string,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
      orderBy: {
        code: "asc",
      },
    },
    {
      enabled: !!studentId && !!semesterId,
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
        subjectClassStudent: {
          some: {
            studentId: studentId as string,
          },
        },
        cancelled: false,
        active: true,
      },
    },
    {
      enabled: !!studentId && !!semesterId,
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
      <Col span={20}>
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
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã LMH",
              dataIndex: "code",
              align: "center",
              width: 100,
            },
            {
              title: "Tên môn",
              dataIndex: "name",
              align: "center",
              width: 150,
              render: (text) => <p className="text-left">{text}</p>,
            },
            {
              title: "Số TC",
              dataIndex: ["subject", "credit"],
              align: "center",
              width: 80,
            },
            {
              title: "Sĩ số",
              align: "center",
              width: 100,
              render: (record) =>
                record?.fixedClasses?.reduce(
                  (acc: number, curr: any) => acc + (curr?._count?.students ?? 0),
                  0
                ),
            },
            {
              title: "Điểm",
              align: "center",
              width: 50,
              render: (_, record) =>
                record.subject.studentSubjectScore[0]?.finalScore?.toNumber() ?? "-",
            },
            {
              title: "Cải thiện",
              align: "center",
              width: 50,
              render: (_, record) => (
                <Checkbox
                  checked={
                    record.subject.studentSubjectScore.length > 0 &&
                    !!record.subject.studentSubjectScore[0]?.finalScore
                      ? record.subject.studentSubjectScore[0].student?.fixedClass?.trainingCourse?.scoreConverts?.some(
                          (sc: ScoreConvert) =>
                            sc?.base10Min <=
                              record.subject.studentSubjectScore[0]?.finalScore?.toNumber() &&
                            record.subject.studentSubjectScore[0]?.finalScore?.toNumber() <=
                              sc?.base10Max &&
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
