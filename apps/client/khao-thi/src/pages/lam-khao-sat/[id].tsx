import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import KhaoSatLayout from '@layouts/khao-sat-layout'
import type { SurveySession } from '@workspace/db'
import { useCreateSurveySession, useFindUniqueSurvey } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
    }[]
}
function TakeTestPage() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const id = router.query.id as string
    const [form] = Form.useForm<PutSurveySession>()
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

    const { mutateAsync: createSurveySession } = useCreateSurveySession()

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id },
            include: {
                surveyQuestion: {
                    include: {
                        surveyQuestionGroup: true,
                    },
                },
                surveyChoice: true,
            },
        },
        {
            enabled: !!id,
        }
    )

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
        const responses = dataSubmit?.responses.filter(
            (i: { surveyQuestionId?: string; surveyChoiceId?: string }) =>
                !i.surveyQuestionId || !i.surveyChoiceId
        )
        if (!dataSubmit.additionalSuggestion || responses?.length) {
            message.error('Bạn chưa hoàn thành mẫu khảo sát')
            return
        }

        try {
            showSpinner()
            await sqlTransaction([
                {
                    model: 'SurveySession',
                    operation: 'create',
                    data: {
                        data: {
                            additionalSuggestion: dataSubmit.additionalSuggestion,
                            isCompleted: true,
                            completedAt: new Date(),
                            responses: {
                                createMany: {
                                    data: dataSubmit?.responses?.map(
                                        (i: {
                                            surveyQuestionId?: string
                                            surveyChoiceId?: string
                                        }) => ({
                                            surveyQuestionId: i.surveyQuestionId,
                                            surveyChoiceId: i.surveyChoiceId,
                                        })
                                    ),
                                },
                            },
                            surveyId: id,
                        },
                    },
                },
            ])
            // await createSurveySession({
            //     data: {
            //         additionalSuggestion: dataSubmit.additionalSuggestion,
            //         isCompleted: true,
            //         completedAt: new Date(),
            //         responses: {
            //             createMany: {
            //                 data: dataSubmit?.responses?.map((i: { surveyQuestionId?: string; surveyChoiceId?: string }) => ({
            //                     surveyQuestionId: i.surveyQuestionId,
            //                     surveyChoiceId: i.surveyChoiceId,
            //                 })),
            //             },
            //         },
            //         surveyId: id,
            //     },
            // })

            message.success('Gửi khảo sát thành công')
            router.push(ROUTER_PATH.KHAO_THI.HOME)
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            const list = survey?.surveyQuestion?.map((i) => {
                return {
                    surveyQuestionId: i.id,
                    surveyChoiceId: '',
                    explanation: '',
                }
            })
            form.setFieldsValue({
                responses: list,
                additionalSuggestion: '',
            })
            setSelected(list)
            setRequireExplanation([])
        }
    }, [survey])

    return (
        <Form form={form} className="p-6 max-w-[1100px] w-full mx-auto">
            <div className="text-xl font-bold">{survey?.name}</div>
            {survey?.surveyChoice?.length && (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Table
                            rowKey="key"
                            dataSource={[{ id: 'abc' }]}
                            columns={survey.surveyChoice.map((i) => {
                                return {
                                    title: `${i?.description} ${i?.requireExplanation === true ? '*' : ''}`,
                                    dataIndex: i?.id,
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
                                                return (
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
                                                                    <div className="mb-3">
                                                                        Lý do :
                                                                    </div>
                                                                    <Input.TextArea placeholder="Nhập ý kiến khác" />
                                                                </Col>
                                                            )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                            {/* <TableCollapse
                                rowKey="id"
                                currentPage={1}
                                headerTitleKey={({ name }) => (
                                    <div className="flex items-center">
                                        <div className="font-bold">{name}</div>
                                    </div>
                                )}
                                childrenFieldName="children"
                                defaultExpandAll
                                columns={[
                                    {
                                        title: 'Nội dung phản hồi',
                                        align: 'left',
                                        dataIndex: 'name',
                                        fixed: 'left',
                                    },
                                    {
                                        title: 'Mức phản hồi',
                                        align: 'center',
                                        width: 200,
                                        render: (_, record) => {
                                            return (
                                                <div className="flex items-center justify-center">
                                                    {survey?.surveyChoice.map((i) => {
                                                        return (
                                                            <Button
                                                                key={i.id}
                                                                onClick={() =>
                                                                    onChange(record?.id, i.id)
                                                                }
                                                                className={`flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px] mr-[6px]  ${checkedQuestion(record?.id, i.id) ? '!bg-[#ea1212] text-white' : 'bg-white text-[#ea1212]'}`}
                                                            >
                                                                {i.answer}
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        },
                                    },
                                ]}
                                data={dataTest}
                                pagination={{
                                    hideOnSinglePage: true,
                                }}
                            /> */}
                        </FormItem>
                    </Col>
                    {survey.additionalSuggestion && (
                        <Col span={24}>
                            <FormItem
                                className="block"
                                form={form}
                                name="additionalSuggestion"
                                label="Ý kiến khác"
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
