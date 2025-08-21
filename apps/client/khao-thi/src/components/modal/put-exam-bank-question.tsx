import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import type { ExamBankQuestion } from '@workspace/db'
import {
    useCountQuestion,
    useCreateExamBankQuestion,
    useCreateManyExamBankQuestion,
    useFindManyDifficulty,
    useFindManyKnowledgeBlock,
    useFindManyQuestion,
    useFindUniqueExamBankQuestion,
} from '@workspace/db/hooks'
import { Col, Form, message, Row } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutExamBankQuestionType = ExamBankQuestion
const PutExamBankQuestion = () => {
    const [form] = Form.useForm<PutExamBankQuestionType>()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        examBankId: string
        questionBankId: string
    }>({
        tag: PutExamBankQuestion.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: createExamBankQuestion } = useCreateExamBankQuestion()
    const { mutateAsync: createManyExamBankQuestion } = useCreateManyExamBankQuestion()
    async function onOk() {
        if (!input?.examBankId) {
            message.error('Thiếu mã ngân hàng câu hỏi')
            return
        }
        if (selectedRowKeys.length === 0) {
            message.warning('Bạn chưa chọn câu hỏi nào')
            return
        }

        try {
            showSpinner()
            const data = selectedRowKeys.map((questionId) => ({
                examBankId: input.examBankId,
                questionId: questionId as string,
            }))

            await createManyExamBankQuestion({
                data,
            })

            message.success(`Thêm mới ${selectedRowKeys.length} câu hỏi thành công`)
            queryClient.invalidateQueries({
                queryKey: ['ExamBankQuestion'],
            })
            onClose()
            setSelectedRowKeys([])
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueExamBankQuestion(
        {
            where: { id: input?.id },
            include: {
                examBank: {
                    include: {
                        exam: true,
                    },
                },
            },
        },
        {
            enabled: !!input?.id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue])

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        content: '',
        point: undefined,
        difficultyId: undefined,
        knowledgeBlockId: undefined,
    })
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const where = useMemo(
        () => ({
            questionBankId: input?.questionBankId,
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      type: { in: filters.questionType },
                  }
                : {}),
            ...(filters.content && filters.content !== ''
                ? {
                      content: {
                          contains: filters.content,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.difficultyId
                ? Array.isArray(filters.difficultyId)
                    ? { difficultyId: { in: filters.difficultyId } }
                    : { difficultyId: filters.difficultyId }
                : {}),
            ...(filters.knowledgeBlockId
                ? Array.isArray(filters.knowledgeBlockId)
                    ? { knowledgeBlockId: { in: filters.knowledgeBlockId } }
                    : { knowledgeBlockId: filters.knowledgeBlockId }
                : {}),
            NOT: {
                sessionQuestions: {
                    some: {
                        examBankId: input?.examBankId,
                    },
                },
            },
        }),
        [
            input?.questionBankId,
            filters.questionType,
            filters.content,
            filters.difficultyId,
            filters.knowledgeBlockId,
            input?.examBankId,
        ]
    )

    const { data } = useFindManyQuestion({
        where,
        include: {
            knowledgeBlock: true,
            difficulty: true,
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        point: filters.point,
                    },
                ],
                !!filters.point
            ),
            { point: 'asc' },
            { createdAt: 'desc' },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountQuestion({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { structureRules: { some: { exam: { questionBankId: input?.questionBankId } } } },
    })

    const { data: difficultyData } = useFindManyDifficulty({
        orderBy: { level: 'asc' },
    })

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Chọn câu hỏi'}
            className="w-[70vw]"
        >
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        rowSelection={rowSelection}
                        filters={filters}
                        setFilters={setFilters}
                        scroll={{ y: '50vh' }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Nội dung câu hỏi',
                                dataIndex: 'content',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                render: (html: string) => (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: html
                                                ? renderWithMath(html)
                                                : '<i>Chưa có nội dung</i>',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: 'Loại câu hỏi',
                                dataIndex: 'questionType',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                options: questionTypeOptions,
                                render: (__, record) =>
                                    getQuestionTypeLabel(record?.type) || 'Chưa xác định',
                            },
                            {
                                title: 'Chương mục',
                                dataIndex: 'knowledgeBlockId',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                options: knowledgeBlockData?.map(({ id, name }) => ({
                                    value: id,
                                    label: name,
                                })),
                                render: (__, record) => {
                                    return record?.knowledgeBlock?.name || 'Chưa xác định'
                                },
                            },
                            {
                                title: 'Độ khó',
                                dataIndex: 'difficultyId',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                options: difficultyData?.map(({ id, name, level }) => ({
                                    value: id,
                                    label: `${name} (level ${level})`,
                                })),
                                render: (__, record) => {
                                    if (!record?.difficulty) {
                                        return 'Chưa xác định'
                                    }
                                    if (!record.difficulty.name) {
                                        return `Level ${record.difficulty.level || 'N/A'}`
                                    }
                                    if (!record.difficulty.level) {
                                        return record.difficulty.name
                                    }
                                    return `${record.difficulty.name} (level ${record.difficulty.level})`
                                },
                            },
                            {
                                title: 'Điểm số',
                                dataIndex: 'point',
                                width: 80,
                                align: 'center',
                                type: 'order',
                                render: (__, record) => {
                                    if (!record?.point) {
                                        return ''
                                    }
                                    return `${record.point} điểm`
                                },
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default PutExamBankQuestion
