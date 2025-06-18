import Table from '@components/commons/table'
import {
    PutStudentModal,
    PutUpdateProfileModal,
    PutUploadProfileModal,
} from '@components/modal'
import { FIXED_CLASS_STUDENT_STATUS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'

import { FilterSinhVien } from '@components/filter'
import {
    useFindManySemester,
    useFindManyStudentSubjectScore,
    useFindManyTemplateFile,
    useFindUniqueStudent,
    useUpdateStudent,
} from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
    Col,
    Divider,
    Flex,
    Menu,
    Row,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TableCollapse from '@components/commons/tableCollapse'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const { data: student } = useFindUniqueStudent(
        {
            where: {
                id: studentId,
            },
            include: {
                userProfile: true,
                curriculumVersion: {
                    include: {
                        curriculum: {
                            include: {
                                trainingMajor: {
                                    include: {
                                        trainingField: true,
                                    },
                                },
                            },
                        },
                    },
                },
                fixedClass: {
                    include: {
                        trainingCourse: true,
                    },
                },
                trainingObjectType: true,
            },
        },
        {
            enabled: !!studentId,
        }
    )

    const { data = [], refetch } = useFindManySemester({
        where: {
            subjectClasses: {
                some: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                include: {
                    subjectClassStudent: {
                        include: {
                            subjectVersion: {
                                include: {
                                    studentSubjectScore: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    type subjectClassesChild = (typeof data)[number]['subjectClasses'][number]

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {student?.code} - {student?.userProfile?.lastName}{' '}
                {student?.userProfile?.firstName} -{' '}
                {student?.trainingObjectType?.name} -{' '}
                {student?.fixedClass?.trainingCourse?.name} -{' '}
                {student?.curriculumVersion?.name} -{' '}
                {student?.curriculumVersion?.curriculum.trainingMajor.name} -{' '}
                {
                    student?.curriculumVersion?.curriculum.trainingMajor
                        .trainingField.name
                }
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        {/* Hàng chứa các button */}
                        <Col xs={24}>
                            <Flex
                                justify="end"
                                wrap="wrap"
                                gap="8px"
                                className="mt-1"
                            >
                                <Button type="primary">
                                    In kết quả học tập
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        currentPage={1}
                        headerTitleKey={'name'}
                        childrenFieldName="subjectClasses"
                        columns={[
                            {
                                title: 'Mã môn học',
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Điểm chuyên cần',
                                align: 'center',
                                dataIndex: 'attendanceScore',
                            },
                            {
                                title: 'Điểm thường xuyên',
                                align: 'center',
                                dataIndex: 'midtermScore',
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                dataIndex: 'examScore',
                            },
                            {
                                title: 'Điểm hệ 10',
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ chữ',
                                align: 'center',
                            },
                            {
                                title: 'Ghi chú',
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const statusInfo =
                                        FIXED_CLASS_STUDENT_STATUS[
                                            record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                                        ]
                                    return statusInfo ? (
                                        <Tag color={statusInfo.color}>
                                            {statusInfo.label}
                                        </Tag>
                                    ) : (
                                        <Tag color="default">
                                            Không xác định
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Cộng điểm">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                                size={16}
                                            />
                                        </Tooltip>
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            hideOnSinglePage: true,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
