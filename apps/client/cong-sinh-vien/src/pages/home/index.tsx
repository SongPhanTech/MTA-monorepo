import CardStudyResult from "@components/commons/card-study-result"
import { useScoreConverter } from "@hooks/scoreConverter"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueCurriculumVersion, useFindUniqueUserProfile } from "@workspace/db/hooks"
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
            studentSemesterResult: {
              select: {
                rank: {
                  select: {
                    classification: true,
                  },
                },
              },
              orderBy: {
                semesterIndexInCourse: "desc",
              },
              take: 1,
            },
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
  const academicRanking =
    userProfile?.educationAndTraining?.[0]?.studentSemesterResult?.[0]?.rank?.classification
  const { data: curriculumVersion } = useFindUniqueCurriculumVersion(
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
    curriculumVersion?.fixedClass?.trainingCourse?.scoreConverts
  )

  const gpaScore = useMemo(() => {
    const validSubjects =
      curriculumVersion?.trainingBlocks
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
  }, [curriculumVersion, convertScore])

  return (
    <div className="flex flex-col gap-6">
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={18}>
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm h-full flex flex-col overflow-hidden animate-fade-in-up">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-slate-50/80 flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wide text-sm text-[#004725] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#028850] animate-pulse-glow" />
                Thời khoá biểu
              </span>
            </div>
            <div className="flex-1 p-4">
              <LichCongTac onlyMySchedule />
            </div>
          </div>
        </Col>

        <Col xs={24} lg={6} className="flex flex-col gap-5">
          <div className="animate-fade-in-up-delay-1 rounded-xl overflow-hidden">
            <CardStudyResult
              gpaScore={gpaScore}
              curriculumVersion={{
                requiredCredits: curriculumVersion?.requiredCredits ?? 0,
                electiveCredits: curriculumVersion?.electiveCredits ?? 0,
              }}
              academicRanking={academicRanking || "-"}
            />
          </div>
          <div className="flex min-h-0 flex-col rounded-xl bg-white border border-gray-200/80 shadow-sm h-[500px] overflow-hidden animate-fade-in-up-delay-2">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 bg-slate-50/80">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#004725] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#028850] animate-pulse-glow" />
                Thông báo
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 bg-[#f9fafb]">
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
