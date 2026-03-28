import { DownOutlined, FileExcelOutlined, PrinterOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import {
  useGetClusterSurveyInfo,
  useGetOrganizationSurveyStatistics,
} from "@workspace/libs/api/exam"
import { Button, Col, Dropdown, Empty, Flex, message, Row, Typography } from "antd"
import ReactECharts from "echarts-for-react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { useRouter } from "next/router"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title } = Typography

type AnswerItem = {
  id: string
  code: string | null
  active: boolean
  description: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  answer: string
  requireExplanation: boolean
  clusterSurveyId: string
  totalCount: number
}

type AnswerWithPercent = AnswerItem & { percent: number; total: number }
function OrganizationSurveyReport({
  selectedId,
  surveyName,
  organizationId,
  trainingObjectTypeName,
  trainingObjectTypeId,
  semesterId,
  // organizationSelected,
  // setOrganizationSelected,
}: {
  selectedId: string
  surveyName: string
  organizationId: string
  trainingObjectTypeName?: string
  trainingObjectTypeId: string
  semesterId: string
  // organizationSelected: string
  // setOrganizationSelected: (value: string) => void
}) {
  const router = useRouter()
  const { onOpen } = useDisclosure({
    tag: "ModalPrintBaoCaoDonVi",
  })
  const { data: res } = useGetClusterSurveyInfo(selectedId as string, {
    organizationId,
    semesterId,
    trainingObjectTypeId,
  })

  const dataInfo = useMemo(() => {
    if (res?.status === 200) {
      return {
        xAxis: {
          type: "category",
          data: ["Tổng số GV", "Số phiếu xuất", "Số phiếu thu"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [
              res?.data?.surveyCount,
              res?.data?.listStudentCount,
              res?.data?.studentCompletedSurveyCount,
            ],
            type: "bar",
          },
        ],
      }
      // return {
      //     title: {
      //         text: 'World Population',
      //         show: false,
      //     },
      //     tooltip: {
      //         trigger: 'axis',
      //         axisPointer: {
      //             type: 'shadow',
      //         },
      //     },
      //     legend: {},
      //     xAxis: {
      //         type: 'value',
      //         boundaryGap: [0, 0.01],
      //     },
      //     yAxis: {
      //         type: 'category',
      //         data: data?.data.map((i) => i.name),
      //     },
      //     series: [
      //         {
      //             name: 'Tổng số GV',
      //             type: 'bar',
      //             data: [data?.data?.surveyCount],
      //         },
      //         {
      //             name: 'Số phiếu xuất',
      //             type: 'bar',
      //             data:[data?.data?.listStudentCount],
      //         },
      //         {
      //             name: 'Số phiếu thu',
      //             type: 'bar',
      //             data:[data?.data?.studentCompletedSurveyCount],
      //         }
      //     ],
      // }
    }
    return {}
  }, [res])
  const { data: dataLevel } = useGetOrganizationSurveyStatistics(selectedId as string, {
    organizationId,
  })
  // const { data: organizations = [] } = useFindManyDM_DonVi()
  // const treeData = buildOrgTree(organizations)

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
        j?.data.push(i?.average[index]?.totalCount || 0)
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
        data: dataLevel?.data?.data.map(
          (i) => `${i?.organization?.sMa || ""} - ${i?.organization?.sTen || ""}`
        ),
      },
      series: choices,
    }
  }, [dataLevel])

  const exportReport = async (dataExport: any, choices: any) => {
    try {
      if (choices?.length <= 0) {
        return
      }
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Báo cáo khảo sát theo đơn vị")

      // Thiết lập style
      const golbalFontStyle = {
        name: "Times New Roman",
      }

      const headerTitleStyle = {
        font: { ...golbalFontStyle, bold: true, size: 14 },
        alignment: {
          horizontal: "center" as const,
          vertical: "middle" as const,
          wrapText: true as const,
        },
      }

      const headerSubtitleStyle = {
        font: { ...golbalFontStyle, bold: true, size: 16 },
        alignment: {
          horizontal: "center" as const,
          vertical: "middle" as const,
          wrapText: true as const,
        },
      }

      const tableHeaderStyle = {
        font: {
          ...golbalFontStyle,
          bold: true,
          size: 14,
          color: { argb: "FF000000" },
        },
        fill: {
          type: "pattern",
          pattern: "none",
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        },
        border: {
          top: {
            style: "thin" as ExcelJS.BorderStyle,
            color: { argb: "FF000000" },
          },
          left: {
            style: "thin" as ExcelJS.BorderStyle,
            color: { argb: "FF000000" },
          },
          right: {
            style: "thin" as ExcelJS.BorderStyle,
            color: { argb: "FF000000" },
          },
          bottom: {
            style: "thin" as ExcelJS.BorderStyle,
            color: { argb: "FF000000" },
          },
        },
      }

      const addBorderToRange = (
        sheet: ExcelJS.Worksheet,
        fromRow: number,
        toRow: number,
        toCol: number
      ) => {
        for (let row = fromRow; row <= toRow; row++) {
          for (let col = 1; col <= toCol; col++) {
            sheet.getCell(row, col).border = {
              top: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
              bottom: { style: "thin" },
            }
          }
        }
      }

      worksheet.mergeCells("A1:C2")
      worksheet.getCell("A1").value = "BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ"
      worksheet.getCell("A1").style = headerTitleStyle

      worksheet.getRow(1).height = 30
      worksheet.getRow(2).height = 30

      worksheet.mergeCells("E1:H2")
      worksheet.getCell("E1").value =
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
      worksheet.getCell("E1").style = headerTitleStyle

      worksheet.mergeCells("A4:H4")
      worksheet.getCell("A4").value = `Báo khảo sát: ${surveyName}`
      worksheet.getCell("A4").style = headerSubtitleStyle
      worksheet.getRow(4).height = 20

      // Thêm tiêu đề bảng
      const headerRow = worksheet.getRow(7)
      headerRow.values = ["STT", "Đợn vị quản lý", ...choices.map((i: any) => i?.description)]
      headerRow.eachCell((cell: any, colNumber: number) => {
        cell.style = {
          ...tableHeaderStyle,
          alignment: {
            horizontal: colNumber === 2 ? "left" : "center",
            vertical: "middle",
            wrapText: true,
          },
        }
      })

      // Điều chỉnh độ rộng cột
      worksheet.columns = [
        { width: 10 },
        { width: 40 },
        { width: 40 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
      ]
      if (dataExport && dataExport.length > 0) {
        dataExport.forEach((i: any, index: number) => {
          const headerRowValue: any = worksheet.getRow(8 + index)
          headerRowValue.values = [
            index + 1,
            `${i?.organization?.sMa || ""} - ${i?.organization?.sTen || ""}`,
            ...calculatePercent(i?.average).map(
              (a: any) => `${a.percent || 0}% (${a?.totalCount || 0}/${a?.total || 0})`
            ),
          ]
          headerRowValue.eachCell((cell: any, colNumber: number) => {
            cell.alignment = {
              horizontal: colNumber === 2 ? "left" : "center",
              vertical: "middle",
              wrapText: true,
            }
          })
        })
      }
      addBorderToRange(worksheet, 7, 7 + dataExport.length, worksheet.columns.length)

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), "Baocao.xlsx")
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
    if (!dataTable?.length) return

    let average = choices.map((i: any) => {
      return { ...i, total: 0, totalCount: 0 }
    })
    dataTable.forEach((e: any) => {
      average = average.map((i: any) => {
        return {
          ...i,
          total: i.total + e.average.find((a: any) => a.id === i.id)?.total,
          totalCount: i.totalCount + e.average.find((a: any) => a.id === i.id)?.totalCount,
        }
      })
    })
    const datarender = [
      ...dataTable,
      {
        name: "Trung bình",
        average: average,
        id: "average",
      },
    ]
    return (
      <Table
        // onRow={(record) => {
        //     return {
        //         onClick: () => {
        //             setOrganizationSelected(record?.organization?.Id as string)
        //         },
        //         className: cn(
        //             organizationSelected === record?.organization.Id ? 'bg-orange-200' : ''
        //         ),
        //     }
        // }}
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
                  title: "Đơn vị quản lý",
                  align: "center",
                  render: (_, record, index) => {
                    return index === datarender.length - 1
                      ? "ĐGTB"
                      : `${record?.organization?.sMa || ""} - ${record?.organization?.sTen || ""}`
                  },
                },
                ...(choices?.map((i: any) => ({
                  title: i?.description,
                  id: i?.id,
                  dataIndex: i?.id,
                  align: "center",
                  render: (__: any, record: any) => {
                    const count = calculatePercent(record?.average).find((a) => a.id === i?.id)
                    return `${count?.percent || 0}% (${count?.totalCount || 0}/${count?.total})`
                  },
                })) || []),
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
        dataSource={datarender}
        pagination={false}
      />
    )
  }

  function calculatePercent(items: AnswerItem[]): AnswerWithPercent[] {
    const total = items.reduce((sum, item) => sum + item.totalCount, 0)
    return items.map((item) => ({
      ...item,
      total,
      percent: total === 0 ? 0 : Number.parseFloat(((item.totalCount / total) * 100).toFixed(2)),
    }))
  }

  return (
    <div>
      <Row gutter={[16, 4]}>
        {res?.status === 200 && (
          <Col span={24}>
            <div className="bg-white h-full flex flex-col">
              <div className="px-4 pb-4 flex justify-between">
                <Title level={4}>Thống kê chung</Title>
              </div>
              <div className="flex-1">
                <ReactECharts option={dataInfo} className="w-full min-h-[400px]" />
                {/* <Table
                                    columns={[
                                        {
                                            title: 'STT',
                                            width: 60,
                                            align: 'center',
                                            fixed: 'left',
                                            render: (_, __, index) => index + 1,
                                        },
                                        {
                                            title: 'Đối tượng',
                                            render: (_, record, index) => {
                                                return record?.name
                                            },
                                        },
                                        {
                                            title: 'Trạng thái',
                                            align: 'center',
                                            width: 200,
                                            render: (_, record, index) => {
                                                return `${record?.taken || 0}/${record?.total || 0}`
                                            },
                                        },
                                    ]}
                                    dataSource={data?.data}
                                    pagination={false}
                                /> */}
              </div>
            </div>
          </Col>
        )}
        <Col span={24}>
          {dataLevel?.status === 200 && (
            <div className="bg-white h-full flex flex-col">
              <div className="px-4 py-2 flex justify-between">
                <Title level={4}>Thống kê theo đơn vị</Title>
                <Flex justify="end">
                  {/* <TreeSelect
                                        multiple
                                        maxTagCount="responsive"
                                        allowClear
                                        showSearch
                                        placeholder="Chọn đơn vị quản lý"
                                        treeDefaultExpandAll
                                        treeData={treeData}
                                        value={organization}
                                        className="mr-4 w-[300px]"
                                        onChange={(value) => {
                                            setOrganization(value)
                                        }}
                                    /> */}
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        {
                          key: "export",
                          icon: <FileExcelOutlined />,
                          label: "Xuất báo cáo",
                          onClick: () =>
                            exportReport(dataLevel?.data?.data, dataLevel?.data?.choices),
                        },
                        {
                          key: "print",
                          icon: <PrinterOutlined />,
                          label: "In báo cáo",
                          onClick: () =>
                            onOpen({
                              surveyName,
                              data: dataLevel?.data?.data,
                              choices: dataLevel?.data?.choices,
                              chartOption: dataBarchart,
                              trainingObjectTypeName,
                            }),
                        },
                      ],
                    }}
                  >
                    <Button size="small" type="primary">
                      Xuất báo cáo <DownOutlined />
                    </Button>
                  </Dropdown>
                </Flex>
              </div>
              <div className="flex-1 pb-4">
                {dataLevel?.status === 200 && dataLevel?.data ? (
                  <div style={{ width: "100%", height: "100%" }}>
                    <ReactECharts
                      onEvents={onEvents}
                      option={dataBarchart}
                      style={{
                        width: "100%",
                        height: Math.max(300, (dataLevel?.data?.data?.length || 0) * 35 + 120),
                      }}
                    />

                    {dataLevel?.data?.data?.length > 0 &&
                      renderTable(dataLevel?.data?.data, dataLevel?.data?.choices)}
                  </div>
                ) : (
                  <Empty />
                )}
              </div>
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default OrganizationSurveyReport
