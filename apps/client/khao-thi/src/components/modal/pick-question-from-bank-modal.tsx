import { useEffect, useMemo, useState } from 'react'
import { Col, Form, Row, Table, Button, message, Switch } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import {
    useCountQuestion,
    useCreateQuestion,
    useFindManyExamFramework,
    useFindManyExamMatrix,
    useFindManyKnowledgeBlock,
    useFindManyQuestion,
    useFindManyQuestionBank,
    useUpdateQuestion,
} from '@workspace/db/hooks'
import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import HtmlTruncate from '@components/commons/html-truncate'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import { QuestionType } from '@workspace/db/client'
import { LEVEL_COLUMNS, QUESTION_TYPE_LABELS } from '@constants/constants'

const PickQuestionFromBankModal = () => {
    const [form] = Form.useForm()
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedQuestions, setSelectedQuestions] = useState<any[]>([])
    const [questionBankId, setQuestionBankId] = useState<string | undefined>(undefined)
    const [keepOld, setKeepOld] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isAllSelected, setIsAllSelected] = useState(false)

    const { isOpen, onClose, input } = useDisclosure<{
        examFrameworkId?: string
        matrixId?: string
    }>({
        tag: 'PickQuestionFromBankModal',
        onClose: () => {
            form.resetFields()
            setSelectedRowKeys([])
            setSelectedQuestions([])
            setQuestionBankId(undefined)
            setKeepOld(false)
            setCurrentPage(1)
        },
    })

    const examFrameworkId = Form.useWatch('examFrameworkId', form)
    const examMatrixId = Form.useWatch('examMatrixId', form)
    const knowledgeBlockId = Form.useWatch('knowledgeBlockId', form)
    const { mutateAsync: createQuestion } = useCreateQuestion()
    const { mutateAsync: updateQuestion } = useUpdateQuestion()

    const { data: examFrameworks = [] } = useFindManyExamFramework()

    const { data: examMatrixs = [] } = useFindManyExamMatrix(
        { where: { examFrameworkId } },
        { enabled: !!examFrameworkId }
    )

    const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock(
        {
            where: {
                examMatrixId,
                deletedAt: null,
            },
        },
        {
            enabled: !!examMatrixId,
        }
    )

    const subjectVersionId = useMemo(
        () => examFrameworks.find((f) => f.id === examFrameworkId)?.subjectVersionId,
        [examFrameworks, examFrameworkId]
    )

    const { data: questionBanks = [] } = useFindManyQuestionBank(
        {
            where: {
                subjectVersionId,
            },
        },
        {
            enabled: !!subjectVersionId,
        }
    )

    const { data: questions = [] } = useFindManyQuestion(
        {
            where: {
                questionBankId,
                deletedAt: null,
            },
            include: {
                multipleChoiceOptions: true,
                fillInBlankSlots: true,
                orderingItems: true,
                knowledgeBlock: true,
            },
            take: pageSize,
            skip: (currentPage - 1) * pageSize,
            orderBy: { createdAt: 'desc' },
        },
        { enabled: !!questionBankId }
    )

    const { data: allQuestions = [] } = useFindManyQuestion(
        {
            where: {
                questionBankId,
                deletedAt: null,
            },
            include: {
                multipleChoiceOptions: true,
                fillInBlankSlots: true,
                orderingItems: true,
                knowledgeBlock: true,
            },
        },
        { enabled: !!questionBankId }
    )

    const { data: totalQuestions = 0 } = useCountQuestion(
        {
            where: {
                questionBankId,
                deletedAt: null,
            },
        },
        { enabled: !!questionBankId }
    )

    useEffect(() => {
        if (!examFrameworkId) return

        form.setFieldsValue({
            examMatrixId: input?.matrixId,
            knowledgeBlockId: undefined,
        })

        setQuestionBankId(undefined)
        setSelectedRowKeys([])
        setSelectedQuestions([])
    }, [examFrameworkId, input?.matrixId, form])

    useEffect(() => {
        if (!examMatrixId) return

        form.setFieldsValue({
            knowledgeBlockId: undefined,
        })
    }, [examMatrixId, form])

    useEffect(() => {
        if (!isOpen) return

        form.setFieldsValue({
            examFrameworkId: input?.examFrameworkId,
            examMatrixId: input?.matrixId,
            knowledgeBlockId: undefined,
        })
    }, [isOpen, input?.examFrameworkId, input?.matrixId, form])

    useEffect(() => {
        if (!questionBankId) return
        setCurrentPage(1)
        setSelectedRowKeys([])
        setSelectedQuestions([])
        setIsAllSelected(false)
    }, [questionBankId])

    useEffect(() => {
        if (!isOpen) return
        if (questionBankId) return
        if (questionBanks.length === 0) return

        setQuestionBankId(questionBanks[0].id)
    }, [isOpen, questionBanks, questionBankId])

    async function onSubmit() {
        try {
            if (!selectedRowKeys.length) {
                message.error('Không có câu hỏi nào được chọn')
                return
            }

            // const { knowledgeBlockId } = form.getFieldsValue();

            if (!knowledgeBlockId) {
                message.error('Vui lòng chọn chuẩn đầu ra')
                return
            }

            if (keepOld) {
                await Promise.all(
                    selectedQuestions.map((q) =>
                        createQuestion({
                            data: {
                                content: q.content,
                                explanation: q.explanation,
                                type: q.type,
                                difficult: q.difficult,
                                point: q.point ?? 1,
                                isAutoGraded: q.isAutoGraded ?? false,
                                knowledgeBlockId,
                                questionBankId: q.questionBankId,

                                multipleChoiceOptions:
                                    q.multipleChoiceOptions?.length > 0
                                        ? {
                                              createMany: {
                                                  data: q.multipleChoiceOptions.map(
                                                      (opt: any, index: number) => ({
                                                          content: opt.content,
                                                          isCorrect: !!opt.isCorrect,
                                                          order: opt.order ?? index + 1,
                                                      })
                                                  ),
                                              },
                                          }
                                        : undefined,

                                orderingItems:
                                    q.orderingItems?.length > 0
                                        ? {
                                              createMany: {
                                                  data: q.orderingItems.map((item: any) => ({
                                                      content: item.content,
                                                      correctOrder: item.correctOrder,
                                                  })),
                                              },
                                          }
                                        : undefined,

                                fillInBlankSlots:
                                    q.fillInBlankSlots?.length > 0
                                        ? {
                                              createMany: {
                                                  data: q.fillInBlankSlots.map(
                                                      (slot: any, index: number) => ({
                                                          order: slot.order ?? index + 1,
                                                          correctAnswer: slot.correctAnswer,
                                                      })
                                                  ),
                                              },
                                          }
                                        : undefined,
                            },
                        })
                    )
                )
                message.success(`Đã sao chép ${selectedQuestions.length} câu hỏi`)
            } else {
                const idsToUpdate: string[] = isAllSelected
                    ? allQuestions.map((q) => q.id)
                    : selectedRowKeys

                await Promise.all(
                    idsToUpdate.map((id) =>
                        updateQuestion({
                            where: { id },
                            data: { knowledgeBlockId },
                        })
                    )
                )

                message.success(`Đã chuyển ${idsToUpdate.length} câu hỏi`)
            }

            form.resetFields()
            onClose()
        } catch (error) {
            console.error(error)
            message.error('Thao tác thất bại')
        }
        await queryClient.invalidateQueries({
            queryKey: ['Question'],
        })
    }

    return (
        <PutFormModal
            open={isOpen}
            title="Chọn câu hỏi từ ngân hàng"
            width={1100}
            className="top-2"
            form={form}
            onFinish={onSubmit}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>,
                <Button
                    key="ok"
                    type="primary"
                    disabled={!selectedRowKeys.length}
                    onClick={onSubmit}
                >
                    Thêm
                </Button>,
            ]}
        >
            <Col span={24}>
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <FormItem form={form} name="examFrameworkId" label="Khung đề" required>
                            <Select
                                disabled={!!input?.examFrameworkId}
                                placeholder="Chọn khung đề"
                                options={examFrameworks.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <FormItem form={form} name="examMatrixId" label="Ma trận đề" required>
                            <Select
                                disabled={!examFrameworkId}
                                placeholder="Chọn ma trận"
                                options={examMatrixs.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <FormItem form={form} name="knowledgeBlockId" label="Chuẩn đầu ra" required>
                            <Select
                                disabled={!examMatrixId}
                                placeholder="Chọn chuẩn đầu ra"
                                options={knowledgeBlocks.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <div className="flex items-center gap-2 mt-2 mb-4">
                    <Switch checked={keepOld} onChange={setKeepOld} />
                    <span>Giữ lại câu hỏi cũ</span>
                </div>
            </Col>

            <Row gutter={16}>
                <Col span={6}>
                    <div className="border rounded p-2 h-full">
                        <b>Ngân hàng câu hỏi (theo môn học)</b>
                        <div className="mt-2 space-y-2">
                            {questionBanks.map((qb) => (
                                <div
                                    key={qb.id}
                                    onClick={() => {
                                        setQuestionBankId(qb.id)
                                    }}
                                    className={`p-2 rounded cursor-pointer ${
                                        qb.id === questionBankId
                                            ? 'bg-blue-50 border border-blue-400'
                                            : 'border'
                                    }`}
                                >
                                    <div className="font-medium">{qb.name}</div>
                                    <div className="text-xs text-gray-500">{qb.code}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Col>

                <Col span={18}>
                    <Table
                        rowKey={'id'}
                        dataSource={questions}
                        scroll={{ y: 420 }}
                        pagination={{
                            current: currentPage,
                            pageSize,
                            total: totalQuestions,
                            showSizeChanger: true,
                            onChange: (page, size) => {
                                if (size === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setPageSize(size)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} câu hỏi`,
                        }}
                        rowSelection={{
                            preserveSelectedRowKeys: true,
                            selectedRowKeys,

                            onChange: (keys, rows, info) => {
                                const stringKeys = keys.map(String)

                                if (info.type === 'all') {
                                    if (stringKeys.length === 0) {
                                        setIsAllSelected(false)
                                        setSelectedRowKeys([])
                                        setSelectedQuestions([])
                                    } else {
                                        setIsAllSelected(true)
                                        setSelectedRowKeys(allQuestions.map((q) => q.id))
                                        setSelectedQuestions(allQuestions)
                                    }
                                    return
                                }

                                // Click từng row
                                setIsAllSelected(false)
                                setSelectedRowKeys(stringKeys)

                                setSelectedQuestions((prev) => {
                                    const map = new Map(prev.map((q) => [q.id, q]))
                                    rows.forEach((q) => {
                                        map.set(q.id, q)
                                    })
                                    return Array.from(map.values())
                                })
                            },
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_: unknown, __: unknown, index: number) =>
                                    (currentPage - 1) * pageSize + index + 1,
                            },

                            {
                                title: 'Nội dung câu hỏi',
                                dataIndex: 'content',
                                width: 280,
                                fixed: 'left',
                                render: (_: unknown, record: any) => (
                                    <HtmlTruncate>
                                        <div>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: record.content
                                                        ? renderWithMath(record.content)
                                                        : '<i>Chưa có nội dung</i>',
                                                }}
                                            />
                                            {(record.type === QuestionType.MULTIPLE_CHOICE ||
                                                record.type === QuestionType.SINGLE_CHOICE) && (
                                                <div className="mt-2 space-y-1">
                                                    {record?.multipleChoiceOptions
                                                        ?.sort(
                                                            (a: any, b: any) =>
                                                                (a.order || 0) - (b.order || 0)
                                                        )
                                                        .map((option: any) => (
                                                            <div
                                                                key={option.id}
                                                                className="text-xs text-gray-600"
                                                            >
                                                                <span
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: option.content
                                                                            ? renderWithMath(
                                                                                  option.content
                                                                              )
                                                                            : '',
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                            {record.type === QuestionType.ORDERING && (
                                                <div className="mt-2 space-y-1">
                                                    {record?.orderingItems
                                                        ?.sort(
                                                            (a: any, b: any) =>
                                                                (a.correctOrder || 0) -
                                                                (b.correctOrder || 0)
                                                        )
                                                        .map((item: any, index: number) => (
                                                            <div
                                                                key={item.id}
                                                                className="text-xs text-gray-600"
                                                            >
                                                                {index + 1}.{' '}
                                                                <span
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: item.content
                                                                            ? renderWithMath(
                                                                                  item.content
                                                                              )
                                                                            : '',
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </HtmlTruncate>
                                ),
                            },

                            {
                                title: 'Loại câu hỏi',
                                dataIndex: 'type',
                                width: 140,
                                align: 'center',
                                render: (_: unknown, record: any) =>
                                    QUESTION_TYPE_LABELS[record?.type as QuestionType] || '',
                            },

                            {
                                title: 'Độ khó',
                                dataIndex: 'difficult',
                                width: 100,
                                align: 'center',
                                render: (_: unknown, record: any) =>
                                    LEVEL_COLUMNS.find(
                                        (level) => level.difficult === record.difficult
                                    )?.label || '',
                            },

                            {
                                title: 'Chuẩn đầu ra',
                                dataIndex: 'knowledgeBlockId',
                                width: 150,
                                align: 'center',
                                render: (_: unknown, record: any) =>
                                    record?.knowledgeBlock?.name || '',
                            },

                            // {
                            //   title: "Đáp án",
                            //   dataIndex: "explanation",
                            //   width: 280,
                            //   render: (_: unknown, record: any) => {
                            //     if (
                            //       record.type === QuestionType.MULTIPLE_CHOICE ||
                            //       record.type === QuestionType.SINGLE_CHOICE
                            //     ) {
                            //       return (
                            //         <div className="space-y-1">
                            //           {record?.multipleChoiceOptions
                            //             ?.sort(
                            //               (a: any, b: any) => (a.order || 0) - (b.order || 0)
                            //             )
                            //             .map((option: any) => (
                            //               <div
                            //                 key={option.id}
                            //                 className={`text-xs ${
                            //                   option.isCorrect
                            //                     ? "text-green-600 font-semibold"
                            //                     : "text-gray-600"
                            //                 }`}
                            //               >
                            //                 {option.isCorrect && "✓ "}
                            //                 <span
                            //                   dangerouslySetInnerHTML={{
                            //                     __html: option.content
                            //                       ? renderWithMath(option.content)
                            //                       : "",
                            //                   }}
                            //                 />
                            //               </div>
                            //             ))}
                            //         </div>
                            //       );
                            //     }

                            //     // Tự luận / vấn đáp / khác
                            //     return (
                            //       <HtmlTruncate>
                            //         <div
                            //           dangerouslySetInnerHTML={{
                            //             __html: record.explanation
                            //               ? renderWithMath(record.explanation)
                            //               : "<i>Chưa có nội dung</i>",
                            //           }}
                            //         />
                            //       </HtmlTruncate>
                            //     );
                            //   },
                            // },
                        ]}
                    />
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default PickQuestionFromBankModal
