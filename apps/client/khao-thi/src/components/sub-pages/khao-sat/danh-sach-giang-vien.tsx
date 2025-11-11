import { BarChartOutlined, EyeOutlined } from '@ant-design/icons'
import HtmlTruncate from '@components/commons/html-truncate'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { cn } from '@lib/utils'
import { useCountSurvey, useFindManySurvey, useUpdateSurvey } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function DetailSurveyPage({
    selectedId,
    surveyId,
    setSurveyId,
}: {
    selectedId: string
    surveyId: string
    setSurveyId: (value: string) => void
}) {
    const { can, canSome } = useAbility()

    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
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
            clusterSurveyId: selectedId,
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
        [filters.code, filters.name, filters.surveyId, filters.surveyQuestionType, selectedId]
    )
    const { data = [] } = useFindManySurvey(
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
            enabled: !!selectedId,
        }
    )

    const { onOpen } = useDisclosure<{ id: string; type: string }>({
        tag: 'PutSurveyModal',
    })

    const { onOpen: onOpenKhaoSat } = useDisclosure<{ dataTable: any[]; id: string }>({
        tag: 'ThongTinKhaoSatModal',
    })

    const { mutateAsync: updateSurvey } = useUpdateSurvey()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurvey({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

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
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                setSurveyId(record.id)
                            },
                            className: cn(surveyId === record.id ? 'bg-orange-200' : ''),
                        }
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
                            title: 'Giảng viên',
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
                                <HtmlTruncate>
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
                            render: (_, record) =>
                                record?.startDate
                                    ? dayjs(record?.startDate).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Ngày kết thúc',
                            dataIndex: 'endDate',
                            type: 'date',
                            render: (_, record) =>
                                record?.endDate ? dayjs(record?.endDate).format('DD/MM/YYYY') : '',
                        },

                        {
                            title: 'Thao tác',
                            width: 130,
                            align: 'center',
                            hidden: !canSome(
                                KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                'THEM',
                                'SUA',
                                'XOA',
                                'XEM_CHI_TIET'
                            ),
                            render: (
                                _,
                                { id, isPublic, surveyQuestion, surveyObjectType, surveySessions }
                            ) => (
                                <Row className="justify-end gap-2">
                                    {can(
                                        KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                        'XEM_CHI_TIET'
                                    ) &&
                                        surveySessions.length > 0 && (
                                            <Tooltip
                                                className="mr-2"
                                                title={'Báo cáo khảo sát'}
                                                placement="top"
                                            >
                                                <BarChartOutlined
                                                    onClick={() => {
                                                        router.push(`/bao-cao-khao-sat/${id}`)
                                                    }}
                                                    style={{ fontSize: '16px' }}
                                                />
                                            </Tooltip>
                                        )}

                                    {surveyQuestion?.length > 0 &&
                                        can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                            'XEM_CHI_TIET'
                                        ) &&
                                        !!isPublic && (
                                            <Tooltip
                                                className="mr-2"
                                                title={'Xem đề khảo sát'}
                                                placement="top"
                                            >
                                                <EyeOutlined
                                                    onClick={() => {
                                                        onOpenKhaoSat({
                                                            dataTable: surveyObjectType,
                                                            id: id,
                                                        })
                                                        // router.push(`/lam-khao-sat/${id}`)
                                                    }}
                                                    style={{ fontSize: '16px' }}
                                                />
                                            </Tooltip>
                                        )}
                                    {can(
                                        KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                        'SUA'
                                    ) && (
                                        <EditIcon
                                            disabled={surveySessions.length > 0}
                                            onClick={() => onOpen({ id, type: 'one' })}
                                            className="text-sm text-blue-700 cursor-pointer mr-2"
                                        />
                                    )}

                                    {can(
                                        KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                        'XOA'
                                    ) && (
                                        <DeleteIcon
                                            disabled={surveySessions.length > 0}
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
                                            }}
                                        />
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
