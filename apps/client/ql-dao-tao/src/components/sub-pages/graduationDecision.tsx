import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutGraduationDecision } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { ApplicationStatus, type Prisma } from '@workspace/db'
import {
    useCountTrainingCourse,
    useDeleteGraduationDecision,
    useFindManyDiplomaType,
    useFindManyTrainingCourse,
    useUpdateStudentGraduationApplication,
} from '@workspace/db/hooks'
import { Col, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface GraduationDecisionProps {
    sessionId: string
}

export default function GraduationDecision({ sessionId }: GraduationDecisionProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        decisionDate: undefined,
        finalGpa: undefined,
        diplomaNumber: '',
        originalDiplomaNumber: '',
        diplomaIssueDate: undefined,
    })

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const where: Prisma.TrainingCourseWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      academicRankingConvert: {
                          some: {
                              graduationDecision: {
                                  some: {
                                      student: {
                                          ...(filters.code
                                              ? {
                                                    code: {
                                                        contains: filters.code,
                                                        mode: 'insensitive',
                                                    },
                                                }
                                              : {}),
                                          userProfile: {
                                              ...(filters.name
                                                  ? {
                                                        fullname: {
                                                            contains: filters.name,
                                                            mode: 'insensitive',
                                                        },
                                                    }
                                                  : {}),
                                              ...(filters.decisionDate
                                                  ? {
                                                        decisionDate: {
                                                            gte: filters.decisionDate[0],
                                                            lte: filters.decisionDate[1],
                                                        },
                                                    }
                                                  : {}),
                                              ...(filters.diplomaIssueDate
                                                  ? {
                                                        diplomaIssueDate: {
                                                            gte: filters.diplomaIssueDate[0],
                                                            lte: filters.diplomaIssueDate[1],
                                                        },
                                                    }
                                                  : {}),
                                              ...(filters.diplomaNumber
                                                  ? {
                                                        diplomaNumber: {
                                                            contains: filters.diplomaNumber,
                                                            mode: 'insensitive',
                                                        },
                                                    }
                                                  : {}),
                                              ...(filters.originalDiplomaNumber
                                                  ? {
                                                        originalDiplomaNumber: {
                                                            contains: filters.originalDiplomaNumber,
                                                            mode: 'insensitive',
                                                        },
                                                    }
                                                  : {}),
                                          },
                                      },
                                  },
                              },
                          },
                      },
                  }
                : {},
        [filters, isFiltering]
    )
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data = [] } = useFindManyTrainingCourse({
        where,
        include: {
            academicRankingConvert: {
                where: {
                    graduationDecision: {
                        some: {
                            application: {
                                sessionId,
                                status: ApplicationStatus.APPROVED,
                            },
                        },
                    },
                },
                include: {
                    graduationDecision: {
                        where: {
                            application: {
                                sessionId,
                                status: ApplicationStatus.APPROVED,
                            },
                        },
                        include: {
                            diplomaType: true,
                            application: true,
                            student: {
                                include: {
                                    userProfile: true,
                                    curriculumVersion: {
                                        include: {
                                            diplomaType: true,
                                        },
                                    },
                                },
                            },

                            finalRanking: true,
                        },
                    },
                },
                orderBy: { rankOrder: 'asc' },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const transformedData = useMemo(() => {
        return data.map((course) => ({
            ...course,
            academicRankingConvert: course.academicRankingConvert.map((ranking) => ({
                ...ranking,
                graduationDecision: undefined,
            })),
            graduationDecisions: course.academicRankingConvert.flatMap((ranking) =>
                ranking.graduationDecision.map((decision) => ({
                    ...decision,
                    academicRankingConvertId: ranking.id,
                }))
            ),
        }))
    }, [data])

    const { data: count } = useCountTrainingCourse({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<{ id: string; trainingCourseId: string }>({
        tag: PutGraduationDecision.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteGraduationDecision } = useDeleteGraduationDecision()
    const { mutateAsync: updateStudentGraduationApplication } =
        useUpdateStudentGraduationApplication()
    async function handleDeleteGraduationDecision(id: string, applicationId: string) {
        try {
            showSpinner()
            await updateStudentGraduationApplication({
                where: { id: applicationId },
                data: { status: ApplicationStatus.IN_REVIEW },
            })
            await deleteGraduationDecision({
                where: {
                    id,
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <TableCollapse
                        rowKey={'key'}
                        headerTitleKey="name"
                        childrenFieldName="graduationDecisions"
                        data={transformedData}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                dataIndex: 'code',
                                width: 120,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 200,
                                dataIndex: 'name',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Ngày duyệt đơn',
                                dataIndex: 'decisionDate',
                                align: 'center',
                                type: 'date',
                                width: 130,
                                render: (_, record) =>
                                    record.decisionDate
                                        ? dayjs(record.decisionDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'GPA cuối cùng',
                                align: 'center',
                                width: 100,
                                dataIndex: 'finalGpa',
                                type: 'order',
                                render: (_, record) => record?.finalGpa?.toNumber(),
                            },
                            {
                                title: 'Loại bằng',
                                align: 'center',
                                type: 'select',
                                options: diplomaTypeData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                width: 100,
                                render: (_, record) =>
                                    record?.diplomaType?.name ||
                                    record?.student?.curriculumVersion?.diplomaType?.name,
                            },
                            {
                                title: 'Số hiệu văn bằng',
                                align: 'center',
                                dataIndex: 'diplomaNumber',
                                type: 'input',
                                width: 120,
                                render: (_, record) => record?.diplomaNumber,
                            },
                            {
                                title: 'Số vào sổ gốc văn bằng',
                                align: 'center',
                                dataIndex: 'originalDiplomaNumber',
                                type: 'input',
                                width: 120,
                                render: (_, record) => record?.originalDiplomaNumber,
                            },
                            {
                                title: 'Ngày cấp bằng',
                                dataIndex: 'diplomaIssueDate',
                                align: 'center',
                                type: 'date',
                                width: 120,
                                render: (_, record) =>
                                    record.diplomaIssueDate
                                        ? dayjs(record.diplomaIssueDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Xếp loại',
                                align: 'center',
                                type: 'select',
                                dataIndex: 'classification',
                                width: 100,
                                render: (_, record) => record?.finalRanking?.classification,
                            },
                            {
                                title: 'Ghi chú của hội đồng',
                                width: 200,
                                render: (_, record) => record?.notes,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpen({
                                                    id: record.id,
                                                    trainingCourseId:
                                                        record?.finalRanking?.trainingCourseId,
                                                })
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () =>
                                                    handleDeleteGraduationDecision(
                                                        record.id,
                                                        record.applicationId
                                                    ),
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
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
        </div>
    )
}
