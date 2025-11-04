import FormItem from '@components/commons/form-item'
import Loading from '@components/commons/loading'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import KhaoSatPrivateLayout from '@layouts/khao-sat-layout/private'
import { useSession } from '@workspace/auth/react'
import type { SurveySession } from '@workspace/db'
import { useSuspenseFindFirstStudent } from '@workspace/db/hooks'
import { getPublicSurvey, useSavePublicSurvey } from '@workspace/libs/api/exam'
import type { GetSurveyResult } from '@workspace/libs/api/schemas/getSurveyResult'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'

import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Confetti from 'react-confetti'

type PutSurveySession = SurveySession & {
    responses: {
        surveyQuestionId: string
        surveyChoiceId?: string
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
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const [form] = Form.useForm<PutSurveySession>()
    const [survey, setSurvey] = useState<SurveyType>()
    const [isLoading, setIsLoading] = useState(true)
    const [isDone, setIsDone] = useState(false)
    const [selected, setSelected] = useState<
        {
            surveyQuestionId: string
            surveyChoiceId?: string
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

    const { data: student } = useSuspenseFindFirstStudent({
        where: {
            userProfileId: profileId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

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
        const responsesError = dataSubmit?.responses.filter(
            (i: any) => i?.type === 'SINGLE_CHOICE' && !i.surveyChoiceId
        )
        if (
            (!dataSubmit.additionalSuggestion && survey?.additionalSuggestion === true) ||
            responsesError?.length
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
                    profileId: profileId,
                    studentId: student?.id,
                    studentCode: student?.code || undefined,
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
            if (res?.status === 200) {
                message.success('Gửi khảo sát thành công')
                setIsDone(true)
            } else {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const fetchData = async () => {
        const response = await getPublicSurvey(id)
        if (response?.status === 200) {
            if (response?.data?.isPublic) {
                return
            }
            setSurvey(response?.data)
            setStartAt(new Date())
            const list = response?.data?.surveyQuestion?.map((i) => {
                if (i?.type === 'SINGLE_CHOICE') {
                    return {
                        surveyQuestionId: i.id,
                        surveyChoiceId: '',
                        explanation: '',
                        type: i.type,
                    }
                }
                return {
                    surveyQuestionId: i.id,
                    answerText: '',
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
                        <Form.List name="responses">
                            {(fields) => (
                                <>
                                    {dataTest.map((section, sectionIndex) => (
                                        <div key={section.id} className="mb-2">
                                            <div className="font-bold mb-1">{section.name}</div>

                                            {section.children?.map((q, qIndex) => {
                                                return (
                                                    <div key={q.id} className="px-4">
                                                        {q.type === 'SINGLE_CHOICE' ? (
                                                            <>
                                                                <div className="flex items-center w-full justify-between mb-2">
                                                                    <div className="mb-2">
                                                                        {sectionIndex + 1}.
                                                                        {qIndex + 1}. {q.name}
                                                                    </div>
                                                                    <div className="flex items-center justify-end">
                                                                        {survey?.surveyChoice.map(
                                                                            (i) => {
                                                                                return (
                                                                                    <Button
                                                                                        key={i.id}
                                                                                        onClick={() =>
                                                                                            onChange(
                                                                                                q?.id,
                                                                                                i.id,
                                                                                                i.requireExplanation
                                                                                            )
                                                                                        }
                                                                                        className={`flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px] mr-2  ${checkedQuestion(q?.id, i.id) ? '!bg-[#ea1212] text-white' : 'bg-white text-[#ea1212]'}`}
                                                                                    >
                                                                                        {i.answer}
                                                                                    </Button>
                                                                                )
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Nếu requireExplanation true thì hiển thị input */}
                                                                {requireExplanation?.length > 0 &&
                                                                    requireExplanation.includes(
                                                                        q?.id
                                                                    ) && (
                                                                        <Form.Item
                                                                            className="!mb-0 !mt-2"
                                                                            shouldUpdate
                                                                        >
                                                                            {() => {
                                                                                return (
                                                                                    <Form.Item
                                                                                        name={[
                                                                                            qIndex,
                                                                                            'explanation',
                                                                                        ]}
                                                                                        label="Lý do"
                                                                                        rules={[
                                                                                            {
                                                                                                required: true,
                                                                                                message:
                                                                                                    'Nhập lý do',
                                                                                            },
                                                                                        ]}
                                                                                    >
                                                                                        <Input.TextArea placeholder="Nhập lý do" />
                                                                                    </Form.Item>
                                                                                )
                                                                            }}
                                                                        </Form.Item>
                                                                    )}
                                                            </>
                                                        ) : (
                                                            // ESSAY
                                                            <>
                                                                <div className="mb-2">
                                                                    {sectionIndex + 1}.{qIndex + 1}.{' '}
                                                                    {q.name}
                                                                </div>
                                                                <Form.Item
                                                                    name={[qIndex, 'answerText']}
                                                                    rules={[
                                                                        {
                                                                            required: true,
                                                                            message:
                                                                                'Nhập câu trả lời',
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Input.TextArea placeholder="Nhập câu trả lời" />
                                                                </Form.Item>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </>
                            )}
                        </Form.List>
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
    return <KhaoSatPrivateLayout>{page}</KhaoSatPrivateLayout>
}
