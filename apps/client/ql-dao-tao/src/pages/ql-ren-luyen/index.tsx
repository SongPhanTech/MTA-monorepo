import { EyeOutlined } from '@ant-design/icons'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingScoreSession,
    useFindManyTrainingObjectType,
    useFindManyTrainingScoreSession,
    useUpdateTrainingScoreSession,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function SubjectClassScore() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { showSpinner, hideSpinner } = useSpinner()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        semesterId: undefined,
        trainingObjectTypes: undefined,
        startDate: undefined,
    })

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutDotRenLuyen',
    })

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
            ...(filters.startDate?.length === 2
                ? {
                      time: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.trainingObjectTypes
                ? {
                      trainingObjectTypeId: {
                          in: filters.trainingObjectTypes,
                      },
                  }
                : {}),
            ...(filters.semesterId
                ? {
                      semesterId: {
                          in: Array.isArray(filters.semesterId)
                              ? filters.semesterId
                              : [filters.semesterId],
                      },
                  }
                : {}),
        }),
        [filters.startDate, filters.name, filters.trainingObjectTypes, filters.semesterId]
    )

    const { data = [], refetch } = useFindManyTrainingScoreSession({
        where,
        include: {
            trainingObjectType: true,
            semester: {
                include: {
                    schoolYear: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingScoreSession({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { mutateAsync: updateTrainingScoreSession } = useUpdateTrainingScoreSession()
    const handleDeleteDotDanhGia = async (id: string) => {
        try {
            showSpinner()
            await updateTrainingScoreSession({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa đợt đánh giá thành công')
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div>
            <Row>
                <Col span={24} className="flex justify-end">
                    <Row>
                        <Col span={20}>
                            <Row gutter={[16, 16]} align="top" justify="space-between">
                                <Col span={12}>
                                    <Flex>
                                        <Col span={10}>
                                            <Form.Item
                                                className="mb-0"
                                                name="semesterId"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <TreeSelectSemester
                                                    onChange={(val) =>
                                                        setFilters({
                                                            ...filters,
                                                            semesterId: val,
                                                        })
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Flex>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={4}>
                            <Flex justify="end" gap={10}>
                                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'THEM') && (
                                    <Button type="primary" onClick={() => onOpen()}>
                                        <BookPlus />
                                        Thêm mới đợt đánh giá
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                        <Col span={24}>
                            <Table
                                rowKey="id"
                                id="training-category"
                                filters={filters}
                                setFilters={(value) => {
                                    setFilters(value)
                                    setCurrentPage(1)
                                }}
                                onRowClick={({ id }) => {
                                    if (
                                        can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                            'XEM_CHI_TIET'
                                        )
                                    ) {
                                        router.push(`${ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN}/${id}`)
                                    }
                                }}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        align: 'center',
                                        fixed: 'left',
                                        render: (_, __, index) =>
                                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                    },
                                    {
                                        title: 'Đợt đánh giá',
                                        dataIndex: 'name',
                                        width: 150,
                                        align: 'center',
                                        type: 'input',
                                    },
                                    {
                                        title: 'Học kỳ',
                                        width: 150,
                                        align: 'center',
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
                                        title: 'Đối tượng',
                                        width: 150,
                                        dataIndex: 'trainingObjectTypes',
                                        align: 'center',
                                        type: 'select',
                                        options: trainingObjectTypeData.map(
                                            (i: TrainingObjectType) => ({
                                                value: i.id,
                                                label: i.name,
                                            })
                                        ),
                                        render: (text, record) => {
                                            return record?.trainingObjectType?.name
                                        },
                                    },
                                    {
                                        title: 'Thời gian',
                                        dataIndex: 'startDate',
                                        width: 150,
                                        align: 'center',
                                        type: 'date',
                                        render: (_, record) =>
                                            record?.time &&
                                            dayjs(record?.time).format('DD/MM/YYYY'),
                                    },
                                    {
                                        title: 'Mô tả',
                                        align: 'center',
                                        dataIndex: 'description',
                                        width: 150,
                                    },
                                    {
                                        title: 'Thao tác',
                                        dataIndex: 'action',
                                        width: 150,
                                        align: 'center',
                                        hidden: !canSome(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                            'XEM_CHI_TIET',
                                            'SUA',
                                            'XOA'
                                        ),
                                        render: (text, record) => (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip title="Xem chi tiết" placement="top">
                                                        <EyeOutlined className="text-sm cursor-pointer" />
                                                    </Tooltip>
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                        onClick={(e) => {
                                                            onOpen(record.id)
                                                            e.stopPropagation()
                                                        }}
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDeleteDotDanhGia(record.id)
                                                                e?.stopPropagation()
                                                            },
                                                            onCancel: (e) => {
                                                                e?.stopPropagation()
                                                            },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
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
                </Col>
            </Row>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
