import { EyeOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutAcademicActionConfig } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useAcademicActionTypeOption } from '@hooks/academicActionType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse } from '@workspace/db'
import {
    useCountTrainingCourse,
    useFindManyTrainingCourse,
    useUpdateAcademicActionConfig,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function AcademicActionConfig() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        trainingCourseId: null,
        actionTaken: undefined,
    })
    const { options: academicActionTypeOption, getAcademicActionTypeLabel } =
        useAcademicActionTypeOption()

    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            academicActionConfig: {
                some: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.actionTaken
                        ? Array.isArray(filters.actionTaken)
                            ? {
                                  actionType: {
                                      in: filters.actionTaken,
                                  },
                              }
                            : {
                                  actionType: {
                                      equals: filters.actionTaken,
                                  },
                              }
                        : {}),
                },
            },
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      id: filters.trainingCourseId,
                  }
                : {}),
        },
        include: {
            academicActionConfig: {
                where: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.actionTaken
                        ? Array.isArray(filters.actionTaken)
                            ? {
                                  actionType: {
                                      in: filters.actionTaken,
                                  },
                              }
                            : {
                                  actionType: {
                                      equals: filters.actionTaken,
                                  },
                              }
                        : {}),
                },
            },
            trainingObjectType: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            academicActionConfig: {
                some: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.actionTaken
                        ? Array.isArray(filters.actionTaken)
                            ? {
                                  actionType: {
                                      in: filters.actionTaken,
                                  },
                              }
                            : {
                                  actionType: {
                                      equals: filters.actionTaken,
                                  },
                              }
                        : {}),
                },
            },
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      id: filters.trainingCourseId,
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
    const { onOpen: onOpenPutAcademicActionConfig } = useDisclosure<{
        id: string
        trainingCourseId: string
    }>({
        tag: PutAcademicActionConfig.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updatePutAcademicActionConfig } = useUpdateAcademicActionConfig()
    async function handleDeletePutAcademicActionConfig(id: string) {
        try {
            showSpinner()
            await updatePutAcademicActionConfig({
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
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey={({ code, name, trainingObjectType }) =>
                            `${[code, name, trainingObjectType.name].filter(Boolean).join(' - ')}`
                        }
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Tên cấu hình',
                                dataIndex: 'name',
                                align: 'center',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Loại hành động xử lý',
                                dataIndex: 'actionTaken',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'select',
                                options: academicActionTypeOption,
                                render: (_, record) =>
                                    getAcademicActionTypeLabel(record.actionType),
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
                                                <Tooltip
                                                    title="Xem chi tiết cấu hình"
                                                    placement="top"
                                                >
                                                    <EyeOutlined className="text-sm cursor-pointer" />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutAcademicActionConfig({
                                                            id: record?.id,
                                                            trainingCourseId:
                                                                record?.trainingCourseId,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeletePutAcademicActionConfig(
                                                                record?.id
                                                            )
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
                        childrenFieldName="academicActionConfig"
                        headerRight={({ id: trainingCourseId }) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutAcademicActionConfig({
                                            id: '',
                                            trainingCourseId: trainingCourseId,
                                        })
                                    }}
                                    title="Thêm mới cấu hình"
                                />
                            </div>
                        )}
                        onRowClick={(record) => {
                            if (record.id) {
                                router.push(
                                    `${ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_XU_LY_HOC_TAP_ID.replace('[id]', record.id)}`
                                )
                            }
                        }}
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

AcademicActionConfig.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
