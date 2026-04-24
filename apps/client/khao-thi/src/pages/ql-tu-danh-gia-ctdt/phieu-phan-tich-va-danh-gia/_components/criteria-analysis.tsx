import CriteriaAnalysisSubPage from "@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import { useMemo } from "react"

export default function CriteriaAnalysisWrite() {
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId || "0fac9683-9dc2-4296-a051-7c739e46785f"
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { data, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
        standards: {
          some: {
            criteria: {
              some: {
                analysisCriterions: {
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
                analysisCriterions: {
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
                analysisCriterions: {
                  lecturer: {
                    userProfile: {
                      id: idProfile,
                    },
                  },
                },
              },
              include: {
                analysisCriterions: {
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
                            evidence: true,
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
      enabled: !!idProfile && !!selectedEvaluationPeriodId,
      refetchOnWindowFocus: false,
    }
  )

  const dataTab = useMemo(() => {
    if (data) {
      return data.standards.map((standard) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <CriteriaAnalysisSubPage
              key={standard.id}
              data={standard}
              idx={standard.order}
              userRole="GV"
              refetch={refetch}
            />
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
                description="Chưa có phiếu phân tích tiêu chí nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}
