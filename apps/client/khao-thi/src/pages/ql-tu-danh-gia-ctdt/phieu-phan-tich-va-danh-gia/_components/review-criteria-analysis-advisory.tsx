import ReviewCriteriaAnalysisSubPage from "@components/sub-pages/tu-danh-gia-ctdt/review-criteria-analysis"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"
import type { ReviewDataTabType } from "./review-criteria-analysis"

export default function ReviewCriteriaAnalysisAdvisory() {
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data } = useFindUniqueEvaluationPeriod(
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
            userRole="ADVISORY_BOARD"
          />
        ),
      }))

    return standardsWithSubmittedCriteria
  }, [data])

  return (
    <div className="h-full">
      <Row gutter={[8, 0]}>
        <Col span={24}>
          {dataTab.length > 0 ? (
            <Tabs
              className="h-[calc(100vh-230px)] overflow-y-auto"
              tabPosition="left"
              items={dataTab}
              tabBarStyle={{
                height: "100%",
                overflow: "auto",
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-230px)]">
              <Empty
                description="Chưa có phiếu phân tích tiêu chí nào chờ Ban tư vấn xét duyệt"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}
