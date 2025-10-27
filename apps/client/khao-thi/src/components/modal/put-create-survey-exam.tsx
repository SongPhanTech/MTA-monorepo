import { DeleteOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyChoice, SurveyQuestion, SurveyResponse } from '@workspace/db'
import {
    useCreateManySurveyChoice,
    useFindManySurveyQuestionGroup,
    useFindUniqueSurvey,
    useUpdateSurvey,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import {
    Button,
    Checkbox,
    type CheckboxChangeEvent,
    Empty,
    Form,
    Input,
    message,
    Tooltip,
    Tree,
    type TreeProps,
} from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyType = Survey & {
    surveyQuestion: string[]
    surveyChoice: SurveyChoice[]
}

interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}

interface Choices {
    id?: string
    answer: string
    description: string
    surveyResponses?: SurveyResponse[]
    requireExplanation: boolean
}
const PutSurveyExamModal = () => {
    const [form] = Form.useForm<PutSurveyType>()
    const [initValue, setInitValue] = useState<string[]>([])
    const [choicesDelete, setChoicesDelete] = useState<Choices[]>([])
    const [choices, setChoices] = useState<Choices[]>([
        {
            answer: '1',
            description: 'Rất không hài lòng',
            requireExplanation: false,
        },
        {
            answer: '2',
            description: 'Khong hài lòng',
            requireExplanation: false,
        },
        {
            answer: '3',
            description: 'Phân vân',
            requireExplanation: false,
        },
        {
            answer: '4',
            description: 'Hài lòng',
            requireExplanation: false,
        },
        {
            answer: '5',
            description: 'Rất hài lòng',
            requireExplanation: false,
        },
    ])

    const { isOpen, onClose, input } = useDisclosure<{ id: string; surveyTopicId: string }>({
        tag: 'PutSurveyExamModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: update } = useUpdateSurvey()

    const { data: surveyQuestionGroup = [] } = useFindManySurveyQuestionGroup(
        {
            where: { surveyTopicId: input?.surveyTopicId },
            include: {
                surveyTopic: true,
                surveyQuestion: true,
            },
            orderBy: { name: 'asc' },
        },
        {
            enabled: !!input?.surveyTopicId,
        }
    )

    const treeData = surveyQuestionGroup.map((item) => ({
        title: item.name,
        key: item.id,
        children: item.surveyQuestion.map((i: SurveyQuestion) => ({
            title: i.name,
            key: i.id,
        })),
        disabled: item.surveyQuestion.length === 0,
    }))

    const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
        // info.checkedNodes: (DataNode & { children?: DataNode[] })[]
        const onlyLeafValues = (info.checkedNodes as MyTreeNode[])
            .filter((node) => !node.children?.length) // chỉ lấy node không có children
            .map((node) => node.value ?? node.key) // lấy value nếu có, không thì lấy key

        form.setFieldValue('surveyQuestion', onlyLeafValues)
        setInitValue(onlyLeafValues)
    }

    const onChange = (value: string | number | boolean, index: number, name: string) => {
        const result = choices.map((choice, i) => {
            if (i === index) {
                return { ...choice, [name]: value }
            }
            return choice
        })
        setChoices(result)
    }

    const removeChoice = (index: number) => {
        setChoicesDelete([...choicesDelete, choices[index]])
        const result = choices.filter((_, i) => i !== index)
        setChoices(result)
    }
    const addChoice = () => {
        setChoices([...choices, { answer: '', description: '', requireExplanation: false }])
    }

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id: input?.id },
            include: {
                surveyQuestion: true,
                surveyChoice: true,
            },
        },
        {
            enabled: !!input?.id,
        }
    )

    const { mutateAsync: createManySurveyChoice } = useCreateManySurveyChoice()

    async function onOk(output?: PutSurveyType) {
        if (!output) return
        if (choices?.length <= 0) {
            message.error('Bạn phải thêm lựa chọn của đáp án')
            return
        }
        if (output?.surveyQuestion?.length <= 0) {
            message.error('Bạn phải thêm câu hỏi cho đợt khảo sát')
            return
        }

        try {
            showSpinner()
            if (input?.id) {
                const listUpdate = choices?.filter((i) => i.id)
                const listCreate = choices?.filter((i) => !i.id)
                if (listUpdate?.length) {
                    await sqlTransaction(
                        listUpdate.map((i) => {
                            return {
                                model: 'SurveyChoice',
                                operation: 'update',
                                data: {
                                    where: {
                                        id: i?.id,
                                    },
                                    data: {
                                        answer: i?.answer,
                                        description: i?.description,
                                        surveyId: input?.id,
                                    },
                                },
                            }
                        })
                    )
                }
                if (listCreate?.length) {
                    await createManySurveyChoice({
                        data: listCreate.map((i) => ({
                            answer: i?.answer,
                            description: i?.description,
                            surveyId: input?.id,
                            requireExplanation: i?.requireExplanation,
                        })),
                    })
                }

                if (choicesDelete?.length) {
                    const dataDelete = choicesDelete.filter((i) => i.id)
                    if (dataDelete.length) {
                        await sqlTransaction(
                            choicesDelete.map((i) => {
                                return {
                                    model: 'SurveyChoice',
                                    operation: 'delete',
                                    data: {
                                        where: {
                                            id: i?.id,
                                        },
                                    },
                                }
                            })
                        )
                    }
                }
                await update({
                    data: {
                        surveyQuestion: {
                            set: output.surveyQuestion.map((i) => ({ id: i })),
                        },
                    },
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            }

            onClose()
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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            setInitValue(survey?.surveyQuestion.map((i: SurveyQuestion) => i.id))
            if (survey?.surveyChoice?.length) {
                // @ts-expect-error
                setChoices(survey?.surveyChoice)
            }
            form.setFieldsValue({
                ...survey,
                surveyQuestion: survey?.surveyQuestion.map((i: SurveyQuestion) => i.id),
                surveyChoice: survey?.surveyChoice,
            })
        }
    }, [survey])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa đề khảo sát' : 'Thêm mới đề khảo sát'}
            className="w-[1000px]"
        >
            <div className="w-full px-8 mt-3">
                <div className="mb-4 text-[14px] font-[500]">Lựa chọn của câu hỏi khảo sát</div>
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-[150px]">Câu trả lời</div>
                        <div className="w-[calc(100%-250px)]">Mô tả</div>
                        <Tooltip
                            className="w-[48px] text-base text-red-600 cursor-pointer"
                            title="Chọn nếu muốn góp ý thêm"
                            placement="top"
                        >
                            <div>*</div>
                        </Tooltip>
                    </div>
                    {choices.map((item, index: number) => (
                        <div key={item.answer} className="flex items-center justify-between mb-2">
                            <Input
                                className="w-[150px] mr-3"
                                value={item.answer}
                                onChange={(e) => {
                                    onChange(e.target.value, index, 'answer')
                                }}
                                placeholder="Nhập câu trả lời"
                            />
                            <Input
                                className="w-[calc(100%-250px)]"
                                value={item.description}
                                onChange={(e) => {
                                    onChange(e.target.value, index, 'description')
                                }}
                                placeholder="Nhập mô tả"
                            />
                            <Checkbox
                                onChange={(e: CheckboxChangeEvent) => {
                                    onChange(e.target.checked, index, 'requireExplanation')
                                }}
                                checked={item?.requireExplanation}
                            />

                            <Tooltip title="Xóa" placement="top">
                                <DeleteOutlined
                                    disabled={Number(item?.surveyResponses?.length) > 0}
                                    className="text-sm text-red-600 cursor-pointer"
                                    onClick={() => removeChoice(index)}
                                />
                            </Tooltip>
                        </div>
                    ))}
                    <div className="flex items-center justify-end">
                        <Button color="primary" variant="outlined" onClick={() => addChoice()}>
                            Thêm câu trả lời
                        </Button>
                    </div>
                </div>

                <div className="mb-4 text-[14px] font-[500]">Danh sách câu hỏi khảo sát</div>
                {surveyQuestionGroup ? (
                    <FormItem
                        form={form}
                        name="surveyQuestion"
                        className="max-h-[800px] overflow-y-auto"
                    >
                        <Tree
                            defaultExpandAll
                            checkedKeys={initValue}
                            treeData={treeData}
                            checkable
                            multiple
                            onCheck={onCheck}
                        />
                    </FormItem>
                ) : (
                    <Empty />
                )}
            </div>
        </PutFormModal>
    )
}

export default PutSurveyExamModal
