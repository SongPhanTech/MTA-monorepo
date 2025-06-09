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
import { Search } from 'lucide-react'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    message,
} from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    trainingCourseId: string | null
}

export default function TeachingAssignment() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
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
            maLMH: '003560 01',
            pcgd: true,
            stc: 3,
            gv1: 'gv1',
            kipHoc: 'Sáng',
            diaDiem: 1,
            gvNhapDiem: 'Nguyễn Quang Uy',
            hanPCGD: '29/09/2025',
            thi: 'Thi viết',
            diemBangNhau: true,
            donViPhuTrach: 'Bộ môn Khoa học máy tính',
        },
        {
            id: 2,
            maMonHoc: '003603',
            tenMonHoc: 'Toán rời rạc',
            maLMH: '003560 02',
            gv1: 'gv2',
            stc: 3,
            donViPhuTrach: 'Bộ môn Khoa học máy tính',
        },
    ]

    const lecturerOptions = [
        { label: 'Nguyễn Văn A', value: 'gv1' },
        { label: 'Trần Thị B', value: 'gv2' },
        { label: 'Lê Văn C', value: 'gv3' },
    ]

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
                                <Button
                                    //TODO: handle export
                                    type="primary"
                                    className="h-[40px]"
                                >
                                    <EditIcon stroke="white" />
                                    Nhập
                                </Button>
                                <Button
                                    //TODO: handle save
                                    type="primary"
                                    className="h-[40px]"
                                >
                                    Lưu
                                </Button>
                                <Button
                                    //TODO: handle cancel
                                    type="primary"
                                    className="h-[40px]"
                                >
                                    Hủy
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
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
                                title: 'PCGD',
                                dataIndex: 'pcgd',
                                align: 'center',
                                width: 100,
                                render: (value) => {
                                    return value ? (
                                        <CheckOutlined className="text-[#028850]" />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Mã lớp môn học',
                                dataIndex: 'maLMH',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'stc',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Giảng viên 1',
                                dataIndex: 'gv1',
                                width: 200,
                                render: (value, index) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={lecturerOptions}
                                        value={value || undefined}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue) => {
                                            console.log(
                                                `Selected ${selectedValue} for row ${index}`
                                            )
                                        }}
                                    />
                                ),
                            },
                            {
                                title: 'Giảng viên 2',
                                dataIndex: 'gv2',
                                width: 150,
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'thi',
                                width: 120,
                            },
                            {
                                title: 'Kíp học',
                                dataIndex: 'kipHoc',
                                width: 100,
                            },
                            {
                                title: 'Địa điểm',
                                dataIndex: 'diaDiem',
                                width: 100,
                            },
                            {
                                title: 'Giảng viên nhập điểm',
                                dataIndex: 'gvNhapDiem',
                                width: 150,
                            },
                            {
                                title: 'Phòng học',
                                dataIndex: 'phongHoc',
                                width: 100,
                            },
                            {
                                title: 'Hạn PCGD',
                                dataIndex: 'hanPCGD',
                                width: 100,
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'donViPhuTrach',
                                width: 200,
                            },
                            {
                                title: 'Điểm bằng nhau',
                                dataIndex: 'diemBangNhau',
                                width: 150,
                                align: 'center',
                                render: (value: boolean) => (
                                    <Checkbox checked={value} disabled />
                                ),
                            },
                            {
                                title: 'Lớp liên kết',
                                dataIndex: 'lopLienKet',
                                width: 150,
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

TeachingAssignment.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
