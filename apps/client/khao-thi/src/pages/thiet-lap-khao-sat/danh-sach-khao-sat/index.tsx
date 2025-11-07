import { EyeOutlined } from '@ant-design/icons'
import HtmlTruncate from '@components/commons/html-truncate'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import { useCountSurvey, useFindManySurvey } from '@workspace/db/hooks'
import { Col, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function DetailSurveyPage() {
    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        surveyQuestionType: undefined,
        surveyId: undefined,
    })
    const where = useMemo(
        () => ({
            subjectClasses: {
                some: {
                    subjectClassStudent: {
                        some: {
                            student: {
                                userProfile: {
                                    id: profileId,
                                },
                            },
                        },
                    },
                },
            },
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.surveyId
                ? Array.isArray(filters.surveyId)
                    ? { surveyId: { in: filters.surveyId } }
                    : { surveyId: filters.surveyId }
                : {}),
            ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
                ? {
                      type: { in: filters.surveyQuestionType },
                  }
                : {}),
        }),
        [filters.code, filters.name, filters.surveyId, filters.surveyQuestionType, profileId]
    )
    const { data = [], refetch } = useFindManySurvey(
        {
            where,
            include: {
                clusterSurvey: true,
                surveyObjectType: true,
                lecture: {
                    include: {
                        userProfile: true,
                    },
                },
                subjectClasses: {
                    include: {
                        subjectClassStudent: {
                            include: {
                                student: true,
                            },
                        },
                        subject: true,
                    },
                },
                surveyQuestion: true,
                surveySessions: true,
            },
            orderBy: { createdAt: 'desc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!profileId,
        }
    )

    const { data: count } = useCountSurvey({
        where: {
            ...where,
            deletedAt: null,
        },
    })
    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <div className="text-lg font-bold">{data?.[0]?.clusterSurvey?.name}</div>
            </Col>
            <Col span={24}>
                <Table
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    columns={[
                        {
                            title: 'STT',
                            width: 20,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Đối tượng được khảo sát',
                            dataIndex: 'name',
                            type: 'input',
                            render: (__, record) => {
                                return `${record?.lecture?.code} - ${record?.lecture?.userProfile?.lastName} ${record?.lecture?.userProfile?.firstName}`
                            },
                        },
                        {
                            title: 'Lớp môn học',
                            dataIndex: 'name',
                            type: 'input',
                            render: (__, record) => (
                                <HtmlTruncate key="explanation">
                                    <ul>
                                        {record?.subjectClasses?.map((i: any) => (
                                            <li key={i.id}>
                                                {i?.code} - {i?.name}
                                            </li>
                                        ))}
                                    </ul>
                                </HtmlTruncate>
                            ),
                        },
                        {
                            title: 'Ngày bắt đầu',
                            dataIndex: 'startDate',
                            type: 'date',
                            width: 120,
                            render: (_, record) => {
                                return (
                                    <div
                                        className={`${dayjs().isAfter(record?.endDate) ? 'text-red-500' : ''}`}
                                    >
                                        {record?.startDate
                                            ? dayjs(record?.startDate).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                )
                            },
                        },

                        {
                            title: 'Ngày kết thúc',
                            dataIndex: 'endDate',
                            type: 'date',
                            width: 120,
                            render: (_, record) => {
                                return (
                                    <div
                                        className={`${dayjs().isAfter(record?.endDate) ? 'text-red-500' : ''}`}
                                    >
                                        {record?.endDate
                                            ? dayjs(record?.endDate).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Trạng thái',
                            align: 'center',
                            width: 120,
                            render: (_, record) => {
                                return (
                                    <Tag
                                        color={
                                            record?.surveySessions?.length > 0 ? 'green' : 'default'
                                        }
                                    >
                                        {record?.surveySessions?.length > 0 ? 'Đã làm' : 'Chưa làm'}
                                    </Tag>
                                )
                            },
                        },

                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            render: (_, { id, isPublic, surveyQuestion, surveySessions }) => (
                                <Row className="justify-end gap-2">
                                    {surveyQuestion?.length > 0 && (
                                        <Tooltip
                                            className="mr-2"
                                            title={'Làm khảo sát'}
                                            placement="top"
                                        >
                                            <EyeOutlined
                                                disabled={surveySessions?.length > 0}
                                                onClick={() => {
                                                    if (!isPublic) {
                                                        router.push(`/lam-khao-sat/private/${id}`)
                                                    } else {
                                                        router.push(`/lam-khao-sat/${id}`)
                                                    }
                                                }}
                                                style={{ fontSize: '16px' }}
                                            />
                                        </Tooltip>
                                    )}
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
    )
}
DetailSurveyPage.getLayout = function getLayout(page: React.ReactNode) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Thiết lập khảo sát' },
                { title: 'Đợt khảo sát', href: 'thiet-lap-khao-sat/dot-khao-sat' },
                { title: 'Chi tiết khảo sát cụm' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
