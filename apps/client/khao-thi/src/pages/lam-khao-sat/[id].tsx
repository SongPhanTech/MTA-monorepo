import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import KhaoSatLayout from '@layouts/khao-sat-layout'
import type { SurveySession } from '@workspace/db'
import { useFindUniqueSurvey } from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

type PutSurveySession = SurveySession & {
    responses?: { surveyQuestionId: string; surveyChoiceId: string }[]
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
    const id = router.query.id as string
    const [form] = Form.useForm<PutSurveySession>()

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

    const onChange = (SurveyQuestionId: string, value: string) => {
        form.setFieldsValue({
            responses: form.getFieldValue('responses').map((i: { surveyQuestionId?: string }) => {
                if (i.surveyQuestionId === SurveyQuestionId) {
                    return {
                        ...i,
                        surveyChoiceId: value,
                    }
                }
                return i
            }),
        })
    }
    const responses = Form.useWatch('responses', form)
    const checkedQuestion = (surveyQuestionId: string, surveyChoiceId: string) => {
        return !!responses?.filter(
            (i) => i.surveyQuestionId === surveyQuestionId && i.surveyChoiceId === surveyChoiceId
        ).length
    }

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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            form.setFieldsValue({
                responses: survey?.surveyQuestion?.map((i) => {
                    return {
                        surveyQuestionId: i.id,
                    }
                }),
            })
        }
    }, [survey])

    return (
        <div className="p-6">
            <div className="text-xl font-bold">{survey?.name}</div>
            {survey?.surveyChoice?.length && (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Table
                            rowKey="key"
                            dataSource={[{ id: 'abc' }]}
                            columns={survey.surveyChoice.map((i) => {
                                return {
                                    title: i?.description,
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

                    <Col span={24}>
                        <TableCollapse
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
                        />
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
                            <Button type="primary">Lưu</Button>
                        </Flex>
                    </Col>
                </Row>
            )}
        </div>
    )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
    return <KhaoSatLayout>{page}</KhaoSatLayout>
}
