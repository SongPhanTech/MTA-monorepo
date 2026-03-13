import DefaultLayout from '@layouts/default-layout'
import { buildOrgFlat } from '@lib/utils'
import PhanCongGiangDay from '@pages/ke-hoach-giao-duc/_pages/phan-cong-giang-day'
import { $Enums, type Prisma } from '@workspace/db/client'
import { useFindManyDM_DonVi } from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Tabs } from 'antd'
import type React from 'react'
import { useMemo } from 'react'

export default function KhaoBoMonPhanCongGiangDay() {
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const orgId = window.contextData?.organizationId
    const where = useMemo(
        () =>
            ({
                semesterId,
                deletedAt: null,
                active: true,
                trainingObjectTypeId,
                lecturerAssignmentDeadline: {
                    not: null,
                },
            }) satisfies Prisma.SubjectClassWhereInput,
        [semesterId, trainingObjectTypeId]
    )

    const { data: dmDonViIds = [] } = useFindManyDM_DonVi(
        {
            select: { Id: true },
            where: whereOrganization,
            orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
        },
        {
            refetchOnWindowFocus: false,
        }
    )

    const orgIds = [
        ...buildOrgFlat(
            dmDonViIds.map((e) => ({
                Id: e.Id,
                sTen: null,
                sParentId: null,
                sMa: null,
            })),
            orgId || '0'
        ).map((org) => org.value),
        orgId,
    ].filter(Boolean)
    const [
        { data: scNormalCount = [] },
        { data: scRetakeCount = [] },
        { data: scReExamCount = [] },
    ] = [
        useFindManyDM_DonVi(
            {
                select: {
                    subjectVersions: {
                        select: {
                            _count: {
                                select: {
                                    subjectClass: {
                                        where: {
                                            ...where,
                                            type: $Enums.SubjectClassType.NORMAL,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                where: {
                    bActive: true,
                    subjectVersions: {
                        some: {
                            subjectClass: {
                                some: {
                                    ...where,
                                    type: $Enums.SubjectClassType.NORMAL,
                                },
                            },
                        },
                    },
                    Id: {
                        in: orgIds,
                    },
                    ...whereOrganization,
                },
                orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
            },
            {
                enabled: !!semesterId && !!trainingObjectTypeId,
                refetchOnWindowFocus: false,
            }
        ),
        useFindManyDM_DonVi(
            {
                select: {
                    subjectVersions: {
                        select: {
                            _count: {
                                select: {
                                    subjectClass: {
                                        where: {
                                            ...where,
                                            type: $Enums.SubjectClassType.RETAKE,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                where: {
                    bActive: true,
                    subjectVersions: {
                        some: {
                            subjectClass: {
                                some: {
                                    ...where,
                                    type: $Enums.SubjectClassType.RETAKE,
                                },
                            },
                        },
                    },
                    Id: {
                        in: orgIds,
                    },
                    ...whereOrganization,
                },
                orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
            },
            {
                enabled: !!semesterId && !!trainingObjectTypeId,
                refetchOnWindowFocus: false,
            }
        ),
        useFindManyDM_DonVi(
            {
                select: {
                    subjectVersions: {
                        select: {
                            _count: {
                                select: {
                                    subjectClass: {
                                        where: {
                                            ...where,
                                            type: $Enums.SubjectClassType.REEXAM,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                where: {
                    bActive: true,
                    subjectVersions: {
                        some: {
                            subjectClass: {
                                some: {
                                    ...where,
                                    type: $Enums.SubjectClassType.REEXAM,
                                },
                            },
                        },
                    },
                    Id: {
                        in: orgIds,
                    },
                    ...whereOrganization,
                },
                orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
            },
            {
                enabled: !!semesterId && !!trainingObjectTypeId,
                refetchOnWindowFocus: false,
            }
        ),
    ]
    const countNormal = scNormalCount
        .flatMap((e) => e.subjectVersions)
        .map((e) => e._count.subjectClass)
        .reduce((a, b) => a + b, 0)
    const countRetake = scRetakeCount
        .flatMap((e) => e.subjectVersions)
        .map((e) => e._count.subjectClass)
        .reduce((a, b) => a + b, 0)
    const countReExam = scReExamCount
        .flatMap((e) => e.subjectVersions)
        .map((e) => e._count.subjectClass)
        .reduce((a, b) => a + b, 0)

    return (
        <Tabs>
            <Tabs.TabPane key={$Enums.SubjectClassType.NORMAL} tab={`Lớp môn học (${countNormal})`}>
                <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.NORMAL} />
            </Tabs.TabPane>
            <Tabs.TabPane key={$Enums.SubjectClassType.RETAKE} tab={`Lớp học lại (${countRetake})`}>
                <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.RETAKE} />
            </Tabs.TabPane>
            <Tabs.TabPane key={$Enums.SubjectClassType.REEXAM} tab={`Lớp thi lại (${countReExam})`}>
                <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.REEXAM} />
            </Tabs.TabPane>
        </Tabs>
    )
}

KhaoBoMonPhanCongGiangDay.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
