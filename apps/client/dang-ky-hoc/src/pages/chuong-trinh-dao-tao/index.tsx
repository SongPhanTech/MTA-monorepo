import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { emptyObjectIf } from '@workspace/constant'
import { $Enums, type Prisma, type SubjectVersion, type TrainingBlockSubject } from '@workspace/db/client'
import {
    useFindManyDM_DonVi,
    useFindManyTrainingBlockOnCurriculumVersion,
    useFindUniqueCurriculumVersion,
    useFindUniqueUserProfile,
} from '@workspace/db/hooks'
import { cn } from '@workspace/ui/lib/utils'
import { Col, Divider, Row, Tag } from 'antd'
import { useMemo, useState } from 'react'
export default function TrainingProgramSubjects() {
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

    const { data: me } = useSession()
    const { data: userProfile } = useFindUniqueUserProfile(
        {
            where: { id: me?.sDM_NhanVienId || '' },
            select: {
                educationAndTraining: {
                    select: {
                        curriculumVersionId: true,
                    },
                },
            },
        },
        {
            enabled: !!me?.sDM_NhanVienId,
        }
    )
    const id = userProfile?.educationAndTraining?.[0]?.curriculumVersionId ?? ''
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
    const { options, getExamTypeLabel } = useExamTypeOptions()

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
    const { data = [], refetch } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersion: {
                deletedAt: null,
                id: id,
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
                CTĐT toàn khoá:{' '}
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
                    <div className="flex gap-2">
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-red-100" /> Môn bắt buộc
                        </p>
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-yellow-200" /> Môn tự chọn
                        </p>
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-orange-300" /> Môn điều kiện
                        </p>
                    </div>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ trainingBlock }) =>
                            `${[trainingBlock?.name].filter(Boolean).join(' - ')}`
                        }
                        onRow={(record) => {
                            const isParent = Array.isArray(record?.subjects)
                            if (isParent) {
                                return {}
                            }
                            const subject = record as unknown as TrainingBlockSubject
                            return {
                                className: cn(
                                    !subject.useForFinalScore && 'bg-orange-300',
                                    subject.type === $Enums.SubjectRequirementType.Mandatory &&
                                        'bg-red-100',
                                    subject.type === $Enums.SubjectRequirementType.Optional &&
                                        'bg-yellow-100'
                                ),
                            }
                        }}
                        headerColumn={[
                            {
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">{record?.trainingBlock?.name}</p>
                                ),
                                colSpan: 3,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce((sum, s) => sum + s.subject.credit, 0),
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce((sum, s) => sum + s.subject.period, 0),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject?.numberOfTheory ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject.numberOfPractical ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject.numberOfSelfStudy ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject.numberOfPractice ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject.numberOfReview ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) =>
                                    record.subjects.reduce(
                                        (sum, s) => sum + (s.subject.numberOfExam ?? 0),
                                        0
                                    ),
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                        ]}
                        childrenFieldName="subjects"
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã MH',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
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
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.name
                                },
                            },
                            {
                                title: 'ĐVPT',
                                dataIndex: 'organization',
                                width: 120,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (_, record) => {
                                    return record?.subject?.managementOrganization?.sMa
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
                                title: 'HKDK',
                                dataIndex: 'semester',
                                width: 80,
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
                            {
                                title: 'Số tiết TKB',
                                dataIndex: 'period',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.period
                                },
                            },
                            {
                                title: 'LT',
                                dataIndex: 'numberOfTheory',
                                width: 80,
                                type: 'order',
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfTheory
                                },
                            },
                            {
                                title: 'BT',
                                dataIndex: 'numberOfPractical',
                                type: 'order',
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfPractical
                                },
                            },
                            {
                                title: 'ThL',
                                dataIndex: 'numberOfSelfStudy',
                                width: 80,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfSelfStudy
                                },
                            },
                            {
                                title: 'TN, TH',
                                dataIndex: 'numberOfPractice',
                                width: 90,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfPractice
                                },
                            },
                            {
                                title: 'Ôn',
                                dataIndex: 'numberOfReview',
                                width: 60,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfReview
                                },
                            },
                            {
                                title: 'KT, Thi',
                                dataIndex: 'numberOfExam',
                                width: 90,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfExam
                                },
                            },
                            {
                                title: 'Thi',
                                dataIndex: 'examType',
                                width: 90,
                                align: 'center',
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) =>
                                    getExamTypeLabel(record?.subject?.examType),
                            },
                            // {
                            //     title: 'Tính điểm TBC',
                            //     align: 'center',
                            //     fixed: 'right',
                            //     dataIndex: 'useForFinalScore',
                            //     width: 120,
                            //     render: (value: boolean) => {
                            //         return <Checkbox checked={!!value} />
                            //     },
                            // },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 150,
                                render: (record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
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
