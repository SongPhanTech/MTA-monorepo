import HtmlTruncate from '@components/commons/html-truncate'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { LEVEL_COLUMNS, QUESTION_TYPE_LABELS } from '@constants/constants'
import type { QuestionType } from '@workspace/db/client'
import { useCountQuestion, useFindManyQuestion, useUpdateQuestion } from '@workspace/db/hooks'
import { Button, Modal, message, Popconfirm, Row } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
// import type { MultipleChoiceOption } from "../../../../prisma/client";

export default function QuestionListByKnowledgeBlockModal() {
    const { isOpen, onClose, input } = useDisclosure<{
        knowledgeBlockId: string
        questionBankId: string
        subjectVersionId: string
    }>({
        tag: 'QuestionListByKnowledgeBlockModal',
    })
    const editModal = useDisclosure<{
        id: string
        questionBankId: string
        subjectVersionId: string
    }>({
        tag: 'PutQuestionModal',
    })
    const { knowledgeBlockId, questionBankId, subjectVersionId } = input || {}
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys as string[])
    }

    const { data: questions = [] } = useFindManyQuestion(
        {
            where: {
                knowledgeBlockId,
                deletedAt: null,
            },
            include: {
                knowledgeBlock: true,
                multipleChoiceOptions: true,
                fillInBlankSlots: true,
                orderingItems: true,
                questionBank: {
                    include: {
                        subjectVersion: true,
                    },
                },
            },
            take: pageSize,
            skip: (currentPage - 1) * pageSize,
            orderBy: { createdAt: 'desc' },
        },
        { enabled: !!knowledgeBlockId }
    )
    const { data: totalQuestions = 0 } = useCountQuestion(
        {
            where: {
                knowledgeBlockId,
                deletedAt: null,
            },
        },
        { enabled: !!knowledgeBlockId }
    )

    const { mutateAsync: updateQuestion } = useUpdateQuestion()

    async function handleDeleteQuestion(id: string) {
        try {
            await updateQuestion({
                where: { id },
                data: { deletedAt: new Date() },
            })
            message.success('Đã xoá câu hỏi')
        } catch {
            message.error('Không thể xoá câu hỏi')
        }
    }
    async function handleDeleteManyQuestions() {
        if (!selectedRowKeys.length) {
            message.warning('Vui lòng chọn ít nhất 1 câu hỏi')
            return
        }

        try {
            await Promise.all(
                selectedRowKeys.map((id) =>
                    updateQuestion({
                        where: { id },
                        data: { deletedAt: new Date() },
                    })
                )
            )

            message.success(`Đã xoá ${selectedRowKeys.length} câu hỏi`)
            setSelectedRowKeys([])
        } catch (error) {
            message.error('Không thể xoá nhiều câu hỏi')
        }
    }

    useEffect(() => {
        if (!knowledgeBlockId) return
        setCurrentPage(1)
        setSelectedRowKeys([])
    }, [knowledgeBlockId])

    return (
        <Modal
            title="Danh sách câu hỏi theo chuẩn đầu ra"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width="80vw"
            bodyStyle={{ padding: 12 }}
        >
            <Table
                rowKey="id"
                bordered
                scroll={{ y: '60vh' }}
                data={questions}
                rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys,
                    onChange: onSelectChange,
                }}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: totalQuestions,
                    showSizeChanger: true,
                    onChange: (page, size) => {
                        if (size === pageSize) setCurrentPage(page)
                        else {
                            setCurrentPage(1)
                            setPageSize(size)
                        }
                    },
                    showTotal: (total, range) =>
                        `${range[0]} - ${range[1]} trong tổng số ${total} câu hỏi`,
                }}
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => index + 1 + (currentPage - 1) * pageSize,
                    },
                    {
                        title: 'Nội dung câu hỏi',
                        dataIndex: 'content',
                        width: 300,
                        fixed: 'left',
                        render: (html: string) => (
                            <HtmlTruncate>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: html
                                            ? renderWithMath(html)
                                            : '<i>Chưa có nội dung</i>',
                                    }}
                                />
                            </HtmlTruncate>
                        ),
                    },
                    {
                        title: 'Loại',
                        dataIndex: 'type',
                        width: 120,
                        align: 'center',
                        render: (_, r) => QUESTION_TYPE_LABELS[r.type as QuestionType] || '',
                    },
                    {
                        title: 'Độ khó',
                        dataIndex: 'difficult',
                        width: 100,
                        align: 'center',
                        render: (_, r) =>
                            LEVEL_COLUMNS.find((l) => l.difficult === r.difficult)?.label,
                    },
                    // {
                    //   title: "Đáp án",
                    //   width: 300,
                    //   render: (_, record) => {
                    //     if (
                    //       record.type === QuestionType.MULTIPLE_CHOICE ||
                    //       record.type === QuestionType.SINGLE_CHOICE
                    //     ) {
                    //       return (
                    //         <div className="space-y-1">
                    //           {record.multipleChoiceOptions
                    //             ?.sort(
                    //               (a: MultipleChoiceOption, b: MultipleChoiceOption) =>
                    //                 (a.order || 0) - (b.order || 0)
                    //             )
                    //             .map((opt: MultipleChoiceOption) => (
                    //               <div
                    //                 key={opt.id}
                    //                 className={
                    //                   opt.isCorrect
                    //                     ? "text-green-600 font-semibold"
                    //                     : "text-gray-600"
                    //                 }
                    //                 dangerouslySetInnerHTML={{
                    //                   __html: renderWithMath(opt.content),
                    //                 }}
                    //               />
                    //             ))}
                    //         </div>
                    //       );
                    //     }
                    //     return (
                    //       <HtmlTruncate>
                    //         <div
                    //           dangerouslySetInnerHTML={{
                    //             __html: record.explanation
                    //               ? renderWithMath(record.explanation)
                    //               : "",
                    //           }}
                    //         />
                    //       </HtmlTruncate>
                    //     );
                    //   },
                    // },
                    {
                        title: 'Thao tác',
                        width: 90,
                        align: 'center',
                        fixed: 'right',
                        render: (_, record) => (
                            <Row className="justify-center gap-2">
                                <EditIcon
                                    onClick={() => {
                                        editModal.onOpen({
                                            id: record.id,
                                            questionBankId: record.questionBankId, // 🔥 lấy từ record
                                            subjectVersionId: record.questionBank?.subjectVersionId,
                                        })
                                    }}
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDeleteQuestion(record.id),
                                    }}
                                />
                            </Row>
                        ),
                    },
                ]}
            />
            <Row justify="space-between" align="middle" className="mb-2">
                <div>
                    {selectedRowKeys.length > 0 && (
                        <span className="text-sm text-gray-500">
                            Đã chọn {selectedRowKeys.length} câu hỏi
                        </span>
                    )}
                </div>

                <Popconfirm
                    title="Xoá các câu hỏi đã chọn?"
                    description="Thao tác này không thể hoàn tác"
                    onConfirm={handleDeleteManyQuestions}
                    okText="Xoá"
                    cancelText="Huỷ"
                >
                    {selectedRowKeys.length > 0 && (
                        <Button danger onClick={handleDeleteManyQuestions}>
                            Xoá
                        </Button>
                    )}
                </Popconfirm>
            </Row>
        </Modal>
    )
}
