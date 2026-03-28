import Table from "@components/commons/table"
import { cn } from "@lib/utils"
import {
  exportClusterSurveyStatistics,
  useGetClusterSurveyStatistics,
} from "@workspace/libs/api/exam"
import { Button, Col, Empty, message, Row, Typography } from "antd"
import ReactECharts from "echarts-for-react"
import { saveAs } from "file-saver"
import { useRouter } from "next/router"
import { useMemo } from "react"

const { Title } = Typography
function LecturerSurveyReport({
  selectedId,
  lectureId,
  sublectClass,
  setSublectClass,
}: {
  selectedId: string
  lectureId: string
  sublectClass: any
  setSublectClass: any
}) {
  const router = useRouter()

  const { data: dataLevel } = useGetClusterSurveyStatistics(selectedId as string, {
    lectureId,
  })

  const dataBarchart = useMemo(() => {
    let choices: any = []

    if (dataLevel?.status !== 200) {
      return
    }
    choices = dataLevel?.data?.choices.map((i) => {
      return {
        name: i?.description,
        type: "bar",
        stack: "total",
        label: {
          show: true,
        },
        emphasis: {
          focus: "series",
        },
        data: [],
      }
    })
    dataLevel?.data?.data.forEach((i: any) => {
      choices.forEach((j: any, index: number) => {
        j?.data.push(i?.average[index]?.totalRate || 0)
      })
    })

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          // Use axis to trigger tooltip
          type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'
        },
      },
      legend: {},
      xAxis: {
        type: "value",
      },
      yAxis: {
        type: "category",
        data:
          dataLevel?.data?.data?.map((i) => {
            return `${i?.subjectClassName}`
          }) || [],
      },
      series: choices,
    }
  }, [dataLevel])

  const exportReport = async () => {
    try {
      const res = await exportClusterSurveyStatistics(selectedId as string)
      if (res.status === 200) {
        saveAs(res?.data, "Bao_cao.docx")
      }
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  const onChartClick = (params: any) => {
    if (dataLevel?.status !== 200) {
      return
    }
    // const result = dataLevel?.data?.data[params?.dataIndex]
    // router.push(`/bao-cao-khao-sat/${result?.surveyId}`)
  }

  const onEvents = {
    click: onChartClick,
  }

  const renderTable = (dataTable: any, choices: any) => {
    return (
      <Table
        onRow={(record) => {
          return {
            onClick: () => {
              setSublectClass(record as any)
            },
            className: cn(sublectClass?.surveyId === record.surveyId ? "bg-orange-200" : ""),
          }
        }}
        columns={
          choices?.length > 0
            ? [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Lớp môn học",
                  align: "center",
                  render: (_, record) => {
                    return record?.subjectClassName
                  },
                },
                // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
                ...choices?.map((i: any, index: number) => ({
                  title: i?.description,
                  id: i?.id,
                  dataIndex: i?.id,
                  align: "center",
                  render: (__: any, record: any, idx: number) => {
                    const count = calculatePercent(record?.average)[idx]
                    return (
                      `${count?.percent || 0}% (${count?.totalRate || 0}/${count?.total})` || "0"
                    )
                  },
                })),
              ]
            : [
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Đối tượng",
                  align: "center",
                  render: (_, record) => {
                    return record?.lecture
                  },
                },
              ]
        }
        dataSource={dataTable}
        pagination={false}
      />
    )
  }

  function calculatePercent(items: any[]): any[] {
    const total = items.reduce((sum, item) => sum + item.totalRate, 0)
    return items.map((item) => ({
      ...item,
      total,
      percent: total === 0 ? 0 : Number.parseFloat(((item.totalRate / total) * 100).toFixed(2)),
    }))
  }

  return (
    <div>
      <Row gutter={[16, 4]}>
        {dataLevel?.status === 200 && dataLevel?.data && (
          <Col span={24}>
            <div className="bg-white h-full flex flex-col">
              <div className="p-4 flex justify-between">
                <Title level={4}>
                  Thống kê khảo sát:{" "}
                  {dataLevel?.data?.data?.length > 0 ? dataLevel?.data?.data[0]?.lecture : ""}
                </Title>
                <Button size="small" type="primary" onClick={exportReport}>
                  Xuất báo cáo
                </Button>
              </div>
              <div className="flex-1">
                {dataLevel?.status === 200 && dataLevel?.data ? (
                  <div style={{ width: "100%", height: "100%" }}>
                    <ReactECharts
                      onEvents={onEvents}
                      option={dataBarchart}
                      className="w-full min-h-[400px] mb-6"
                    />

                    {dataLevel?.data?.data?.length > 0 &&
                      renderTable(dataLevel?.data?.data, dataLevel?.data?.choices)}
                  </div>
                ) : (
                  // <BarChart className="h-full" dataMap={dataBarchart} />
                  <Empty />
                )}
              </div>
            </div>
          </Col>
        )}
      </Row>
    </div>
  )
}

export default LecturerSurveyReport
