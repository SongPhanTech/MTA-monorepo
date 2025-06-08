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
} from '@workspace/db/hooks'
import type { TrainingObjectType } from '@workspace/db'
import { CalendarPlus, Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined } from '@ant-design/icons'
import { PutOpenClassModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    trainingCourseId: string | null
}

export default function SubjectOpeningPlan() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingCourseId: null,
    })

    const { data = [], refetch } = useFindManyTrainingField({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingCourseId
                ? { trainingCourseId: filters.trainingCourseId }
                : {}),
        },
        include: {
            organization: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingField({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

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
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const dataFake = [
        {
            id: 1,
            maMonHoc: '003603',
            tenMonHoc: 'Toán rời rạc',
            danhSachLop: [
                { name: '003560 01 (53)' },
                { name: '003560 02 (53)' },
            ],
            stc: 3,
            chuongTrinhDaoTao: [
                { name: 'Đạn' },
                { name: 'Công nghệ chế tạo máy' },
                { name: 'Công nghệ chế tạo dạn' },
                { name: 'Công nghệ vật liệu' },
                { name: 'Phòng hóa' },
            ],
            cacLopCoMon: [
                { name: 'Đạn 1' },
                { name: 'Đạn 2' },
                { name: 'Đạn 3' },
                { name: 'Công nghệ chế tạo máy' },
                { name: 'Công nghệ chế tạo dạn' },
                { name: 'Công nghệ vật liệu' },
                { name: 'Phòng hóa' },
            ],
            svNo: 0,
            tongSV: 81,
            soLMH: 4,
            donViPhuTrach: 'Bộ môn Khoa học máy tính',
        },
        {
            id: 2,
            maMonHoc: '003603',
            tenMonHoc: 'Toán rời rạc',
            danhSachLop: ['003560 01 (53)', '003560 02 (53)'],
            stc: 3,
            chuongTrinhDaoTao: [
                { name: 'Đạn' },
                { name: 'Công nghệ chế tạo máy' },
                { name: 'Công nghệ chế tạo dạn' },
                { name: 'Công nghệ vật liệu' },
                { name: 'Phòng hóa' },
            ],
            cacLopCoMon: [
                { name: 'Đạn 1' },
                { name: 'Đạn 2' },
                { name: 'Đạn 3' },
                { name: 'Công nghệ chế tạo máy' },
                { name: 'Công nghệ chế tạo dạn' },
                { name: 'Công nghệ vật liệu' },
                { name: 'Phòng hóa' },
            ],
            svNo: 0,
            tongSV: 81,
            soLMH: 4,
            donViPhuTrach: 'Bộ môn Khoa học máy tính',
        },
    ]

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
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file TKB
                                </Button>
                            </Flex>
                        </Col>
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
                                title: 'Mã môn học',
                                dataIndex: 'maMonHoc',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                            },
                            {
                                title: 'Danh sách lớp môn học',
                                dataIndex: 'danhSachLop',
                                width: 200,
                                render: (values: { name: string }[]) => (
                                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                                        {values.map((val, idx) => (
                                            <li key={idx}>{val.name}</li>
                                        ))}
                                    </ul>
                                ),
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'chuongTrinhDaoTao',
                                width: 200,
                                render: (values: { name: string }[]) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                            listStyleType: 'disc',
                                        }}
                                    >
                                        {values.map((val, idx) => (
                                            <li key={idx}>{val.name}</li>
                                        ))}
                                    </ul>
                                ),
                            },
                            {
                                title: 'Các lớp có môn',
                                dataIndex: 'cacLopCoMon',
                                width: 200,
                                render: (classes: { name: string }[]) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                            listStyleType: 'disc',
                                        }}
                                    >
                                        {classes.map((cls, idx) => (
                                            <li key={idx}>{cls.name}</li>
                                        ))}
                                    </ul>
                                ),
                            },
                            {
                                title: 'SV nợ',
                                dataIndex: 'svNo',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tổng SV',
                                dataIndex: 'tongSV',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số lớp môn học',
                                dataIndex: 'soLMH',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'donViPhuTrach',
                                width: 200,
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
                                                Mở Lớp
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataFake}
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

SubjectOpeningPlan.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
