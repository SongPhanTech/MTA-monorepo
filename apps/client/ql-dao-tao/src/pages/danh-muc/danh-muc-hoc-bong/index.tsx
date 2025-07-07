import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutHocBong, PutScholarshipCriteria } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useCriteriaOperatorOptions } from '@hooks/criteriaOperator'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCountScholarship,
    useFindManyScholarship,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateScholarship,
    useUpdateScholarshipCriteria,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Input, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookPlus, Check, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useCriteriaFieldOptions } from '../../../hooks/criteriaField'

interface FilterProps {
    searchText: string | undefined
    trainingObjectTypeId: string | null
    trainingCourseId: string | null
}

export default function Scholarship() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: null,
        trainingCourseId: null,
    })

    const { getCriteriaFieldLabel } = useCriteriaFieldOptions()
    const { getCriteriaOperatorLabel } = useCriteriaOperatorOptions()

    const { data = [], refetch } = useFindManyScholarship({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      name: {
                          contains: filters.searchText,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      trainingCourseId: filters.trainingCourseId,
                  }
                : {}),
            ...(filters.trainingCourseId &&
            filters.trainingCourseId !== '' &&
            filters.trainingObjectTypeId &&
            filters.trainingObjectTypeId !== ''
                ? {
                      trainingCourse: {
                          trainingObjectTypeId: filters.trainingObjectTypeId,
                      },
                  }
                : {}),
        },
        include: {
            criteria: true,
            trainingCourse: {
                include: {
                    trainingObjectType: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountScholarship({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      name: {
                          contains: filters.searchText,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      trainingCourseId: filters.trainingCourseId,
                  }
                : {}),
            ...(filters.trainingCourseId &&
            filters.trainingCourseId !== '' &&
            filters.trainingObjectTypeId &&
            filters.trainingObjectTypeId !== ''
                ? {
                      trainingCourse: {
                          trainingObjectTypeId: filters.trainingObjectTypeId,
                      },
                  }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenPutHocBong } = useDisclosure<string>({
        tag: PutHocBong.name,
    })

    const { onOpen: onOpenPutScholarshipCriteria } = useDisclosure<{
        scholarshipId: string
        scholarshipCriteriaId: string
    }>({
        tag: PutScholarshipCriteria.name,
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: updateScholarshipCriteria } = useUpdateScholarshipCriteria()
    async function handleDeleteScholarshipCriteria(id: string) {
        try {
            showSpinner()
            await updateScholarshipCriteria({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Flex>
                            <Col span={8}>
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        handleFilterChange('searchText', e.target.value)
                                    }
                                    style={{ width: '100%' }}
                                    placeholder="Tìm kiếm tên học bổng"
                                    allowClear
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
                                    onChange={(val) => handleFilterChange('trainingCourseId', val)}
                                    allowClear
                                />
                            </Col>
                            <Col span={8}>
                                <Select
                                    placeholder="Chọn đối tượng đào tạo"
                                    options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    style={{ width: '100%' }}
                                    onChange={(val) =>
                                        handleFilterChange('trainingObjectTypeId', val)
                                    }
                                    allowClear
                                    disabled={!filters?.trainingCourseId}
                                />
                            </Col>
                        </Flex>

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
                        headerTitleKey={({
                            code,
                            name,
                            trainingCourse,
                            effectiveFrom,
                            effectiveTo,
                        }) =>
                            `${code || ''} - ${name || ''} - ${trainingCourse?.name || ''} - ${trainingCourse?.trainingObjectType?.name || ''} - ${(effectiveFrom && dayjs(effectiveFrom).format('DD/MM/YYYY')) || ''} - ${(effectiveTo && dayjs(effectiveTo).format('DD/MM/YYYY')) || ''}`
                        }
                        defaultExpandAll
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Mã tiêu chí',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Trường được đánh giá',
                                dataIndex: 'field',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
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
                                            {value ? (
                                                <Check size={18} color="green" />
                                            ) : (
                                                <X size={18} color="red" />
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'So sánh',
                                dataIndex: 'operator',
                                align: 'center',
                                width: 150,
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
                                    title="Thêm mới phiên bản"
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
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
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
