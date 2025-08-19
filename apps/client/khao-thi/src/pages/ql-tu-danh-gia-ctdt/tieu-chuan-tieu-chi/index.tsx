import { EyeOutlined } from '@ant-design/icons'
import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilte'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutCriterionCatalog, PutStandardCatalog } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountStandardCatalog,
    useDeleteCriterionCatalog,
    useDeleteStandardCatalog,
    useFindManyScoreScaleCatalog,
    useFindManyStandardCatalog,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, message, Row, Tooltip } from 'antd'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function StandardCatalog() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        order: undefined,
        name: '',
        searchText: '',
        scoreScalesId: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.searchText && {
                name: {
                    contains: filters.searchText,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.name && {
                criteria: {
                    some: {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                },
            }),
            ...(filters.scoreScalesId && {
                criteria: {
                    some: {
                        scoreScaleId: Array.isArray(filters.scoreScalesId)
                            ? filters.scoreScalesId.length > 1
                                ? { in: filters.scoreScalesId }
                                : { equals: filters.scoreScalesId[0] }
                            : { equals: filters.scoreScalesId },
                    },
                },
            }),
        }),
        [filters.searchText, filters.name, filters.scoreScalesId]
    )

    const { data, refetch } = useFindManyStandardCatalog({
        where,
        include: {
            criteria: {
                where: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                    ...(filters.scoreScalesId && {
                        scoreScaleId: Array.isArray(filters.scoreScalesId)
                            ? filters.scoreScalesId.length > 1
                                ? { in: filters.scoreScalesId }
                                : { equals: filters.scoreScalesId[0] }
                            : { equals: filters.scoreScalesId },
                    }),
                },
                include: {
                    scoreScale: true,
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                order: filters.order,
                            },
                        ],
                        !!filters.order
                    ),
                    { order: 'asc' },
                ],
            },
        },
        orderBy: [{ order: 'asc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountStandardCatalog({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: scoreScales } = useFindManyScoreScaleCatalog()

    const { onOpen: onOpenPutStandardCatalog } = useDisclosure<{ id: string; count: number }>({
        tag: PutStandardCatalog.name,
    })

    const { onOpen: onOpenPutCriterionCatalog } = useDisclosure<{
        id: string
        standardId: string
    }>({
        tag: PutCriterionCatalog.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteStandardCatalog } = useDeleteStandardCatalog()
    async function handleDeleteStandardCatalog(id: string) {
        try {
            showSpinner()
            await deleteStandardCatalog({
                where: { id },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: deleteCriterionCatalog } = useDeleteCriterionCatalog()
    async function handleDeleteCriterionCatalog(id: string) {
        try {
            showSpinner()
            await deleteCriterionCatalog({
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
                    <Row gutter={[16, 16]} align="top">
                        <Col span={12}>
                            <Flex>
                                <Col span={10}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    searchText: e.target.value,
                                                })
                                            }
                                            className="py-0 h-8"
                                            placeholder="Tìm kiếm tiêu chuẩn đánh giá CTĐT"
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        {/* Thêm mới */}
                        <Col span={12}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        onOpenPutStandardCatalog({ id: '', count: count || 0 })
                                    }}
                                >
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey={({ order, name }) =>
                            `${[order, name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="criteria"
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        headerRight={(record) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutCriterionCatalog({
                                            id: '',
                                            standardId: record?.id,
                                        })
                                    }}
                                    title="Thêm mới phiên bản"
                                />
                                <EditIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutStandardCatalog({
                                            id: record?.id,
                                            count: count || 0,
                                        })
                                    }}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: (e) => {
                                            handleDeleteStandardCatalog(record?.id)
                                            e?.stopPropagation()
                                        },
                                        onCancel: (e) => {
                                            e?.stopPropagation()
                                        },
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        onRowClick={({ id }) => {
                            router.push(
                                `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI}/${id}`
                            )
                        }}
                        columns={[
                            {
                                title: 'Thứ tự',
                                dataIndex: 'order',
                                width: 200,
                                align: 'center',
                                type: 'order',
                            },
                            {
                                title: 'Tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên',
                                dataIndex: 'scoreScalesId',
                                width: 200,
                                align: 'center',
                                type: 'select',
                                options: scoreScales?.map(({ id, name, passFrom }) => ({
                                    value: id,
                                    label: passFrom ? `${name} (${passFrom} điểm để đạt)` : name,
                                })),
                                render: (_, record) =>
                                    record?.scoreScale?.passFrom
                                        ? `${record?.scoreScale?.name} (${record?.scoreScale?.passFrom} điểm để qua)`
                                        : record?.scoreScale?.name,
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
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <Tooltip title="Chi tiết tiêu chí" placement="top">
                                                    <EyeOutlined className="text-sm cursor-pointer" />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutCriterionCatalog({
                                                            id: record?.id,
                                                            standardId: record?.standardId,
                                                        })
                                                        console.log(record?.lenght)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteCriterionCatalog(record?.id)
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => {
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
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

StandardCatalog.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
