import { EyeOutlined, PlusCircleOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { SurveyObjectType } from '@workspace/db'
import {
    useCountSurvey,
    useFindManySurvey,
    useFindManySurveyObjectType,
    useFindManySurveyTopic,
    useUpdateSurvey,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function TabDotKhaoSat() {
    const { can } = useAbility()
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
        [
            filters.name,
            filters.surveyTopicId,
            filters.surveyObjectTypeId,
            filters.startDate,
            filters.endDate,
        ]
    )

    const { data = [], refetch } = useFindManySurvey({
        where,
        include: {
            surveyObjectType: true,
            surveyTopic: true,
            surveyQuestion: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurvey({ where: { ...where, deletedAt: null } })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutSurveyModal',
    })
    const { onOpen: onOpenKhaoSat } = useDisclosure<{ dataTable: any[]; id: string }>({
        tag: 'ThongTinKhaoSatModal',
    })

    const { onOpen: onOpenSurveyExamModal } = useDisclosure<{ id: string; surveyTopicId: string }>({
        tag: 'PutSurveyExamModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleModalCreateExam = (value: { id: string; surveyTopicId: string }) => {
        onOpenSurveyExamModal(value)
    }
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
            refetch()
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

    const { data: surveyTopicData } = useFindManySurveyTopic({ orderBy: { createdAt: 'desc' } })
    const { data: surveyObjectTypeData } = useFindManySurveyObjectType({
        orderBy: { name: 'asc' },
    })
    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
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
                                title: 'Tên đợt khảo sát',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Chủ đề khảo sát',
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
                                title: 'Đối tượng khảo sát',
                                dataIndex: 'surveyObjectTypeId',
                                type: 'select',
                                options: surveyObjectTypeData?.map(({ id, name }) => ({
                                    value: id,
                                    label: name,
                                })),
                                render: (_, record) =>
                                    record?.surveyObjectType?.length
                                        ? record?.surveyObjectType
                                              .map((i: SurveyObjectType) => i.name)
                                              .join(',')
                                        : '',
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
                                    record?.endDate
                                        ? dayjs(record?.endDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Thao tác',
                                width: 110,
                                align: 'center',
                                render: (
                                    _,
                                    { id, surveyTopicId, surveyQuestion, surveyObjectType }
                                ) => (
                                    <Row className="justify-end gap-2">
                                        {surveyQuestion?.length > 0 && (
                                            <Tooltip title={'Xem đề khảo sát'} placement="top">
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
                                        <Tooltip title={'Tạo đề khảo sát'} placement="top">
                                            <PlusCircleOutlined
                                                onClick={() =>
                                                    handleModalCreateExam({ id, surveyTopicId })
                                                }
                                            />
                                        </Tooltip>
                                        <EditIcon
                                            onClick={onOpen.bind(null, id)}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
                                            }}
                                        />
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

export default TabDotKhaoSat
