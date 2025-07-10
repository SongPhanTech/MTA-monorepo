import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutGraduationApplication } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useApplicationStatusOptions } from '@hooks/applicationStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountStudentGraduationApplication,
    useFindManyStudentGraduationApplication,
    useUpdateGraduationSession,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookPlus, FileUp, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | null
    trainingCourseId: string | null
    trainingObjectTypeId: string | null
}

export default function StudentGraduationApplication() {
    const router = useRouter()
    const { getApplicationStatusLabel, getApplicationStatusColor } = useApplicationStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingCourseId: null,
        trainingObjectTypeId: null,
    })
    const { id: graduationSessionId } = router.query

    const { data: studentGraduationApplicationData, refetch } =
        useFindManyStudentGraduationApplication({
            where: {
                sessionId: Array.isArray(graduationSessionId)
                    ? graduationSessionId[0]
                    : graduationSessionId,
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
            sessionId: Array.isArray(graduationSessionId)
                ? graduationSessionId[0]
                : graduationSessionId,
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
        graduationSessionId: string | string[] | undefined
    }>({
        tag: PutGraduationApplication.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: null, graduationSessionId })
    }
    const { mutateAsync: updateGraduationSession } = useUpdateGraduationSession()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateGraduationSession({
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
                                                handleFilterChange('searchText', e.target.value)
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
                        <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary">
                                    <FileUp />
                                    Nhập đơn xét tốt nghiệp
                                </Button>
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
                                    Thêm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-block"
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
                                title: 'Mã đơn xét tốt nghiệp',
                                dataIndex: 'code',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                width: 100,
                                fixed: 'left',
                                render: (_, record) => record.student?.code || '',
                            },
                            {
                                title: 'Tên sinh viên',
                                width: 150,
                                render: (record) =>
                                    `${record.student?.userProfile?.lastName || ''} ${record.student?.userProfile?.firstName || ''}`,
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: ['student', 'userProfile', 'dateOfBirth'],
                                width: 150,
                                render: (record) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Ngày nộp đơn',
                                dataIndex: 'applicationDate',
                                width: 150,
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
                                render: (record) => {
                                    const label = getApplicationStatusLabel(record)
                                    const color = getApplicationStatusColor(record)
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
                                                        onOpen({ id, graduationSessionId })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
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
    )
}

StudentGraduationApplication.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
