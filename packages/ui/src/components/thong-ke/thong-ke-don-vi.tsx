import { useFindManyDM_DonVi } from "@workspace/db/hooks"
import { cn } from "@workspace/ui/lib/utils"
import { Col, Row, Table } from "antd"
import ReactECharts from "echarts-for-react"
import type React from "react"

type LectureByOrgProps = {
  className?: string
  showTable?: boolean
}

const ThongKeDonVi: React.FC<LectureByOrgProps> = ({ className, showTable = true }) => {
  const { data: donViData = [] } = useFindManyDM_DonVi({
    select: {
      sTen: true,
      _count: {
        select: {
          lecturers: {
            where: {
              active: true,
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const data = donViData
    .map((donVi) => ({
      letter: donVi.sTen,
      frequency: donVi._count.lecturers,
    }))
    .filter((item) => item.frequency > 0)

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
                data: data.map((item) => item.letter),
                axisTick: {
                  alignWithLabel: true,
                },
                axisLabel: {
                  rotate: 90,
                },
              },
            ],
            yAxis: [
              {
                type: "value",
              },
            ],
            series: [
              {
                name: "Giảng viên",
                type: "bar",
                barWidth: "60%",
                data: data.map((item) => item.frequency),
              },
            ],
          }}
        />
      </Col>
      <Col span={8}>
        <Table
          rowKey={"letter"}
          dataSource={data}
          columns={[
            {
              title: "STT",
              dataIndex: "index",
              key: "index",
              align: "center",
              render: (_text, _record, index) => index + 1,
            },
            {
              title: "Đơn vị",
              dataIndex: "letter",
              key: "letter",
            },
            {
              title: "Số lượng giảng viên",
              dataIndex: "frequency",
              key: "frequency",
            },
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

export { ThongKeDonVi }
