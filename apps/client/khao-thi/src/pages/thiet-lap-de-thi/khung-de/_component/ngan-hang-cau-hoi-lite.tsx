import { Button, Row, Col, message, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
// import DeleteIcon from "@/components/commoms/icons/delete";
// import EditIcon from "@/components/commoms/icons/edit";
// import HtmlTruncate from "@/components/commoms/html-truncate";
// import { renderWithMath } from "@/components/commoms/rick-text-editor/renderWithMath";

// import type { MultipleChoiceOption } from "../../prisma/client";
// import { QuestionType } from "../../prisma/client";
import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { LEVEL_COLORS } from '@constants/constants'
import {
    useCountQuestion,
    useFindManyExamMatrix,
    useFindManyKnowledgeBlock,
    useFindManyQuestion,
    useFindUniqueQuestionBank,
    useUpdateQuestion,
} from '@workspace/db/hooks'

interface QuestionBankLiteProps {
    examFrameworkId?: string
    questionBankId: string
}

export default function QuestionBankLite({
    examFrameworkId,
    questionBankId,
}: QuestionBankLiteProps) {
    // const [showAllQuestions, setShowAllQuestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    // const [activeKnowledgeBlockId, setActiveKnowledgeBlockId] = useState<
    //   string | null
    // >(null);

    // const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    //     setSelectedRowKeys(newSelectedRowKeys as string[])
    // }

    // const { onOpen: onOpenPutQuestion } = useDisclosure<{
    //     id: string
    //     questionBankId: string
    //     subjectVersionId: string
    // }>({
    //     tag: 'PutQuestionModal',
    // })

    const { onOpen: onOpenQuestionListModal } = useDisclosure<{
        knowledgeBlockId: string
        questionBankId: string
        subjectVersionId: string
        matrixName: string
    }>({
        tag: 'QuestionListByKnowledgeBlockModal',
    })

    const { onOpen: onOpenPickQuestionFromBank } = useDisclosure<{
        examFrameworkId: string
    }>({
        tag: 'PickQuestionFromBankModal',
    })

    const { mutateAsync: updateQuestion } = useUpdateQuestion()

    async function handleDeleteQuestion(id: string) {
        try {
            await updateQuestion({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    const { data: examMatrixs = [] } = useFindManyExamMatrix(
        {
            where: {
                examFrameworkId,
                deletedAt: null,
            },
        },
        { enabled: !!examFrameworkId }
    )

    const matrixIds = useMemo(() => examMatrixs.map((m) => m.id), [examMatrixs])

    const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock(
        {
            where: { examMatrixId: { in: matrixIds }, deletedAt: null },
            include: {
                configExams: true,
            },
        },
        { enabled: matrixIds.length > 0 }
    )

    const knowledgeBlockIds = useMemo(() => knowledgeBlocks.map((k) => k.id), [knowledgeBlocks])

    const { data: questions = [] } = useFindManyQuestion(
        {
            where: {
                knowledgeBlockId: { in: knowledgeBlockIds },
                deletedAt: null,
            },
            include: {
                knowledgeBlock: true,
                multipleChoiceOptions: true,
            },
            take: pageSize,
            skip: (currentPage - 1) * pageSize,
            orderBy: { createdAt: 'desc' },
        },
        { enabled: knowledgeBlockIds.length > 0 }
    )

    const { data: initialValue } = useFindUniqueQuestionBank(
        {
            where: { id: questionBankId },
            include: {
                subjectVersion: true,
            },
        },
        { enabled: !!questionBankId }
    )

    const matrixMap = useMemo(() => {
        const map = new Map<string, string>()
        examMatrixs.forEach((m) => {
            map.set(m.id, m.name)
        })
        return map
    }, [examMatrixs])

    const data = useMemo(() => {
        return knowledgeBlocks.map((kb) => {
            const qs = questions.filter((q) => q.knowledgeBlockId === kb.id)

            const stats: Record<
                string,
                {
                    current: number
                    required: number
                    missing: number
                }
            > = {}

            LEVEL_COLORS.forEach((l) => {
                const current = qs.filter((q) => q.difficult === l.key).length

                const required = kb.configExams?.find((c) => c.difficult === l.key)?.quantity ?? 0

                stats[l.key] = {
                    current,
                    required,
                    missing: Math.max(required - current, 0),
                }
            })

            return {
                key: kb.id,
                // name: kb.name,
                examMatrixName: matrixMap.get(kb.examMatrixId) || '',
                knowledgeBlockName: kb.name,
                knowledgeBlockId: kb.id,
                ...stats,
            }
        })
    }, [knowledgeBlocks, questions, matrixMap])

    // const filteredQuestions = useMemo(() => {
    //   // if (!showAllQuestions) return [];

    //   if (!activeKnowledgeBlockId) return questions;

    //   return questions.filter(
    //     (q) => q.knowledgeBlockId === activeKnowledgeBlockId
    //   );
    // }, [questions, activeKnowledgeBlockId]);

    const { data: totalQuestions = 0 } = useCountQuestion(
        {
            where: {
                knowledgeBlockId: { in: knowledgeBlockIds },
                deletedAt: null,
            },
        },
        { enabled: knowledgeBlockIds.length > 0 }
    )

    // useEffect(() => {
    //   setCurrentPage(1);
    // }, [activeKnowledgeBlockId, examFrameworkId]);

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24} className="mt-4">
                    <Row justify="end" gutter={8} className="gap-2">
                        {/* <Button
              size="middle"
              onClick={() => setActiveKnowledgeBlockId(null)}
            >
              <EyeOutlined size={15} />
              Xem tất cả câu hỏi
            </Button> */}

                        <Button
                            type="primary"
                            size="middle"
                            onClick={() => {
                                if (!examFrameworkId) return
                                onOpenPickQuestionFromBank({
                                    examFrameworkId: examFrameworkId,
                                })
                            }}
                        >
                            <BookPlus size={15} />
                            Thêm câu hỏi từ ngân hàng
                        </Button>
                        {/* <Button
              type="primary"
              size="middle"
              onClick={() =>
                onOpenPutQuestion({
                  id: "",
                  questionBankId,
                  subjectVersionId: initialValue?.subjectVersionId || "",
                })
              }
            >
              <BookPlus size={15} />
              Thêm câu hỏi mới
            </Button> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        className="mt-2"
                        // scroll={{ y: 'calc(100vh - 260px)' }}
                        bordered
                        data={data}
                        pagination={false}
                        // pagination={{
                        //   current: currentPage,
                        //   pageSize,
                        //   total: totalQuestions,
                        //   onChange: (page, size) => {
                        //     if (size === pageSize) {
                        //       setCurrentPage(page);
                        //     } else {
                        //       setCurrentPage(1);
                        //       setPageSize(size);
                        //     }
                        //   },
                        //   showSizeChanger: true,
                        //   showTotal: (total, range) =>
                        //     `${range[0]} - ${range[1]} trong tổng số ${total} câu hỏi`,
                        // }}
                        columns={[
                            {
                                title: 'Ma trận',
                                dataIndex: 'examMatrixName',
                                width: 180,
                            },
                            {
                                title: 'Chuẩn đầu ra',
                                dataIndex: 'knowledgeBlockName',
                                width: 220,
                            },
                            ...LEVEL_COLORS.map((l) => ({
                                title: l.label,
                                dataIndex: l.key,
                                align: 'center' as const,
                                render: (v: {
                                    current: number
                                    required: number
                                    missing: number
                                }) => (
                                    <div className="flex items-center justify-center gap-1">
                                        {/* Số câu hiện tại */}
                                        <span
                                            className="inline-flex items-center justify-center min-w-[28px] h-[24px]
                       rounded border border-green-300 text-green-600
                       text-sm font-semibold bg-green-50"
                                        >
                                            {v.current}
                                        </span>

                                        {/* Badge thiếu */}
                                        {v.missing > 0 && (
                                            <span
                                                className="inline-flex items-center justify-center
                           px-1.5 h-[24px]
                           rounded border border-red-300
                           bg-red-50 text-red-500
                           text-xs font-medium"
                                            >
                                                Thiếu {v.missing}
                                            </span>
                                        )}
                                    </div>
                                ),
                            })),
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center' as const,
                                render: (_: unknown, record: any) => (
                                    <Tooltip title="Xem câu hỏi">
                                        <EyeOutlined
                                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                                            onClick={() =>
                                                onOpenQuestionListModal({
                                                    knowledgeBlockId: record.knowledgeBlockId,
                                                    questionBankId,
                                                    subjectVersionId:
                                                        initialValue?.subjectVersionId || '',
                                                    matrixName: record.examMatrixName,
                                                })
                                            }
                                        />
                                    </Tooltip>
                                ),
                            },
                        ]}
                    />
                </Col>
                {/* 
        <Col span={24} className="mt-4">
          <Table
            rowKey="id"
            bordered
            rowSelection={{
              type: "checkbox",
              selectedRowKeys,
              onChange: onSelectChange,
            }}
            scroll={{ y: "calc(100vh - 260px)" }}
            data={questions}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalQuestions,
              onChange: (page, size) => {
                if (size === pageSize) {
                  setCurrentPage(page);
                } else {
                  setCurrentPage(1);
                  setPageSize(size);
                }
              },
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} câu hỏi`,
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Nội dung câu hỏi",
                dataIndex: "content",
                width: 280,
                fixed: "left",
                render: (html: string) => (
                  <HtmlTruncate>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: html
                          ? renderWithMath(html)
                          : "<i>Chưa có nội dung</i>",
                      }}
                    />
                  </HtmlTruncate>
                ),
              },
              {
                title: "Loại câu hỏi",
                dataIndex: "type",
                width: 140,
                align: "center",
                render: (_, record) =>
                  QUESTION_TYPE_LABELS[record.type as QuestionType] || "",
              },
              {
                title: "Độ khó",
                dataIndex: "difficult",
                width: 100,
                align: "center",
                render: (_, record) =>
                  LEVEL_COLUMNS.find((l) => l.difficult === record.difficult)
                    ?.label || "",
              },
              {
                title: "Chuẩn đầu ra",
                width: 150,
                align: "center",
                render: (_, record) => record?.knowledgeBlock?.name || "",
              },
              // {
              //   title: "Đáp án",
              //   dataIndex: "explanation",
              //   width: 280,
              //   type: "input",
              //   render: (__, record) => {
              //     if (
              //       record.type === QuestionType.MULTIPLE_CHOICE ||
              //       record.type === QuestionType.SINGLE_CHOICE
              //     ) {
              //       return (
              //         <div className="space-y-1">
              //           {record?.multipleChoiceOptions
              //             ?.sort(
              //               (
              //                 a: MultipleChoiceOption,
              //                 b: MultipleChoiceOption
              //               ) => (a.order || 0) - (b.order || 0)
              //             )
              //             .map((option: MultipleChoiceOption) => (
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
              {
                title: "Thao tác",
                width: 90,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <EditIcon
                      className="text-sm text-blue-700 cursor-pointer"
                      onClick={() =>
                        onOpenPutQuestion({
                          id: record.id,
                          questionBankId,
                          subjectVersionId:
                            initialValue?.subjectVersionId || "",
                        })
                      }
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
        </Col> */}
            </Row>
        </div>
    )
}
