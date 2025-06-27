import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingBlock } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Curriculum, TrainingObjectType } from '@workspace/db'
import {
    useCountTrainingBlock,
    useFindManyCurriculum,
    useFindManyTrainingBlock,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateTrainingBlock,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
interface FilterProps {
    searchText: string | null
    trainingCourseId: string | null
    trainingObjectTypeId: string | null
}

export default function TrainingBlock() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingCourseId: null,
        trainingObjectTypeId: null,
    })

    const { data: trainingBlockData, refetch } = useFindManyTrainingBlock({
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
            ...(filters.trainingObjectTypeId
                ? {
                      curriculumVersions: {
                          some: {
                              curriculumVersion: {
                                  trainingObjectTypeId:
                                      filters.trainingObjectTypeId,
                              },
                          },
                      },
                  }
                : {}),
        },
        include: {
            curriculumVersions: {
                include: {
                    curriculumVersion: true,
                },
            },
        },
        orderBy: {
            priority: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count, refetch: refetchCount } = useCountTrainingBlock({
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
            ...(filters.trainingObjectTypeId
                ? {
                      curriculumVersions: {
                          some: {
                              curriculumVersion: {
                                  trainingObjectTypeId:
                                      filters.trainingObjectTypeId,
                              },
                          },
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
    const { onOpen } = useDisclosure<string>({
        tag: PutTrainingBlock.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingBlock({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
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

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })
    const { data: curriculumData = [] } = useFindManyCurriculum({
        orderBy: { name: 'asc' },
    })

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
                                                handleFilterChange(
                                                    'searchText',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập tên ngành..."
                                            className="py-0"
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
                                <Col span={12}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange(
                                                    'trainingObjectTypeId',
                                                    val
                                                )
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingCourseId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange(
                                                    'trainingCourseId',
                                                    val
                                                )
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chương trình đào tạo"
                                            options={curriculumData.map(
                                                (i: Curriculum) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingObjectTypeId',
                                            //         val
                                            //     )
                                            // }
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
                                    Thêm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-block"
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã khối kiến thức',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên khối kiến thức',
                                dataIndex: 'name',
                                width: 150,
                            },
                            // {
                            //     title: 'Tổng tín chỉ',
                            //     dataIndex: '',
                            //     width: 150,
                            // },
                            // {
                            //     title: 'Tổng tín chỉ bắt buộc',
                            //     dataIndex: 'totalRequiredCredits',
                            //     width: 150,
                            // },
                            // {
                            //     title: 'Số tín chỉ chuyên ngành',
                            //     dataIndex: 'specializedCredits',
                            //     width: 150,
                            // },
                            // {
                            //     title: 'Thứ tự',
                            //     dataIndex: 'priority',
                            //     sorter: (
                            //         a: { priority: number },
                            //         b: { priority: number }
                            //     ) => a.priority - b.priority,
                            //     align: 'center',
                            //     width: 100,
                            // },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                align: 'center',
                                width: 140,
                                filters: [
                                    { text: 'Đang đào tạo', value: true },
                                    { text: 'Ngừng đào tạo', value: false },
                                ],
                                filterMultiple: false,
                                onFilter: (value, record) =>
                                    record.active === value,
                                fixed: 'right',
                                render: (record) => {
                                    return !record ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">Đang đào tạo</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                        data={trainingBlockData}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingBlock.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
