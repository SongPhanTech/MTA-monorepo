import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType, TrainingScoreSession } from '@workspace/db'
import {
    useCountTrainingScoreSession,
    useCreateTrainingScoreSession,
    useDeleteTrainingScoreSession,
    useFindManySemester,
    useFindManyTrainingObjectType,
    useFindManyTrainingScoreSession,
    useUpdateTrainingScoreSession,
} from '@workspace/db/hooks'
import { Button, Col, DatePicker, Flex, Form, Input, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import ModalDotDanhGia from './modal-dot-danh-gia'

// import LopBienCheItem from './lop-bien-che'
// const { Option } = Select;
interface FilterProps {
    semesterId: string | null //Học kỳ
    timeFilter?: [string, string] | null
    trainingObjectTypeId: string | null
    searchText: string
}

export default function SubjectClassScore() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const [isModalVisible, setIsModalVisible] = useState(false)
    const [selectedSession, setSelectedSession] = useState<TrainingScoreSession | null>(null)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        timeFilter: undefined,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: semesterData = [] } = useFindManySemester({
        orderBy: {
            startDate: 'desc',
        },
    })

    // const { data: subjectClassData = [] } = useFindManyFixedClass({
    const { data: TrainingScoreSessionData = [], refetch } = useFindManyTrainingScoreSession({
        where: selectedSemesterId
            ? {
                  semesterId: selectedSemesterId,
                  ...(filters.searchText && filters.searchText !== ''
                      ? {
                            OR: [
                                { name: { contains: filters.searchText } },
                                { code: { contains: filters.searchText } },
                            ],
                        }
                      : {}),
                  ...(filters.trainingObjectTypeId
                      ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                      : {}),
                  ...(filters.timeFilter?.[0] && filters.timeFilter[1]
                      ? {
                            time: {
                                gte: new Date(filters.timeFilter[0]).toISOString(),
                                lte: new Date(filters.timeFilter[1]).toISOString(),
                            },
                        }
                      : {}),
              }
            : {
                  // If no selectedSemesterId, return no data by using an impossible condition.
                  id: { equals: '' },
              },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    console.log('filters.timeFilter', filters.timeFilter)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountTrainingScoreSession({
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

    const handleChangeSemester = async (id: string) => {
        try {
            showSpinner()
            console.log('Selected Semester ID:', id)
            setSelectedSemesterId(id)
            // const semester = semesterData.find((sem: Semester) => sem.id === id)
            // setSelectedSemesterId(semester)
            setFilters((prev) => ({
                ...prev,
                semesterId: id,
            }))
            debouncedRefetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
        },
    }
    const handleModalDotDanhGia = () => {
        setIsEditMode(false)
        setIsModalVisible(true)
    }

    const { mutateAsync: createTrainingScoreSession } = useCreateTrainingScoreSession()
    const { mutateAsync: updateTrainingScoreSession } = useUpdateTrainingScoreSession()
    const { mutateAsync: deleteTrainingScoreSession } = useDeleteTrainingScoreSession()

    const handleModalSubmit = async (data: any) => {
        try {
            showSpinner()
            // Xử lý dữ liệu và gọi API để lưu đợt đánh giá
            console.log('Submitted Data:', data)
            await createTrainingScoreSession({
                data: {
                    name: data.tenDot,
                    semesterId: data.hocKi,
                    trainingObjectTypeId: data.doituong,
                    time: data.thoiGian ? new Date(data.thoiGian).toISOString() : undefined,
                    description: data.ghiChu || '',
                },
            })
            message.success('Thêm mới đợt đánh giá thành công')
            setIsModalVisible(false)
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const handleEdit = async (id: string, data: any) => {
        try {
            showSpinner()
            console.log('Editing Data:', data)
            await updateTrainingScoreSession({
                where: { id: id },
                data: {
                    name: data.tenDot,
                    semesterId: data.hocKi,
                    trainingObjectTypeId: data.doituong,
                    time: data.thoiGian ? new Date(data.thoiGian).toISOString() : undefined,
                    description: data.ghiChu || '',
                },
            })
            message.success('Cập nhật đợt đánh giá thành công')
            setIsModalVisible(false)
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleEditModalDotDanhGia = (data: any) => {
        setSelectedSemesterId(data.semesterId)
        setSelectedSession(data)
        setIsModalVisible(true)
        setIsEditMode(true)
    }

    const handleDeleteDotDanhGia = async (id: string) => {
        try {
            showSpinner()
            // Gọi API để xóa đợt đánh giá
            await updateTrainingScoreSession({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa đợt đánh giá thành công')
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            {/* Từ ngày {selectedSemester?.startDate ? new Date(selectedSemester.startDate).toLocaleDateString('vi-VN') : ''} đến ngày {selectedSemester?.endDate ? new Date(selectedSemester.endDate).toLocaleDateString('vi-VN') : ''} */}
            <Row>
                <Col span={24} className="flex justify-end">
                    <Row>
                        <Col span={20}>
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
                                                    placeholder="Nhập tên đợt đánh giá"
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
                                                name="semesterId"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <TreeSelectSemester
                                                    style={{ height: 40 }}
                                                    placeholder="Học kỳ"
                                                    onChange={(val) => handleChangeSemester(val)}
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

                                        <Col span={10} className="flex">
                                            <Form.Item
                                                className="mb-0"
                                                name="timeFilter"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <DatePicker.RangePicker
                                                    placeholder={['Từ ngày', 'Đến ngày']}
                                                    style={{ width: '100%', height: 40 }}
                                                    allowClear
                                                    onChange={(dates, dateStrings) => {
                                                        setFilters((prev) => ({
                                                            ...prev,
                                                            timeFilter: dateStrings.length
                                                                ? [dateStrings[0], dateStrings[1]]
                                                                : null,
                                                        }))
                                                    }}
                                                    format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Flex>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={4}>
                            <Flex justify="end" gap={10}>
                                {/* <Button
                                onClick={handleModal}
                                className="border-primary text-primary"
                            >
                                <PlusOutlined />
                                Thêm mới năm học
                            </Button> */}
                                <Button
                                    // onClick={handleModalSemester}
                                    type="primary"
                                    style={{ height: 40 }}
                                    onClick={handleModalDotDanhGia}
                                >
                                    <PlusOutlined />
                                    Thêm mới đợt đánh giá
                                </Button>
                            </Flex>
                        </Col>
                        <Col span={24}>
                            <Table
                                rowKey="id"
                                id="training-category"
                                // rowSelection={rowSelection}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        align: 'center',
                                        fixed: 'left',
                                        render: (_, __, index) =>
                                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                    },
                                    {
                                        title: 'Đợt đánh giá',
                                        dataIndex: 'name',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => <>{record.name || ''}</>,
                                    },
                                    {
                                        title: 'Đối tượng',
                                        dataIndex: 'stc',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => {
                                            const trainingObj = trainingObjectTypeData.find(
                                                (item) => item.id === record.trainingObjectTypeId
                                            )
                                            return trainingObj?.name || 'Chưa có đối tượng'
                                        },
                                    },
                                    {
                                        title: 'Thời gian',
                                        dataIndex: 'time',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => {
                                            const date = new Date(record.time)
                                            const day = String(date.getDate()).padStart(2, '0')
                                            const month = String(date.getMonth() + 1).padStart(
                                                2,
                                                '0'
                                            )
                                            const year = date.getFullYear()
                                            return `${day}/${month}/${year}`
                                        },
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'active',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => (
                                            <Tag color={record.active ? 'green' : 'red'}>
                                                {record.active ? 'Mở' : 'Đóng'}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: 'Thao tác',
                                        dataIndex: 'action',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        handleEditModalDotDanhGia(record)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteDotDanhGia(record.id),
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Row>
                                        ),
                                    },
                                ]}
                                data={TrainingScoreSessionData}
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
                </Col>
            </Row>
            <ModalDotDanhGia
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleModalSubmit}
                onEdit={handleEdit}
                data={selectedSession}
                isEdit={isEditMode}
            />
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
