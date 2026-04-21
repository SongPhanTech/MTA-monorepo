import CardStudyResult from "@components/commons/card-study-result"
import { useScoreConverter } from "@hooks/scoreConverter"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueCurriculumVersion, useFindUniqueUserProfile } from "@workspace/db/hooks"
import { useAcademicRankingConverter } from "@workspace/libs/hook/academicRankingConvert"
import { LichCongTac } from "@workspace/ui"
import { DanhSachThongBao } from "@components/commons/thong-bao"
import { Col, Divider, Row, Typography } from "antd"
import { useMemo } from "react"

const { Title } = Typography

function Page() {
  const { data: me } = useSession()
  const { data: userProfile } = useFindUniqueUserProfile(
    {
      where: { id: me?.sDM_NhanVienId || "" },
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
  const curriculumVersionId = userProfile?.educationAndTraining?.[0]?.curriculumVersionId ?? ""
  const studentId = userProfile?.educationAndTraining?.[0]?.id ?? ""
  const fixedClassId = userProfile?.educationAndTraining?.[0]?.fixedClassId ?? ""
  const { data: subjectScoreData } = useFindUniqueCurriculumVersion(
    {
      where: {
        id: curriculumVersionId,
      },
      include: {
        fixedClass: {
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
    subjectScoreData?.fixedClass?.trainingCourse?.scoreConverts
  )

  const { convertAcademicRanking } = useAcademicRankingConverter(
    subjectScoreData?.fixedClass?.trainingCourse?.academicRankingConvert,
    subjectScoreData?.fixedClass?.trainingCourse?.baseScore
  )
  const gpaScore = useMemo(() => {
    const validSubjects =
      subjectScoreData?.trainingBlocks
        .flatMap((block) => block.subjects)
        .filter((subjectItem) => subjectItem.useForFinalScore === true) || []

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
    return { gpa, totalCredits }
  }, [subjectScoreData, convertScore])

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <div className="bg-white rounded border-gray-200 border h-full flex flex-col">
            <div className="p-4">
              <Divider orientation="center" className="font-semibold uppercase my-0 mt-2.5 text-2xl after:border-t-gray-500 before:border-t-gray-500">Thời khoá biểu</Divider>
            </div>
            <div className="flex-1 px-4 py-1.5">
              <LichCongTac onlyMySchedule />
            </div>
          </div>
        </Col>
        <Col xs={24} md={6} className="flex flex-col gap-4">
          <CardStudyResult
            gpaScore={gpaScore}
            subjectScoreData={{
              requiredCredits: subjectScoreData?.requiredCredits ?? 0,
              electiveCredits: subjectScoreData?.electiveCredits ?? 0,
            }}
            academicRanking={convertAcademicRanking(gpaScore.gpa).classification || "-"}
          />
          <div className="bg-white rounded-sm border border-gray-200 h-[500px] overflow-hidden flex flex-col mt-2">
            <div className="px-4 py-2 border-b border-gray-200 bg-green-700">
              <Title className="mb-0 uppercase font-medium text-white" level={4}>
                Thông báo
              </Title>
            </div>
            <div className="flex-1 overflow-y-auto mb-2 p-2">
              <DanhSachThongBao />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
