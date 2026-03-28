import CrossReviewPeriodSubPage from "@components/sub-pages/ql-dot-danh-gia/cross-review-period"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import type {
  CriterionPeriod,
  EvaluationCriterion,
  EvaluationCriterionComment,
  StandardPeriod,
} from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"

export type DataTabCrossReviewPeriodType = StandardPeriod & {
  criteria: (CriterionPeriod & {
    evaluationCriterion?:
      | (EvaluationCriterion & {
          evaluationCriterionComments?: (EvaluationCriterionComment & {
            reviewer?: { fullname?: string | null }
          })[]
          lecturer?: { userProfile?: { fullname?: string | null } } | null
          reviewer?: {
            lecturer?: { userProfile?: { fullname?: string | null } } | null
          } | null
          deadlineReview?: Date | null
        })
      | null
  })[]
}

export default function CrossReviewPeriod() {
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
              include: {
                evaluationCriterion: {
                  include: {
                    lecturer: {
                      include: {
                        userProfile: {
                          select: {
                            fullname: true,
                          },
                        },
                      },
                    },
                    reviewer: {
                      include: {
                        lecturer: {
                          include: {
                            userProfile: {
                              select: {
                                fullname: true,
                              },
                            },
                          },
                        },
                      },
                    },
                    evaluationCriterionComments: {
                      include: {
                        reviewer: {
                          select: {
                            fullname: true,
                          },
                        },
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
    }
  )

  const dataTab = useMemo(() => {
    if (data && data.standards.length > 0) {
      return data.standards.map((standard: DataTabCrossReviewPeriodType) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <div className="h-[calc(100vh-230px)] overflow-y-auto">
              <CrossReviewPeriodSubPage key={standard.id} data={standard} />
            </div>
          ),
        }
      })
    }
  }, [data])

  return (
    <div className="h-full">
      <Row gutter={[8, 0]}>
        <Col span={24}>
          {data && data.standards.length > 0 ? (
            <Tabs
              className="h-[calc(100vh-230px)]"
              tabPosition="left"
              items={dataTab}
              tabBarStyle={{
                height: "100%",
                overflow: "auto",
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-230px)]">
              <Empty description="Chưa có phản biện nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}
