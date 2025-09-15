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
import type { Prisma, TrainingCourse } from '@workspace/db'
import {
    useCountScholarship,
    useFindManyScholarship,
    useFindManyTrainingCourse,
    useUpdateScholarship,
    useUpdateScholarshipCriteria,
} from '@workspace/db/hooks'
import { Button, Checkbox, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useCriteriaFieldOptions } from '../../../hooks/criteriaField'

export default function Scholarship() {
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

    const where: Prisma.ScholarshipWhereInput = useMemo(
        () =>
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
        [filters, isFiltering]
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
        orderBy: {
            rankOrder: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountScholarship({
        where,
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

    const { mutateAsync: updateScholarship } = useUpdateScholarship()
    async function handleDeleteScholarship(id: string) {
        try {
            showSpinner()
            await updateScholarship({
                where: { id },
                data: { deletedAt: new Date() },
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

    const { mutateAsync: updateScholarshipCriteria } = useUpdateScholarshipCriteria()
    async function handleDeleteScholarshipCriteria(id: string) {
        try {
            showSpinner()
            await updateScholarshipCriteria({
                where: { id },
                data: { deletedAt: new Date() },
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={4}>
                            <Select
                                placeholder="Chọn khóa"
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
                            <Flex justify="end" gap={4}>
                                <Button onClick={() => onOpenPutHocBong()} type="primary">
                                    <BookPlus />
                                    Thêm mới học bổng
                                </Button>
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
                        defaultExpandAll
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
                            {
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
                            },
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
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                fixed: 'right',
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
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
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={() =>
                                                        onOpenPutScholarshipCriteria({
                                                            scholarshipId: record?.scholarshipId,
                                                            scholarshipCriteriaId: record?.id,
                                                        })
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteScholarshipCriteria(
                                                                record?.id
                                                            ),
                                                    }}
                                                />
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
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDeleteScholarship(id),
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
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
