import { Button, Col, Row, Typography } from 'antd'
// @ts-nocheck
import type { GetSurveyStatistics200QuestionsItemAnswersItem } from '@workspace/libs/api/schemas'
import Table from '@components/commons/table'
import HtmlTruncate from '@components/commons/html-truncate'
import { useFindManySurveyQuestion, useFindManySurveyResponse } from '@workspace/db/hooks'
import Select from '@components/commons/select'
import { useState } from 'react'
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { DownloadOutlined } from '@ant-design/icons'

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
                type: 'ESSAY',
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
                surveyQuestionId: surveyQuestionId || '',
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
    const exportWord = async () => {
        if (!surveyQuestionId) return

        const question = dataQuestion.find((q) => q.id === surveyQuestionId)

        const rows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('STT')] }),
                    new TableCell({ children: [new Paragraph('Nội dung câu trả lời')] }),
                ],
            }),
            ...data.map(
                (item, index) =>
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(String(index + 1))],
                            }),
                            new TableCell({
                                children: [new Paragraph(item?.answerText || '')],
                            }),
                        ],
                    })
            ),
        ]

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: question?.name || 'Câu hỏi',
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                        }),
                        new Paragraph(''),
                        new DocxTable({ rows }),
                    ],
                },
            ],
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, 'cau-hoi-tu-luan.docx')
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

                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        className="ml-3"
                        disabled={!surveyQuestionId}
                        onClick={exportWord}
                    >
                        Xuất Word
                    </Button>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Nội dung câu trả lời',
                                align: 'left',
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
