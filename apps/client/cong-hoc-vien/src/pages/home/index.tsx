import CardStudyResult from "@components/commons/card-study-result"
import { useScoreConverter } from "@hooks/scoreConverter"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueCurriculumVersion, useFindUniqueUserProfile } from "@workspace/db/hooks"
import { courseScoreConfigFrom } from "@workspace/libs/utils"
import { LichCongTac } from "@workspace/ui"
import { DanhSachThongBao } from "@components/commons/thong-bao"
import { Col, Divider, Row, Typography } from "antd"
import { $Enums } from "@workspace/db/client"
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
        fixedClasses: {
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
    curriculumVersion?.fixedClasses?.[0]?.trainingCourse?.scoreConverts
  )

  const totalCurriculumCredits = useMemo(() => {
    let required = 0
    let elective = 0
    curriculumVersion?.trainingBlocks?.forEach((block) => {
      let blockElective = 0
      block.subjects?.forEach((sub) => {
        if (!sub.useForFinalScore) return

        if (sub.type === $Enums.SubjectRequirementType.Mandatory) {
          required += sub.subject?.credit ?? 0
        } else {
          blockElective += sub.subject?.credit ?? 0
        }
      })

      if (block.electiveCreditsRequired != null && block.electiveCreditsRequired > 0) {
        elective += Math.min(blockElective, block.electiveCreditsRequired)
      }
    })
    return required + elective
  }, [curriculumVersion])

  const gpaScore = useMemo(() => {
    let totalWeightedScore = 0
    let totalCredits = 0

    curriculumVersion?.trainingBlocks?.forEach((block) => {
      const passedOptionalSubjects: { credits: number; score4: number }[] = []

      block.subjects?.forEach((subjectItem: any) => {
        if (!subjectItem.useForFinalScore) return

        const subject = subjectItem.subject
        const scores = subject.studentSubjectScore || []
        const credits = subject.credit || 0

        if (scores.length > 0) {
          // Lấy điểm cao nhất trong số các lần học lại/thi lại
          let bestScore10 = 0
          let bestScoreResult: any = null

          scores.forEach((score: any) => {
            const score10 = score.manualFinalScore ?? score.finalScore?.toNumber() ?? 0
            const scoreResult = convertScore(
              score10,
              courseScoreConfigFrom(
                curriculumVersion?.fixedClasses?.[0]?.trainingCourse,
                score,
                {
                  isGraduation: subjectItem.graduation,
                  isConditional: !subjectItem.useForFinalScore,
                }
              )
            )

            if (!bestScoreResult || score10 > bestScore10) {
              bestScore10 = score10
              bestScoreResult = scoreResult
            }
          })

          // Chỉ tính môn đạt
          if (bestScoreResult?.pass) {
            const score4 = bestScoreResult.base4 || 0

            if (subjectItem.type === $Enums.SubjectRequirementType.Mandatory) {
              totalWeightedScore += score4 * credits
              totalCredits += credits
            } else {
              passedOptionalSubjects.push({ credits, score4 })
            }
          }
        }
      })

      const maxElective = block.electiveCreditsRequired

      if (passedOptionalSubjects.length > 0 && maxElective != null && maxElective > 0) {
        // Lấy ưu tiên các môn tự chọn có điểm cao nhất
        passedOptionalSubjects.sort((a, b) => b.score4 - a.score4)

        let blockElectiveCredits = 0

        for (const opt of passedOptionalSubjects) {
          const creditsToTake = Math.min(opt.credits, maxElective - blockElectiveCredits)
          if (creditsToTake > 0) {
            totalCredits += creditsToTake
            totalWeightedScore += opt.score4 * creditsToTake
            blockElectiveCredits += creditsToTake
          }
          if (blockElectiveCredits >= maxElective) break
        }
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
                requiredCredits: totalCurriculumCredits,
                electiveCredits: 0,
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
