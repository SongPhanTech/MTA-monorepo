import { Col, Row, Typography } from 'antd'
// @ts-nocheck
import { GetSurveyStatistics200QuestionsItemAnswersItem } from '@workspace/libs/api/schemas'
import Table from '@components/commons/table'
import HtmlTruncate from '@components/commons/html-truncate'
import { useFindManySurveyQuestion, useFindManySurveyResponse } from '@workspace/db/hooks'
import Select from '@components/commons/select'
import { useState } from 'react'
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
    const { data } = useFindManySurveyResponse(
        {
            where: {
                surveyQuestionId: surveyQuestionId || '',
            },
            include:{
                surveySession:{
                    include:{
                        profile:true,
                        student:{
                            include:{
                                userProfile:true
                            }
                        }
                    }
                }
            }
        },
        {
            enabled: !!surveyQuestionId,
        }
    )
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
