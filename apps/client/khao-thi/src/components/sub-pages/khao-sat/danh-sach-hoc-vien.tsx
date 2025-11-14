import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import ExportStudentInSurvey from '@components/modal/export-list-student-in-survey'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { Survey } from '@workspace/db'
import {
    useCountUserProfile,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyUserProfile,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { Col, Flex, Row, Skeleton, Tag } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

function DanhSachHocVien({ survey }: { survey: Survey |null }) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        code: '',
        idCardNumber: '',
        phoneNumber: '',
        statusSurvey: undefined,
    })
    const router = useRouter()
    const { data: fixedClasses = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
    })
    const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
        useFindManyTrainingCourse({
            orderBy: { name: 'asc' },
        })

    const where = useMemo(() => {
        return {
            educationAndTraining: {
                some: {
                    subjectClassStudent: {
                        some: {
                            subjectClass: {
                                survey: {
                                    some: {
                                        id: survey?.id,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            ...(filters.statusSurvey &&
                filters.statusSurvey?.length === 1 &&
                filters.statusSurvey[0] === true && {
                    surveySession: {
                        some: {
                            surveyId: survey?.id,
                        },
                    },
                }),
            ...(filters.statusSurvey &&
                filters.statusSurvey?.length === 1 &&
                filters.statusSurvey[0] === false && {
                    surveySession: {
                        none: {
                            surveyId: survey?.id,
                        },
                    },
                }),

            ...(filters.name && {
                OR: [
                    {
                        firstName: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        lastName: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }),
            ...(filters.code && {
                code: {
                    contains: filters.code,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.idCardNumber && {
                idCardNumber: {
                    contains: filters.idCardNumber,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.phoneNumber && {
                phoneNumber: {
                    contains: filters.phoneNumber,
                    mode: 'insensitive' as const,
                },
            }),
        }
    }, [survey, filters])
    const { data ,isLoading} = useFindManyUserProfile({
        where,
        include: {
            educationAndTraining: {
                include: {
                    subjectClassStudent: {
                        include: {
                            subjectClass: {
                                include: {
                                    survey: {
                                        include: {
                                            surveySessions: true,
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
                },
            },
            surveySession: {
                where: { surveyId:survey?.id },
            },
        },
        orderBy: {
            firstName: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: count } = useCountUserProfile({
        where: { ...where, deletedAt: null },
    })

    const checkStatus = (record: any) => {
        if (record?.surveySession?.length === 1) {
            return <Tag color="green">{'Đã làm'}</Tag>
        }
        return <Tag color={'red'}>{'Chưa làm'}</Tag>
    }
    console.log(survey);
    

    const { showSpinner, hideSpinner } = useSpinner()

    return (
        <div>
            <Row gutter={[16, 4]}>
                {
                    isLoading ?<Skeleton/>:(<>
                     <Col span={24}>
                    <Flex justify="end">
                        <ExportStudentInSurvey
                            query={where}
                            survey={survey || null}
                       
                        />
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã người làm KS',
                                dataIndex: 'code',
                                type: 'input',
                                render: (_, record) => record?.code || '',
                            },
                            {
                                title: 'Người làm khảo sát',
                                dataIndex: 'name',
                                type: 'input',
                                render: (_, record) => {
                                    return `${record?.lastName || ''} ${record?.firstName || ''}`
                                },
                            },
                            {
                                title: 'CCCD',
                                dataIndex: 'idCardNumber',
                                type: 'input',
                                render: (_, record) => record?.idCardNumber || '',
                            },
                            {
                                title: 'SĐT',
                                dataIndex: 'phoneNumber',
                                type: 'input',
                                render: (_, record) => record?.phoneNumber || '',
                            },
                            {
                                title: 'Lớp quản lý',
                                dataIndex: 'fixedClassIds',
                                type: 'select',
                                options:
                                    fixedClasses?.map((fc) => ({ value: fc.id, label: fc.name })) ||
                                    [],
                                render: (_, record) =>
                                    record?.educationAndTraining?.length > 0
                                        ? `${record?.educationAndTraining[0]?.fixedClass?.code || ''}`
                                        : '',
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourseIds',
                                type: 'select',
                                options:
                                    trainingCourses?.map((tc) => ({
                                        value: tc.id,
                                        label: tc.name,
                                    })) || [],
                                render: (_, record) =>
                                    record?.educationAndTraining?.length > 0
                                        ? `${record?.educationAndTraining[0]?.fixedClass?.trainingCourse?.name || ''}`
                                        : '',
                            },
                            {
                                title: 'Trạng thái KS',
                                dataIndex: 'statusSurvey',
                                align: 'center',
                                type: 'select',
                                options: [
                                    {
                                        value: true,
                                        label: 'Đã làm',
                                    },
                                    {
                                        value: false,
                                        label: 'Chưa làm',
                                    },
                                ],
                                render: (__, record) => {
                                    return checkStatus(record)
                                },
                            },
                        ]}
                        data={data || []}
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
                    </>)
                }
               
            </Row>
        </div>
    )
}

export default DanhSachHocVien
