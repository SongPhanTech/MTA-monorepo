import { DownloadOutlined } from "@ant-design/icons"
import HtmlTruncate from "@components/commons/html-truncate"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { useFindManySurveyQuestion, useFindManySurveyResponse } from "@workspace/db/hooks"
// @ts-nocheck
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from "@workspace/libs/api/schemas"
import { Button, Col, Flex, Row, Typography } from "antd"
import { Document, Table as DocxTable, Packer, Paragraph, TableCell, TableRow, TextRun } from "docx"
import { saveAs } from "file-saver"
import { useState } from "react"

const { Title } = Typography

export interface CriteriaItem {
  id: string
  name: string
  answers: GetSurveyStatistics200QuestionsItemAnswersItem[]
}

function SurveyEssay({ selectedId }: { selectedId: string }) {
  const [surveyQuestionId, setSurveyQuestionId] = useState(null)
  const { data: dataQuestion = [] } = useFindManySurveyQuestion(
    {
      where: {
        survey: {
          some: {
            id: selectedId,
          },
        },
        type: "ESSAY",
      },
      include: {
        survey: {
          where: {
            id: selectedId,
          },
        },
      },
    },
    {
      enabled: !!selectedId,
    }
  )
  const { data = [] } = useFindManySurveyResponse(
    {
      where: {
        surveyQuestionId: surveyQuestionId || "",
        surveySession: {
          surveyId: selectedId,
        },
      },
      include: {
        surveySession: {
          include: {
            profile: true,
            student: {
              include: {
                userProfile: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!surveyQuestionId,
    }
  )

  const { data: allAnswers = [] } = useFindManySurveyResponse(
    {
      where: {
        surveySession: {
          surveyId: selectedId,
        },
      },
    },
    {
      enabled: !!selectedId,
    }
  )

  const tableData = (
    surveyQuestionId ? dataQuestion.filter((q) => q.id === surveyQuestionId) : dataQuestion
  ).map((q) => ({
    id: q.id,
    name: q.name,
    answers: allAnswers.filter((a) => a.surveyQuestionId === q.id),
  }))

  const exportWord = async () => {
    if (!tableData.length) return

    const sections = tableData.map((q) => {
      const rows = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: "pct" },
              children: [
                new Paragraph({
                  alignment: "center",
                  children: [new TextRun({ text: "STT", bold: true })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 90, type: "pct" },
              children: [
                new Paragraph({
                  alignment: "center",
                  children: [
                    new TextRun({
                      text: "Nội dung câu trả lời",
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `  ${q.name}`,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ===== ANSWERS =====
        ...(q.answers || []).map(
          (item, index) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(index + 1),
                      alignment: "center",
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: `  ${item?.answerText?.trim() || ""}`,
                    }),
                  ],
                }),
              ],
            })
        ),
      ]

      return {
        children: [
          new DocxTable({
            width: { size: 100, type: "pct" },
            rows,
          }),
        ],
      }
    })

    const doc = new Document({ sections })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, "cau-hoi-tu-luan.docx")
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Select
            options={dataQuestion.map((i) => {
              return {
                label: i?.name,
                value: i?.id,
              }
            })}
            onChange={(value) => {
              setSurveyQuestionId(value)
            }}
            placeholder="Chọn câu hỏi"
            className="w-[300px]"
          />
          <Flex justify="end" gap={8} align="center">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              className="ml-3"
              disabled={!tableData.length}
              onClick={exportWord}
              size="small"
            >
              Xuất Word
            </Button>
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Nội dung câu trả lời",
                align: "left",
                render: (_, record, index) => {
                  return <HtmlTruncate>{record?.answerText}</HtmlTruncate>
                },
              },
            ]}
            dataSource={data}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

export default SurveyEssay
