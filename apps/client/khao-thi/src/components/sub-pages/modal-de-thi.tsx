import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { ModalPrintExamBank, PutExamBankQuestion } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { ExamBankQuestion, Question } from '@workspace/db'
import {
    useCountExamBankQuestion,
    useFindManyExamBankQuestion,
    useUpdateExamBankQuestion,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Modal, message, Row, Switch, Tooltip } from 'antd'
import { BookPlus, Printer } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ModalExamBankProps {
    open: boolean
    onCancel: () => void
    examBankId: string
    questionBankId: string
}

const ModalExamBank: React.FC<ModalExamBankProps> = ({
    open,
    onCancel,
    examBankId,
    questionBankId,
}) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        knowledgeBlockId: undefined,
        count: undefined,
        questionPoint: undefined,
    })
    const [showAllExplanations, setShowAllExplanations] = useState(false)
    const [rowVisibility, setRowVisibility] = useState<Record<string, boolean>>({})

    const { onOpen: onOpenPutExamBankQuestion } = useDisclosure<{
        id: string
        examBankId: string
        questionBankId: string
    }>({
        tag: PutExamBankQuestion.name,
    })

    const { onOpen: onOpenModalPrintExamBank } = useDisclosure<{
        data?: (ExamBankQuestion & { question: Question })[]
    }>({
        tag: ModalPrintExamBank.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useFindManyExamBankQuestion(
        {
            where: { examBankId },
            include: {
                question: true,
            },
        },
        {
            enabled: !!examBankId,
        }
    )

    const { data: count } = useCountExamBankQuestion(
        {
            where: { examBankId },
        },
        {
            enabled: !!examBankId,
        }
    )

    const { mutateAsync: updateExamBankQuestion } = useUpdateExamBankQuestion()
    async function handleDeleteExamBankQuestion(id: string) {
        try {
            showSpinner()
            await updateExamBankQuestion({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const toggleAllExplanations = (checked: boolean) => {
        setShowAllExplanations(checked)
        if (!checked) {
            const newVisibility: Record<string, boolean> = {}
            data?.forEach((item) => {
                newVisibility[item.id] = false
            })
            setRowVisibility(newVisibility)
        }
    }

    const toggleRowExplanation = (id: string) => {
        setRowVisibility((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))

        const allVisible = data?.every(
            (item) => rowVisibility[item.id] || (item.id === id && !rowVisibility[id])
        )
        if (allVisible) {
            setShowAllExplanations(true)
        } else if (showAllExplanations) {
            setShowAllExplanations(false)
        }
    }

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
                        <Col>
                            <Flex align="center" gap={8}>
                                <span>Hiển thị giải thích:</span>
                                <Switch
                                    checked={showAllExplanations}
                                    onChange={toggleAllExplanations}
                                />
                            </Flex>
                        </Col>
                        <Col>
                            <Flex justify="end" gap={4}>
                                <Button
                                    type="primary"
                                    onClick={() => onOpenModalPrintExamBank({ data })}
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
                                title: 'Giải thích đáp án',
                                dataIndex: 'explanation',
                                width: 200,
                                type: 'input',
                                render: (__, record) => {
                                    const isVisible =
                                        showAllExplanations || rowVisibility[record.id]
                                    return isVisible ? (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: record?.question?.explanation
                                                    ? renderWithMath(record?.question?.explanation)
                                                    : '<i>Chưa có nội dung</i>',
                                            }}
                                        />
                                    ) : (
                                        '***'
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                fixed: 'right',
                                width: 120,
                                render: (__, record) => {
                                    if (record?.id) {
                                        const isVisible =
                                            showAllExplanations || rowVisibility[record.id]
                                        return (
                                            <Row className="justify-center gap-2">
                                                <Tooltip title="Ẩn/hiện giải thích">
                                                    <Button
                                                        type="text"
                                                        icon={
                                                            isVisible ? (
                                                                <EyeOutlined />
                                                            ) : (
                                                                <EyeInvisibleOutlined />
                                                            )
                                                        }
                                                        onClick={() =>
                                                            toggleRowExplanation(record.id)
                                                        }
                                                        className="-mr-1.5"
                                                    />
                                                </Tooltip>
                                                <EditIcon
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                    onClick={() =>
                                                        onOpenPutExamBankQuestion({
                                                            id: record.id,
                                                            examBankId,
                                                            questionBankId,
                                                        })
                                                    }
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteExamBankQuestion(record.id),
                                                    }}
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
