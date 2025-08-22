import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import { ModalPrintExamBank, PutExamBankQuestion } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import type { ExamBankQuestion, Question } from '@workspace/db'
import {
    useCountExamBankQuestion,
    useDeleteExamBankQuestion,
    useFindManyDifficulty,
    useFindManyExamBankQuestion,
    useFindManyKnowledgeBlock,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Modal, message, Row } from 'antd'
import { BookPlus, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ModalExamBankProps {
    open: boolean
    onCancel: () => void
    examBankId: string
    questionBankId: string
    subjectVersionName: string
    subject: string
    semester: string
    examCode: string
    examId: string
    duration: number
    disabled?: boolean
}

const ModalExamBank: React.FC<ModalExamBankProps> = ({
    open,
    onCancel,
    examBankId,
    questionBankId,
    subjectVersionName,
    subject,
    semester,
    examCode,
    examId,
    duration,
    disabled = false,
}) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        content: '',
        questionType: undefined,
        difficultyId: undefined,
        knowledgeBlockId: undefined,
        point: undefined,
    })

    const where = useMemo(
        () => ({
            examBankId,
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      question: { type: { in: filters.questionType } },
                  }
                : {}),
            ...(filters.content && filters.content !== ''
                ? {
                      question: {
                          content: {
                              contains: filters.content,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.difficultyId
                ? Array.isArray(filters.difficultyId)
                    ? { question: { difficultyId: { in: filters.difficultyId } } }
                    : { question: { difficultyId: filters.difficultyId } }
                : {}),
            ...(filters.knowledgeBlockId
                ? Array.isArray(filters.knowledgeBlockId)
                    ? { question: { knowledgeBlockId: { in: filters.knowledgeBlockId } } }
                    : { question: { knowledgeBlockId: filters.knowledgeBlockId } }
                : {}),
        }),
        [
            examBankId,
            filters.questionType,
            filters.content,
            filters.difficultyId,
            filters.knowledgeBlockId,
        ]
    )

    const { onOpen: onOpenPutExamBankQuestion } = useDisclosure<{
        id: string
        examBankId: string
        questionBankId: string
    }>({
        tag: PutExamBankQuestion.name,
    })

    const { onOpen: onOpenModalPrintExamBank } = useDisclosure<{
        data?: (ExamBankQuestion & { question: Question })[]
        subjectVersionName: string
        subject: string
        examCode: string
        semester: string
        examId: string
        duration: number
        explanation: boolean
    }>({
        tag: ModalPrintExamBank.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useFindManyExamBankQuestion(
        {
            where,
            include: {
                question: {
                    include: {
                        knowledgeBlock: true,
                        difficulty: true,
                    },
                },
            },
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            question: {
                                point: filters.point,
                            },
                        },
                    ],
                    !!filters.point
                ),
                { order: 'asc' },
                { createdAt: 'asc' },
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!examBankId,
        }
    )

    const { data: count } = useCountExamBankQuestion(
        {
            where: { ...where, deletedAt: null },
        },
        {
            enabled: !!examBankId,
        }
    )

    const { mutateAsync: deleteExamBankQuestion } = useDeleteExamBankQuestion()
    async function handleDeleteExamBankQuestion(id: string) {
        try {
            showSpinner()
            await deleteExamBankQuestion({
                where: { id },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { structureRules: { some: { exam: { questionBankId } } } },
    })

    const { data: difficultyData } = useFindManyDifficulty({
        orderBy: { level: 'asc' },
    })

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            maskClosable={true}
            footer={null}
            title="Chi tiết đề thi"
            className="w-[70vw]"
            width="70%"
        >
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenModalPrintExamBank({
                                            data,
                                            subjectVersionName,
                                            subject,
                                            examCode,
                                            semester,
                                            examId,
                                            duration,
                                            explanation: true,
                                        })
                                    }
                                    icon={<Printer />}
                                >
                                    In đáp án
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenModalPrintExamBank({
                                            data,
                                            subjectVersionName,
                                            subject,
                                            examCode,
                                            semester,
                                            examId,
                                            duration,
                                            explanation: false,
                                        })
                                    }
                                    icon={<Printer />}
                                >
                                    In đề thi
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenPutExamBankQuestion({
                                            id: '',
                                            examBankId,
                                            questionBankId,
                                        })
                                    }
                                    disabled={disabled}
                                    icon={<BookPlus />}
                                >
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="key"
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                align: 'center',
                                fixed: 'left',
                                width: 60,
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Nội dung câu hỏi',
                                dataIndex: 'content',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                render: (__, record) => (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: record?.question?.content
                                                ? renderWithMath(record?.question?.content)
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
                                    getQuestionTypeLabel(record?.question?.type) || 'Chưa xác định',
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
                                    return record?.question?.knowledgeBlock?.name || 'Chưa xác định'
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
                                    if (!record?.question?.difficulty) {
                                        return 'Chưa xác định'
                                    }
                                    if (!record.question?.difficulty.name) {
                                        return `Level ${record.question?.difficulty.level || 'N/A'}`
                                    }
                                    if (!record.question?.difficulty.level) {
                                        return record.question?.difficulty.name
                                    }
                                    return `${record.question?.difficulty.name} (level ${record.question?.difficulty.level})`
                                },
                            },
                            {
                                title: 'Điểm số',
                                dataIndex: 'point',
                                width: 80,
                                align: 'center',
                                type: 'order',
                                render: (__, record) => {
                                    return record?.question?.point
                                },
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                fixed: 'right',
                                width: 120,
                                render: (__, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteExamBankQuestion(record.id),
                                                    }}
                                                    disabled={disabled}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
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
        </Modal>
    )
}

export default ModalExamBank
