import { useStatisticsGraduationDecision } from "@workspace/libs/api/training"
import { cn } from "@workspace/ui/lib/utils"
import { Col, Row, Table } from "antd"
import ReactECharts from "echarts-for-react"
import type React from "react"
import { useTrainingObjectTypeStore } from "../select-training-object-type"

type LectureByOrgProps = {
  className?: string
  showTable?: boolean
}

const ThongKeTotNghiep: React.FC<LectureByOrgProps> = ({ className, showTable = true }) => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: res } = useStatisticsGraduationDecision({
    trainingObjectTypeId: trainingObjectTypeId ?? "",
  })
  const dataGroupByYear =
    res?.status === 200
      ? Object.entries(Object.groupBy(res.data, (item) => item.year)).map(([year, items]) => ({
          year,
          items: items ?? [],
        }))
      : []

  const dataGroupByClassification =
    res?.status === 200
      ? Object.entries(Object.groupBy(res.data, (item) => item.classification)).map(
          ([classification, items]) => ({
            classification,
            items: items ?? [],
          })
        )
      : []

  return (
    <Row className={cn(className)}>
      <Col span={16}>
        <ReactECharts
          style={{
            height: 500,
          }}
          option={{
            responsive: true,
            maintainAspectRatio: false,
            tooltip: {
              trigger: "axis",
              axisPointer: {
                type: "shadow",
              },
            },
            grid: {
              left: "3%",
              right: "4%",
              bottom: "3%",
              containLabel: true,
            },
            xAxis: [
              {
                type: "category",
                data: dataGroupByYear.map((e) => e.year),
                axisTick: {
                  alignWithLabel: true,
                },
              },
            ],
            yAxis: [
              {
                type: "value",
              },
            ],
            series: dataGroupByClassification.map((e) => ({
              name: e.classification,
              type: "bar",
              stack: "total",
              barWidth: "30%",
              label: {
                show: true,
              },
              data: e.items.map((item) => item.count),
            })),
          }}
        />
      </Col>
      <Col span={8}>
        <Table
          dataSource={dataGroupByYear.map((e) => ({
            ...e,
            ...Object.fromEntries(e.items.map((item) => [item.classification, item.count])),
          }))}
          columns={[
            {
              title: "STT",
              dataIndex: "index",
              key: "index",
              align: "center",
              render: (_text, _record, index) => index + 1,
            },
            {
              title: "Năm học",
              dataIndex: "year",
              key: "year",
              align: "center",
            },
            ...dataGroupByClassification.map((item) => ({
              title: item.classification,
              dataIndex: item.classification,
              align: "center" as const,
            })),
          ]}
          pagination={{
            defaultPageSize: 10,
            hideOnSinglePage: true,
          }}
        />
      </Col>
    </Row>
  )
}

export { ThongKeTotNghiep }
