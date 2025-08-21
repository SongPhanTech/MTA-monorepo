import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilte'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import { useCountSubjectVersion, useFindManySubjectVersion } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Input, Row, Tag } from 'antd'
import { BookOpenCheck, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

function SubjectVersion() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const { options: examTypeOption, getExamTypeLabel } = useExamTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        credit: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive' as const,
                              },
                          },
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive' as const,
                              },
                          },
                      ],
                  }
                : {}),
            subjectClass: {
                some: {
                    cancelled: false,
                    ...(selectedSemesterId && {
                        semesterId: selectedSemesterId,
                    }),
                    ...(filters.code && {
                        code: {
                            contains: filters.code,
                            mode: 'insensitive' as const,
                        },
                    }),
                    ...(filters.name && {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    }),
                },
            },
        }),
        [filters.searchText, selectedSemesterId, filters.code, filters.name]
    )

    const { data = [] } = useFindManySubjectVersion({
        where,
        include: {
            subjectClass: {
                include: {
                    semester: { include: { schoolYear: true } },
                    mainLecturer: {
                        select: {
                            code: true,
                            userProfile: {
                                select: {
                                    fullname: true,
                                },
                            },
                        },
                    },
                    exam: true,
                    _count: {
                        select: {
                            subjectClassStudent: true,
                        },
                    },
                },
                where: {
                    cancelled: false,
                    ...(selectedSemesterId && {
                        semesterId: selectedSemesterId,
                    }),
                    ...(filters.code && {
                        code: {
                            contains: filters.code,
                            mode: 'insensitive',
                        },
                    }),
                    ...(filters.name && {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive',
                        },
                    }),
                },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectVersion({
        where: { ...where, deletedAt: null },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 0]} align="top" justify="end">
                        <Col span={12}>
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
                                    placeholder="Tìm kiếm phiên bản môn học"
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
                        <Col span={12}>
                            <Flex justify="end">
                                <Button
                                    onClick={() => {
                                        router.push(
                                            `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/create`
                                        )
                                    }}
                                    type="primary"
                                >
                                    <BookOpenCheck />
                                    Tạo kỳ thi
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        headerTitleKey={({ code, name, credit }) =>
                            `${[code, name].filter(Boolean).join(' - ')} (${credit} tín chỉ)`
                        }
                        childrenFieldName="subjectClass"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                fixed: 'left',
                                width: 220,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'name',
                                fixed: 'left',
                                width: 220,
                                type: 'input',
                            },
                            {
                                title: 'Học kỳ',
                                width: 220,

                                render: (_, record) => {
                                    return [
                                        record?.semester?.name,
                                        record?.semester?.schoolYear?.name,
                                    ]
                                        .filter(Boolean)
                                        .join(' - ')
                                },
                            },
                            {
                                title: 'Giảng viên',
                                width: 220,
                                render: (_, record) => {
                                    return [
                                        record?.mainLecturer?.code,
                                        record?.mainLecturer?.userProfile?.fullname,
                                    ]
                                        .filter(Boolean)
                                        .join(' - ')
                                },
                            },
                            {
                                title: 'SL sinh viên',
                                width: 120,
                                align: 'center',
                                render: (_, record) => {
                                    return record?._count?.subjectClassStudent || 0
                                },
                            },
                            {
                                title: 'Hình thức thi',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    return getExamTypeLabel(record?.examType)
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                fixed: 'right',
                                width: 100,
                                render: (__, record) => {
                                    const hasExam = !!record.exam

                                    return hasExam ? (
                                        <Tag color="green">Đã tạo kỳ thi</Tag>
                                    ) : (
                                        <Tag color="default">Chưa tạo kỳ thi</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id, exam }) => (
                                    <Row className="justify-center gap-2">
                                        <Button
                                            disabled={!!exam}
                                            className="flex items-center gap-2 text-primary"
                                        >
                                            <BookOpenCheck />
                                            <span>Tạo kỳ thi</span>
                                        </Button>
                                    </Row>
                                ),
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

export default SubjectVersion
