import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import { PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { SubjectClass, TrainingObjectType } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useFindManyTrainingObjectType,
    useUpdateSubjectClass,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import HanNhapDiem from './modal-han-nhap-diem'
import dayjs from 'dayjs'

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
    const [editSubjectClass, setEditSubjectClass] =
        useState<SubjectClass | null>(null)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

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
        console.log(`Filter changed: ${key} = ${value}`)
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
        console.log('Filters updated:', filters)
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const handleChangeLocked = async (id: string, isLocked: boolean) => {}

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
                                  trainingObjectTypeId:
                                      filters.trainingObjectTypeId,
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
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
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

    const handleFilterApply = (newFilters: Partial<FilterProps>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters }
            console.log('Filters applied:', updatedFilters)
            debouncedRefetch()
            return updatedFilters
        })
    }

    useEffect(() => {
        filters
        debouncedRefetch()
    }, [filters, debouncedRefetch])
    // Cập nhật giá trị khi filter thay đổi
    useEffect(() => {
        form.setFieldsValue({
            searchText: filters.searchText,
            semesterId: filters.semesterId,
            trainingObjectTypeId: filters.trainingObjectTypeId,
        })
    }, [filters, form])

    const handleApply = async (data: SubjectClass) => {
        updateSubjectClass({
            where: { id: data.id },
            data: {
                examScoreDeadline: data.examScoreDeadline,
                scoreDeadline: data.scoreDeadline,
            },
        }).catch((error) => {
            console.error(
                'Error updating examScoreDeadline for item:',
                data.id,
                error
            )
        })

        console.log('Applying filters:', data)
    }

    const handleCheckExamDate = () => {
        dataTable.forEach((item: SubjectClass) => {
            if (item.examDate) {
                if (!item.examScoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const examScoreDeadline = new Date(
                        examDate.getTime() + 7 * 24 * 60 * 60 * 1000
                    )
                    item.examScoreDeadline = examScoreDeadline
                    if (
                        item.examScoreDeadline <=
                        new Date(new Date().setHours(24, 0, 0, 0))
                    ) {
                        item.isLockExamScore = true
                    } else if (
                        examDate >= new Date(new Date().setHours(24, 0, 0, 0))
                    ) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: {
                            examScoreDeadline,
                            isLockExamScore: item.isLockExamScore,
                        },
                    }).catch((error) => {
                        console.error(
                            'Error updating examScoreDeadline for item:',
                            item.id,
                            error
                        )
                    })
                } else {
                    const examDate = new Date(item.examDate)
                    if (
                        item.examScoreDeadline <
                        new Date(new Date().setHours(24, 0, 0, 0))
                    ) {
                        item.isLockExamScore = true
                    } else if (
                        examDate >= new Date(new Date().setHours(24, 0, 0, 0))
                    ) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockExamScore: item.isLockExamScore },
                    }).catch((error) => {
                        console.error(
                            'Error updating examScoreDeadline for item:',
                            item.id,
                            error
                        )
                    })
                }
                // Kiểm tra và cập nhật scoreDeadline
                if (!item.scoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const scoreDeadline = new Date(
                        examDate.getTime() - 7 * 24 * 60 * 60 * 1000
                    )
                    item.scoreDeadline = scoreDeadline
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { scoreDeadline, isLockScore: item.isLockScore },
                    }).catch((error) => {
                        console.error(
                            'Error updating scoreDeadline for item:',
                            item.id,
                            error
                        )
                    })
                } else {
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockScore: item.isLockScore },
                    }).catch((error) => {
                        console.error(
                            'Error updating scoreDeadline for item:',
                            item.id,
                            error
                        )
                    })
                }
            } else {
                console.log('No exam date found for item:', item)
            }
        })
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        handleCheckExamDate()
    }, [])

    console.log(dataTable)

    return (
        <div>
            <Form form={form}>
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row
                            gutter={[16, 16]}
                            align="top"
                            justify="space-between"
                        >
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
                                                defaultValue={
                                                    filters.semesterId ||
                                                    undefined
                                                }
                                                onChange={(val) =>
                                                    handleFilterChange(
                                                        'semesterId',
                                                        val
                                                    )
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
                                                    (
                                                        i: TrainingObjectType
                                                    ) => ({
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
                            Hạn nhập điểm CC, TX tự động đặt là trước ngày thi 1
                            tuần, hạn nhập điểm thi tự động đặt là trước ngày
                            thi lớp 1 tuần
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
                                        index +
                                        1 +
                                        (currentPage - 1) *
                                            DEFAULT_PAGINATE_SIZE,
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
                                    fixed: 'left',
                                },
                                {
                                    title: 'Môn học',
                                    width: 250,
                                    render: (text, record) =>
                                        record.subject?.name || text,
                                    fixed: 'left',
                                },
                                {
                                    title: 'Số tín chỉ',
                                    width: 80,
                                    align: 'center',
                                    render: (text, record) =>
                                        record.subject?.credit || text,
                                },
                                {
                                    title: 'Hạn ĐQT',
                                    width: 120,
                                    align: 'center',
                                    render: ({ scoreDeadline }) =>
                                        scoreDeadline
                                            ? dayjs(scoreDeadline).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Số ngày',
                                    dataIndex: 'ngayDot',
                                    width: 80,
                                    align: 'center',
                                },
                                {
                                    title: 'Hạn ĐT',
                                    width: 120,
                                    align: 'center',
                                    render: ({ examScoreDeadline }) =>
                                        examScoreDeadline
                                            ? dayjs(examScoreDeadline).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Giảng viên',
                                    width: 200,
                                    align: 'center',
                                    render: (text, record) => {
                                        const mainLecturer = record.mainLecturer
                                            ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                            : 'Chưa có giảng viên chính'
                                        const extraLecturer =
                                            record.extraLecturer
                                                ? `, ${record.extraLecturer.userProfile.lastName} ${record.extraLecturer.userProfile.firstName}`
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
                                        const enterGradeLecturer =
                                            record.enterGradeLecturer
                                                ? `${record.enterGradeLecturer.userProfile.lastName} ${record.enterGradeLecturer.userProfile.firstName}`
                                                : ''
                                        const mainLecturer = record.mainLecturer
                                            ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                            : ''
                                        const extraLecturer =
                                            record.extraLecturer
                                                ? `${record.extraLecturer.userProfile.lastName} ${record.extraLecturer.userProfile.firstName}`
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
                                    render: ({ startDate }) =>
                                        startDate
                                            ? dayjs(startDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Ngày thi',
                                    width: 150,
                                    align: 'center',
                                    render: ({ examDate }) =>
                                        examDate
                                            ? dayjs(examDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Ngày kết thúc',
                                    width: 150,
                                    align: 'center',
                                    render: ({ endDate }) =>
                                        endDate
                                            ? dayjs(endDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Bộ môn',
                                    dataIndex: 'danhSachLop',
                                    width: 200,
                                    align: 'center',
                                    render: (text, record) => {
                                        return (
                                            <span>
                                                {record.subject
                                                    ?.managementOrganization
                                                    ?.sTen || 'Chưa có bộ môn'}
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
                                                {record.subject
                                                    ?.managementOrganization
                                                    ?.parent?.sTen ||
                                                    'Chưa có khoa'}
                                            </span>
                                        )
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'trangThai',
                                    width: 150,
                                    // fixed: 'right',
                                    align: 'center',
                                    render: (text, record) => {
                                        if (
                                            record.active === true ||
                                            record.active === 'active'
                                        ) {
                                            return (
                                                <Tag color="green">
                                                    Đang hoạt động
                                                </Tag>
                                            )
                                        }
                                        if (
                                            record.active === false ||
                                            record.active === 'inactive'
                                        ) {
                                            return (
                                                <Tag color="red">Kết thúc</Tag>
                                            )
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
                                                    <Row
                                                        className="flex justify-center items-center gap-2 text-[#028850]"
                                                        onClick={() => {
                                                            setEditSubjectClass(
                                                                record as SubjectClass
                                                            )
                                                        }}
                                                    >
                                                        <HanNhapDiem
                                                            data={
                                                                editSubjectClass
                                                            }
                                                            onFilterChange={
                                                                handleFilterChange
                                                            }
                                                            onApply={
                                                                handleApply
                                                            }
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
