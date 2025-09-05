import FormItem from '@components/commons/form-item'
import Loading from '@components/commons/loading'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import KhaoSatLayout from '@layouts/khao-sat-layout'
import type { SurveySession } from '@workspace/db'
import { getPublicSurvey, useSavePublicSurvey } from '@workspace/libs/api/exam'
import type { GetSurveyResult } from '@workspace/libs/api/schemas/getSurveyResult'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'

import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Confetti from 'react-confetti'

type PutSurveySession = SurveySession & {
    responses: {
        surveyQuestionId: string
        surveyChoiceId: string
        answerText?: string
        explanation?: string
        requireExplanation?: boolean
    }[]
    additionalSuggestion: string
}

type GroupedSurveyQuestion = {
    id: string // group id
    name: string // group name
    children: {
        id: string
        name: string
        type: string
    }[]
}
type SurveyType = GetSurveyResult
function TakeTestPage() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const [startAt, setStartAt] = useState<Date>(new Date())
    const id = router.query.id as string
    const [form] = Form.useForm<PutSurveySession>()
    const [survey, setSurvey] = useState<SurveyType>()
    const [isLoading, setIsLoading] = useState(true)
    const [isDone, setIsDone] = useState(false)
    const [selected, setSelected] = useState<
        {
            surveyQuestionId: string
            surveyChoiceId: string
            answerText?: string
            explanation?: string
            requireExplanation?: boolean
        }[]
    >([])
    const [requireExplanation, setRequireExplanation] = useState<string[]>([])

    // const { data } =  useGetPublicSurvey(id)
    const { mutateAsync: createSavePublicSurvey } = useSavePublicSurvey()
    const onChange = (SurveyQuestionId: string, value: string, requireExplanation: boolean) => {
        const result = form.getFieldValue('responses').map((i: { surveyQuestionId?: string }) => {
            if (i.surveyQuestionId === SurveyQuestionId) {
                if (!requireExplanation) {
                    return {
                        ...i,
                        surveyChoiceId: value,
                        explanation: '',
                        requireExplanation: false,
                    }
                }
                return {
                    ...i,
                    surveyChoiceId: value,
                    requireExplanation: true,
                }
            }
            return { ...i }
        })

        form.setFieldsValue({
            responses: result,
        })
        setSelected(result)
        const listRequireExplanation = result
            .filter((i: { requireExplanation?: boolean }) => i.requireExplanation === true)
            .map((j: any) => j.surveyQuestionId)
        setRequireExplanation(listRequireExplanation)
    }

    const checkedQuestion = useCallback(
        (surveyQuestionId: string, surveyChoiceId: string) => {
            if (!selected) return false
            return !!selected?.filter(
                (i: { surveyQuestionId?: string; surveyChoiceId?: string }) =>
                    i.surveyQuestionId === surveyQuestionId && i.surveyChoiceId === surveyChoiceId
            ).length
        },
        [selected]
    )

    const dataTest = useMemo(() => {
        const groupedMap = (survey?.surveyQuestion ?? []).reduce<
            Record<string, GroupedSurveyQuestion>
        >((acc: any, item: any, index: number) => {
            const groupId = item.surveyQuestionGroupId

            if (!acc[groupId]) {
                acc[groupId] = {
                    id: item.surveyQuestionGroup.id,
                    name: item.surveyQuestionGroup.name,
                    children: [],
                }
            }

            acc[groupId].children.push({
                id: item.id,
                name: item.name,
                type: item.type,
            })

            return acc
        }, {})

        // Chuyển thành array
        const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
            return { ...i, name: `${index + 1}. ${i.name}` }
        })
        return grouped || []
        // return classGroups
    }, [survey?.surveyQuestion])

    async function onOk() {
        const dataSubmit = form.getFieldsValue()
        console.log(dataSubmit)

        const responses = dataSubmit?.responses.filter(
            (i: { surveyQuestionId?: string; surveyChoiceId?: string }) =>
                !i.surveyQuestionId || !i.surveyChoiceId
        )
        if (
            (!dataSubmit.additionalSuggestion && survey?.additionalSuggestion === true) ||
            responses?.length
        ) {
            message.error('Bạn chưa hoàn thành mẫu khảo sát')
            return
        }
        const reason = dataSubmit.responses.filter(
            (i: { requireExplanation?: boolean; explanation?: string; type?: string }) =>
                i.requireExplanation === true && !i.explanation && i.type === 'SINGLE_CHOICE'
        )
        if (reason.length) {
            message.error('Bạn chưa nhập lý do cho những khảo sát đặc biệt')
            return
        }
        const reason2 = dataSubmit.responses.filter(
            (i: { answerText?: string; type?: string }) => !i.answerText && i.type === 'ESSAY'
        )
        if (reason2.length) {
            message.error('Bạn chưa hoàn thành câu hỏi tự luận')
            return
        }
        try {
            showSpinner()
            const res = await createSavePublicSurvey({
                data: {
                    additionalSuggestion: dataSubmit.additionalSuggestion || '',
                    startedAt: new Date(startAt).toISOString(),
                    surveyId: id,
                    responses: dataSubmit?.responses?.map((i) => {
                        return {
                            surveyQuestionId: i.surveyQuestionId,
                            surveyChoiceId: i.surveyChoiceId,
                            explanation: i.explanation,
                            answerText: i.answerText,
                        }
                    }),
                },
            })
            // await sqlTransaction([
            //     {
            //         model: 'SurveySession',
            //         operation: 'create',
            //         data: {
            //             data: {
            //                 additionalSuggestion: dataSubmit.additionalSuggestion,
            //                 isCompleted: true,
            //                 completedAt: new Date(),
            //                 responses: {
            //                     createMany: {
            //                         data: dataSubmit?.responses?.map(
            //                             (i: {
            //                                 surveyQuestionId?: string
            //                                 surveyChoiceId?: string
            //                                 explanation?: string
            //                                 answerText?: string
            //                             }) => ({
            //                                 surveyQuestionId: i.surveyQuestionId,
            //                                 surveyChoiceId: i.surveyChoiceId,
            //                                 explanation: i.explanation,
            //                                 answerText: i.answerText,
            //                             })
            //                         ),
            //                     },
            //                 },
            //                 surveyId: id,
            //             },
            //         },
            //     },
            // ])
            if (res?.status === 200) {
                message.success('Gửi khảo sát thành công')
                setIsDone(true)
            } else {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            }
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const fetchData = async () => {
        const response = await getPublicSurvey(id)
        if (response?.status === 200) {
            setSurvey(response?.data)
            setStartAt(new Date())
            const list = response?.data?.surveyQuestion?.map((i) => {
                return {
                    surveyQuestionId: i.id,
                    surveyChoiceId: '',
                    explanation: '',
                    type: i.type,
                }
            })
            form.setFieldsValue({
                responses: list,
                additionalSuggestion: '',
            })
            setSelected(list)
            setRequireExplanation([])
        } else {
            message.error(response?.data?.message)
        }
        setIsLoading(false)
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    return isLoading ? (
        <Loading />
    ) : isDone ? (
        <div className="text-center flex flex-col items-center justify-center min-h-[calc(100vh-64px-24px)]">
            <div className="text-2xl mb-6 text-[#0d7101]">
                Xin chúc mừng bạn đã hoàn thành khảo sát
            </div>
            <Button
                type="primary"
                onClick={() => {
                    router.push('/home')
                }}
                size="large"
                className="mb-20"
            >
                Quay về trang chủ
            </Button>
            <Confetti width={window?.innerWidth || 1000} height={window?.innerHeight || 1000} />
        </div>
    ) : (
        <Form form={form} className="p-6 max-w-[1100px] w-full mx-auto">
            <div className="text-xl font-bold">{survey?.name}</div>
            {survey?.surveyChoice?.length && (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Table
                            rowKey="id"
                            dataSource={[{ id: 'abc' }]}
                            columns={survey.surveyChoice.map((i) => {
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
                    <Col span={24} className="text-base text-[#e80808]">
                        Nếu ở mức (*), bạn phải ghi rõ lý do
                    </Col>

                    <Col span={24}>
                        <FormItem className="block" form={form} name="responses" label="">
                            {dataTest.map((item, index: number) => {
                                return (
                                    <div key={item.id}>
                                        <div className="font-bold mb-3">{item.name}</div>
                                        <div className="px-4">
                                            {item?.children?.map((j, idx: number) => {
                                                return j?.type === 'SINGLE_CHOICE' ? (
                                                    <div key={j.id} className="mb-6">
                                                        <div className="flex justify-between">
                                                            <div className="mb-3">
                                                                {index + 1}.{idx + 1}. {j.name}
                                                            </div>
                                                            <div className="flex items-center justify-end">
                                                                {survey?.surveyChoice.map((i) => {
                                                                    return (
                                                                        <Button
                                                                            key={i.id}
                                                                            onClick={() =>
                                                                                onChange(
                                                                                    j?.id,
                                                                                    i.id,
                                                                                    i.requireExplanation
                                                                                )
                                                                            }
                                                                            className={`flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px] mr-2  ${checkedQuestion(j?.id, i.id) ? '!bg-[#ea1212] text-white' : 'bg-white text-[#ea1212]'}`}
                                                                        >
                                                                            {i.answer}
                                                                        </Button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        {requireExplanation?.length > 0 &&
                                                            requireExplanation.includes(j?.id) && (
                                                                <Col span={24}>
                                                                    <div className="mb-2">
                                                                        Lý do :
                                                                    </div>
                                                                    <Form.Item
                                                                        name={[
                                                                            'responses',
                                                                            idx,
                                                                            'answerText',
                                                                        ]}
                                                                        label=""
                                                                    >
                                                                        <Input.TextArea placeholder="Nhập lý do" />
                                                                    </Form.Item>
                                                                </Col>
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div key={j.id} className="mb-6">
                                                        <Col span={24}>
                                                            <div className="mb-2">
                                                                {index + 1}.{idx + 1}. {j.name}
                                                            </div>
                                                            <Form.Item
                                                                name={[
                                                                    'responses',
                                                                    idx,
                                                                    'explanation',
                                                                ]}
                                                                label=""
                                                            >
                                                                <Input.TextArea placeholder="Nhập câu trả lời" />
                                                            </Form.Item>
                                                        </Col>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </FormItem>
                    </Col>
                    {survey.additionalSuggestion && (
                        <Col span={24}>
                            <div className="mb-3 font-bold">Ý kiến khác :</div>
                            <FormItem
                                className="block"
                                form={form}
                                name="additionalSuggestion"
                                label=""
                            >
                                <Input.TextArea placeholder="Nhập ý kiến khác" />
                            </FormItem>
                        </Col>
                    )}

                    <Col span={24} className="mt-6">
                        <Flex justify="end">
                            <Button onClick={() => onOk()} type="primary">
                                Lưu
                            </Button>
                        </Flex>
                    </Col>
                </Row>
            )}
        </Form>
    )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
    return <KhaoSatLayout>{page}</KhaoSatLayout>
}
