import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import NoExamBank from '@components/icons/icon-no-exambank'
import ViewIcon from '@components/icons/view'
import { ModalExamBank } from '@components/sub-pages'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { Question } from '@workspace/db'
import {
    useCountExamBank,
    useDeleteExamBank,
    useFindManyExamBank,
    useFindUniqueExam,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus, Printer, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ExamBankProps {
    id: string
}

export default function ExamBank({ id }: ExamBankProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [examBankModal, setExamBankModal] = useState({
        visible: false,
        examBankId: '',
        questionBankId: '',
        examCode: '',
    })
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        knowledgeBlockId: undefined,
        count: undefined,
        questionPoint: undefined,
    })

    const { onOpen: onOpenPutExamBank } = useDisclosure<{
        examId: string
        id: string
    }>({
        tag: 'PutExamBank',
    })

    const { onOpen: onOpenModalPrintAllExams } = useDisclosure<{
        exams: {
            examCode: string
            questions: Question[]
            subjectVersionName: string
            subject: string
            semester: string
            examId: string
            duration: number
        }[]
        explanation: boolean
    }>({
        tag: 'ModalPrintAllExams',
    })

    const openExamBankModal = (examBankId: string, questionBankId: string, examCode: string) => {
        setExamBankModal({
            visible: true,
            examBankId,
            questionBankId,
            examCode,
        })
    }

    const closeExamBankModal = () => {
        setExamBankModal({
            visible: false,
            examBankId: '',
            questionBankId: '',
            examCode: '',
        })
    }

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
            include: {
                questionBank: {
                    include: {
                        subjectVersion: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                },
                subjectClass: {
                    include: {
                        semester: {
                            include: {
                                schoolYear: true,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!id }
    )

    const { data: examBankData = [], refetch } = useFindManyExamBank(
        {
            where: { examId: id },
            orderBy: { examCode: 'asc' },
            include: {
                questions: {
                    include: {
                        question: true,
                    },
                },
                _count: { select: { questions: true } },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: countExam, refetch: refetchCount } = useCountExamBank(
        {
            where: {
                examId: id,
                deletedAt: null,
            },
        },
        { enabled: !!id }
    )

    const { mutateAsync: deleteExamBank } = useDeleteExamBank()
    async function handleDeleteExamBank(id: string) {
        try {
            showSpinner()
            await deleteExamBank({
                where: { id },
            })
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

    const { onOpen: onOpenModalSinhDeThiTuDong } = useDisclosure<string>({
        tag: 'ModalSinhDeThiTuDong',
        onClose: () => {
            refetch()
            refetchCount()
        },
    })

    const handlePrintAllExams = (explanation: boolean) => {
        if (!examBankData) return

        const isPrintAll =
            selectedRowKeys.length === 0 || selectedRowKeys.length === examBankData.length

        const filteredExamBank = isPrintAll
            ? examBankData
            : examBankData.filter((exam) => selectedRowKeys.includes(exam.id))

        const exams = filteredExamBank.map((exam) => ({
            examCode: exam.examCode,
            questions: exam.questions.map((q) => q.question),
            subjectVersionName: initialValue?.questionBank?.subjectVersion?.name || '',
            subject: (() => {
                const { code, name } = initialValue?.questionBank?.subjectVersion?.subject || {}
                return [code, name].filter(Boolean).join(' - ')
            })(),
            semester: (() => {
                const { name, schoolYear } = initialValue?.subjectClass?.[0]?.semester || {}
                return [name, schoolYear?.name].filter(Boolean).join('<br/>')
            })(),
            examId: id,
            duration: Number(initialValue?.duration),
        }))

        onOpenModalPrintAllExams({ exams, explanation })
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }

    return (
        <div>
            {examBankData.length > 0 ? (
                <>
                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Row gutter={[16, 16]} align="top" justify="end">
                                <Col span={12}>
                                    <Flex justify="end" gap={4}>
                                        <Button onClick={() => onOpenModalSinhDeThiTuDong(id)}>
                                            <Shuffle />
                                            Sinh đề tự động
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                onOpenPutExamBank({
                                                    examId: id,
                                                    id: '',
                                                })
                                            }}
                                        >
                                            <BookPlus />
                                            Thêm đề thi
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => handlePrintAllExams(true)}
                                            disabled={!examBankData}
                                        >
                                            <Printer />
                                            In đáp án
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => handlePrintAllExams(false)}
                                            disabled={!examBankData}
                                        >
                                            <Printer />
                                            In toàn bộ đề thi
                                        </Button>
                                    </Flex>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Table
                                rowKey="id"
                                filters={filters}
                                setFilters={(value) => {
                                    setFilters(value)
                                    setCurrentPage(1)
                                }}
                                rowSelection={rowSelection}
                                columns={[
                                    {
                                        title: 'STT',
                                        align: 'center',
                                        fixed: 'left',
                                        render: (_, __, index) =>
                                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                    },
                                    {
                                        title: 'Mã đề',
                                        align: 'center',
                                        fixed: 'left',
                                        dataIndex: 'examCode',
                                    },
                                    {
                                        title: 'Số câu hỏi',
                                        align: 'center',
                                        dataIndex: ['_count', 'questions'],
                                    },
                                    {
                                        title: 'Tổng điểm',
                                        align: 'center',
                                        render: (__, record) => {
                                            let total = 0
                                            if (!record?.questions) {
                                                return '-'
                                            }
                                            for (const q of record.questions) {
                                                total += q.question.point || 0
                                            }
                                            return total
                                        },
                                    },
                                    {
                                        title: 'Thao tác',
                                        align: 'center',
                                        fixed: 'right',
                                        render: (__, record) => {
                                            if (record?.id) {
                                                return (
                                                    <Row className="justify-center gap-2">
                                                        <ViewIcon
                                                            onClick={() =>
                                                                openExamBankModal(
                                                                    record.id,
                                                                    initialValue?.questionBankId ??
                                                                        '',
                                                                    record?.examCode ?? ''
                                                                )
                                                            }
                                                        />
                                                        <EditIcon
                                                            className="text-sm text-blue-700 cursor-pointer"
                                                            onClick={() =>
                                                                onOpenPutExamBank({
                                                                    examId: id,
                                                                    id: record.id,
                                                                })
                                                            }
                                                        />
                                                        <DeleteIcon
                                                            popConfirm={{
                                                                onConfirm: () =>
                                                                    handleDeleteExamBank(record.id),
                                                            }}
                                                        />
                                                    </Row>
                                                )
                                            }
                                            return ''
                                        },
                                    },
                                ]}
                                data={examBankData}
                                pagination={{
                                    current: currentPage,
                                    pageSize: numberOfPages,
                                    total: countExam,
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
                    <ModalExamBank
                        open={examBankModal.visible}
                        onCancel={closeExamBankModal}
                        examBankId={examBankModal.examBankId}
                        questionBankId={examBankModal.questionBankId}
                        subjectVersionName={initialValue?.questionBank?.subjectVersion?.name || ''}
                        duration={Number(initialValue?.duration)}
                        subject={(() => {
                            const { code, name } =
                                initialValue?.questionBank?.subjectVersion?.subject || {}
                            return [code, name].filter(Boolean).join(' - ')
                        })()}
                        semester={(() => {
                            const { name, schoolYear } =
                                initialValue?.subjectClass?.[0]?.semester || {}
                            return [name, schoolYear?.name].filter(Boolean).join(' <br/> ')
                        })()}
                        examCode={examBankModal.examCode}
                        examId={id}
                    />
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <NoExamBank />
                    <span className="text-[#4A4A4A] text-[13px]">
                        Chưa có đề thi nào. Vui lòng thêm mới đề thi.
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={() => onOpenModalSinhDeThiTuDong(id)}>
                            <Shuffle />
                            Sinh đề tự động
                        </Button>
                        <Button
                            type="primary"
                            onClick={() =>
                                onOpenPutExamBank({
                                    examId: id,
                                    id: '',
                                })
                            }
                        >
                            <BookPlus />
                            Thêm đề thi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
