import CriteriaAnalysisPeriodSubPage from "@components/sub-pages/ql-dot-danh-gia/criteria-analysis-period"
import { getStatusEvaluation } from "@constants/constants"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import type { StandardPeriod } from "@workspace/db/client"
import { useFindUniqueEvaluationPeriod } from "@workspace/db/hooks"
import { Col, Empty, Row, Tabs } from "antd"
import dayjs from "dayjs"
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"
import { saveAs } from "file-saver"
import { useCallback, useMemo } from "react"

export default function CriteriaAnalysisPeriodList() {
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
                analysisCriterions: {
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
                    lecturer: {
                      include: {
                        userProfile: true,
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

  const exportDanhyeuCau = useCallback((dataTable: any) => {
    // ==== Tạo header bảng ====
    const headerRow1 = new TableRow({
      children: [
        new TableCell({
          rowSpan: 2,
          children: [new Paragraph("STT")],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          columnSpan: 2,
          children: [
            new Paragraph({
              text: "Phân tích tiêu chí",
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          columnSpan: 3,
          children: [
            new Paragraph({
              text: "Thông tin minh chứng",
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    })

    const headerRow2 = new TableRow({
      children: [
        // 2 cột nhỏ trong "Phân tích tiêu chí"
        new TableCell({
          children: [new Paragraph("Các yêu cầu")],
        }),
        new TableCell({
          children: [new Paragraph("Các câu hỏi đặt ra")],
        }),

        // 3 cột nhỏ trong "Thông tin minh chứng"
        new TableCell({
          children: [new Paragraph("Tên minh chứng")],
        }),
        new TableCell({
          children: [new Paragraph("Nơi thu thập")],
        }),
        new TableCell({
          children: [new Paragraph("Phương pháp thu thập")],
        }),
      ],
    })

    // ==== Tạo các dòng dữ liệu ====
    const dataRows = dataTable.map(
      (item: any, index: number) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
            new TableCell({
              children: [new Paragraph(`${item?.name || ""}`)],
            }),
            new TableCell({
              children: item?.questions.map((t: string) => new Paragraph(`${t}`)),
            }),
            new TableCell({
              children: item?.evidences.map(
                (t: any) => new Paragraph(`${t?.evidence?.name || ""}`)
              ),
            }),

            new TableCell({
              children: [new Paragraph(`${item?.evidencePlaces || ""}`)],
            }),
            new TableCell({
              children: [new Paragraph(`${item?.collectionMethod || ""}`)],
            }),
          ],
        })
    )

    // ==== Tạo bảng ====
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [headerRow1, headerRow2, ...dataRows],
    })

    return table
  }, [])

  const handleViewAll = useCallback(
    async (dataExport: StandardPeriod[]) => {
      try {
        if (!dataExport) return
        const sections = await Promise.all([
          ...dataExport.map(async (standard: any, idx: number) => {
            const children: any = []

            // Tiêu chuẩn
            children.push(
              new Paragraph({
                indent: { firstLine: 720 },
                alignment: AlignmentType.JUSTIFIED,
                heading: HeadingLevel.HEADING_1,
                children: [
                  new TextRun({
                    text: `Tiêu chuẩn ${idx + 1}: ${standard.name}`,
                    bold: true,
                    size: 28,
                    color: "000000",
                  }),
                ],
              })
            )

            // Tiêu chí
            for (const [cIdx, criterion] of standard.criteria.entries()) {
              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  heading: HeadingLevel.HEADING_2,
                  children: [
                    new TextRun({
                      text: `Tiêu chí ${idx + 1}.${cIdx + 1}: ${criterion.name}`,
                      size: 28,
                      italics: true,
                      color: "000000",
                    }),
                  ],
                })
              )
              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: `Người thực hiện ${
                        criterion?.analysisCriterions?.lecturer?.userProfile?.fullname || ""
                      }`,
                      size: 28,
                      italics: true,
                      color: "000000",
                    }),
                  ],
                })
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({
                      text: `Hạn ${criterion?.analysisCriterions?.deadline ? dayjs(criterion?.analysisCriterions?.deadline).format("DD/MM/YYYY") : ""}`,
                      size: 28,
                      italics: true,
                      color: "000000",
                    }),
                  ],
                })
              )

              children.push(
                new Paragraph({
                  indent: { firstLine: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    after: 200,
                  },
                  children: [
                    new TextRun({
                      text: `Trạng thái: ${criterion?.analysisCriterions?.status ? getStatusEvaluation(criterion?.analysisCriterions?.status)?.label : ""}`,
                      size: 28,
                      italics: true,
                      color: "000000",
                    }),
                  ],
                })
              )

              children.push(exportDanhyeuCau(criterion?.analysisCriterions?.requirementCriterions))

              // Add spacing after each criterion
              children.push(
                new Paragraph({
                  spacing: {
                    after: 400,
                  },
                  children: [],
                })
              )
            }

            return { children }
          }),
        ])
        const doc = new Document({
          sections: [...sections],
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, `bao_cao_dot_danh_gia_${data?.name}.docx`)
      } catch (error) {
        console.log(error)
      }
    },
    [data, exportDanhyeuCau]
  )

  const dataTab = useMemo(() => {
    if (data) {
      return data.standards.map((standard) => {
        return {
          key: standard.id,
          label: `Tiêu chuẩn ${standard.order}`,
          children: (
            <CriteriaAnalysisPeriodSubPage
              key={standard.id}
              data={standard}
              idx={standard.order}
              refetch={refetch}
              handleViewAll={() => handleViewAll(data?.standards || [])}
              allData={data?.standards}
            />
          ),
        }
      })
    }
  }, [data, refetch, handleViewAll])

  return (
    <div className="h-full">
      <Row gutter={[8, 0]}>
        <Col span={24}>
          {data && data.standards.length > 0 ? (
            <Tabs
              className="h-[calc(100vh-230px)] overflow-y-auto"
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
