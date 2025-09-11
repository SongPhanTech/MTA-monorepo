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
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingCourse,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateAcademicWarningRule,
} from '@workspace/db/hooks'
import { Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useCriteriaFieldOptions } from '../../../hooks/criteriaField'

export default function AcademicWarningRule() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        trainingObjectId: null,
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

    const where = useMemo(() => {
        const academicWarningRuleFilter = {
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
        }

        return {
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      id: filters.trainingCourseId,
                  }
                : {}),
            ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                ? {
                      trainingObjectTypeId: filters.trainingObjectId,
                  }
                : {}),
            ...(Object.keys(academicWarningRuleFilter).length > 0 && {
                academicWarningRule: {
                    some: academicWarningRuleFilter,
                },
            }),
        }
    }, [filters.trainingCourseId, filters.trainingObjectId, filters.field, filters.operator])

    const { data = [], refetch } = useFindManyTrainingCourse({
        where,
        include: {
            academicWarningRule: true,
            trainingObjectType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenAcademicWarningRule } = useDisclosure<{
        trainingCourseId: string
        academicWarningRuleId: string
    }>({
        tag: 'PutAcademicWarningRule',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateAcademicWarningRule } = useUpdateAcademicWarningRule()
    async function handleDeleteAcademicWarningRule(id: string) {
        try {
            showSpinner()
            await updateAcademicWarningRule({
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

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: { active: true },
        orderBy: { name: 'asc' },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Flex>
                            <Col span={12}>
                                <Select
                                    placeholder="Chọn khóa"
                                    options={trainingCourseData.map((i: TrainingCourse) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    className="w-[300px]"
                                    onChange={(val) =>
                                        setFilters((prev) => ({ ...prev, trainingCourseId: val }))
                                    }
                                    allowClear
                                />
                            </Col>
                            <Col span={12}>
                                <Select
                                    placeholder="Chọn đối tượng đào tạo"
                                    options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    className="w-[300px]"
                                    onChange={(val) =>
                                        setFilters((prev) => ({ ...prev, trainingObjectId: val }))
                                    }
                                    allowClear
                                />
                            </Col>
                        </Flex>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey={({ code, name, trainingObjectType }) =>
                            `${[code, name, trainingObjectType?.name].filter(Boolean).join(' - ')}`
                        }
                        defaultExpandAll
                        currentPage={currentPage}
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
                                title: 'So sánh',
                                dataIndex: 'operator',
                                align: 'center',
                                width: 180,
                                type: 'select',
                                options: criteriaOperatorOptions,
                                render: (value) => getCriteriaOperatorLabel(value),
                            },
                            {
                                title: 'Ngưỡng so sánh',
                                dataIndex: 'threshold',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Mức độ cảnh cáo sẽ tăng',
                                dataIndex: 'severity',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Áp dụng cho sinh viên năm thứ...',
                                dataIndex: 'yearCondition',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Áp dụng cho học kỳ thứ ... trong năm',
                                dataIndex: 'semesterCondition',
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
                                                        onOpenAcademicWarningRule({
                                                            trainingCourseId:
                                                                record?.trainingCourseId,
                                                            academicWarningRuleId: record?.id,
                                                        })
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteAcademicWarningRule(
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
                        childrenFieldName="academicWarningRule"
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[50px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenAcademicWarningRule({
                                            trainingCourseId: id,
                                            academicWarningRuleId: '',
                                        })
                                    }}
                                    title="Thêm mới cảnh cáo học tập"
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

AcademicWarningRule.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
