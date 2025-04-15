import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutTrainingCourseModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingCourse,
    useFindManyTrainingCourse,
    useFindManyTrainingForm,
    useUpdateTrainingCourse,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManySchoolYear
} from '@workspace/db/hooks'
import { TrainingCourse, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType, TrainingCourseStatus } from '@workspace/db'

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
import FixedClassPage from '@pages/fixed-class'
// const { Option } = Select;

const statusOptions = {
    ACTIVE: { label: 'Đang hoạt động', color: 'green' },
    COMPLETED: { label: 'Hoàn thành', color: 'blue' },
    SUSPEND: { label: 'Tạm dừng', color: 'orange' },
    CANCEL: { label: 'Hủy bỏ', color: 'red' },
}
export default function TrainingCoursePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState({
        name: '',
        code: '',
        trainingFormId: undefined,
        trainingTypeId: undefined,
        trainingLevelId: undefined,
        trainingObjectTypeId: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined
    });

    const [dataToView, setDataToView] = useState<any>([])
    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            ...(filters.name && filters.name !== "" ? { name: { contains: filters.name } } : {}),
            ...(filters.code && filters.code !== "" ? { code: { contains: filters.code } } : {}),
            ...(filters.trainingFormId ? { trainingFormId: filters.trainingFormId } : {}),
            ...(filters.trainingTypeId ? { trainingTypeId: filters.trainingTypeId } : {}),
            ...(filters.trainingLevelId ? { trainingLevelId: filters.trainingLevelId } : {}),
            ...(filters.trainingObjectTypeId ? { trainingObjectTypeId: filters.trainingObjectTypeId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.startDate && filters.endDate ? {
                startDate: {
                    gte: new Date(filters.startDate),
                    lte: new Date(filters.endDate),
                }
            } : {}),
        },
        include: {
            TrainingForm: true,
            TrainingLevel: true,
            TrainingType: true,
            TrainingObjectType: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            ...(filters.name && filters.name !== "" ? { name: { contains: filters.name } } : {}),
            ...(filters.code && filters.code !== "" ? { code: { contains: filters.code } } : {}),
            ...(filters.trainingFormId ? { trainingFormId: filters.trainingFormId } : {}),
            ...(filters.trainingTypeId ? { trainingTypeId: filters.trainingTypeId } : {}),
            ...(filters.trainingLevelId ? { trainingLevelId: filters.trainingLevelId } : {}),
            ...(filters.trainingObjectTypeId ? { trainingObjectTypeId: filters.trainingObjectTypeId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.startDate && filters.endDate ? {
                startDate: {
                    gte: new Date(filters.startDate),
                    lte: new Date(filters.endDate),
                }
            } : {}),
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
    const { data: trainingFormData = [], refetch: refetchForm } =
        useFindManyTrainingForm({
            take: 1000,
            skip: 0,
        })

    const { data: trainingTypeData = [], refetch: refetchType } =
        useFindManyTrainingType({
            take: 1000,
            skip: 0,
        })
    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel({
            take: 1000,
            skip: 0,
        })
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType({
            take: 1000,
            skip: 0,
        })
    const handleFilterChange = (key: any, value: any) => {
        if (key !== "time") {
            setFilters((prev) => {
                const newFilters = { ...prev, [key]: value };
                debouncedRefetch();
                return newFilters;
            });
        } else {
            setFilters((prev) => {
                const newFilters = {
                    ...prev,
                    startDate: value?.startDate ?? undefined,
                    endDate: value?.endDate ?? undefined
                };
                debouncedRefetch();
                return newFilters;
            });
        }
    };
    async function handleStatusChange(id: string, newStatus: TrainingCourseStatus) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    status: newStatus
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const options = Object.entries(statusOptions).map(([value, { label, color }]) => ({
        value,
        label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
    }));
    const filterRow = {
        isFilterRow: true,
        key: 'filter',
    };
    useEffect(() => {
        const dataWithFilter = [filterRow, ...data];
        setDataToView(dataWithFilter)
    }, [data])
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Khóa
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                            {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
                            <Flex justify='space-between' align='center'>
                                <label>Năm học:</label>
                                <Select
                                    className="w-[70%]"
                                    placeholder='Chọn năm học'
                                    allowClear
                                    options={dataSchoolYear.map((i: SchoolYear) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                            startDate: i.startDate,
                                            endDate: i.endDate
                                        }
                                    })}
                                    // value={filters.schoolYearId}
                                    onChange={(value: number | null, option: any) => {
                                        handleFilterChange("time", option ?? undefined)
                                    }}
                                />
                            </Flex>

                            {/* </Form.Item> */}
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
                                render: (_, record, index) => {
                                    if (record.isFilterRow) return '';
                                    return (
                                        index +
                                        (currentPage - 1) * DEFAULT_PAGINATE_SIZE
                                    );
                                },
                            },
                            {
                                title: 'Mã khóa',
                                dataIndex: 'code',
                                align: 'center',
                                width: 100,
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Input
                                                // placeholder="Nhập mã khóa"
                                                allowClear
                                                onPressEnter={(e) => {
                                                    const value = e.currentTarget.value?.trim();
                                                    handleFilterChange('code', value);
                                                }}
                                                onChange={(e) => {
                                                    if (!e.target.value || e.target.value === "") {
                                                        handleFilterChange('code', undefined);
                                                    }
                                                }}
                                            />
                                        );
                                    }
                                    return value;
                                },
                            },
                            {
                                title: 'Tên khóa',
                                dataIndex: 'name',
                                width: 100,
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Input
                                                // placeholder="Nhập tên khóa"
                                                allowClear
                                                onPressEnter={(e) => {
                                                    const value = e.currentTarget.value?.trim();
                                                    handleFilterChange('name', value);
                                                }}
                                                onChange={(e) => {
                                                    if (!e.target.value || e.target.value === "") {
                                                        handleFilterChange('name', undefined);
                                                    }
                                                }}
                                            />
                                        );
                                    }
                                    return value;
                                },
                            },
                            {
                                title: 'Loại hình đào tạo',
                                dataIndex: 'TrainingType',
                                width: 150,
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Select
                                                className='w-[110px]'
                                                // placeholder="Chọn loại hình đào tạo"
                                                options={trainingTypeData.map((i: TrainingType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                }))}
                                                onChange={(val) => handleFilterChange('trainingTypeId', val)}
                                                allowClear
                                            />
                                        );
                                    }
                                    return value?.name ? value?.name : "";
                                },
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'TrainingObjectType',
                                width: 120,
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Select
                                                className='w-[110px]'
                                                // placeholder="Chọn đối tượng đào tạo"
                                                options={trainingObjectTypeData.map((i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                }))}
                                                onChange={(val) => handleFilterChange('trainingObjectTypeId', val)}
                                                allowClear
                                            />
                                        );
                                    }
                                    return value?.name ? value?.name : "";
                                },
                            },
                            {
                                title: 'Hình thức đào tạo',
                                dataIndex: 'TrainingForm',
                                width: 120,
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Select
                                                className='w-[110px]'
                                                // placeholder="Chọn hình thức đào tạo"
                                                options={trainingFormData.map((i: TrainingForm) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                }))}
                                                onChange={(val) => handleFilterChange('trainingFormId', val)}
                                                allowClear
                                            />
                                        );
                                    }
                                    return value?.name ? value?.name : "";
                                },
                            },
                            {
                                title: 'Trình độ đào tạo',
                                dataIndex: 'TrainingLevel',
                                render: (value: any, record: any) => {
                                    if (record.isFilterRow) {
                                        return (
                                            <Select
                                                className='w-[110px]'
                                                // placeholder="Chọn trình độ đào tạo"
                                                options={trainingLevelData.map((i: TrainingForm) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                }))}
                                                onChange={(val) => handleFilterChange('trainingLevelId', val)}
                                                allowClear
                                            />
                                        );
                                    }
                                    return value?.name ? value?.name : "";
                                },
                            },
                            {
                                title: 'Ngày bắt đầu',
                                render: ({ startDate }) => startDate ?
                                    dayjs(startDate).format('DD/MM/YYYY') : "",
                            },
                            {
                                title: 'Ngày kết thúc',
                                render: ({ endDate }) => endDate ?
                                    dayjs(endDate).format('DD/MM/YYYY') : "",
                            },
                            {
                                title: 'Trạng thái',
                                width: 130,
                                render: (record: any) => {
                                    if (record.isFilterRow) {
                                        return <Select
                                            className='w-[155px]'
                                            onChange={(val) => handleFilterChange('status', val)}
                                            options={Object.entries(statusOptions).map(([value, { label, color }]) => ({
                                                value,
                                                label, // hiển thị trong dropdown
                                            }))
                                            }
                                            allowClear
                                        // style={{ width: 180 }}
                                        />
                                    } else return (
                                        <Select
                                            className='w-[155px]'
                                            value={record.status}
                                            onChange={(newStatus) => handleStatusChange(record.id, newStatus as TrainingCourseStatus)}
                                            options={options}
                                            optionLabelProp="label"
                                            // style={{ width: 180 }}
                                            bordered={false}
                                            showSearch={false}

                                        />
                                    )
                                }
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (<Row className="justify-center gap-2">
                                            <Tooltip
                                                title="Xem chi tiết"
                                                placement="leftTop"
                                            >
                                                <EyeOutlined
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                            </Tooltip>
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDelete(id),
                                                }}
                                            />
                                        </Row>)
                                    } else return ""
                                },
                            },
                        ]}
                        data={dataToView}
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
                            expandedRowRender: (record) => <div style={{ maxWidth: '100%' }}>
                                <FixedClassPage key={record.id} trainingCourse={record} />
                            </div>,
                            rowExpandable: (record) => !(record.isFilterRow === true), // điều kiện nào đó
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
