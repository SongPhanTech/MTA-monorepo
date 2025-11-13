import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { ApplicationStatus, type Prisma } from '@workspace/db/client'
import {
    useCountGraduationDecision,
    useDeleteGraduationDecision,
    useFindManyDiplomaType,
    useFindManyGraduationDecision,
    useFindManySemester,
    useUpdateStudentGraduationApplication,
} from '@workspace/db/hooks'
import { Col, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookCheckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface GraduationDecisionProps {
    sessionId: string
}

export default function GraduationDecision({ sessionId }: GraduationDecisionProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [student, setStudent] = useState<any>(null)
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

    const where: Prisma.GraduationDecisionWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      application: { sessionId },
                      deletedAt: null,
                      student: {
                          ...(filters.code
                              ? {
                                    code: {
                                        contains: filters.code,
                                        mode: 'insensitive',
                                    },
                                }
                              : {}),
                          fixedClass: {
                              ...(filters.fixedClassName
                                  ? {
                                        name: {
                                            contains: filters.fixedClassName,
                                            mode: 'insensitive' as const,
                                        },
                                    }
                                  : {}),
                              ...(filters.fixedClassCode
                                  ? {
                                        name: {
                                            contains: filters.fixedClassCode,
                                            mode: 'insensitive' as const,
                                        },
                                    }
                                  : {}),
                          },
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
                  }
                : { application: { sessionId }, deletedAt: null },
        [sessionId, filters, isFiltering]
    )
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data } = useFindManyGraduationDecision({
        where,
        include: {
            diplomaType: true,
            application: true,
            trainingMajor: true,
            finalRanking: true,
            student: {
                include: {
                    userProfile: true,
                    curriculumVersion: {
                        include: {
                            diplomaType: true,
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
                },
            },
        },
        orderBy: [
            { originalDiplomaNumber: 'asc' },
            { student: { userProfile: { firstName: 'asc' } } },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountGraduationDecision({ where })

    const { onOpen } = useDisclosure<{ id: string; trainingCourseId: string }>({
        tag: 'PutGraduationDecision',
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
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { onOpen: onOpenPhuLucVanBang, onClose } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    const { data: dataTable } = useFindManySemester(
        {
            where: {
                subjectClasses: {
                    some: {
                        subjectClassStudent: {
                            some: {
                                studentId: student?.id,
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
                                studentId: student?.id,
                            },
                        },
                    },
                    include: {
                        subjectClassStudent: {
                            where: {
                                studentId: student?.id,
                            },
                            include: {
                                subjectVersion: true,
                                certificates: {
                                    include: {
                                        archivedCertificate: true,
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
        },
        { enabled: !!student?.id }
    )

    return (
        <div className="bg-white rounded-lg shadow-sm px-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
                        data={data}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                dataIndex: 'code',
                                width: 100,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                width: 150,
                                dataIndex: 'name',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Ngày sinh',
                                width: 80,
                                align: 'center',
                                render: (_, record) =>
                                    record?.student?.userProfile?.dateOfBirth
                                        ? dayjs(record?.student?.userProfile?.dateOfBirth).format(
                                              'DD/MM/YYYY'
                                          )
                                        : '',
                            },
                            {
                                title: 'Lớp',
                                width: 150,
                                dataIndex: 'fixedClassName',
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record?.student?.fixedClass.name,
                            },
                            {
                                title: 'Mã lớp',
                                width: 80,
                                dataIndex: 'fixedClassCode',
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record?.student?.fixedClass.code,
                            },
                            {
                                title: 'SĐT',
                                width: 100,
                                align: 'center',
                                render: (_, record) => record?.student?.userProfile?.phoneNumber,
                            },
                            {
                                title: 'Giới tính',
                                dataIndex: ['student', 'userProfile', 'gender'],
                                align: 'center',
                                width: 60,
                                render: (_, record) => record?.userProfile?.gender?.sTen,
                            },
                            {
                                title: 'Nơi sinh',
                                dataIndex: ['student', 'userProfile', 'placeOfBirth'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Dân tộc',
                                dataIndex: '',
                                width: 80,
                                align: 'center',
                                render: (_, record) =>
                                    record.student?.userProfile?.ethnicity?.sTen || '',
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
                                title: 'GPA',
                                align: 'center',
                                width: 60,
                                dataIndex: 'finalGpa',
                                type: 'order',
                                render: (_, record) => record?.finalGpa?.toNumber(),
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
                                        <Tooltip title="Phụ lục văn bằng" placement="top">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setStudent(record?.student)
                                                    onOpenPhuLucVanBang({
                                                        dataStudent: record?.student,
                                                        dataTable,
                                                    })
                                                }}
                                                size={16}
                                            />
                                        </Tooltip>
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
