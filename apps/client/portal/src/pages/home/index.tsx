import Notifications from '@components/dashboard/notifications'
import { useScoreConverter } from '@hooks/scoreConverter'
import DashboardLayout from '@layouts/dashboard-layout'
import { useSession } from '@workspace/auth/react'
import { useFindUniqueCurriculumVersion, useFindUniqueUserProfile } from '@workspace/db/hooks'
import { useAcademicRankingConverter } from '@workspace/libs/hook/academicRankingConvert'
import { LichCongTac } from '@workspace/ui'
import { Col, Progress, Row, Typography } from 'antd'
import { useMemo } from 'react'

const { Title } = Typography

function Page() {
    const { data: me } = useSession()
    const { data: userProfile } = useFindUniqueUserProfile(
        {
            where: { id: me?.sDM_NhanVienId || '' },
            select: {
                educationAndTraining: {
                    select: {
                        id: true,
                        curriculumVersionId: true,
                        fixedClassId: true,
                    },
                },
            },
        },
        {
            enabled: !!me?.sDM_NhanVienId,
        }
    )
    const curriculumVersionId = userProfile?.educationAndTraining?.[0]?.curriculumVersionId ?? ''
    const studentId = userProfile?.educationAndTraining?.[0]?.id ?? ''
    const fixedClassId = userProfile?.educationAndTraining?.[0]?.fixedClassId ?? ''
    const { data: subjectScoreData } = useFindUniqueCurriculumVersion(
        {
            where: {
                id: curriculumVersionId,
            },
            include: {
                fixedClasses: {
                    where: {
                        id: fixedClassId,
                    },
                    include: {
                        trainingCourse: {
                            include: {
                                scoreConverts: true,
                                academicRankingConvert: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                trainingBlocks: {
                    include: {
                        subjects: {
                            include: {
                                subject: {
                                    include: {
                                        studentSubjectScore: {
                                            where: {
                                                studentId,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!curriculumVersionId && !!studentId && !!fixedClassId }
    )

    const { convertScore } = useScoreConverter(
        subjectScoreData?.fixedClasses?.[0]?.trainingCourse?.scoreConverts
    )

    const { convertAcademicRanking } = useAcademicRankingConverter(
        subjectScoreData?.fixedClasses?.[0]?.trainingCourse?.academicRankingConvert,
        subjectScoreData?.fixedClasses?.[0]?.trainingCourse?.baseScore
    )
    console.log('subjectScoreData', subjectScoreData?.fixedClasses?.[0]?.trainingCourse)

    const totalCredits = subjectScoreData?.trainingBlocks[0]?.subjects
        ?.filter(
            (subjectItem: any) =>
                subjectItem.print === true && subjectItem.useForFinalScore === true
        )
        ?.reduce((sum: number, subjectItem: any) => sum + (subjectItem.subject?.credit || 0), 0)

    const gpaScore = useMemo(() => {
        const validSubjects =
            subjectScoreData?.trainingBlocks[0]?.subjects?.filter(
                (subjectItem: any) =>
                    subjectItem.print === true && subjectItem.useForFinalScore === true
            ) || []

        let totalWeightedScore = 0
        let totalCredits = 0

        validSubjects.forEach((subjectItem: any) => {
            const subject = subjectItem.subject
            const score = subject.studentSubjectScore?.[0]
            const credits = subject.credit || 0

            if (score) {
                const score10 = score.manualFinalScore || score.finalScore || 0
                const score4 = convertScore(score10).base4 || 0

                totalWeightedScore += score4 * credits
                totalCredits += credits
            }
        })

        const gpa = totalCredits > 0 ? totalWeightedScore / totalCredits : 0
        return gpa
    }, [subjectScoreData, convertScore])

    return (
        <div>
            <Row gutter={[8, 8]}>
                <Col xs={24} lg={18}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thời khoá biểu</Title>
                        </div>
                        <div className="flex-1 p-2">
                            <LichCongTac />
                        </div>
                    </div>
                </Col>
                <Col xs={24} md={6}>
                    <div className="bg-white rounded shadow h-72 flex flex-col">
                        <div className="px-4 pt-4">
                            <Title level={4}>Kết quả học tập</Title>
                        </div>
                        <div className="px-4 mt-2 flex flex-col gap-4 items-center">
                            <p>Tín chỉ tích luỹ</p>
                            <Progress
                                type="circle"
                                size={'small'}
                                percent={20}
                                format={() => (
                                    <span>
                                        {totalCredits}/
                                        {(subjectScoreData?.requiredCredits ?? 0) +
                                            (subjectScoreData?.electiveCredits ?? 0)}
                                    </span>
                                )}
                            />
                            <div className="flex justify-around w-full">
                                <div className="flex flex-col items-center">
                                    <p>Điểm trung bình tích luỹ</p>
                                    <span className="text-3xl font-bold">
                                        {gpaScore.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <p>Xếp hạng</p>
                                    <span className="text-3xl font-bold">
                                        {convertAcademicRanking(gpaScore).classification || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded shadow h-[550px] flex flex-col mt-2">
                        <div className="p-4">
                            <Title level={4}>Thông báo</Title>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-2 p-2">
                            <Notifications />
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DashboardLayout>{page}</DashboardLayout>
}
