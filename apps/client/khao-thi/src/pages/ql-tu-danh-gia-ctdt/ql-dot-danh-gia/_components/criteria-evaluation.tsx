import CriteriaEvaluationListSubPage from "@components/sub-pages/tu-danh-gia-ctdt/criteria-evaluation-list"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"

export default function CriteriaEvaluationPeriodList() {
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
                        userProfile: true,
                      },
                    },
                    reviewer: {
                      include: {
                        lecturer: {
                          include: {
                            userProfile: true,
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
      return data.standards.map((standard) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <CriteriaEvaluationListSubPage
              key={standard.id}
              data={standard}
              allStandards={data.standards}
            />
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
