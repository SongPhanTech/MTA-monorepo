import CrossReviewSubPage from "@components/sub-pages/tu-danh-gia-ctdt/cross-review"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"
import type { DataTabCrossReviewType } from "./cross-review"

export default function CrossReviewExternal() {
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "7247c121-ab5a-4a72-a018-4a4090c7948a"
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
      return data.standards.map((standard: DataTabCrossReviewType) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <div className="h-[calc(100vh-230px)] overflow-y-auto">
              <CrossReviewSubPage
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
