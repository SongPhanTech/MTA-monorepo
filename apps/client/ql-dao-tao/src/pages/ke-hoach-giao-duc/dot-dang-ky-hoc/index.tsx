import { EyeOutlined } from '@ant-design/icons'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { type TrainingCourse, TrainingObjectTypes } from '@workspace/db'
import {
    useCountClassRegisterSession,
    useDeleteClassRegisterSession,
    useFindManyClassRegisterSession,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Select, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ClassRegisterSession() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        startDate: undefined,
        endDate: undefined,
        semesterId: undefined,
        trainingCourseId: undefined,
        active: undefined,
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
            ...(filters.semesterId
                ? {
                      semesterId: {
                          in: Array.isArray(filters.semesterId)
                              ? filters.semesterId
                              : [filters.semesterId],
                      },
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
        }),
        [
            filters.name,
            filters.semesterId,
            filters.startDate,
            filters.endDate,
            filters.trainingCourseId,
            filters.active,
        ]
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
        where: { active: true, trainingObjectType: { type: TrainingObjectTypes.CIVILIAN } },
        orderBy: { createdAt: 'desc' },
    })

    const { onOpen: onOpenPutClassRegisterSession } = useDisclosure<string>({
        tag: 'PutClassRegisterSession',
    })

    const { mutateAsync: deleteClassRegisterSession } = useDeleteClassRegisterSession()
    async function handleDeleteClassRegisterSession(id: string) {
        try {
            showSpinner()
            await deleteClassRegisterSession({
                where: { id },
            })
        } catch (_error) {
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
                                    <TreeSelectSemester
                                        onChange={(val) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                semesterId: val,
                                            }))
                                        }
                                    />
                                </Col>
                                <Col span={8}>
                                    <Select
                                        placeholder="Chọn khóa"
                                        options={trainingCourseData.map((i: TrainingCourse) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        })}
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
                                <Button
                                    type="primary"
                                    onClick={() => onOpenPutClassRegisterSession()}
                                >
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        onRowClick={({ id }) => {
                            router.push(
                                `${ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC_DOT_DANG_KY_HOC}/${id}`
                            )
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên đợt đăng ký',
                                align: 'center',
                                dataIndex: 'name',
                                type: 'input',
                                width: 120,
                                fixed: 'left',
                            },
                            {
                                title: 'Học kỳ',
                                align: 'center',
                                width: 150,
                                render: (_, record) =>
                                    [record?.semester?.name, record?.semester?.schoolYear?.name]
                                        .filter(Boolean)
                                        .join(' - '),
                            },
                            {
                                title: 'Khóa học',
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
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Xem các đơn đăng ký" placement="top">
                                            <EyeOutlined className="text-sm cursor-pointer" />
                                        </Tooltip>
                                        <EditIcon
                                            onClick={(e) => {
                                                onOpenPutClassRegisterSession(id)
                                                e?.stopPropagation()
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
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
