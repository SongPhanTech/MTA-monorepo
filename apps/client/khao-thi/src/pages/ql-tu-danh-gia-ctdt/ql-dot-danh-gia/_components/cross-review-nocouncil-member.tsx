import CrossReviewNoCouncilSubPage from "@components/sub-pages/tu-danh-gia-ctdt/cross-review-nocouncil"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"
import type { DataTabCrossReviewNoCouncilType } from "@components/sub-pages/tu-danh-gia-ctdt/cross-review-nocouncil"

export default function CrossReviewNoCouncilMember() {
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "be492b22-dd49-47f9-8a12-96d8705cc4eb"
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
        standards: {
          some: {
            criteria: {
              some: {
                evaluationCriterion: {
                  lecturerReview: {
                    some: {
                      userProfileId: idProfile,
                    },
                  },
                },
              },
            },
          },
        },
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
                  lecturerReview: {
                    some: {
                      userProfileId: idProfile,
                    },
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
                  lecturerReview: {
                    some: {
                      userProfileId: idProfile,
                    },
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
      enabled: !!idProfile && !!selectedEvaluationPeriodId,
    }
  )

  const dataTab = useMemo(() => {
    if (data && data.standards.length > 0) {
      return data.standards.map((standard: DataTabCrossReviewNoCouncilType) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <div className="h-[calc(100vh-230px)] overflow-y-auto">
              <CrossReviewNoCouncilSubPage
                key={standard.id}
                data={standard}
                onRefetch={refetch}
                role="REVIEWER"
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
                description="Chưa có tiêu chuẩn nào phản biện"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}
