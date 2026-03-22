import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma, TrainingCourse } from '@workspace/db/client'
import {
    useCountClassRegisterSession,
    useFindManyClassRegisterSession,
    useFindManyTrainingCourse,
    useUpdateClassRegisterSession,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Select, useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ClassRegisterSession() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        startDate: undefined,
        endDate: undefined,
        trainingCourseId: undefined,
        active: undefined,
    })

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const where = useMemo(
        () =>
            ({
                deletedAt: null,
                ...(filters.code
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
                ...(semesterId
                    ? {
                          semesterId,
                      }
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
                ...(filters.trainingCourseId &&
                    filters.trainingCourseId !== '' && {
                        trainingCourses: {
                            some: {
                                id: filters.trainingCourseId,
                            },
                        },
                    }),
                ...(filters.active !== undefined && {
                    active:
                        String(filters.active) === 'true'
                            ? true
                            : String(filters.active) === 'false'
                              ? false
                              : undefined,
                }),
                trainingCourses: {
                    some: {
                        trainingObjectTypeId,
                    },
                },
            }) satisfies Prisma.ClassRegisterSessionWhereInput,
        [filters, semesterId, trainingObjectTypeId]
    )

    const { data } = useFindManyClassRegisterSession({
        where,
        include: { semester: { include: { schoolYear: true } }, trainingCourses: true },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountClassRegisterSession({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: { active: true, trainingObjectTypeId, deletedAt: null },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    const trainingCourseOptions = useMemo(
        () =>
            trainingCourseData.map((i: TrainingCourse) => ({
                value: i.id,
                label: i.name,
            })),
        [trainingCourseData]
    )

    const { onOpen: onOpenPutClassRegisterSession } = useDisclosure<string>({
        tag: 'PutClassRegisterSession',
    })

    const { mutateAsync: deleteClassRegisterSession } = useUpdateClassRegisterSession()
    async function handleDeleteClassRegisterSession(id: string) {
        try {
            showSpinner()
            await deleteClassRegisterSession({
                where: { id },
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

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Row gutter={[16, 16]} align="top">
                                <Col span={8}>
                                    <Select
                                        placeholder="Chọn khoá"
                                        options={trainingCourseOptions}
                                        style={{ width: '100%' }}
                                        onChange={(val) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                trainingCourseId: val,
                                            }))
                                        }
                                        allowClear
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Flex justify="end" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                                    'THEM'
                                ) && (
                                    <Button
                                        type="primary"
                                        onClick={() => onOpenPutClassRegisterSession()}
                                    >
                                        <BookPlus />
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
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
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * numberOfPages,
                            },
                            // {
                            //     title: 'Mã đợt đăng ký',
                            //     align: 'center',
                            //     dataIndex: 'code',
                            //     type: 'input',
                            //     width: 100,
                            //     fixed: 'left',
                            // },
                            {
                                title: 'Tên đợt đăng ký',
                                align: 'center',
                                dataIndex: 'name',
                                type: 'input',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Học kỳ',
                                align: 'center',
                                width: 150,
                                render: (_, record) => record?.semester?.name,
                            },
                            {
                                title: 'Khoá học',
                                align: 'center',
                                width: 150,
                                render: (_, record) => (
                                    <div className="text-left">
                                        {record?.trainingCourses?.map(
                                            (i: TrainingCourse, index: number) => (
                                                <div key={`${index + 1}`}>- {i.name}</div>
                                            )
                                        )}
                                    </div>
                                ),
                            },
                            {
                                title: 'Ngày bắt đầu',
                                align: 'center',
                                width: 120,
                                dataIndex: 'startDate',
                                type: 'date',
                                render: (_, record) =>
                                    record?.startDate
                                        ? dayjs(record?.startDate).format('HH:mm - DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                align: 'center',
                                width: 120,
                                dataIndex: 'endDate',
                                type: 'date',
                                render: (_, record) =>
                                    record?.endDate
                                        ? dayjs(record?.endDate).format('HH:mm - DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Mô tả',
                                width: 200,
                                align: 'center',
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return (
                                        <Tooltip title={value}>
                                            <div className="line-clamp-2">{value}</div>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                fixed: 'right',
                                dataIndex: 'active',
                                type: 'select',
                                options: [
                                    {
                                        value: true,
                                        label: 'Đang mở',
                                    },
                                    {
                                        value: false,
                                        label: 'Đã đóng',
                                    },
                                ],
                                render: (__, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Đã đóng</Tag>
                                    ) : (
                                        <Tag color="success">Đang mở</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                                    'XEM_CHI_TIET',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                                            'XEM_CHI_TIET'
                                        ) && (
                                            <Tooltip title="Xem các đơn đăng ký" placement="top">
                                                <EyeOutlined
                                                    onClick={() => {
                                                        router.push(
                                                            ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE_ID.replace(
                                                                '[id]',
                                                                id
                                                            )
                                                        )
                                                    }}
                                                    className="text-sm cursor-pointer"
                                                />
                                            </Tooltip>
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={(e) => {
                                                    onOpenPutClassRegisterSession(id)
                                                    e?.stopPropagation()
                                                }}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: (e) => {
                                                        handleDeleteClassRegisterSession(id)
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
        </div>
    )
}

ClassRegisterSession.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
