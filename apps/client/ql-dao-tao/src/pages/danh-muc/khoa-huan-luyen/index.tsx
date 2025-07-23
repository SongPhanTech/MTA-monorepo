import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingCourseModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountTrainingCourse,
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingCoursePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        trainingObjectTypes: undefined,
        admissionQuota: undefined,
        semesterStart: undefined,
    })

    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            OR: [
                { name: { contains: filters.name, mode: 'insensitive' } },
                { code: { contains: filters.code, mode: 'insensitive' } },
            ],
            ...(filters.trainingObjectTypes
                ? {
                      trainingObjectTypeId: {
                          in: filters.trainingObjectTypes,
                      },
                  }
                : {}),
            ...(filters.semesterStart
                ? {
                      semesterStartId: {
                          in: filters.trainingObjectTypes,
                      },
                  }
                : {}),
        },
        include: {
            trainingObjectType: true,
            semesterStart: {
                include: {
                    schoolYear: true,
                },
            },
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        admissionQuota: filters.admissionQuota,
                    },
                ],
                !!filters.admissionQuota
            ),
            { name: 'asc' },
        ],

        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            OR: [
                { name: { contains: filters.name, mode: 'insensitive' } },
                { code: { contains: filters.code, mode: 'insensitive' } },
            ],
            ...(filters.trainingObjectTypes
                ? {
                      trainingObjectTypeId: {
                          in: filters.trainingObjectTypes,
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
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutTrainingCourseModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const { data: schoolYearData = [] } = useFindManySchoolYear({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            {/* <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            style={{
                                                marginRight: 8,
                                                height: 32,
                                            }}
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
                                <Col span={8}>
                                    <Form.Item
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
                                            style={{
                                                marginRight: 8,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypeId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex> */}
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-course"
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, record, index) =>
                                    index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
                            },
                            {
                                title: 'Mã khóa',
                                dataIndex: 'code',
                                width: 150,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên khóa',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 175,
                                type: 'select',
                                options: trainingObjectTypeData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                }),
                                render: (__, record) =>
                                    record?.trainingObjectType?.name
                                        ? record?.trainingObjectType?.name
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                align: 'center',
                                dataIndex: 'semesterStart',
                                width: 150,
                                type: 'select',
                                options: schoolYearData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                }),
                                render: (value) =>
                                    value?.schoolYear?.name ? value?.schoolYear?.name : '',
                            },
                            {
                                title: 'Niên khoá',
                                align: 'center',
                                dataIndex: 'academicYear',
                                width: 150,
                            },
                            {
                                title: 'Chỉ tiêu tuyển sinh',
                                align: 'center',
                                dataIndex: 'admissionQuota',
                                width: 150,
                                type: 'order',
                            },
                            {
                                title: 'Mô tả',
                                width: 100,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 175,
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
                                render: (_, { id }) => {
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
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingCoursePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
