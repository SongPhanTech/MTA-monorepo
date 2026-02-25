import { toRoman } from '@lib/utils'
import { useFindFirstSurveySession } from '@workspace/db/hooks'
import type { GetSurveyResult } from '@workspace/libs/api/schemas'
import { Modal as AntdModal, Button, Col, Form, Input, Radio, Row, Skeleton, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type GroupedSurveyQuestion = {
    id: string // group id
    name: string // group name
    children: {
        id: string
        name: string
        type: string
        requireExplanation: boolean
    }[]
}

type SurveyType = GetSurveyResult & {
    questionsList: {
        surveyChoiceId?: string | null
        answerText?: string | null
        explanation?: string | null
    }[]
}
const ReviewSurveyModal = () => {
    const { isOpen, onClose, input } = useDisclosure<{
        userId: string
        surveyId: string
        userName?: string
    }>({
        tag: 'ReviewSurveyModal',
    })

    const [form] = Form.useForm<SurveyType>()

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    const { data, isLoading } = useFindFirstSurveySession(
        {
            where: {
                profileId: input?.userId,
                surveyId: input?.surveyId,
            },
            include: {
                responses: {
                    include: {
                        surveyQuestion: {
                            include: {
                                surveyQuestionGroup: true,
                            },
                        },
                    },
                },
                survey: {
                    include: {
                        surveyChoice: true,
                        surveyQuestion: {
                            include: {
                                surveyQuestionGroup: true,
                                specificChoice: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!input?.userId && !!input?.surveyId,
        }
    )

    const requireExplanation = useMemo(() => {
        return data?.survey?.surveyChoice
            ?.filter((i: any) => !!i?.requireExplanation)
            .map((i) => i.id)
    }, [data])

    const groupedData = useMemo(() => {
        if (!data?.survey?.surveyQuestion || !data?.responses) return []

        const responseMap = new Map(data.responses.map((r: any) => [r.surveyQuestionId, r]))

        const groupedMap: Record<string, any> = {}
        data.survey.surveyQuestion.forEach((question: any) => {
            const group = question.surveyQuestionGroup
            const groupId = group.id

            if (!groupedMap[groupId]) {
                groupedMap[groupId] = {
                    id: groupId,
                    name: group.name,
                    questions: [],
                }
            }

            const response = responseMap.get(question.id)

            if (response) {
                groupedMap[groupId].questions.push(response)
            }
        })

        let runningIndex = 1

        return Object.values(groupedMap).flatMap((group: any, groupIndex) => {
            const groupRow = {
                id: `group-${group.id}`,
                name: group.name,
                isParent: true,
                index: toRoman(groupIndex + 1),
            }

            const questionRows = group.questions.map((q: any) => {
                const row = {
                    ...q,
                    isParent: false,
                    index: runningIndex,
                    isFullWidth:
                        q?.surveyQuestion?.type === 'ESSAY' ||
                        q?.surveyQuestion?.type === 'SINGLE_CHOICE',
                }
                runningIndex++
                return row
            })

            return [groupRow, ...questionRows]
        })
    }, [data])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (data) {
            const list = data?.responses.filter((i: any) =>
                requireExplanation?.includes(i?.surveyChoiceId)
            )
            const result = data?.responses.map((i) => {
                return {
                    surveyChoiceId: i?.surveyChoiceId,
                    answerText: i?.answerText,
                    explanation: i?.explanation,
                }
            })

            setExpandedRowKeys(list.map((i) => i?.surveyQuestionId))

            form.setFieldsValue({
                questionsList: result,
            })
            console.log(form.getFieldsValue())
        }
    }, [data, requireExplanation])

    return (
        <AntdModal
            open={isOpen}
            onCancel={onClose}
            maskClosable={true}
            title={'Xem lại khảo sát'}
            className="w-[1100px]"
            footer={null}
        >
            <div className="flex flex-col gap-2">
                {isLoading ? (
                    <Skeleton />
                ) : !!data?.responses && data?.responses?.length > 0 ? (
                    <div>
                        {input?.userName && (
                            <div className="text-base font-bold my-4">
                                <span>Người làm KS:</span>
                                {input?.userName}
                            </div>
                        )}
                        {data?.survey?.surveyChoice?.length && (
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Table
                                        rowKey="id"
                                        dataSource={[{ id: 'abc' }]}
                                        className="custom-red-table"
                                        rowClassName={(record: any) =>
                                            record.isParent ? 'group-row' : ''
                                        }
                                        columns={data?.survey.surveyChoice.map((i) => {
                                            return {
                                                title: `${i?.description} ${i?.requireExplanation === true ? '*' : ''}`,
                                                dataIndex: i?.id,
                                                key: i?.id,
                                                align: 'center',
                                                render: () => (
                                                    <div className="flex items-center justify-center">
                                                        <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                                            {i?.answer}
                                                        </Button>
                                                    </div>
                                                ),
                                            }
                                        })}
                                        pagination={false}
                                    />
                                </Col>

                                <Col span={24} className="my-3">
                                    <Form
                                        form={form}
                                        className="px-6 max-w-[1100px] w-full mx-auto"
                                    >
                                        <Table
                                            rowKey={(record) =>
                                                record.isParent ? `group-${record.id}` : record.id
                                            }
                                            dataSource={groupedData}
                                            className="custom-red-table"
                                            rowClassName={(record: any) =>
                                                record.isParent ? 'group-row' : ''
                                            }
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: 'STT',
                                                    width: 50,
                                                    align: 'center',
                                                    render: (_, record: any) => (
                                                        <div
                                                            className={
                                                                record.isParent
                                                                    ? 'font-semibold'
                                                                    : ''
                                                            }
                                                        >
                                                            {record.index}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    title: 'Nội dung phản hồi',
                                                    render: (_, record: any) => {
                                                        if (record.isParent) {
                                                            return (
                                                                <div className="font-semibold uppercase">
                                                                    {record.name}
                                                                </div>
                                                            )
                                                        }

                                                        // ESSAY
                                                        if (
                                                            record?.surveyQuestion?.type === 'ESSAY'
                                                        ) {
                                                            return (
                                                                <div>
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: record
                                                                                ?.surveyQuestion
                                                                                ?.name,
                                                                        }}
                                                                    />

                                                                    <Input.TextArea
                                                                        value={record.answerText}
                                                                        readOnly
                                                                        className="mt-2"
                                                                    />
                                                                </div>
                                                            )
                                                        }

                                                        // specificChoice (câu 12–13)
                                                        if (
                                                            record?.surveyQuestion?.specificChoice
                                                                ?.length > 0
                                                        ) {
                                                            return (
                                                                <div>
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: record
                                                                                ?.surveyQuestion
                                                                                ?.name,
                                                                        }}
                                                                    />

                                                                    <Radio.Group
                                                                        value={
                                                                            record.surveyChoiceId
                                                                        }
                                                                        disabled
                                                                        className="flex gap-x-6 mt-3"
                                                                    >
                                                                        {record.surveyQuestion.specificChoice.map(
                                                                            (choice: any) => (
                                                                                <Radio
                                                                                    key={choice.id}
                                                                                    value={
                                                                                        choice.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        choice.description
                                                                                    }
                                                                                </Radio>
                                                                            )
                                                                        )}
                                                                    </Radio.Group>
                                                                </div>
                                                            )
                                                        }

                                                        // SINGLE_CHOICE thường (chỉ hiển thị nội dung)
                                                        return (
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: record?.surveyQuestion
                                                                        ?.name,
                                                                }}
                                                            />
                                                        )
                                                    },

                                                    onCell: (record: any) => ({
                                                        colSpan:
                                                            record.isParent ||
                                                            record?.surveyQuestion?.specificChoice
                                                                ?.length > 0 ||
                                                            record?.surveyQuestion?.type === 'ESSAY'
                                                                ? 2
                                                                : 1,
                                                    }),
                                                },

                                                {
                                                    title: 'Mức phản hồi',
                                                    width: 200,
                                                    align: 'center',

                                                    onCell: (record: any) => ({
                                                        colSpan:
                                                            record.isParent ||
                                                            record?.surveyQuestion?.specificChoice
                                                                ?.length > 0 ||
                                                            record?.surveyQuestion?.type === 'ESSAY'
                                                                ? 0
                                                                : 1,
                                                    }),

                                                    render: (_, record, index) => {
                                                        if (record.isParent) return null
                                                        if (
                                                            record?.surveyQuestion?.type ===
                                                            'SINGLE_CHOICE'
                                                        ) {
                                                            return (
                                                                <Radio.Group
                                                                    value={record.surveyChoiceId}
                                                                    className="flex gap-x-6 mt-2"
                                                                >
                                                                    {data?.survey?.surveyChoice.map(
                                                                        (i) => (
                                                                            <Radio.Button
                                                                                key={i?.id}
                                                                                value={i?.id}
                                                                            >
                                                                                {i?.answer}
                                                                            </Radio.Button>
                                                                        )
                                                                    )}
                                                                </Radio.Group>
                                                            )
                                                        }

                                                        return null
                                                    },
                                                },
                                            ]}
                                            expandable={{
                                                expandedRowKeys,
                                                showExpandColumn: false,
                                                expandedRowRender: (record, index) => (
                                                    <Form.Item
                                                        label="Lý do"
                                                        name={[
                                                            'questionsList',
                                                            index,
                                                            'explanation',
                                                        ]}
                                                        // rules={[
                                                        //     {
                                                        //     required:
                                                        //         form.getFieldValue(['responses', record.id]) === 4,
                                                        //     message: 'Vui lòng nhập lý do',
                                                        //     },
                                                        // ]}
                                                    >
                                                        <Input.TextArea
                                                            rows={3}
                                                            placeholder="Nhập lý do tại đây..."
                                                        />
                                                    </Form.Item>
                                                ),
                                            }}
                                            bordered={true}
                                        />
                                    </Form>
                                </Col>
                            </Row>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="text-xl font-bold">Bạn chưa làm khảo sát này</div>
                    </div>
                )}
            </div>
            <Col span={24}>
                <div className="flex justify-end gap-2">
                    <Button onClick={onClose}>Quay lại</Button>
                </div>
            </Col>
            <style>
                {`
    .custom-red-table .ant-table-thead > tr > th {
        background: #ffe5e5 !important;
        border: 0.5px solid red !important;
    }
        .custom-red-table .group-row > td {
        background: #ffe5e5 !important;
        font-weight: 600;
    }

    .custom-red-table .ant-table,
    .custom-red-table .ant-table-container,
    .custom-red-table .ant-table-content table,
    .custom-red-table .ant-table-cell {
        border: 0.5px solid red !important;
    }

    .custom-red-table .ant-radio-button-wrapper {
        border: 0.5px solid red !important;
        box-shadow: none !important;
    }

    
    .custom-red-table .ant-radio-button-wrapper-checked {
        background: #ff0000 !important;
        border-color: #ff0000 !important;
        color: #ffffff !important;
    }

    .custom-red-table .ant-radio-button-wrapper-checked::before {
        background-color: #ff0000 !important;
    }

    .custom-red-table textarea,
    .custom-red-table .ant-input {
        border: 0.5px solid red !important;
        box-shadow: none !important;
    }

    .custom-red-table textarea:focus,
    .custom-red-table .ant-input:focus,
    .custom-red-table .ant-input-focused {
        border: 0.5px solid red !important;
        box-shadow: none !important;
        outline: none !important;
    }
    `}
            </style>
        </AntdModal>
    )
}

export default ReviewSurveyModal
