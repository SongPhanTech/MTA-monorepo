import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { Prisma, SubjectVersion } from '@workspace/db'
import {
    useFindManyDM_DonVi,
    useFindManyTrainingBlockOnCurriculumVersion,
    useFindUniqueCurriculumVersion,
} from '@workspace/db/hooks'

import { Col, Divider, Row } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
export default function TrainingProgramSubjects() {
    const router = useRouter()
    const id = router.query.id as string
    const [filters, setFilters] = useState<FilterProps>({
        organization: undefined,
        code: '',
        name: '',
        trainingMajors: undefined,
        credit: undefined,
        semester: undefined,
        period: undefined,
        numberOfTheory: undefined,
        numberOfPractical: undefined,
        numberOfSelfStudy: undefined,
        numberOfPractice: undefined,
        numberOfReview: undefined,
        numberOfExam: undefined,
        examType: undefined,
    })

    const { data: initialValue } = useFindUniqueCurriculumVersion(
        {
            where: { id },
            include: {
                curriculum: {
                    include: {
                        managementOrganization: true,
                        trainingMajor: true,
                    },
                },
                trainingBlocks: {
                    include: {
                        subjects: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                },
                trainingTime: true,
                documentFiles: true,
            },
        },
        { enabled: !!id }
    )

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const where: Prisma.TrainingBlockOnCurriculumVersionWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      subjects: {
                          some: {
                              subject: {
                                  ...(filters.name
                                      ? {
                                            name: {
                                                contains: filters.name,
                                                mode: 'insensitive',
                                            },
                                        }
                                      : {}),
                                  ...(filters.code
                                      ? {
                                            code: {
                                                contains: filters.code,
                                                mode: 'insensitive',
                                            },
                                        }
                                      : {}),
                                  ...emptyObjectIf(
                                      {
                                          managementOrganizationId: {
                                              in: filters.organization,
                                          },
                                      },
                                      !!filters.organization
                                  ),
                                  ...emptyObjectIf(
                                      {
                                          examType: {
                                              in: filters.examType,
                                          },
                                      },
                                      !!filters.examType
                                  ),
                              },
                          },
                      },
                  }
                : {},
        [filters, isFiltering]
    )

    const { data = [] } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersionId: id,
            curriculumVersion: {
                deletedAt: null,
            },
            ...where,
        },
        include: {
            subjects: {
                where: {
                    subject: {
                        ...(filters.name
                            ? {
                                  name: {
                                      contains: filters.name,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(filters.code
                            ? {
                                  code: {
                                      contains: filters.code,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...emptyObjectIf(
                            {
                                managementOrganizationId: {
                                    in: filters.organization,
                                },
                            },
                            !!filters.organization
                        ),
                        ...emptyObjectIf(
                            {
                                examType: {
                                    in: filters.examType,
                                },
                            },
                            !!filters.examType
                        ),
                    },
                },
                include: {
                    subject: {
                        include: {
                            managementOrganization: {
                                include: {
                                    trainingMajors: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    credit: filters.credit,
                                },
                            },
                        ],
                        !!filters.credit
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    period: filters.period,
                                },
                            },
                        ],
                        !!filters.period
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfTheory: filters.numberOfTheory,
                                },
                            },
                        ],
                        !!filters.numberOfTheory
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfSelfStudy: filters.numberOfSelfStudy,
                                },
                            },
                        ],
                        !!filters.numberOfSelfStudy
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfPractical: filters.numberOfPractical,
                                },
                            },
                        ],
                        !!filters.numberOfPractical
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfPractice: filters.numberOfPractice,
                                },
                            },
                        ],
                        !!filters.numberOfPractice
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfReview: filters.numberOfReview,
                                },
                            },
                        ],
                        !!filters.numberOfReview
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfExam: filters.numberOfExam,
                                },
                            },
                        ],
                        !!filters.numberOfExam
                    ),
                    {
                        semester: filters.semester ? filters.semester : 'asc',
                    },
                ],
            },
            trainingBlock: true,
        },
        orderBy: {
            priority: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    initialValue?.code,
                    initialValue?.name,
                    initialValue?.curriculum?.trainingMajor?.name,
                    initialValue?.curriculum?.managementOrganization?.sTen,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ trainingBlock }) =>
                            `Khối kiến thức: ${[trainingBlock?.name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjects"
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: 'code',
                                width: 145,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.code ? record?.subject?.code : ''
                                },
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.name
                                },
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                width: 200,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (_, record) => {
                                    return record?.subject?.managementOrganization?.sTen
                                },
                            },
                            {
                                title: 'Số TC',
                                dataIndex: 'credit',
                                width: 80,
                                type: 'order',
                                align: 'center',
                                distinctFilters: [
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.credit
                                },
                            },
                            {
                                title: 'Học kỳ dự kiến',
                                dataIndex: 'semester',
                                width: 140,
                                type: 'order',
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                        ]}
                        data={data}
                        pagination={false}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingProgramSubjects.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Chương trình đào tạo' }]}>{page}</DefaultLayout>
    )
}
