import ReviewCriteriaEvaluationAdvisorySubpage from "@components/sub-pages/tu-danh-gia-ctdt/review-criteria-evaluation-advisory"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import {
  $Enums,
  type CriterionPeriod,
  type EvaluationCriterion,
  type EvaluationCriterionComment,
  type StandardPeriod,
} from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"

export type DataReviewCriteriaEvaluationType = StandardPeriod & {
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

const ReviewCriteriaEvaluationAdvisory = () => {
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
      },
      include: {
        standards: {
          where: {
            criteria: {
              some: {
                evaluationCriterion: {
                  status: {
                    not: $Enums.EvaluationStatus.LOCK,
                  },
                },
              },
            },
          },
          include: {
            criteria: {
              where: {
                evaluationCriterion: {
                  status: {
                    not: $Enums.EvaluationStatus.LOCK,
                  },
                },
              },
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
      return data.standards.map((standard: DataReviewCriteriaEvaluationType) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <div className="h-[calc(100vh-230px)] overflow-y-auto">
              <ReviewCriteriaEvaluationAdvisorySubpage
                key={standard.id}
                data={standard}
                onRefetch={refetch}
              />
            </div>
          ),
        }
      })
    }
  }, [data, refetch])

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
              <Empty
                description="Chưa có phiếu đánh giá tiêu chí nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default ReviewCriteriaEvaluationAdvisory
