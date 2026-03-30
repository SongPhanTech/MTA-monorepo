import StandarReportsSubPage from "@components/sub-pages/tu-danh-gia-ctdt/standar-reports"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import type {
  CriterionPeriod,
  EvaluationCriterion,
  EvaluationCriterionComment,
  StandardPeriod,
} from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"

export type DataTabEvaluationCriterionType = StandardPeriod & {
  criteria: (CriterionPeriod & {
    evaluationCriterion?:
      | (EvaluationCriterion & {
          evaluationCriterionComments?: (EvaluationCriterionComment & {
            reviewer?: { fullname?: string | null }
          })[]
          lecturer?: { userProfile?: { fullname?: string | null } } | null
        })
      | null
  })[]
}

export default function StandardReports() {
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
              include: {
                evaluationCriterion: {
                  where: {
                    status: $Enums.EvaluationStatus.COMPLETED,
                  },
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
      refetchOnWindowFocus: false,
    }
  )

  return (
    <div className="h-full">
      <Row gutter={[8, 0]}>
        <Col span={24}>
          {data && data.standards.length > 0 ? (
            <Tabs
              className="h-[calc(100vh-230px)]"
              tabPosition="left"
              items={data.standards.map((standard: DataTabEvaluationCriterionType) => {
                return {
                  key: standard.id,
                  label: `Tiêu chuẩn ${standard.order}`,
                  children: (
                    <StandarReportsSubPage key={standard.id} data={standard} onRefetch={refetch} />
                  ),
                }
              })}
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
