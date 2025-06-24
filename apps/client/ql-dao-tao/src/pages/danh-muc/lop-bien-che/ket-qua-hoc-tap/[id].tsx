import TableCollapse from '@components/commons/tableCollapse'
import { ModalPrintToKQHT } from '@components/modal'
import { SUBJECT_CLASS_STUDENT_STATUS } from '@constants/constants'
import { useScoreConverter } from '@hooks/scoreConverter'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useFindManySemester, useFindUniqueStudent } from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon, Check, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const { onOpen, onClose } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: ModalPrintToKQHT.name,
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
                        trainingLevel: true,
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
                        trainingCourse: {
                            include: {
                                scoreConverts: true,
                            },
                        },
                    },
                },
                trainingObjectType: true,
                trainingForm: true,
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
                            studentId: studentId,
                        },
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                where: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
                include: {
                    subjectClassStudent: {
                        include: {
                            subjectVersion: true,
                        },
                    },
                },
            },
            trainingCoursesStart: {
                where: {
                    id: student?.fixedClass?.trainingCourseId ?? undefined,
                },
                include: {
                    scoreConverts: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    const { convertScore } = useScoreConverter(
        data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
    )

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
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpen({
                                            dataTable: data,
                                            dataStudent: student,
                                        })
                                    }
                                >
                                    In kết quả học tập
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        currentPage={1}
                        headerTitleKey="name"
                        childrenFieldName="subjectClasses"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã môn học',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'subjectVersion',
                                    'code',
                                ],
                                fixed: 'left',
                                width: 120,
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'subjectVersion',
                                    'name',
                                ],
                                fixed: 'left',
                                width: 200,
                            },
                            {
                                title: 'Điểm chuyên cần',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'attendanceScore',
                                ],
                                width: 130,
                            },
                            {
                                title: 'Điểm thường xuyên',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'midtermScore',
                                ],
                                width: 150,
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'examScore',
                                ],
                                width: 100,
                            },
                            {
                                title: 'Điểm hệ 10',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'finalScore',
                                ],
                                width: 100,
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'finalScore',
                                ],
                                width: 100,
                                render: (value) => convertScore(value).base4,
                            },
                            {
                                title: 'Điểm hệ chữ',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'finalScore',
                                ],
                                width: 120,
                                render: (value) => convertScore(value).letter,
                            },
                            {
                                title: 'Kết quả',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'finalScore',
                                ],
                                width: 100,
                                render: (value: number) => {
                                    const result = convertScore(value)
                                    return (
                                        <div className="flex items-center justify-center">
                                            {result.pass ? (
                                                <Check
                                                    size={18}
                                                    color="green"
                                                />
                                            ) : (
                                                <X size={18} color="red" />
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Ghi chú',
                                align: 'center',
                                dataIndex: [
                                    'subjectClassStudent',
                                    '0',
                                    'description',
                                ],
                                width: 200,
                                render: (value: string) => {
                                    return (
                                        <span className="line-clamp-1">
                                            {value}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const status =
                                        record.subjectClassStudent?.[0]?.status

                                    const statusInfo = status
                                        ? SUBJECT_CLASS_STUDENT_STATUS[
                                              status as keyof typeof SUBJECT_CLASS_STUDENT_STATUS
                                          ]
                                        : undefined

                                    return (
                                        <Tag
                                            color={
                                                statusInfo?.color ?? 'default'
                                            }
                                        >
                                            {statusInfo?.label ??
                                                'Không xác định'}
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
    return (
        <DefaultLayout headerChildren="Kết quả học tập">{page}</DefaultLayout>
    )
}
