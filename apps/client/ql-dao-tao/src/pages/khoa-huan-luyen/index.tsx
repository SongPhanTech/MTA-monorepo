import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutTrainingCourseModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, KHOA_HL_STATUS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingCourse,
    useFindManyTrainingCourse,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import type {
    TrainingCourse,
    SchoolYear,
    TrainingForm,
    TrainingLevel,
    TrainingType,
    TrainingObjectType,
    TrainingCourseStatus,
} from '@workspace/db'

import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Space,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { TRAINING_COURSE_STATUS } from '@constants/constants'
import Select from '@components/commons/select'
import FixedClassPage from '@pages/lop-bien-che'
import { FilterKhoa } from '@components/filter'
import EditIcon from '@components/icons/edit'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    trainingFormId: string | undefined
    trainingTypeId: string | undefined
    trainingLevelId: string | undefined
    trainingObjectTypeId: string | undefined
    status: string | undefined
    startDate: string | undefined
    endDate: string | undefined
    schoolYearId: string | undefined
}

export default function TrainingCoursePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingFormId: undefined,
        trainingTypeId: undefined,
        trainingLevelId: undefined,
        trainingObjectTypeId: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        schoolYearId: undefined,
    })

    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingFormId
                ? { trainingFormId: filters.trainingFormId }
                : {}),
            ...(filters.trainingTypeId
                ? { trainingTypeId: filters.trainingTypeId }
                : {}),
            ...(filters.trainingLevelId
                ? { trainingLevelId: filters.trainingLevelId }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
            ...(filters.status
                ? { status: filters.status as TrainingCourseStatus }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
        },
        include: {
            trainingForm: true,
            trainingLevel: true,
            trainingType: true,
            trainingObjectType: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingFormId
                ? { trainingFormId: filters.trainingFormId }
                : {}),
            ...(filters.trainingTypeId
                ? { trainingTypeId: filters.trainingTypeId }
                : {}),
            ...(filters.trainingLevelId
                ? { trainingLevelId: filters.trainingLevelId }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
            ...(filters.status
                ? { status: filters.status as TrainingCourseStatus }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (
        key: string,
        value: string | { startDate?: string; endDate?: string }
    ) => {
        if (key !== 'time') {
            setFilters((prev) => {
                const newFilters = { ...prev, [key]: value }
                debouncedRefetch()
                return newFilters
            })
        } else if (typeof value === 'object' && value !== null) {
            setFilters((prev: FilterProps) => {
                const newFilters = {
                    ...prev,
                    startDate: value.startDate ?? undefined,
                    endDate: value.endDate ?? undefined,
                }
                debouncedRefetch()
                return newFilters
            })
        }
    }
    async function handleStatusChange(
        id: string,
        newStatus: TrainingCourseStatus
    ) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    status: newStatus,
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const options = Object.entries(KHOA_HL_STATUS).map(
        ([value, { label, color }]) => ({
            value,
            label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
        })
    )

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Khóa huấn luyện
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <FilterKhoa
                                filters={filters}
                                setFilters={setFilters}
                                debouncedRefetch={debouncedRefetch}
                            />
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
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, record, index) =>
                                    index +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE +
                                    1,
                            },
                            {
                                title: 'Mã khóa',
                                dataIndex: 'code',
                                align: 'center',
                            },
                            {
                                title: 'Tên khóa',
                                dataIndex: 'name',
                                align: 'center',
                            },
                            {
                                title: 'Loại hình đào tạo',
                                dataIndex: 'trainingType',
                                align: 'center',
                                width: 150,
                                render: (value: TrainingType) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectType',
                                align: 'center',
                                width: 120,
                                render: (value: TrainingObjectType) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Hình thức đào tạo',
                                align: 'center',
                                dataIndex: 'trainingForm',
                                width: 120,
                                render: (value: TrainingForm) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Trình độ đào tạo',
                                dataIndex: 'trainingLevel',
                                align: 'center',
                                width: 120,
                                render: (value: TrainingLevel) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Ngày bắt đầu',
                                align: 'center',
                                render: ({ startDate }) =>
                                    startDate
                                        ? dayjs(startDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                align: 'center',
                                render: ({ endDate }) =>
                                    endDate
                                        ? dayjs(endDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                render: (record: TrainingCourse) => {
                                    return (
                                        <Select
                                            className="w-[155px]"
                                            value={record.status}
                                            onChange={(newStatus) =>
                                                handleStatusChange(
                                                    record.id,
                                                    newStatus as TrainingCourseStatus
                                                )
                                            }
                                            options={options}
                                            optionLabelProp="label"
                                            // style={{ width: 180 }}
                                            bordered={false}
                                            showSearch={false}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Mô tả',
                                width: 100,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
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
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                        expandable={{
                            expandedRowRender: (
                                record: Partial<TrainingCourse>
                            ) => (
                                <div style={{ maxWidth: '100%' }}>
                                    <FixedClassPage
                                        key={record.id}
                                        trainingCourse={record}
                                    />
                                </div>
                            ),
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
