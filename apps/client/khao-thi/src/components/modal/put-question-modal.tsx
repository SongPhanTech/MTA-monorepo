import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
// import { EditorContent } from '@tiptap/react'
import { type Question, QuestionType } from '@workspace/db'
import {
    useCreateQuestion,
    useFindManyDifficulty,
    useFindManyKnowledgeBlock,
    useFindUniqueQuestion,
    useUpdateQuestion,
} from '@workspace/db/hooks'
import { Button, Checkbox, Col, Form, Input, InputNumber, message, Radio, Row, Tooltip } from 'antd'
import { useWatch } from 'antd/es/form/Form'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutQuestionType = Question & {
    multipleChoiceOptions: {
        content: string
        isCorrect: boolean
        id?: string
    }[]
}
const PutQuestionModal = () => {
    const [form] = Form.useForm<PutQuestionType>()
    const { options: questionTypeOptions } = useQuestionTypeOptions()
    const [dataOptions, setDataOptions] = useState<any>([
        {
            key: '1',
            content: '',
            isCorrect: false,
        },
        {
            key: '2',
            content: '',
            isCorrect: false,
        },
        {
            key: '3',
            content: '',
            isCorrect: false,
        },
        {
            key: '4',
            content: '',
            isCorrect: false,
        },
    ])
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        questionBankId: string
        subjectVersionId: string
    }>({
        tag: 'PutQuestionModal',
        onClose: form.resetFields,
    })

    const typeQuestion = Form.useWatch('type', form)
    const content = Form.useWatch('content', form)
    const explanation = Form.useWatch('explanation', form)
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createQuestion } = useCreateQuestion()
    const { mutateAsync: updateQuestion } = useUpdateQuestion()
    async function onOk(output?: PutQuestionType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.questionBankId) {
                message.error('Thiếu mã ngân hàng câu hỏi')
                hideSpinner()
                return
            }
            const data = {
                content: output.content,
                type: output.type,
                point: output.point,
                explanation: output.explanation,
                isAutoGraded: output.isAutoGraded,
                questionBankId: input?.questionBankId,
                knowledgeBlockId: output.knowledgeBlockId,
            }
            let res: any = null

            if (
                output.type === QuestionType.MULTIPLE_CHOICE ||
                output.type === QuestionType.SINGLE_CHOICE
            ) {
                const error = output.multipleChoiceOptions.find((i) => !i.content)
                if (error || !output.multipleChoiceOptions.length) {
                    message.error('Vui lòng nhập đáp án')
                    return
                }
                const error1 = output.multipleChoiceOptions.filter((i) => !!i.isCorrect)
                if (
                    error1.length === 0 ||
                    (error1.length < 2 && output.type === QuestionType.MULTIPLE_CHOICE) ||
                    (error1.length > 1 && output.type === QuestionType.SINGLE_CHOICE)
                ) {
                    message.error('Vui lòng nhập đúng đáp án')
                    return
                }
                if (input?.id) {
                    await updateQuestion({
                        data,
                        where: {
                            id: input.id,
                        },
                    })
                } else {
                    res = await createQuestion({
                        data: {
                            ...data,
                            multipleChoiceOptions: {
                                createMany: {
                                    data: output.multipleChoiceOptions.map((i, index: number) => {
                                        return {
                                            content: i.content,
                                            isCorrect: i.isCorrect,
                                            order: index + 1,
                                        }
                                    }),
                                },
                            },
                        },
                    })
                }
            } else {
                if (input?.id) {
                    await updateQuestion({
                        data,
                        where: {
                            id: input.id,
                        },
                    })
                    message.success('Cập nhật thành công')
                } else {
                    res = await createQuestion({
                        data,
                    })
                }
            }
            queryClient.invalidateQueries({
                queryKey: ['Question'],
            })
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

    const { data: initialValue } = useFindUniqueQuestion(
        {
            where: { id: input?.id },
            include: { questionBank: true, multipleChoiceOptions: true },
        },
        {
            enabled: !!input?.id,
        }
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { subjectVersionId: input?.subjectVersionId },
    })

    const { data: difficultyData } = useFindManyDifficulty({
        orderBy: { level: 'asc' },
    })

    const handleDeleteAnswer = (index: number) => {
        const data = form.getFieldsValue()?.multipleChoiceOptions || []
        if (data.length) {
            const result = data.splice(index, 1)
            setDataOptions(data)
            form.setFieldValue('multipleChoiceOptions', data)
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            setDataOptions(
                initialValue.multipleChoiceOptions.map((i) => {
                    return {
                        key: String(i.order),
                        content: i.content,
                        isCorrect: i.isCorrect,
                        id: i.id,
                    }
                })
            )
            form.setFieldsValue({
                ...initialValue,
                multipleChoiceOptions: initialValue.multipleChoiceOptions.map((i) => {
                    return {
                        content: i.content,
                        isCorrect: i.isCorrect,
                        key: String(i.order),
                    }
                }),
            })
        } else {
            form.setFieldsValue({
                isAutoGraded: false,
                multipleChoiceOptions: dataOptions,
                // type: QuestionType.ESSAY, // TODO: clear after add many QuestionType
                point: 1,
            })
        }
    }, [initialValue])

    const fixedHtmlContent = useMemo(() => {
        return content?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    }, [content])

    const fixedHtmlExplanation = useMemo(() => {
        return explanation?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    }, [explanation])

    const listForm = useWatch('multipleChoiceOptions', form) || []

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}
            className="w-[80vw]"
        >
            <Col span={24}>
                <div className="flex">
                    <Col span={12}>
                        <Row gutter={[16, 0]}>
                            <Col span={12}>
                                <FormItem form={form} name="type" label="Loại câu hỏi" required>
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn loại câu hỏi"
                                        options={questionTypeOptions}
                                        // defaultValue={QuestionType.ESSAY} // TODO: clear after add many QuestionType
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem form={form} name="knowledgeBlockId" label="Chương mục">
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn chương mục"
                                        options={knowledgeBlockData?.map(({ id, name }) => ({
                                            value: id,
                                            label: name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem form={form} name="point" label="Điểm" required>
                                    <InputNumber
                                        min={0}
                                        type="number"
                                        placeholder="Nhập điểm"
                                        defaultValue={1}
                                        step={0.1}
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            {typeQuestion !== QuestionType.ESSAY && (
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name={'isAutoGraded'}
                                        label="Tự động chấm điểm"
                                    >
                                        <Radio.Group buttonStyle="solid">
                                            <Radio value={true}>Có</Radio>
                                            <Radio value={false}>Không</Radio>
                                        </Radio.Group>
                                    </FormItem>
                                </Col>
                            )}
                            <Col span={24}>
                                <div className="border-t border-[#D1D5DB] x-auto my-2" />
                            </Col>
                            <Col span={24}>
                                <FormItem
                                    form={form}
                                    label="Câu hỏi"
                                    name={'content'}
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập câu hỏi',
                                        },
                                    ]}
                                >
                                    <RichTextEditor />
                                </FormItem>
                            </Col>
                            {/* Tự luận */}
                            <Col span={24}>
                                {(typeQuestion === QuestionType.ESSAY ||
                                    typeQuestion === QuestionType.ORAL) && (
                                    <FormItem
                                        form={form}
                                        label="Giải thích đáp án"
                                        name={'explanation'}
                                    >
                                        <RichTextEditor />
                                    </FormItem>
                                )}
                                {(typeQuestion === QuestionType.SINGLE_CHOICE ||
                                    typeQuestion === QuestionType.MULTIPLE_CHOICE) && (
                                    <>
                                        <FormItem
                                            form={form}
                                            label="Đáp án"
                                            name={'multipleChoiceOptions'}
                                        >
                                            <Table
                                                rowKey="key"
                                                pagination={false}
                                                data={dataOptions}
                                                columns={[
                                                    {
                                                        title: 'Đáp án',
                                                        width: 100,
                                                        align: 'left',
                                                        render: (_, __, index) => {
                                                            return `Đáp án ${index + 1}`
                                                        },
                                                    },
                                                    {
                                                        title: 'Đáp án',
                                                        dataIndex: 'content',
                                                        align: 'center',
                                                        render: (__, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'multipleChoiceOptions',
                                                                        index,
                                                                        'content',
                                                                    ]}
                                                                    label=""
                                                                    required
                                                                >
                                                                    <Input placeholder="Nhập đáp án" />
                                                                    {/* <EditorContent editor={editor} {...editorProps} /> */}
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },
                                                    {
                                                        title: 'Đúng/sai',
                                                        dataIndex: 'questionType',
                                                        width: 100,
                                                        align: 'center',
                                                        render: (__, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'multipleChoiceOptions',
                                                                        index,
                                                                        'isCorrect',
                                                                    ]}
                                                                    label=""
                                                                    valuePropName="checked"
                                                                >
                                                                    <Checkbox />
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },
                                                    {
                                                        title: '',
                                                        dataIndex: 'questionType',
                                                        width: 50,
                                                        align: 'center',
                                                        render: (__, record, index: number) => {
                                                            return (
                                                                <Tooltip title={'Xoá'}>
                                                                    <Trash2
                                                                        size={16}
                                                                        strokeWidth={1.5}
                                                                        className="text-red-600 cursor-pointer"
                                                                        onClick={() => {
                                                                            handleDeleteAnswer(
                                                                                index
                                                                            )
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )
                                                        },
                                                    },
                                                ]}
                                            />
                                        </FormItem>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => {
                                                    const data =
                                                        form.getFieldsValue()
                                                            ?.multipleChoiceOptions || []
                                                    form.setFieldValue('multipleChoiceOptions', [
                                                        ...data,
                                                        {
                                                            content: '',
                                                            isCorrect: false,
                                                            key: `${data.length + 1}`,
                                                        },
                                                    ])
                                                    setDataOptions([
                                                        ...data,
                                                        {
                                                            content: '',
                                                            isCorrect: false,
                                                            key: `${data.length + 1}`,
                                                        },
                                                    ])
                                                }}
                                            >
                                                Thêm Đáp án
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Col>

                    <div className="border-r border-[#D1D5DB] h-auto mx-2" />

                    <Col span={12}>
                        <Row gutter={[16, 0]}>
                            <Col span={24}>
                                <div className="flex gap-4 flex-col">
                                    <div className="flex gap-2 flex-col">
                                        <p className="font-medium text-sm text-[#111827]">
                                            Câu hỏi
                                        </p>
                                        <div className="bg-[#FAFAFA] rounded-xl p-4">
                                            <div
                                                className="prose max-w-none text-sm text-gray-800"
                                                dangerouslySetInnerHTML={{
                                                    __html: fixedHtmlContent
                                                        ? renderWithMath(fixedHtmlContent)
                                                        : '<i>Chưa có nội dung</i>',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Tự luận */}
                                    {(typeQuestion === QuestionType.ESSAY ||
                                        typeQuestion === QuestionType.ORAL) && (
                                        <div className="flex gap-2 flex-col">
                                            <p className="font-medium text-sm text-[#111827]">
                                                Giải thích đáp án
                                            </p>
                                            <div className="bg-white p-2 rounded-lg border border-[#D1D5DB] min-h-[164px]">
                                                <div
                                                    className="prose max-w-none text-sm text-gray-800"
                                                    dangerouslySetInnerHTML={{
                                                        __html: fixedHtmlExplanation
                                                            ? renderWithMath(fixedHtmlExplanation)
                                                            : '<i>Chưa có giải thích</i>',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {(typeQuestion === QuestionType.SINGLE_CHOICE ||
                                        typeQuestion === QuestionType.MULTIPLE_CHOICE) && (
                                        <div>
                                            <div className="mb-3 font-[500]">Đáp án</div>
                                            {listForm.length &&
                                                listForm.map((i: any) => {
                                                    return (
                                                        <div
                                                            className={`flex items-center gap-3 border-solid border-[1px] p-3 mb-3 rounded-[8px] ${i?.isCorrect ? 'border-green-500 bg-green-100' : ''}`}
                                                        >
                                                            <Checkbox checked={i?.isCorrect} />
                                                            <div>{i.content}</div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </div>
            </Col>
        </PutFormModal>
    )
}

export default PutQuestionModal
