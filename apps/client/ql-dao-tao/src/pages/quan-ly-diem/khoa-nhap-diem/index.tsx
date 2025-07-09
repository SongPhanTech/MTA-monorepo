import { CalendarOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import { HanNhapDiem } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySemester,
    useFindManySubjectClass,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    semesterId: string | null //Học kỳ
    trainingObjectTypeId: string | null
}

export default function SubjectClassScore() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [form] = Form.useForm()

    const { data: semesters = [] } = useFindManySemester({
        orderBy: {
            createdAt: 'desc',
        },
    })

    const latestSemester = useMemo(() => semesters?.[0]?.id || null, [semesters])

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: latestSemester,
        trainingObjectTypeId: null,
    })

    const { onOpen, onClose } = useDisclosure<string>({
        tag: HanNhapDiem.name,
    })

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
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
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.trainingObjectTypeId
                ? {
                      subjectClassStudent: {
                          some: {
                              student: {
                                  trainingObjectTypeId: filters.trainingObjectTypeId,
                              },
                          },
                      },
                  }
                : {}),
            deletedAt: null,
        },
        include: {
            subject: {
                include: {
                    managementOrganization: { include: { parent: true } },
                },
            },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
            enterGradeLecturer: {
                include: { userProfile: true },
            },
            subjectClassStudent: {
                include: {
                    student: { include: { userProfile: true } },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountSubjectClass({
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
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.trainingObjectTypeId
                ? {
                      subjectClassStudent: {
                          some: {
                              student: {
                                  trainingObjectTypeId: filters.trainingObjectTypeId,
                              },
                          },
                      },
                  }
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

    useEffect(() => {
        if (latestSemester && !filters.semesterId) {
            setFilters((prev) => ({
                ...prev,
                semesterId: latestSemester,
            }))
        }
    }, [latestSemester, filters.semesterId])

    return (
        <div>
            <Form form={form}>
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
                                                    handleFilterChange('searchText', e.target.value)
                                                }
                                                placeholder="Nhập tên lớp..."
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
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <TreeSelectSemester
                                                style={{ height: 40 }}
                                                defaultValue={latestSemester || ''}
                                                value={filters.semesterId || ''}
                                                onChange={(val) =>
                                                    handleFilterChange('semesterId', val)
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            className="mb-0"
                                            name="trainingObjectTypeId"
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
                                                    handleFilterChange('trainingObjectTypeId', val)
                                                }
                                                allowClear
                                            />
                                        </Form.Item>
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
                        <p
                            style={{
                                color: 'red',
                                fontWeight: 'bold',
                                marginBottom: 16,
                            }}
                        >
                            Hạn nhập điểm CC, TX tự động đặt là trước ngày thi 1 tuần, hạn nhập điểm
                            thi tự động đặt là trước ngày thi lớp 1 tuần
                        </p>
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
                                        index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                },
                                {
                                    title: 'Mã lớp',
                                    dataIndex: 'code',
                                    align: 'center',
                                    width: 150,
                                    fixed: 'left',
                                },
                                {
                                    title: 'Tên lớp',
                                    dataIndex: 'name',
                                    align: 'center',
                                    width: 200,
                                },
                                {
                                    title: 'Môn học',
                                    width: 250,
                                    render: (text, record) => record?.subject?.name || text,
                                },
                                {
                                    title: 'Số tín chỉ',
                                    width: 80,
                                    align: 'center',
                                    render: (text, record) => record?.subject?.credit || text,
                                },
                                {
                                    title: 'Hạn ĐQT',
                                    width: 120,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const dateA = a.scoreDeadline
                                            ? new Date(a.scoreDeadline).getTime()
                                            : 0
                                        const dateB = b.scoreDeadline
                                            ? new Date(b.scoreDeadline).getTime()
                                            : 0
                                        return dateA - dateB
                                    },
                                    render: ({ scoreDeadline }) =>
                                        scoreDeadline
                                            ? dayjs(scoreDeadline).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Số ngày',
                                    width: 100,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const today = dayjs()

                                        // Hàm tính số ngày còn lại
                                        const calculateDaysRemaining = (record: any) => {
                                            const scoreDeadline = record?.scoreDeadline
                                                ? dayjs(record?.scoreDeadline)
                                                : null
                                            const examDeadline = record?.examScoreDeadline
                                                ? dayjs(record?.examScoreDeadline)
                                                : null

                                            // Nếu không có cả 2 hạn
                                            if (!scoreDeadline && !examDeadline)
                                                return Number.POSITIVE_INFINITY

                                            // Nếu chưa qua hạn ĐQT
                                            if (scoreDeadline && today.isBefore(scoreDeadline)) {
                                                return scoreDeadline.diff(today, 'day')
                                            }
                                            // Nếu đã qua hạn ĐQT nhưng chưa qua hạn ĐT
                                            if (examDeadline && today.isBefore(examDeadline)) {
                                                return examDeadline.diff(today, 'day')
                                            }
                                            // Đã qua cả 2 hạn
                                            return Number.NEGATIVE_INFINITY
                                        }

                                        const daysA = calculateDaysRemaining(a)
                                        const daysB = calculateDaysRemaining(b)

                                        return daysA - daysB
                                    },
                                    render: (record) => {
                                        const today = dayjs()
                                        const scoreDeadline = dayjs(record?.scoreDeadline)
                                        const examScoreDeadline = dayjs(record?.examScoreDeadline)

                                        if (!scoreDeadline && !examScoreDeadline) {
                                            return 'N/A'
                                        }

                                        let daysRemaining: number
                                        let deadlineType: string

                                        // Nếu chưa qua hạn ĐQT
                                        if (today?.isBefore(scoreDeadline)) {
                                            daysRemaining = scoreDeadline?.diff(today, 'day')
                                            deadlineType = 'ĐQT'
                                        }
                                        // Nếu đã qua hạn ĐQT nhưng chưa qua hạn ĐT
                                        else if (today?.isBefore(examScoreDeadline)) {
                                            daysRemaining = examScoreDeadline?.diff(today, 'day')
                                            deadlineType = 'ĐT'
                                        } else {
                                            return 'Hết hạn'
                                        }

                                        return (
                                            <Tooltip
                                                title={`Còn ${daysRemaining} ngày trước hạn ${deadlineType}`}
                                            >
                                                <span
                                                    style={{
                                                        color:
                                                            daysRemaining <= 3
                                                                ? 'red'
                                                                : daysRemaining <= 7
                                                                  ? 'orange'
                                                                  : 'green',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {daysRemaining}
                                                </span>
                                            </Tooltip>
                                        )
                                    },
                                },
                                {
                                    title: 'Hạn ĐT',
                                    width: 120,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const dateA = a.examScoreDeadline
                                            ? new Date(a.examScoreDeadline).getTime()
                                            : 0
                                        const dateB = b.examScoreDeadline
                                            ? new Date(b.examScoreDeadline).getTime()
                                            : 0
                                        return dateA - dateB
                                    },
                                    render: ({ examScoreDeadline }) =>
                                        examScoreDeadline
                                            ? dayjs(examScoreDeadline).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Giảng viên',
                                    width: 200,
                                    align: 'center',
                                    render: (text, record) => {
                                        const mainLecturer = record?.mainLecturer
                                            ? `${record?.mainLecturer?.userProfile?.lastName} ${record?.mainLecturer?.userProfile?.firstName}`
                                            : 'Chưa có giảng viên chính'
                                        const extraLecturer = record?.extraLecturer
                                            ? `, ${record?.extraLecturer?.userProfile?.lastName} ${record?.extraLecturer?.userProfile?.firstName}`
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
                                    width: 200,
                                    align: 'center',
                                    render: (text, record) => {
                                        const enterGradeLecturer = record?.enterGradeLecturer
                                            ? `${record?.enterGradeLecturer?.userProfile?.lastName} ${record?.enterGradeLecturer?.userProfile?.firstName}`
                                            : ''
                                        const mainLecturer = record?.mainLecturer
                                            ? `${record?.mainLecturer?.userProfile?.lastName} ${record?.mainLecturer?.userProfile?.firstName}`
                                            : ''
                                        const extraLecturer = record?.extraLecturer
                                            ? `${record?.extraLecturer?.userProfile?.lastName} ${record?.extraLecturer?.userProfile?.firstName}`
                                            : ''
                                        return (
                                            <span>
                                                {enterGradeLecturer ||
                                                    mainLecturer ||
                                                    extraLecturer ||
                                                    'Chưa có giảng viên NĐ'}
                                            </span>
                                        )
                                    },
                                },

                                {
                                    title: 'Ngày bắt đầu',
                                    width: 150,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const dateA = a.startDate
                                            ? new Date(a.startDate).getTime()
                                            : 0
                                        const dateB = b.startDate
                                            ? new Date(b.startDate).getTime()
                                            : 0
                                        return dateA - dateB
                                    },
                                    render: ({ startDate }) =>
                                        startDate ? dayjs(startDate).format('DD/MM/YYYY') : '',
                                },
                                {
                                    title: 'Ngày thi',
                                    width: 150,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const dateA = a.examDate
                                            ? new Date(a.examDate).getTime()
                                            : 0
                                        const dateB = b.examDate
                                            ? new Date(b.examDate).getTime()
                                            : 0
                                        return dateA - dateB
                                    },
                                    render: ({ examDate }) =>
                                        examDate ? dayjs(examDate).format('DD/MM/YYYY') : '',
                                },
                                {
                                    title: 'Ngày kết thúc',
                                    width: 150,
                                    align: 'center',
                                    sorter: (a: any, b: any) => {
                                        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0
                                        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0
                                        return dateA - dateB
                                    },
                                    render: ({ endDate }) =>
                                        endDate ? dayjs(endDate).format('DD/MM/YYYY') : '',
                                },
                                {
                                    title: 'Bộ môn',
                                    dataIndex: 'danhSachLop',
                                    width: 200,
                                    align: 'center',
                                    render: (text, record) => {
                                        return (
                                            <span>
                                                {record?.subject?.managementOrganization?.sTen ||
                                                    'Chưa có bộ môn'}
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
                                                {record?.subject?.managementOrganization?.parent
                                                    ?.sTen || 'Chưa có khoa'}
                                            </span>
                                        )
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    width: 150,
                                    fixed: 'right',
                                    align: 'center',
                                    render: (text, record) => {
                                        if (
                                            record?.active === true ||
                                            record?.active === 'active'
                                        ) {
                                            return <Tag color="green">Đang hoạt động</Tag>
                                        }
                                        if (
                                            record?.active === false ||
                                            record?.active === 'inactive'
                                        ) {
                                            return <Tag color="red">Kết thúc</Tag>
                                        }
                                        return ''
                                    },
                                },
                                {
                                    title: 'Thao tác',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (text, record) => {
                                        if (record.id) {
                                            return (
                                                <div className="flex justify-center items-center gap-2">
                                                    <Row className="flex justify-center items-center gap-2 text-primary">
                                                        <Button
                                                            icon={<CalendarOutlined />}
                                                            onClick={() => onOpen(record.id)}
                                                            style={{
                                                                height: '40px',
                                                                width: '40px',
                                                            }}
                                                        />
                                                        Đặt lại lịch nhập điểm
                                                    </Row>
                                                </div>
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
            </Form>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
