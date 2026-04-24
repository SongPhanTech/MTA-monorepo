import CriteriaEvaluationSubPage from "@components/sub-pages/tu-danh-gia-ctdt/criteria-evaluation"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"

export default function CriteriaEvaluationWrite() {
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "0fac9683-9dc2-4296-a051-7c739e46785f"

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
        standards: {
          some: {
            criteria: {
              some: {
                evaluationCriterion: {
                  lecturer: {
                    userProfile: {
                      id: idProfile,
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
                  lecturer: {
                    userProfile: {
                      id: idProfile,
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
                  lecturer: {
                    userProfile: {
                      id: idProfile,
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
              items={data.standards.map((standard) => {
                return {
                  key: standard.id,
                  label: `Tiêu chuẩn ${standard.order}`,
                  children: <CriteriaEvaluationSubPage key={standard.id} data={standard} />,
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
