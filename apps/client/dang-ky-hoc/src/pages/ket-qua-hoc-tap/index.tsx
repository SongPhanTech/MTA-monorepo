import TableCollapse from '@components/commons/tableCollapse'
import { useScoreConverter } from '@hooks/scoreConverter'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import type { ArchivedAward, ArchivedCertificate, Certificate } from '@workspace/db'
import {
    useFindManySemester,
    useFindUniqueStudent,
    useFindUniqueUserProfile,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const { data: me } = useSession()
    const [_filters, _setFilters] = useState({
        searchText: '',
    })

    const userId = me?.sDM_NhanVienId || ''
    const { onOpen } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    const { data: userProfile } = useFindUniqueUserProfile(
        {
            where: {
                id: userId,
            },
            select: {
                educationAndTraining: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        },
        {
            enabled: !!userId,
        }
    )
    const studentId = userProfile?.educationAndTraining?.[0]?.id
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
                                trainingObjectType: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!studentId,
        }
    )

    const { data = [] } = useFindManySemester({
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
                where: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
                include: {
                    subjectClassStudent: {
                        where: {
                            studentId,
                        },
                        include: {
                            subjectVersion: true,
                            certificates: {
                                include: {
                                    archivedCertificate: {
                                        include: {
                                            certificate: true,
                                        },
                                    },
                                },
                            },
                            awards: {
                                include: {
                                    archivedAward: true,
                                },
                            },
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
            schoolYear: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    const { convertScore } = useScoreConverter(data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts)

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        {/* Hàng chứa các button */}
                        <Col xs={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
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
                        headerTitleKey={({ code, name, schoolYear }) =>
                            `${[code, name, schoolYear?.name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjectClasses"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã môn học',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'subjectVersion', 'code'],
                                fixed: 'left',
                                width: 120,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: ['subjectClassStudent', '0', 'subjectVersion', 'name'],
                                fixed: 'left',
                                width: 200,
                            },
                            {
                                title: 'Điểm chuyên cần',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'attendanceScore'],
                                width: 150,
                            },
                            {
                                title: 'Điểm thường xuyên',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'midtermScore'],
                                width: 150,
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'examScore'],
                                width: 100,
                            },

                            {
                                title: 'Điểm tương đương',
                                align: 'center',
                                width: 150,
                                render: (__, { id, subjectClassStudent }) => {
                                    const arr: { finalScore: number }[] =
                                        subjectClassStudent?.[0]?.certificates.map(
                                            (i: { archivedCertificate: ArchivedCertificate }) => {
                                                return {
                                                    ...i,
                                                    finalScore:
                                                        Number(
                                                            i?.archivedCertificate?.finalScore
                                                        ) || 0,
                                                }
                                            }
                                        )
                                    return arr?.length > 0
                                        ? _.maxBy(arr, 'finalScore')?.finalScore
                                        : ''
                                },
                            },
                            {
                                title: 'Điểm hệ 10',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    return (
                                        subjectClassStudent?.manualFinalScore ??
                                        subjectClassStudent?.finalScore?.toNumber() ??
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ||
                                        subjectClassStudent?.finalScore?.toNumber() ||
                                        0
                                    return score !== undefined ? convertScore(score).base4 : ''
                                },
                            },
                            {
                                title: 'Điểm hệ chữ',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ||
                                        subjectClassStudent?.finalScore?.toNumber() ||
                                        0
                                    return score !== undefined ? convertScore(score).letter : ''
                                },
                            },
                            {
                                title: 'Kết quả',
                                align: 'center',
                                width: 80,
                                render: (_: any, record: any) => {
                                    const subjectClassStudent = record.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ??
                                        subjectClassStudent?.finalScore

                                    if (score === undefined || score === null) return null

                                    const result = convertScore(score)

                                    return (
                                        <div className="flex items-center justify-center">
                                            {result.pass ? (
                                                <Check size={18} color="green" />
                                            ) : (
                                                <X size={18} color="red" />
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Điểm cộng',
                                align: 'center',
                                width: 120,
                                render: (_, { id, subjectClassStudent }) =>
                                    subjectClassStudent?.[0]?.awards.reduce(
                                        (
                                            acc: number,
                                            curr: {
                                                archivedAward: ArchivedAward
                                            }
                                        ) => acc + (curr?.archivedAward?.bonusScore ?? 0),
                                        0
                                    ),
                            },
                            {
                                title: 'Chứng chỉ',
                                align: 'center',
                                width: 150,
                                render: (_, { id, subjectClassStudent }) =>
                                    subjectClassStudent?.[0]?.certificates
                                        .map(
                                            (i: {
                                                archivedCertificate: ArchivedCertificate & {
                                                    certificate: Certificate
                                                }
                                            }) => i?.archivedCertificate?.certificate.name
                                        )
                                        .join(', '),
                            },
                            {
                                title: 'Ghi chú',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'description'],
                                width: 200,
                                render: (value: string) => {
                                    return <span className="line-clamp-1">{value}</span>
                                },
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
    return <DefaultLayout breadcrumbList={[{ title: 'Kết quả học tập' }]}>{page}</DefaultLayout>
}
