// @ts-nocheck
// import EvaluatedPage from '@components/sub-pages/tu-danh-gia'
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type {
  AnalysisFormEvidence,
  EvaluationCriterion,
  EvaluationPeriod,
  Evidence,
  RequirementCriterion,
} from "@workspace/db"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, Row, Tabs } from "antd"
import { Printer } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type DataPrintDotDanhGia = EvaluationPeriod & {
  standards: DataIndex[]
}

export type DataIndex = EvaluationStandard & {
  criteria: (EvaluationCriterion & {
    requirementCriterions: (RequirementCriterion & {
      evidences: (AnalysisFormEvidence & {
        evidence: Evidence
      })[]
    })[]
    scoreScale: any
  })[]
}

export default function EvaluationPeriodPage() {
  const router = useRouter()
  const id = router.query.id as string

  const { showSpinner, hideSpinner } = useSpinner()

  const { data, refetch } = useFindUniqueEvaluationPeriod(
    {
      where: { id },
      include: {
        standards: {
          include: {
            criteria: {
              include: {
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
                  },
                  orderBy: {
                    order: "asc",
                  },
                },
                scoreScale: true,
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
        council: {
          include: {
            members: {
              include: {
                lecturer: {
                  include: {
                    userProfile: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    { refetchOnWindowFocus: false, enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const dataTab = useMemo(() => {
    if (data) {
      return data.standards.map((i: DataIndex, index: number) => {
        return {
          key: i.id,
          label: `Tiêu chuẩn ${index + 1}`,
          children: <EvaluatedPage key={i.id} data={i} index={index + 1} refetch={refetch} />,
        }
      })
    }
  }, [data, refetch])

  const { onOpen: onOpenModalPrintDotDanhGia } = useDisclosure<{ data: DataPrintDotDanhGia }>({
    tag: "ModalPrintDotDanhGia",
  })

  return (
    <div className="h-full">
      <Row gutter={[16, 0]}>
        <Col span={24} className="font-bold text-xl mb-6 px-4">
          <Flex justify="space-between">
            <Col className="text-2xl font-bold" span={12}>
              {data?.name}
            </Col>
            <Col span={12} className="text-right">
              <Button
                type="primary"
                onClick={() => {
                  if (data) {
                    onOpenModalPrintDotDanhGia({
                      data,
                    })
                  }
                }}
              >
                <Printer /> In
              </Button>
            </Col>
          </Flex>
        </Col>
        <Col span={24}>
          <Tabs
            className="h-[calc(100vh-230px)] overflow-y-auto"
            tabPosition={"left"}
            items={dataTab}
            tabBarStyle={{ height: "100%", overflow: "auto", width: "175px" }}
          />
        </Col>
      </Row>
    </div>
  )
}

EvaluationPeriodPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "QL tự đánh giá CTĐT" },
        {
          title: "Quản lý đợt tự đánh giá",
          href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
        },
        { title: "Chi tiết đợt tự đánh giá" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
