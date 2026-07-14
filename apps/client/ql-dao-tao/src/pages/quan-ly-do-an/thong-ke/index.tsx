import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import {
  type Prisma,
  StudentThesisRegistrationStatus,
  SubjectVersionType,
} from "@workspace/db/client"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { Col, Flex, Input, Row, Segmented, Tabs } from "antd"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js"
import { Award, Calculator, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const StatCard = ({
  title,
  icon,
  value,
  totalItems = 1,
}: {
  title: string
  icon: React.ReactNode
  value: string | number | React.ReactNode
  totalItems?: number
}) => {
  const span = Math.floor(24 / totalItems)

  return (
    <Col span={span}>
      <div className="bg-white rounded-lg shadow-sm py-4 px-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <strong className="text-base">{title}</strong>
          {icon}
        </div>
        <span className="text-primary text-xl">{value}</span>
      </div>
    </Col>
  )
}

export default function ThongKe() {
  const [activeKey, setActiveKey] = useState("ket-qua")
  const { id: semesterId } = useSemesterStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    code: "",
    name: "",
    finalGpa: undefined,
  })

  const where = useMemo(() => {
    return {
      subject: {
        type: SubjectVersionType.Project,
      },
      ...(semesterId ? { semesterId } : {}),
      ...(filters.searchText
        ? {
            OR: [
              { name: { contains: filters.searchText, mode: "insensitive" as const } },
              { code: { contains: filters.searchText, mode: "insensitive" as const } },
              {
                subject: {
                  name: {
                    contains: filters.searchText,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
      thesisProjects: {
        some: {
          registrations: {
            some: {
              student: {
                ...(filters.code && filters.code !== ""
                  ? {
                      code: {
                        contains: filters.code,
                        mode: "insensitive" as const,
                      },
                    }
                  : {}),
                userProfile: (filters.name && filters.name !== ""
                    ? {
                        fullname: {
                          contains: filters.name,
                          mode: "insensitive" as const,
                        },
                      }
                    : {}),
              },
              status: StudentThesisRegistrationStatus.ACCEPTED,
            },
          },
        },
      },
      deletedAt: null,
      active: true,
      cancelled: false,
      status: "OFFICIAL",
    } satisfies Prisma.SubjectClassWhereInput
  }, [semesterId, filters.searchText, filters.name, filters.code])

  const { data } = useFindManySubjectClass({
    where,
    include: {
      subject: true,
      thesisProjects: {
        include: {
          registrations: {
            include: {
              student: {
                include: {
                  userProfile: true,
                  fixedClass: true,
                },
              },
              studentSubjectScore: true,
            },
            where: {
              status: StudentThesisRegistrationStatus.ACCEPTED,
              student: {
                ...(filters.code && filters.code !== ""
                  ? {
                      code: {
                        contains: filters.code,
                        mode: "insensitive" as const,
                      },
                    }
                  : {}),
                userProfile: (filters.name && filters.name !== ""
                    ? {
                        fullname: {
                          contains: filters.name,
                          mode: "insensitive" as const,
                        },
                      }
                    : {}),
              },
            },
          },
        },
      },
      subjectClassStudent: {
        include: {
          student: true,
        },
      },
    },
  })

  const projects = useMemo(() => {
    if (!data) return []

    return data.map((subjectClass) => {
      const thesisProjects = subjectClass.thesisProjects
        .map((tp) => {
          const validRegistrations = tp.registrations.filter((reg) => reg.student)

          return {
            ...tp,
            registrations: validRegistrations,
          }
        })
        .filter((tp) => tp.registrations.length > 0)
      const students = thesisProjects.flatMap((tp) =>
        tp.registrations.map((reg) => ({
          ...reg.student,
          title: tp.title,
          finalScore: reg.studentSubjectScore?.finalScore,
        }))
      )

      return {
        ...subjectClass,
        thesisProjects,
        students,
      }
    })
  }, [data])

  const totalStudents = useMemo(() => {
    return projects.reduce((sum, sc) => sum + sc.students.length, 0)
  }, [projects])

  const averageScore = useMemo(() => {
    const allScores = projects
      .flatMap((sc) => sc.students.map((st) => (st.finalScore ? Number(st.finalScore) : null)))
      .filter((s): s is number => s !== null)

    if (allScores.length === 0) return 0

    const total = allScores.reduce((sum, s) => sum + s, 0)
    return (total / allScores.length).toFixed(2)
  }, [projects])

  const { data: count } = useCountSubjectClass({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const scoreDistribution = useMemo(() => {
    const allScores = projects
      .flatMap((sc) => sc.students.map((st) => (st.finalScore ? Number(st.finalScore) : null)))
      .filter((s): s is number => s !== null)

    const step = 0.25
    const numberOfBins = Math.ceil(10 / step)
    const bins = Array.from({ length: numberOfBins }, (_, i) => ({
      range: `${(i * step).toFixed(2)} - ${((i + 1) * step).toFixed(2)}`,
      count: 0,
      min: i * step,
      max: (i + 1) * step,
    }))

    allScores.forEach((score) => {
      const binIndex = bins.findIndex((bin) => score >= bin.min && score < bin.max)
      if (binIndex !== -1) {
        bins[binIndex].count++
      } else if (score === 10) {
        bins[bins.length - 1].count++
      }
    })

    return bins
  }, [projects])

  const chartData = {
    labels: scoreDistribution.map((b) => b.range),
    datasets: [
      {
        label: "Số lượng SV",
        data: scoreDistribution.map((b) => b.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        display: false,
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Khoảng điểm" },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: { display: true, text: "Số lượng SV" },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const items = [
    {
      key: "ket-qua",
      label: "Danh sách kết quả",
      children: (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <TableCollapse
                rowKey="id"
                filters={filters}
                setFilters={(value) => {
                  setFilters(value)
                  setCurrentPage(1)
                }}
                headerTitleKey={({ code, name, subject }) =>
                  `${[code, name, subject?.name].filter(Boolean).join(" - ")}`
                }
                childrenFieldName="students"
                defaultExpandAll
                columns={[
                  {
                    title: "Mã sinh viên",
                    dataIndex: "code",
                    fixed: "left",
                    type: "input",
                    align: "center",
                    render: (_, record) => record?.code,
                  },
                  {
                    title: "Họ và tên",
                    dataIndex: "name",
                    type: "input",
                    render: (_, record) => record?.userProfile?.fullname,
                  },
                  {
                    title: "Đề tài",
                    render: (_, record) => record?.title,
                  },
                  {
                    title: "Lớp niên chế",
                    render: (_, record) => record?.fixedClass?.name,
                  },
                  {
                    title: "Điểm tổng kết",
                    align: "center",
                    render: (_, record) => record?.finalScore?.toString(),
                  },
                ]}
                data={projects}
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
      ),
    },
    {
      key: "thong-ke",
      label: "Thống kê",
      children: (
        <div>
          <Row gutter={[16, 16]}>
            {[
              {
                title: "Tổng số bảo vệ",
                icon: <Users />,
                value: totalStudents,
              },
              {
                title: "Điểm trung bình",
                icon: <Calculator />,
                value: averageScore,
              },
            ].map((item, _, arr) => (
              <StatCard
                key={item.title}
                title={item.title}
                icon={item.icon}
                value={item.value}
                totalItems={arr.length}
              />
            ))}
            <StatCard
              title="Phổ điểm"
              icon={<Award />}
              value={<Bar data={chartData} options={chartOptions} />}
              totalItems={1}
            />
          </Row>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 0]} className="mx-2">
        <Col span={24} className="bg-white rounded-lg shadow-sm p-4">
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={18}>
              <strong>Thông tin lớp học</strong>
            </Col>
            <Col span={8}>
              <Flex gap={8}>
                <Input
                  id="search"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      searchText: e.target.value,
                    })
                  }
                  className="py-0 h-8"
                  placeholder="Tìm kiếm lớp môn học"
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
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24} className="mt-4 !px-0">
          <Segmented
            value={activeKey}
            onChange={(val) => setActiveKey(val)}
            options={[
              { label: "Danh sách kết quả", value: "ket-qua" },
              { label: "Thống kê", value: "thong-ke" },
            ]}
            style={{ marginBottom: 14 }}
            className="w-full flex justify-between"
            size="large"
          />
          <style jsx global>{`
            .ant-segmented.w-full .ant-segmented-item {
              flex: 1;
              justify-content: center;
            }
          `}</style>

          <Tabs
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key)}
            items={items}
            tabBarStyle={{ display: "none" }}
          />
        </Col>
      </Row>
    </div>
  )
}

ThongKe.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
