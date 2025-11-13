import { BarChartOutlined, EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ExportLecturerInSurvey from '@components/modal/export-list-lecturer-in-survey'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { cn } from '@lib/utils'
import { useCountSurvey, useFindManySurvey, useUpdateSurvey } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Col, Flex, message, Row, Tooltip } from 'antd'
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
        subjectClassName: undefined,
        startDate: undefined,
        endDate: undefined,
        idCardNumber: undefined,
        phoneNumber: undefined,
        organizationId: undefined,
    })
    const where = useMemo(
        () => ({
            clusterSurveyId: selectedId,
            ...(filters.name && filters.name !== ''
                ? {
                      lecture: {
                          OR: [
                              {
                                  code: {
                                      contains: filters.name,
                                      mode: 'insensitive' as const,
                                  },
                              },
                              {
                                  userProfile: {
                                    OR: [
                                        {
                                            firstName: {
                                                contains: filters.name,
                                                mode: 'insensitive' as const,
                                            },
                                        },
                                        {
                                            lastName: {
                                                contains: filters.name,
                                                mode: 'insensitive' as const,
                                            },
                                        },
                                    ]
                                  },
                              },
                          ],
                      },
                  }
                : {}),

            ...(filters.subjectClassName && filters.subjectClassName !== ''
                ? {
                     subjectClass:{
                        OR: [
                            {
                                    code: {
                                      contains: filters.subjectClassName,
                                      mode: 'insensitive' as const,
                                  },
                            },
                               {
                                    name: {
                                      contains: filters.subjectClassName,
                                      mode: 'insensitive' as const,
                                  },
                            }
                        ]
                     }
                  }
                : {}),
                    ...(filters.idCardNumber && filters.idCardNumber !== ''
                ? {
                 lecture: {
                     userProfile: {
                         idCardNumber: {
                             contains: filters.idCardNumber,
                             mode: 'insensitive' as const,
                         },
                     }
                 }
                  }
                : {}),
            ...(filters.phoneNumber && filters.phoneNumber !== ''
                ? {
                 lecture: {
                     userProfile: {
                         phoneNumber: {
                             contains: filters.phoneNumber,
                             mode: 'insensitive' as const,
                         },
                     }
                 }
                  }
                : {}),
                      ...(filters.organizationId && filters.organizationId !== ''
                ? {
                 lecture: {
                     organization:{
                        OR:[
                            {
                                    sMa: {
                                      contains: filters.organizationId,
                                      mode: 'insensitive' as const,
                                  },
                            },
                               {
                                    sTen: {
                                      contains: filters.organizationId,
                                      mode: 'insensitive' as const,
                                  },
                            }
                        ]
                     }
                 }
                  }
                : {}),
        }),
        [filters, selectedId]
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
                        organization: true,
                    },
                },
                subjectClass: {
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
        <Row gutter={[16, 4]}>
            <Col span={24}>
            <Flex align="center" justify="space-between">
                <div className="text-lg font-bold">{data?.[0]?.clusterSurvey?.name}</div>
                <ExportLecturerInSurvey query={where} surveyName={data?.[0]?.clusterSurvey?.name ||''}/>
            </Flex>

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
                            title: 'Lớp môn học',
                            dataIndex: 'name',
                            type: 'input',
                            render: (__, record) => (
                                <>
                                    {record?.subjectClass?.code} - {record?.subjectClass?.name}
                                </>
                            ),
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
                            title: 'CCCD',
                            dataIndex: 'idCardNumber',
                            type: 'input',
                            align: 'center',
                            render: (__, record) => {
                                return record?.lecture?.userProfile?.idCardNumber || ''
                            },
                        },
                        {
                            title: 'SĐT',
                            dataIndex: 'phoneNumber',
                            type: 'input',
                            align: 'center',
                            render: (__, record) => {
                                return record?.lecture?.userProfile?.phoneNumber || ''
                            },
                        },
                        {
                            title: 'ĐVQL',
                            dataIndex: 'organizationId',
                            type: 'input',
                            width: 100,
                            align: 'center',
                            render: (__, record) => {
                                return record?.lecture?.organization?.sMa || ''
                            },
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
                            width: 80,
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
