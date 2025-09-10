import { CalendarOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function SubjectClassScore() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [form] = Form.useForm()

    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        semesterId: '',
        trainingObjectId: null,
        subjectName: '',
        scoreDeadline: undefined,
        examScoreDeadline: undefined,
        startDate: undefined,
        examDate: undefined,
        endDate: undefined,
    })

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'HanNhapDiem',
    })

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.trainingObjectId
                ? {
                      subjectClassStudent: {
                          some: {
                              student: {
                                  trainingObjectTypeId: filters.trainingObjectId,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.subjectName && filters.subjectName !== ''
                ? {
                      subject: {
                          name: {
                              contains: filters.subjectName,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.scoreDeadline?.length === 2
                ? {
                      scoreDeadline: {
                          gte: dayjs(filters.scoreDeadline?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.scoreDeadline?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.examScoreDeadline?.length === 2
                ? {
                      examScoreDeadline: {
                          gte: dayjs(filters.examScoreDeadline?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examScoreDeadline?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.startDate?.length === 2
                ? {
                      startDate: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.examDate?.length === 2
                ? {
                      examDate: {
                          gte: dayjs(filters.examDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      endDate: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }),
        [
            filters.code,
            filters.name,
            filters.semesterId,
            filters.trainingObjectId,
            filters.subjectName,
            filters.scoreDeadline,
            filters.examScoreDeadline,
            filters.startDate,
            filters.examDate,
            filters.endDate,
        ]
    )

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
        where,
        include: {
            subject: {
                include: {
                    managementOrganization: true,
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
            ...where,
            deletedAt: null,
        },
    })

    /* Mới */
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    return (
        <div>
            <Form form={form}>
                <Row gutter={[16, 0]}>
                    <Col span={24} className="pb-2">
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={12}>
                                <Flex>
                                    <Col span={8}>
                                        <Form.Item
                                            className="mb-0"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <TreeSelectSemester
                                                filterTimeNow={true}
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
                            filters={filters}
                            setFilters={setFilters}
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
                                    width: 200,
                                    fixed: 'left',
                                    type: 'input',
                                },
                                {
                                    title: 'Tên lớp',
                                    dataIndex: 'name',
                                    align: 'center',
                                    width: 200,
                                    type: 'input',
                                },
                                {
                                    title: 'Môn học',
                                    width: 250,
                                    dataIndex: 'subjectName',
                                    render: (text, record) => record?.subject?.name || text,
                                    type: 'input',
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
                                    dataIndex: 'scoreDeadline',
                                    align: 'center',
                                    type: 'date',
                                    render: (_, record) =>
                                        record.scoreDeadline
                                            ? dayjs(record.scoreDeadline).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Số ngày',
                                    width: 100,
                                    align: 'center',
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
                                    type: 'date',
                                    render: (_, record) =>
                                        record.examScoreDeadline
                                            ? dayjs(record.examScoreDeadline).format('DD/MM/YYYY')
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
                                    type: 'date',
                                    render: (_, record) =>
                                        record.startDate
                                            ? dayjs(record.startDate).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Ngày thi',
                                    width: 150,
                                    align: 'center',
                                    type: 'date',
                                    render: (_, record) =>
                                        record.examDate
                                            ? dayjs(record.examDate).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Ngày kết thúc',
                                    width: 150,
                                    align: 'center',
                                    type: 'date',
                                    render: (_, record) =>
                                        record.endDate
                                            ? dayjs(record.endDate).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Bộ môn',
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

                                onChange: (page, pageSize) => {
                                    if (numberOfPages === pageSize) {
                                        setCurrentPage(page)
                                    } else {
                                        setCurrentPage(1)
                                        setNumberOfPages(pageSize)
                                    }
                                },
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
