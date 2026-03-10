import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import HtmlTruncate from '@components/commons/html-truncate'
import PutFormModal from '@components/commons/put-modal'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { LEVEL_COLUMNS, QUESTION_TYPE_LABELS } from '@constants/constants'
import { store } from '@pages/thiet-lap-de-thi/danh-sach-de'
import { QuestionType } from '@workspace/db/client'
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
import { Button, Col, Form, message, Row, Switch } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const PickQuestionFromBankModal = () => {
    const [form] = Form.useForm()
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedQuestions, setSelectedQuestions] = useState<any[]>([])
    const [questionBankId, setQuestionBankId] = useState<string | undefined>(undefined)
    const [keepOld, setKeepOld] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isAllSelected, setIsAllSelected] = useState(false)
    const [originMatrixId, setOriginMatrixId] = useState<string | undefined>()
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        content: '',
        explanation: '',
        difficult: undefined,
        knowledgeBlockId: undefined,
    })
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
            setKeepOld(true)
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
    const where = useMemo(
        () => ({
            deletedAt: null,
            questionBankId,
            knowledgeBlockId: null,
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      type: { in: filters.questionType },
                  }
                : {}),

            ...(filters.content
                ? {
                      content: {
                          contains: filters.content,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),

            ...(filters.difficult && filters.difficult.length > 0
                ? {
                      difficult: { in: filters.difficult },
                  }
                : {}),

            ...(filters.knowledgeBlockId
                ? {
                      knowledgeBlockId: filters.knowledgeBlockId,
                  }
                : {}),
        }),
        [
            questionBankId,
            filters.questionType,
            filters.content,
            filters.difficult,
            filters.knowledgeBlockId,
        ]
    )
    const { data: questions = [] } = useFindManyQuestion(
        {
            where,
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
            where,
        },
        { enabled: !!questionBankId }
    )

    useEffect(() => {
        if (!isOpen) return
        setOriginMatrixId(input?.matrixId)

        form.setFieldsValue({
            examFrameworkId: input?.examFrameworkId,
            examMatrixId: input?.matrixId,
            knowledgeBlockId: undefined,
        })
    }, [isOpen, input?.examFrameworkId, input?.matrixId, form])

    useEffect(() => {
        if (!questionBankId) return
        setSelectedRowKeys([])
        setSelectedQuestions([])
        setIsAllSelected(false)
    }, [questionBankId])

    useEffect(() => {
        if (isOpen && !questionBankId && questionBanks.length > 0) {
            setQuestionBankId(questionBanks[0].id)
        }
    }, [isOpen, questionBanks, questionBankId])

    const rowSelection = {
        selectedRowKeys,
        preserveSelectedRowKeys: true,

        onSelect: (record: any, selected: boolean) => {
            if (selected) {
                setSelectedRowKeys((prev) => {
                    if (prev.includes(record.id)) return prev
                    return [...prev, record.id]
                })

                setSelectedQuestions((prev) => {
                    if (prev.some((q) => q.id === record.id)) return prev
                    return [...prev, record]
                })
            } else {
                setIsAllSelected(false)

                setSelectedRowKeys((prev) => prev.filter((id) => id !== record.id))
                setSelectedQuestions((prev) => prev.filter((q) => q.id !== record.id))
            }
        },

        onChange: (_keys: any, _rows: any, info: any) => {
            if (info?.type !== 'all') return

            if (isAllSelected) {
                setSelectedRowKeys([])
                setSelectedQuestions([])
                setIsAllSelected(false)
                return
            }

            setSelectedRowKeys(allQuestions.map((q) => q.id))
            setSelectedQuestions(allQuestions)
            setIsAllSelected(true)
        },
    }

    async function onSubmit() {
        try {
            if (!selectedRowKeys.length) {
                message.error('Không có câu hỏi nào được chọn')
                return
            }

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
            if (originMatrixId) {
                store.setState((s) => ({
                    ...s,
                    matrixId: originMatrixId,
                }))
                localStorage.setItem('currentMatrixId', originMatrixId)
            }

            await queryClient.invalidateQueries({
                queryKey: ['Question'],
            })
            form.resetFields()
            onClose()
        } catch (error) {
            console.error(error)
            message.error('Thao tác thất bại')
        }
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
                                onChange={(value) => {
                                    form.setFieldsValue({
                                        examMatrixId: undefined,
                                        knowledgeBlockId: undefined,
                                    })

                                    setQuestionBankId(undefined)
                                    setSelectedRowKeys([])
                                    setSelectedQuestions([])
                                }}
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
                                onChange={() => {
                                    form.setFieldsValue({
                                        knowledgeBlockId: undefined,
                                    })
                                }}
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
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        data={questions}
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
                        rowSelection={rowSelection}
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
                                type: 'input',
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
                                type: 'select',
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
                        ]}
                    />
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default PickQuestionFromBankModal
