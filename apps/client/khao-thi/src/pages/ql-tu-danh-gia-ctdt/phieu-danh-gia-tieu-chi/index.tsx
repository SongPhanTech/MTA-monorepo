import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { useCountEvaluationPeriod, useFindManyEvaluationPeriod } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Flex, Row } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function CriteriaEvaluationPage() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || 'e59c23ff-d7ef-4b49-b175-c675c4caabbb'

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const router = useRouter()

    const { data: assignments = [] } = useFindManyEvaluationPeriod(
        {
            where: {
                standards: {
                    some: {
                        criteria: {
                            some: {
                                criterionAssignments: {
                                    some: {
                                        lecturer: {
                                            userProfile: {
                                                id: idProfile,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            include: {
                councils: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!idProfile,
        }
    )

    const { data: count } = useCountEvaluationPeriod({
        where: {
            standards: {
                some: {
                    criteria: {
                        some: {
                            criterionAssignments: {
                                some: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Table
                    rowKey="id"
                    data={assignments}
                    columns={[
                        {
                            title: 'STT',
                            width: 30,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Tên đợt đánh giá',
                            width: 200,
                            align: 'center',
                            render: (_, record) => record?.name || '',
                        },
                        {
                            title: 'Hội đồng đánh giá',
                            width: 200,
                            render: (_, record) => {
                                if (!record.councils || record.councils.length === 0) return

                                return (
                                    <div className="text-left">
                                        {record.councils.map(
                                            (council: { id: string; name: string }) => (
                                                <div key={council.id} className="py-0.5">
                                                    - {council.name}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Ngày bắt đầu',
                            width: 150,
                            render: (_, record) =>
                                record?.startDate ? formatDate(record.startDate) : undefined,
                        },
                        {
                            title: 'Ngày kết thúc',
                            width: 150,
                            render: (_, record) =>
                                record?.endDate ? formatDate(record.endDate) : undefined,
                        },
                        {
                            title: 'Thao tác',
                            width: 80,
                            align: 'center',
                            render: (_, record) => {
                                return (
                                    <Flex justify="center" align="center">
                                        <EditIcon
                                            className="text-blue-700 cursor-pointer"
                                            title="Viết phiếu đánh giá"
                                            onClick={() => {
                                                router.push(
                                                    `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_PHIEU_DANH_GIA_TIEU_CHI}/${record.id}`
                                                )
                                            }}
                                        />
                                    </Flex>
                                )
                            },
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
    )
}

CriteriaEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
