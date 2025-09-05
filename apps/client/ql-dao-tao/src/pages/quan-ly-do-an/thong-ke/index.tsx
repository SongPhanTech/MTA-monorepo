import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import TableCollapse from '@components/commons/tableCollapse'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { StudentThesisRegistrationStatus, SubjectVersionType } from '@workspace/db'
import { useCountSubjectClass, useFindManySubjectClass } from '@workspace/db/hooks'
import { Col, Flex, Input, Row, Segmented, Tabs } from 'antd'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

export enum SubjectType {
    prerequisite = 'prerequisite',
    parallel = 'parallel',
    equivalent = 'equivalent',
}

export default function ThongKe() {
    const [activeKey, setActiveKey] = useState('ket-qua')
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        finalGpa: undefined,
    })

    const where = useMemo(() => {
        return {
            subject: {
                type: SubjectVersionType.Project,
            },
            ...(selectedSemesterId ? { semesterId: selectedSemesterId } : {}),
            ...(filters.searchText
                ? {
                      OR: [
                          { name: { contains: filters.searchText, mode: 'insensitive' as const } },
                          { code: { contains: filters.searchText, mode: 'insensitive' as const } },
                          {
                              subject: {
                                  name: {
                                      contains: filters.searchText,
                                      mode: 'insensitive' as const,
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
                                ...(filters.code && filters.code !== ''
                                    ? {
                                          code: {
                                              contains: filters.code,
                                              mode: 'insensitive' as const,
                                          },
                                      }
                                    : {}),
                                userProfile: {
                                    ...(filters.name && filters.name !== ''
                                        ? {
                                              fullname: {
                                                  contains: filters.name,
                                                  mode: 'insensitive' as const,
                                              },
                                          }
                                        : {}),
                                },
                            },
                            status: StudentThesisRegistrationStatus.ACCEPTED,
                        },
                    },
                },
            },
        }
    }, [selectedSemesterId, filters.searchText, filters.name, filters.code])

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
                                ...(filters.code && filters.code !== ''
                                    ? {
                                          code: {
                                              contains: filters.code,
                                              mode: 'insensitive' as const,
                                          },
                                      }
                                    : {}),
                                userProfile: {
                                    ...(filters.name && filters.name !== ''
                                        ? {
                                              fullname: {
                                                  contains: filters.name,
                                                  mode: 'insensitive' as const,
                                              },
                                          }
                                        : {}),
                                },
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

    console.log(projects)

    const { data: count } = useCountSubjectClass({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const items = [
        {
            key: 'ket-qua',
            label: 'Danh sách kết quả',
            children: (
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <TableCollapse
                                rowKey="id"
                                filters={filters}
                                setFilters={setFilters}
                                headerTitleKey={({ code, name, subject }) =>
                                    `${[code, name, subject?.name].filter(Boolean).join(' - ')}`
                                }
                                childrenFieldName="students"
                                defaultExpandAll
                                columns={[
                                    {
                                        title: 'Mã sinh viên',
                                        dataIndex: 'code',
                                        fixed: 'left',
                                        type: 'input',
                                        align: 'center',
                                        render: (_, record) => record?.code,
                                    },
                                    {
                                        title: 'Họ và tên',
                                        dataIndex: 'name',
                                        type: 'input',
                                        render: (_, record) => record?.userProfile?.fullname,
                                    },
                                    {
                                        title: 'Đề tài',
                                        render: (_, record) => record?.title,
                                    },
                                    {
                                        title: 'Lớp niên chế',
                                        render: (_, record) => record?.fixedClass?.name,
                                    },
                                    {
                                        title: 'Điểm tổng kết',
                                        align: 'center',
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
            key: 'thong-ke',
            label: 'Thống kê',
            children: <div className="bg-white rounded-lg shadow-sm p-4">1123123</div>,
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
                                                color: 'rgba(0, 0, 0, 0.25)',
                                            }}
                                        />
                                    }
                                    allowClear
                                />
                                <TreeSelectSemester
                                    filterTimeNow={true}
                                    onChange={(val) => setSelectedSemesterId(val)}
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
                            { label: 'Danh sách kết quả', value: 'ket-qua' },
                            { label: 'Thống kê', value: 'thong-ke' },
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
                        onChange={(key) => setActiveKey(key as SubjectType)}
                        items={items}
                        tabBarStyle={{ display: 'none' }}
                    />
                </Col>
            </Row>
        </div>
    )
}

ThongKe.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
