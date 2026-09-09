import ReviewCriteriaAnalysisSubPage from "@components/sub-pages/tu-danh-gia-ctdt/review-criteria-analysis"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import type {
  AnalysisCriterion,
  AnalysisFormEvidence,
  CriterionPeriod,
  EvaluationCriterionComment,
  Evidence,
  Lecturer,
  RequirementCriterion,
  StandardPeriod,
  UserProfile,
} from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Row, Tabs } from "antd"
import { useMemo } from "react"

export type ReviewDataTabType = StandardPeriod & {
  criteria: (CriterionPeriod & {
    analysisCriterions?:
      | (AnalysisCriterion & {
          requirementCriterions: (RequirementCriterion & {
            evidences: (AnalysisFormEvidence & {
              evidence: Evidence
            })[]
            evaluationCriterionComment?: EvaluationCriterionComment[]
          })[]
          evaluationCriterionComments?: EvaluationCriterionComment[]
          lecturer?: Lecturer & {
            userProfile: UserProfile
          }
        })
      | null
  })[]
}

export default function ReviewCriteriaAnalysis() {
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
      },
      include: {
        standards: {
          include: {
            criteria: {
              where: {
                analysisCriterions: {
                  status: {
                    not: $Enums.EvaluationCriterionStatus.PENDING,
                  },
                },
              },
              include: {
                analysisCriterions: {
                  where: {
                    status: {
                      not: $Enums.EvaluationCriterionStatus.PENDING,
                    },
                  },
                  include: {
                    lecturer: {
                      include: {
                        userProfile: true,
                      },
                    },
                    requirementCriterions: {
                      include: {
                        evidences: {
                          include: {
                            evidence: {
                              include: {
                                category: true,
                              },
                            },
                          },
                          orderBy: {
                            order: "asc",
                          },
                        },
                        evaluationCriterionComment: {
                          include: {
                            reviewer: true,
                          },
                          orderBy: {
                            createdAt: "desc",
                          },
                        },
                      },
                      orderBy: {
                        order: "asc",
                      },
                    },
                    evaluationCriterionComments: {
                      include: {
                        reviewer: true,
                      },
                      orderBy: {
                        createdAt: "desc",
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
      refetchOnWindowFocus: false,
    }
  )

  const dataTab = useMemo(() => {
    if (!data?.standards) return []

    const standardsWithSubmittedCriteria = data.standards
      .filter((standard) => standard.criteria.some((c) => c.analysisCriterions))
      .map((standard) => ({
        key: standard.id,
        label: `Tiêu chuẩn ${standard.order}`,
        children: (
          <ReviewCriteriaAnalysisSubPage
            key={standard.id}
            data={standard as ReviewDataTabType}
            idx={standard.order}
            refetch={refetch}
          />
        ),
      }))

    return standardsWithSubmittedCriteria
  }, [data, refetch])

  return (
    <div className="h-full">
      <Row gutter={[8, 0]}>
        <Col span={24}>
          <Tabs
            className="h-[calc(100vh-230px)] overflow-y-auto"
            tabPosition="left"
            items={dataTab}
            tabBarStyle={{
              height: "100%",
              overflow: "auto",
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
