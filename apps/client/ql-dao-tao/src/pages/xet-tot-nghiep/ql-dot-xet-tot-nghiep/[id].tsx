import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutGraduationApplication } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useApplicationStatusOptions } from '@hooks/applicationStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { Gender } from '@workspace/db'
import {
    useCountStudentGraduationApplication,
    useFindManyStudentGraduationApplication,
    useUpdateStudentGraduationApplication,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | null
}

export default function StudentGraduationApplication() {
    const router = useRouter()
    const { getApplicationStatusLabel, getApplicationStatusColor } = useApplicationStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const graduationSessionId = router.query.id as string

    const { data: studentGraduationApplicationData, refetch } =
        useFindManyStudentGraduationApplication({
            where: {
                ...(filters.searchText && filters.searchText !== ''
                    ? {
                          code: { contains: filters.searchText, mode: 'insensitive' },
                      }
                    : {}),
                sessionId: graduationSessionId,
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        })

    const { data: count } = useCountStudentGraduationApplication({
        where: {
            sessionId: graduationSessionId,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{
        id: string | null
        graduationSessionId: string | undefined
    }>({
        tag: PutGraduationApplication.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: null, graduationSessionId })
    }
    const { mutateAsync: updateStudentGraduationApplication } =
        useUpdateStudentGraduationApplication()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateStudentGraduationApplication({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
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

    return (
        <Row gutter={[16, 0]} className="mt-2">
            <Col span={24} className="!p-0">
                <Flex vertical gap={16}>
                    <Col span={24}>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            {/* <TableCollapse
                                rowKey="id"
                                headerTitleKey="name"
                                childrenFieldName="awards"
                                filters={filters}
                                setFilters={setFilters}
                                defaultExpandAll
                                columns={[
                                    {
                                        title: 'Mã sinh viên',
                                        dataIndex: 'code',
                                        width: 120,
                                        align: 'center',
                                        type: 'input',
                                        multiple: ['name', 'scholarship'],
                                        render: (__, record) => record?.student?.userProfile?.code,
                                    },
                                    {
                                        title: 'Tên sinh viên',
                                        dataIndex: 'name',
                                        width: 150,
                                        type: 'input',
                                        multiple: ['code', 'scholarship'],
                                        render: (__, record) =>
                                            record?.student?.userProfile?.fullname,
                                    },
                                    {
                                        title: 'GPA',
                                        dataIndex: ['gpaAtAward'],
                                        width: 120,
                                        align: 'center',
                                    },
                                    {
                                        title: 'Số tiền học bổng',
                                        dataIndex: ['amount'],
                                        width: 150,
                                    },
                                    {
                                        title: 'Học bổng',
                                        dataIndex: 'scholarship',
                                        width: 200,
                                        type: 'select',
                                        multiple: ['code', 'name'],
                                        options: dataScholarship.map((i: any) => ({
                                            value: i.id,
                                            label: [i.name, i.rankOrder, i.trainingCourse.name]
                                                .filter(Boolean)
                                                .join(' - '),
                                        })),
                                        render: (__, record) => record?.scholarship?.name,
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
                                                        <DeleteIcon
                                                            popConfirm={{
                                                                onConfirm: () =>
                                                                    handleDeleteScholarshipAward(
                                                                        id
                                                                    ),
                                                            }}
                                                        />
                                                    </Row>
                                                )
                                            }
                                            return ''
                                        },
                                    },
                                ]}
                                data={transformedTrainingCourses}
                                pagination={{
                                    current: currentPage,
                                    pageSize: numberOfPages,
                                    total: count,
                                    onChange: setCurrentPage,
                                    onShowSizeChange: setNumberOfPages,
                                }}
                            /> */}
                        </div>
                    </Col>
                    <Flex>
                        <Col span={14}>
                            <div className="bg-white rounded-lg shadow-sm p-4">
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
                                                                placeholder="Tìm kiếm đơn..."
                                                                className="py-0"
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
                                                </Flex>
                                            </Col>
                                            <Col span={12}>
                                                <Flex justify="end" gap={4} className="ml-auto">
                                                    {/* <Button type="primary">
                                                        <FileUp />
                                                        Nhập đơn xét tốt nghiệp
                                                    </Button> */}
                                                    <Button onClick={handleModal} type="primary">
                                                        <BookPlus />
                                                        Thêm
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        className="h-[32px] px-4"
                                                        // onClick={handleTransferData}
                                                        // disabled={transferDataDisabled}
                                                    >
                                                        <BookPlus />
                                                        Xét
                                                    </Button>
                                                </Flex>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            rowKey="id"
                                            id="student-graduation-application"
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
                                                    title: 'Mã sinh viên',
                                                    align: 'center',
                                                    width: 100,
                                                    fixed: 'left',
                                                    render: (_, record) =>
                                                        record.student?.userProfile?.code || '',
                                                },
                                                {
                                                    title: 'Họ và tên',
                                                    width: 150,
                                                    render: (record) =>
                                                        record.student?.userProfile?.fullname,
                                                },
                                                {
                                                    title: 'Ngày sinh',
                                                    width: 150,
                                                    render: (record) =>
                                                        record?.student?.userProfile?.dateOfBirth
                                                            ? dayjs(
                                                                  record?.student?.userProfile
                                                                      ?.dateOfBirth
                                                              ).format('DD/MM/YYYY')
                                                            : '',
                                                },
                                                {
                                                    title: 'Giới tính',
                                                    dataIndex: ['student', 'userProfile', 'gender'],
                                                    width: 70,
                                                    render: (value: Gender) => {
                                                        switch (value) {
                                                            case Gender.Male:
                                                                return 'Nam'
                                                            case Gender.Female:
                                                                return 'Nữ'
                                                            default:
                                                                return ''
                                                        }
                                                    },
                                                },
                                                {
                                                    title: 'Nơi sinh',
                                                    dataIndex: [
                                                        'student',
                                                        'userProfile',
                                                        'placeOfBirth',
                                                    ],
                                                    width: 150,
                                                },
                                                {
                                                    title: 'Dân tộc',
                                                    dataIndex: '',
                                                    width: 100,
                                                },
                                                {
                                                    title: 'Ngày nộp đơn',
                                                    dataIndex: 'applicationDate',
                                                    width: 150,
                                                    render: (record: string) =>
                                                        record
                                                            ? dayjs(record).format('DD/MM/YYYY')
                                                            : '',
                                                },
                                                {
                                                    title: 'Trạng thái',
                                                    dataIndex: 'status',
                                                    align: 'center',
                                                    width: 140,
                                                    fixed: 'right',
                                                    render: (record) => {
                                                        const label =
                                                            getApplicationStatusLabel(record)
                                                        const color =
                                                            getApplicationStatusColor(record)
                                                        return <Tag color={color}>{label}</Tag>
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
                                                                    <EditIcon
                                                                        onClick={() => {
                                                                            onOpen({
                                                                                id,
                                                                                graduationSessionId,
                                                                            })
                                                                        }}
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
                                            pagination={{
                                                current: currentPage,
                                                pageSize: numberOfPages,
                                                total: count,
                                                onChange: setCurrentPage,
                                                onShowSizeChange: setNumberOfPages,
                                            }}
                                            data={studentGraduationApplicationData}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        <Col span={10}>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                {/* <Flex vertical>
                                    <Flex justify="space-between" align="center">
                                        <h3 className="font-medium">
                                            Danh sách sinh viên được chọn
                                        </h3>
                                        <Button
                                            type="primary"
                                            onClick={handleSaveScholarshipAward}
                                            disabled={rightPanelData.length === 0}
                                        >
                                            Lưu
                                        </Button>
                                    </Flex>

                                    {rightPanelData.length > 0 ? (
                                        <Table
                                            rowKey="id"
                                            data={rightPanelData}
                                            columns={[
                                                {
                                                    title: 'STT',
                                                    width: 50,
                                                    align: 'center',
                                                    fixed: 'left',
                                                    render: (_, __, index) =>
                                                        index +
                                                        1 +
                                                        (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                                },
                                                {
                                                    title: 'Mã sinh viên',
                                                    dataIndex: ['code'],
                                                    width: 120,
                                                    align: 'center',
                                                    fixed: 'left',
                                                },
                                                {
                                                    title: 'Tên sinh viên',
                                                    dataIndex: ['fullname'],
                                                    width: 200,
                                                    fixed: 'left',
                                                },
                                                {
                                                    title: 'Trung bình hệ 4',
                                                    dataIndex: ['gpaAtAward'],
                                                    width: 150,
                                                    align: 'center',
                                                },
                                                {
                                                    title: 'Xếp hạng',
                                                    dataIndex: ['priorityRank'],
                                                    width: 150,
                                                    align: 'center',
                                                },
                                                {
                                                    title: 'Học bổng',
                                                    dataIndex: ['scholarshipName'],
                                                    width: 150,
                                                    align: 'center',
                                                    fixed: 'right',
                                                },
                                            ]}
                                            pagination={false}
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-center py-8">
                                            Chưa có dữ liệu được chọn
                                        </div>
                                    )}
                                </Flex> */}
                            </div>
                        </Col>
                    </Flex>
                </Flex>
            </Col>
        </Row>
    )
}

StudentGraduationApplication.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
