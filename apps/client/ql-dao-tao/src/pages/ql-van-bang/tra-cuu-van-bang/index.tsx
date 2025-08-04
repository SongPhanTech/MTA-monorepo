import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import type { Prisma } from '@workspace/db'
import {
    useCountGraduationDecision,
    useFindManyDiplomaType,
    useFindManyGraduationDecision,
} from '@workspace/db/hooks'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

export default function GraduationDecisionDiploma() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        decisionDate: undefined,
        finalGpa: undefined,
        diplomaNumber: '',
        diplomaIssueDate: undefined,
    })

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const where: Prisma.GraduationDecisionWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      ...(filters.decisionDate
                          ? {
                                decisionDate: {
                                    gte: dayjs(filters.decisionDate?.[0], 'DD/MM/YYYY').toDate(),
                                    lte: dayjs(filters.decisionDate?.[1], 'DD/MM/YYYY').toDate(),
                                },
                            }
                          : {}),
                      ...(filters.diplomaIssueDate
                          ? {
                                diplomaIssueDate: {
                                    gte: dayjs(
                                        filters.diplomaIssueDate?.[0],
                                        'DD/MM/YYYY'
                                    ).toDate(),
                                    lte: dayjs(
                                        filters.diplomaIssueDate?.[1],
                                        'DD/MM/YYYY'
                                    ).toDate(),
                                },
                            }
                          : {}),
                      ...(filters.diplomaNumber
                          ? {
                                diplomaNumber: {
                                    contains: filters.diplomaNumber,
                                    mode: 'insensitive',
                                },
                            }
                          : {}),
                      student: {
                          userProfile: {
                              ...(filters.name
                                  ? {
                                        fullname: {
                                            contains: filters.name,
                                            mode: 'insensitive',
                                        },
                                    }
                                  : {}),
                              ...(filters.code
                                  ? {
                                        code: {
                                            contains: filters.code,
                                            mode: 'insensitive',
                                        },
                                    }
                                  : {}),
                          },
                      },
                  }
                : {},
        [filters, isFiltering]
    )
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data = [] } = useFindManyGraduationDecision({
        where,
        include: {
            student: {
                include: {
                    userProfile: true,
                },
            },
            trainingMajor: true,
            diplomaType: true,
            finalRanking: true,
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        finalGpa: filters.finalGpa,
                    },
                ],
                !!filters.finalGpa
            ),
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountGraduationDecision({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey={'key'}
                        data={data}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                dataIndex: 'code',
                                width: 120,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 200,
                                dataIndex: 'name',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Ngày duyệt đơn',
                                dataIndex: 'decisionDate',
                                align: 'center',
                                type: 'date',
                                width: 130,
                                render: (_, record) =>
                                    record.decisionDate
                                        ? dayjs(record.decisionDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Ghi chú của hội đồng',
                                width: 200,
                                render: (_, record) => record?.notes,
                            },
                            {
                                title: 'GPA cuối cùng',
                                align: 'center',
                                width: 100,
                                dataIndex: 'finalGpa',
                                type: 'order',
                                render: (_, record) => record?.finalGpa?.toNumber(),
                            },
                            {
                                title: 'Loại bằng',
                                align: 'center',
                                type: 'select',
                                options: diplomaTypeData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                width: 100,
                                render: (_, record) => record?.diplomaType?.name,
                            },
                            {
                                title: 'Số hiệu văn bằng',
                                align: 'center',
                                dataIndex: 'diplomaNumber',
                                type: 'input',
                                width: 120,
                                render: (_, record) => record?.diplomaNumber,
                            },
                            {
                                title: 'Ngày cấp bằng',
                                dataIndex: 'diplomaIssueDate',
                                align: 'center',
                                type: 'date',
                                width: 120,
                                render: (_, record) =>
                                    record.diplomaIssueDate
                                        ? dayjs(record.diplomaIssueDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Xếp loại',
                                align: 'center',
                                fixed: 'right',
                                // type: 'select',
                                // dataIndex: 'classification',
                                width: 100,
                                render: (_, record) => record?.finalRanking?.classification,
                            },
                        ]}
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

GraduationDecisionDiploma.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
