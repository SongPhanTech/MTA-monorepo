import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { cn } from '@lib/utils'
import { Survey } from '@workspace/db'
import {
    useCountClusterSurvey,
    useFindManyClusterSurvey,
    useFindManySurveyTopic,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Checkbox, Col, Flex, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function TabDotKhaoSatCum({
    selectedId,
    setSelectedId,
}: {
    selectedId: string
    setSelectedId: (value: string) => void
}) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        surveyObjectTypeId: undefined,
        surveyTopicId: undefined,
        startDate: undefined,
        endDate: undefined,
    })
    const router = useRouter()
    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.surveyObjectTypeId
                ? {
                      surveyObjectType: {
                          some: {
                              id: {
                                  in: filters.surveyObjectTypeId,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.surveyTopicId
                ? Array.isArray(filters.surveyTopicId)
                    ? filters.surveyTopicId.length > 1
                        ? { surveyTopicId: { in: filters.surveyTopicId } }
                        : { surveyTopicId: { equals: filters.surveyTopicId[0] } }
                    : { surveyTopicId: { equals: filters.surveyTopicId } }
                : {}),
            ...(filters.startDate?.length === 2
                ? {
                      startDate: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      endDate: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }),
        [filters]
    )

    const { data = [], refetch } = useFindManyClusterSurvey({
        where,
        include: {
            surveyObjectType: true,
            surveyTopic: true,
            surveyQuestion: true,
            surveys: {
                include: {
                    surveySessions: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count, refetch: refetchCount } = useCountClusterSurvey({
        where: { ...where, deletedAt: null },
    })

    const { onOpen } = useDisclosure<{ id: string; type: string }>({
        tag: 'PutSurveyModal',
        onClose: () => {
            refetch()
            refetchCount()
        },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: '', type: 'multiple' })
    }

    // const { mutateAsync: updateSurvey } = useUpdateClusterSurvey()

    async function handleDelete(id: string, surveys: Survey[]) {
        try {
            showSpinner()
            let listTranssition: any = [
                {
                    model: 'ClusterSurvey',
                    operation: 'update',
                    data: {
                        where: {
                            id,
                        },
                        data: {
                            deletedAt: new Date(),
                        },
                    },
                },
            ]
            if (surveys?.length > 0) {
                listTranssition = [
                    {
                        model: 'ClusterSurvey',
                        operation: 'update',
                        data: {
                            where: {
                                id,
                            },
                            data: {
                                deletedAt: new Date(),
                            },
                        },
                    },
                    ...surveys.map((i: Survey) => {
                        return {
                            model: 'Survey',
                            operation: 'update',
                            data: {
                                where: {
                                    id: i.id,
                                },
                                data: {
                                    deletedAt: new Date(),
                                },
                            },
                        }
                    }),
                ]
            }

            const res = await sqlTransaction(listTranssition)
            if (res?.status === 200) {
                message.success('Xóa thành công')
                refetch()
                refetchCount()
            }
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

    const disabledDelete = useMemo(() => {
        if (data?.length > 0) {
            const result = data.find((i: any) => i?.surveys?.surveySessions?.length > 0)
            if (result) {
                return true
            }
        }

        return false
    }, [data])

    const { data: surveyTopicData } = useFindManySurveyTopic({ orderBy: { createdAt: 'desc' } })

    return (
        <div>
            <Row gutter={[16, 8]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end">
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary" size="small">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        className="h-[calc(100vh-200px)]"
                        rowKey={'id'}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    setSelectedId(record.id)
                                },
                                className: cn(selectedId === record.id ? 'bg-orange-200' : ''),
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
                                title: 'Tên đợt KS',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Chủ đề KS',
                                dataIndex: 'surveyTopicId',
                                type: 'select',
                                options: surveyTopicData?.map(({ id, name }) => ({
                                    value: id,
                                    label: name,
                                })),
                                render: (_, record) =>
                                    record?.surveyTopic ? record?.surveyTopic.name : '',
                            },
                            {
                                title: 'Công khai',
                                dataIndex: 'isPublic',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                options: [
                                    {
                                        value: true,
                                        label: 'Công khai',
                                    },
                                    {
                                        value: false,
                                        label: 'Nội bộ',
                                    },
                                ],
                                render: (_, record) => {
                                    return <Checkbox checked={record?.isPublic} />
                                },
                            },

                            {
                                title: 'Ẩn danh',
                                dataIndex: 'anonymous',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                options: [
                                    {
                                        value: true,
                                        label: 'Ẩn danh',
                                    },
                                    {
                                        value: false,
                                        label: 'Không ẩn danh',
                                    },
                                ],
                                render: (_, record) => {
                                    return <Checkbox checked={record?.anonymous} />
                                },
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
                                title: 'Thao tác',
                                width: 120,
                                align: 'center',
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                    'THEM',
                                    'SUA',
                                    'XOA',
                                    'XEM_CHI_TIET'
                                ),
                                render: (_, { id, surveyQuestion, surveys }) => (
                                    <Row className="justify-center gap-2">
                                        {/* {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                            'XEM_CHI_TIET'
                                        ) &&  (
                                            <Tooltip
                                                className="mr-2"
                                                title={'Báo cáo khảo sát'}
                                                placement="top"
                                            >
                                                <EyeOutlined
                                                    onClick={() => {
                                                        router.push(`/bao-cao-khao-sat/${id}`)
                                                    }}
                                                    style={{ fontSize: '16px' }}
                                                />
                                            </Tooltip>
                                        )} */}

                                        {surveyQuestion?.length > 0 &&
                                            can(
                                                KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                                'XEM_CHI_TIET'
                                            ) && (
                                                <Tooltip
                                                    className="mr-2"
                                                    title={'Xem đề khảo sát'}
                                                    placement="top"
                                                >
                                                    <EyeOutlined
                                                        onClick={() => {
                                                            router.push(
                                                                `/thiet-lap-khao-sat/dot-khao-sat/${id}`
                                                            )
                                                        }}
                                                        style={{ fontSize: '16px' }}
                                                    />
                                                </Tooltip>
                                            )}

                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_DOT_KHAO_SAT,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                disabled={disabledDelete}
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(id, surveys),
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
        </div>
    )
}

export default TabDotKhaoSatCum
