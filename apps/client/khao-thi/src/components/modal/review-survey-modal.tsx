import { useFindFirstSurveySession } from '@workspace/db/hooks'
import { Modal as AntdModal, Button, Col, Input, Row, Skeleton, Table } from 'antd'
import { useMemo } from 'react'
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
const ReviewSurveyModal = () => {
    const { isOpen, onClose, input } = useDisclosure<{
        userId: string
        surveyId: string
        userName?: string
    }>({
        tag: 'ReviewSurveyModal',
    })

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

    const dataTest = useMemo(() => {
        const list =
            data?.responses.map((i) => {
                return {
                    ...i?.surveyQuestion,
                }
            }) ?? []
        const groupedMap = list.reduce<Record<string, GroupedSurveyQuestion>>(
            (acc: any, item: any, index: number) => {
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
            },
            {}
        )

        // Chuyển thành array
        const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
            return { ...i, name: `${index + 1}. ${i.name}` }
        })
        return grouped || []
        // return classGroups
    }, [data])

    const checkedQuestion = (qId: string, aId: string) => {
        const result = data?.responses.find(
            (i) => i.surveyQuestionId === qId && i.surveyChoiceId === aId
        )
        if (result) {
            return true
        }
        return false
    }

    return (
        <AntdModal
            open={isOpen}
            onCancel={onClose}
            maskClosable={true}
            title={'Xem lại khảo sát'}
            className="w-[1100px]"
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
                                <Col span={24} className="text-base text-[#e80808]">
                                    Nếu ở mức (*), bạn phải ghi rõ lý do
                                </Col>

                                <Col span={24}>
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
                                                                        {data?.survey?.surveyChoice.map(
                                                                            (i) => {
                                                                                return (
                                                                                    <Button
                                                                                        key={i.id}
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
                                                                {q?.requireExplanation && (
                                                                    <Input.TextArea placeholder="Nhập lý do" />
                                                                )}
                                                            </>
                                                        ) : (
                                                            // ESSAY
                                                            <>
                                                                <div className="mb-2">
                                                                    {sectionIndex + 1}.{qIndex + 1}.{' '}
                                                                    {q.name}
                                                                </div>
                                                                <Input.TextArea placeholder="Nhập lý do" />
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
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
        </AntdModal>
    )
}

export default ReviewSurveyModal
