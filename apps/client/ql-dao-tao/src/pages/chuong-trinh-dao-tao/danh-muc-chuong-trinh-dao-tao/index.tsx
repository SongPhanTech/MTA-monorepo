import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutCurriculum, PutCurriculumVersion } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse, TrainingMajor, TrainingObjectType } from '@workspace/db'
import {
    useCountCurriculum,
    useFindManyCurriculum,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useUpdateCurriculum,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
    trainingMajorId: string | undefined
}

export default function TrainingProgramCatalog() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectId: '',
        trainingCourseId: '',
        trainingMajorId: '',
    })

    const { data = [], refetch } = useFindManyCurriculum({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              curriculumVersion: {
                                  some: {
                                      OR: [
                                          {
                                              name: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                          {
                                              code: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                ? {
                      curriculumVersion: {
                          some: {
                              trainingObjectTypeId: {
                                  contains: filters.trainingObjectId,
                                  mode: 'insensitive',
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      curriculumVersion: {
                          some: {
                              fixedClasses: {
                                  some: {
                                      trainingCourseId: {
                                          contains: filters.trainingCourseId,
                                          mode: 'insensitive',
                                      },
                                  },
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingMajorId && filters.trainingMajorId !== ''
                ? {
                      trainingMajorId: {
                          contains: filters.trainingMajorId,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        },
        include: {
            curriculumVersion: {
                where: {
                    ...(filters.searchText && filters.searchText !== ''
                        ? {
                              OR: [
                                  {
                                      name: {
                                          contains: filters.searchText,
                                          mode: 'insensitive',
                                      },
                                  },
                                  {
                                      code: {
                                          contains: filters.searchText,
                                          mode: 'insensitive',
                                      },
                                  },
                              ],
                          }
                        : {}),
                    ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                        ? {
                              trainingObjectTypeId: {
                                  contains: filters.trainingObjectId,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                        ? {
                              fixedClasses: {
                                  some: {
                                      trainingCourseId: {
                                          contains: filters.trainingCourseId,
                                          mode: 'insensitive',
                                      },
                                  },
                              },
                          }
                        : {}),
                },
                include: {
                    trainingBlocks: {
                        select: {
                            subjects: {
                                select: {
                                    subject: {
                                        select: {
                                            credit: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            managementOrganization: true,
            trainingMajor: true,
        },
        orderBy: {
            name: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountCurriculum({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              curriculumVersion: {
                                  some: {
                                      OR: [
                                          {
                                              name: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                          {
                                              code: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                ? {
                      curriculumVersion: {
                          some: {
                              trainingObjectTypeId: {
                                  contains: filters.trainingObjectId,
                                  mode: 'insensitive',
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      curriculumVersion: {
                          some: {
                              fixedClasses: {
                                  some: {
                                      trainingCourseId: {
                                          contains: filters.trainingCourseId,
                                          mode: 'insensitive',
                                      },
                                  },
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingMajorId && filters.trainingMajorId !== ''
                ? {
                      trainingMajorId: {
                          contains: filters.trainingMajorId,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        },
    })

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { onOpen: onOpenCurriculum, onClose: onCloseCurriculum } = useDisclosure<string>({
        tag: PutCurriculum.name,
    })

    const { onOpen: onOpenCurriculumVersion, onClose: onCloseCurriculumVersion } = useDisclosure<{
        curriculumId: string
        versionId: string
    }>({
        tag: PutCurriculumVersion.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpenCurriculum()
    }
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function handleDeleteCurriculum(id: string) {
        try {
            showSpinner()
            await updateCurriculum({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()
    async function handleDeleteCurriculumVersion(id: string) {
        try {
            showSpinner()
            await updateCurriculumVersion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
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

    const handleRowClick = (record: { id?: string }) => {
        if (record?.id) {
            router.push(
                `${
                    ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO
                }/${record.id}`
            )
        }
    }

    const processedData = useMemo(() => {
        return data?.map((item) => ({
            ...item,
            name: `${item?.name}${
                item?.managementOrganization?.sTen ? ` - ${item?.managementOrganization?.sTen}` : ''
            }`,
        }))
    }, [data])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            className="py-0"
                                            placeholder="Nhập chương trình đào tạo"
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
                                <Col span={10}>
                                    <Form.Item className="mb-0" name="trainingObjectId">
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item className="mb-0" name="trainingCourseId">
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingCourse) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingCourseId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item className="mb-0" name="trainingMajorId">
                                        <Select
                                            placeholder="Chọn chuyên ngành đào tạo"
                                            options={trainingMajorData.map((i: TrainingMajor) => ({
                                                value: i.id,
                                                label: i.name,
                                            }))}
                                            onChange={(val) =>
                                                handleFilterChange('trainingMajorId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    <PlusOutlined />
                                    Thêm chương trình
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        id="version-category"
                        headerTitleKey="name"
                        childrenFieldName="curriculumVersion"
                        currentPage={currentPage}
                        defaultExpandAll
                        onRowClick={(record) => handleRowClick(record)}
                        columns={[
                            {
                                title: 'Mã CTĐT',
                                dataIndex: 'code',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Tên chương trình',
                                dataIndex: 'name',
                                align: 'center',
                                width: 180,
                            },
                            {
                                title: 'Tên viết tắt',
                                dataIndex: 'shortName',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Tên tiếng anh',
                                dataIndex: 'englishName',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Tổng tín chỉ',
                                align: 'center',
                                width: 120,
                                render: ({ trainingBlocks = [] }) => {
                                    const totalCredit = trainingBlocks.reduce(
                                        (
                                            total: number,
                                            block: {
                                                subjects?: {
                                                    subject: { credit?: number }
                                                }[]
                                            }
                                        ) => {
                                            const blockCredit =
                                                block?.subjects?.reduce(
                                                    (
                                                        sum: number,
                                                        {
                                                            subject,
                                                        }: {
                                                            subject: {
                                                                credit?: number
                                                            }
                                                        }
                                                    ) => sum + (subject?.credit || 0),
                                                    0
                                                ) || 0
                                            return total + blockCredit
                                        },
                                        0
                                    )

                                    return totalCredit
                                },
                            },
                            {
                                title: 'Số tín chỉ bắt buộc',
                                dataIndex: 'requiredCredits',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Số tín chỉ tự chọn',
                                dataIndex: 'electiveCredits',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                align: 'center',
                                width: 200,
                                render: (value) => <span className="line-clamp-1">{value}</span>,
                            },
                            {
                                title: 'Năm khởi tạo',
                                dataIndex: 'createdAt',
                                align: 'center',
                                width: 140,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Năm áp dụng',
                                dataIndex: 'startDate',
                                align: 'center',
                                width: 140,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Thời gian đào tạo',
                                dataIndex: 'numberOfSemesters',
                                align: 'center',
                                width: 140,
                                render: (value) => `${value} năm`,
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
                                render: (_, record) => {
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
                                fixed: 'right',
                                align: 'center',
                                render: (_, { id, curriculumId }) => {
                                    if (id) {
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
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenCurriculumVersion({
                                                            curriculumId: curriculumId,
                                                            versionId: id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteCurriculumVersion(id),
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
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[75px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenCurriculumVersion({
                                            curriculumId: id,
                                            versionId: '',
                                        })
                                    }}
                                    title="Thêm mới phiên bản"
                                />
                                <EditIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenCurriculum(id)
                                    }}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDeleteCurriculum(id),
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        data={processedData}
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

TrainingProgramCatalog.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
