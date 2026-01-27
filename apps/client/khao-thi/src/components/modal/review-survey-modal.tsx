import { useFindFirstSurveySession } from '@workspace/db/hooks'
import { GetSurveyResult } from '@workspace/libs/api/schemas'
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
                                            rowKey="id"
                                            dataSource={data?.responses || []}
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: 'STT',
                                                    width: 50,
                                                    align: 'center',
                                                    render: (_, __, index) => index + 1,
                                                },
                                                {
                                                    title: 'Nội dung phản hồi',
                                                    dataIndex: 'content',
                                                    render: (_, record) => {
                                                        return (
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: record?.surveyQuestion
                                                                        ?.name,
                                                                }}
                                                            />
                                                        )
                                                    },
                                                },
                                                {
                                                    title: 'Mức phản hồi',
                                                    width: 200,
                                                    align: 'center',
                                                    render: (_, record, qIndex) => {
                                                        return record?.surveyQuestion?.type ===
                                                            'SINGLE_CHOICE' ? (
                                                            <Form.Item
                                                                name={[
                                                                    'questionsList',
                                                                    qIndex,
                                                                    'surveyChoiceId',
                                                                ]}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message:
                                                                            'Vui lòng chọn mức phản hồi',
                                                                    },
                                                                ]}
                                                                style={{ marginBottom: 0 }}
                                                                className="w-full"
                                                            >
                                                                <Radio.Group className="w-full gap-x-2 flex">
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
                                                            </Form.Item>
                                                        ) : (
                                                            <Form.Item
                                                                name={[
                                                                    'questionsList',
                                                                    qIndex,
                                                                    'answerText',
                                                                ]}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message: 'Nhập câu trả lời',
                                                                    },
                                                                ]}
                                                            >
                                                                <Input.TextArea placeholder="Nhập câu trả lời" />
                                                            </Form.Item>
                                                        )
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
                                {data?.additionalSuggestion && (
                                    <Col span={24}>
                                        <div className="mb-3 font-bold">Ý kiến khác :</div>
                                        <Input.TextArea
                                            value={data?.additionalSuggestion || ''}
                                            placeholder="Nhập ý kiến khác"
                                        />
                                    </Col>
                                )}
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
        </AntdModal>
    )
}

export default ReviewSurveyModal
