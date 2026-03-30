import TableIndexCollapse from "@components/commons/table-collapse-index"
import type { FilterProps } from "@components/commons/typeFilter"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useFindManyStandardPeriod } from "@workspace/db/hooks"
import { Button, Col, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function EvaluationStandardTab() {
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
  })

  const { onOpen } = useDisclosure<{
    id?: string
    refetch?: () => void
  }>({
    tag: "PutTieuChuanTieuChi",
  })

  const where = useMemo(
    () => ({
      ...(filters.name && {
        criteria: {
          some: {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          },
        },
      }),
    }),
    [filters.name]
  )

  const { data, isLoading, refetch } = useFindManyStandardPeriod(
    {
      where: {
        ...where,
        periodId: selectedEvaluationPeriodId,
      },
      include: {
        criteria: true,
      },
      orderBy: {
        order: "asc",
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
    }
  )

  return (
    <Row gutter={[8, 0]}>
      <Col span={24}>
        <Row gutter={[8, 8]} align="middle" justify="end">
          <Col>
            {!data || data.length === 0 ? (
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  onOpen({
                    refetch,
                  })
                }}
              >
                Thêm mới
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  onOpen({ id: data[0]?.id, refetch })
                }}
              >
                Chỉnh sửa
              </Button>
            )}
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <TableIndexCollapse
          rowKey="id"
          headerTitleKey={({ order, name }) => {
            const parts = [order, name].filter(Boolean)
            return `Tiêu chuẩn ${parts.join(" - ")}`
          }}
          childrenFieldName="criteria"
          defaultExpandAll
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
          }}
          loading={isLoading}
          isTitle={true}
          scroll={{ y: "calc(100vh - 240px)", x: "max-content" }}
          className="w-full mt-2"
          columns={[
            {
              title: "Tiêu chí",
              dataIndex: "name",
              type: "input",
              width: 300,
            },
          ]}
          data={data}
          pagination={false}
        />
      </Col>
    </Row>
  )
}
