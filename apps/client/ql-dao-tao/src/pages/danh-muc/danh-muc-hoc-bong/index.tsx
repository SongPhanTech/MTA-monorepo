import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useCriteriaOperatorOptions } from '@hooks/criteriaOperator'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Prisma, TrainingCourse } from '@workspace/db/client'
import {
    useCountScholarship,
    useDeleteScholarship,
    useDeleteScholarshipCriteria,
    useFindManyScholarship,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Flex, message, Row, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useCriteriaFieldOptions } from '../../../hooks/criteriaField'

export default function Scholarship() {
    const { can, canSome } = useAbility()
    const [expandAll, setExpandAll] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        trainingCourseId: null,
        field: undefined,
        operator: undefined,
    })

    const { options: criteriaFieldOptions, getCriteriaFieldLabel } = useCriteriaFieldOptions()
    const { options: criteriaOperatorOptions, getCriteriaOperatorLabel } =
        useCriteriaOperatorOptions()
    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const where: Prisma.ScholarshipWhereInput = useMemo(
        () =>
            Object.assign(
                {},
                isFiltering
                    ? {
                          ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                              ? {
                                    trainingCourseId: filters.trainingCourseId,
                                }
                              : {}),
                          criteria: {
                              some: {
                                  ...(filters.field
                                      ? Array.isArray(filters.field)
                                          ? {
                                                field: {
                                                    in: filters.field,
                                                },
                                            }
                                          : {
                                                field: {
                                                    equals: filters.field,
                                                },
                                            }
                                      : {}),
                                  ...(filters.operator
                                      ? Array.isArray(filters.operator)
                                          ? {
                                                operator: {
                                                    in: filters.operator,
                                                },
                                            }
                                          : {
                                                operator: {
                                                    equals: filters.operator,
                                                },
                                            }
                                      : {}),
                              },
                          },
                      }
                    : {},
                {
                    trainingCourse: {
                        trainingObjectTypeId,
                    },
                }
            ),
        [filters, isFiltering, trainingObjectTypeId]
    )

    const { data = [], refetch } = useFindManyScholarship({
        where,
        include: {
            criteria: true,
            trainingCourse: {
                include: {
                    trainingObjectType: true,
                },
            },
        },
        orderBy: [{ trainingCourse: { name: 'desc' } }, { rankOrder: 'asc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountScholarship({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenPutHocBong } = useDisclosure<string>({
        tag: 'PutHocBong',
    })

    const { onOpen: onOpenPutScholarshipCriteria } = useDisclosure<{
        scholarshipId: string
        scholarshipCriteriaId: string
    }>({
        tag: 'PutScholarshipCriteria',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteScholarship } = useDeleteScholarship()
    async function handleDeleteScholarship(id: string) {
        try {
            showSpinner()
            await deleteScholarship({ where: { id } })
            message.success('Xóa học bổng thành công')
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

    const { mutateAsync: deleteScholarshipCriteria } = useDeleteScholarshipCriteria()
    async function handleDeleteScholarshipCriteria(id: string) {
        try {
            showSpinner()
            await deleteScholarshipCriteria({ where: { id } })
            message.success('Xóa tiêu chí thành công')
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
        },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={4}>
                            <Select
                                placeholder="Chọn khoá"
                                options={trainingCourseData.map((i: TrainingCourse) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                                style={{ width: '100%' }}
                                onChange={(val) => handleFilterChange('trainingCourseId', val)}
                                allowClear
                            />
                        </Col>

                        <Col span={4}>
                            <Flex justify="end" className="gap-2">
                                <Button onClick={() => setExpandAll(!expandAll)}>
                                    {expandAll ? 'Thu gọn' : 'Mở rộng'}
                                </Button>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                    'THEM'
                                ) && (
                                    <Button onClick={() => onOpenPutHocBong()} type="primary">
                                        <BookPlus />
                                        Thêm mới học bổng
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey={({ code, name, trainingCourse, rankOrder }) =>
                            `${[trainingCourse.name, code, name].filter(Boolean).join(' - ')} (${rankOrder})`
                        }
                        defaultExpandAll={expandAll}
                        currentPage={currentPage}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'Trường được đánh giá',
                                dataIndex: 'field',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'select',
                                options: criteriaFieldOptions,
                                render: (value) => getCriteriaFieldLabel(value),
                            },
                            /* {
                                title: 'Đảo ngược so sánh',
                                dataIndex: 'invert',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            }, */
                            {
                                title: 'So sánh',
                                dataIndex: 'operator',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: criteriaOperatorOptions,
                                render: (value) => getCriteriaOperatorLabel(value),
                            },
                            {
                                title: 'Mốc điểm',
                                dataIndex: 'value',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Điểm cộng',
                                dataIndex: 'bonusValue',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Mô tả',
                                width: 150,
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
                            // {
                            //     title: 'Trạng thái',
                            //     align: 'center',
                            //     width: 130,
                            //     fixed: 'right',
                            //     render: (value, record) => {
                            //         return !record?.active ? (
                            //             <Tag color="error">Không hoạt động</Tag>
                            //         ) : (
                            //             <Tag color="success">Đang hoạt động</Tag>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={() =>
                                                            onOpenPutScholarshipCriteria({
                                                                scholarshipId:
                                                                    record?.scholarshipId,
                                                                scholarshipCriteriaId: record?.id,
                                                            })
                                                        }
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: () =>
                                                                handleDeleteScholarshipCriteria(
                                                                    record?.id
                                                                ),
                                                        }}
                                                    />
                                                )}
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        childrenFieldName="criteria"
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                    'SUA'
                                ) && (
                                    <>
                                        <CreateIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenPutScholarshipCriteria({
                                                    scholarshipId: id,
                                                    scholarshipCriteriaId: '',
                                                })
                                            }}
                                            title="Thêm mới tiêu chí"
                                        />
                                        <EditIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenPutHocBong(id)
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                    </>
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_HOC_BONG,
                                    'XOA'
                                ) && (
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () => handleDeleteScholarship(id),
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        )}
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

Scholarship.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
