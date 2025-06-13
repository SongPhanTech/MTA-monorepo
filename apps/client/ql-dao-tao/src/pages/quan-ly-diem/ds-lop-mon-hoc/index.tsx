import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingField,
    useFindManyTrainingField,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManySemester,
    useFindManySubjectClass,
    useCountSubjectClass,
    useFindManySchoolYear
} from '@workspace/db/hooks'
import type { TrainingObjectType } from '@workspace/db'
import { CalendarPlus, Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _, { includes } from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined } from '@ant-design/icons'
import { PutOpenClassModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'

// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    semesterId: string | null
    schoolYearId: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
}

export default function SubjectClass() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        subjectClassId: null,
        schoolYearId: null,
    })


    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType(
            {
                where: {
                    deletedAt: null,
                },
            }
        )

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
        {
            where: {
                deletedAt: null,
            },
        }
    )

    const { data: schoolYearData = [] } = useFindManySchoolYear({
        orderBy: {
            startDate: 'desc',
        },
    })
    const { data: semesterData = [], refetch: refetchSemester } = useFindManySemester(
        {
            where: {
                schoolYearId: filters.schoolYearId || undefined,
            },
            orderBy: {
                startDate: 'desc',
            },
        }
    )
    //#endregion

    //#region Mới
    /* Mới */

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
        where: {
            ...(
                filters.searchText && filters.searchText !== '' ? {
                    OR: [
                        { name: { contains: filters.searchText } },
                        { code: { contains: filters.searchText } },
                    ],
                } : {}
            ),
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.subjectClassId ? { id: filters.subjectClassId } : {}),
            deletedAt: null,
        },
        include: {
            subject: {
                include: { managementOrganization: { include: { parent: true } } }
            },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    console.log('Data table:', dataTable)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        [refetch]
    )

    const { data: count } = useCountSubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            deletedAt: null,
        },
    })

    /* Mới */
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
        },
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'searchText',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập tên lớp..."
                                            style={{
                                                height: 40,
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
                                        className="mb-0"
                                        name="schoolYearId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Năm học"
                                            options={schoolYearData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
                                            }}
                                            allowClear
                                            onChange={(val) => {
                                                handleFilterChange(
                                                    'schoolYearId',
                                                    val
                                                )
                                                refetchSemester()
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="semesterId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Học kỳ"
                                            options={semesterData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange(
                                                    'semesterId',
                                                    val
                                                )
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
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
                                            style={{
                                                height: 40,
                                            }}
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
                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingCourseId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Lớp MH"
                                            options={dataTable.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
                                            }}
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
                                <Col span={4} className="flex">
                                    <FilterSubjectClass
                                        onFilterChange={handleFilterChange} onSearchChange={undefined} />
                                </Col>
                            </Flex>
                        </Col>

                        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        rowSelection={rowSelection}
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
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'name',
                                width: 150,
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                                render: (text, record) =>
                                    record.subject?.name || text,
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                                render: (text, record) =>
                                    record.subject?.credit || text,
                            },
                            {
                                title: 'Hạn đợi',
                                dataIndex: 'ngayDot',
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Số ngày',
                                dataIndex: 'ngayDot',
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Hạn ĐT',
                                dataIndex: 'ngayDot',
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Giảng viên',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                                align: 'center',
                                render: (text, record) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.firstName} ${record.mainLecturer.userProfile.lastName}`
                                        : 'Chưa có giảng viên chính'
                                    const extraLecturer = record.extraLecturer
                                        ? `, ${record.extraLecturer.userProfile.firstName} ${record.extraLecturer.userProfile.lastName}`
                                        : ''
                                    return (
                                        <span>
                                            {mainLecturer}
                                            {extraLecturer}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên NĐ',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                                align: 'center',
                                render: (text, record) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.firstName} ${record.mainLecturer.userProfile.lastName}`
                                        : 'Chưa có giảng viên chính'
                                    return (
                                        <span>
                                            {mainLecturer}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'trangThai',
                                width: 150,
                                align: 'center',
                                render: (text, record) => {
                                    if (record.active === true || record.active === 'active') {
                                        return (
                                            <Tag color="green">Đang hoạt động</Tag>
                                        )
                                    } else if (record.active === false || record.active === 'inactive') {
                                        return (
                                            <Tag color="red">Kết thúc</Tag>
                                        )
                                    }
                                    return ''
                                },
                            },
                            {
                                title: 'Ngày bắt đầu',
                                dataIndex: 'startDate',
                                width: 150,
                                align: 'center',
                                render: (date) =>
                                    new Date(date).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    }),
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                width: 150,
                                align: 'center',
                                render: (date) =>
                                    date ?
                                        new Date(date).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                        }) : ''
                            },
                            {
                                title: 'Ngày kết thúc',
                                dataIndex: 'endDate',
                                width: 150,
                                align: 'center',
                                render: (date) =>
                                    date ? new Date(date).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    }) : ''
                            },
                            {
                                title: 'Bộ môn',
                                dataIndex: 'danhSachLop',
                                width: 200,
                                align: 'center',
                                render: (text, record) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.name || 'Chưa có bộ môn'}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Khoa',
                                dataIndex: 'danhSachLop',
                                width: 200,
                                align: 'center',
                                render: (text, record) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.parent?.name || 'Chưa có khoa'}
                                        </span>
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
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                                onClick={handleModal}
                                            >
                                                <CalendarPlus
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                                Nhập điểm
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataTable}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
