import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { LEVEL_COLORS } from '@constants/constants'
import { store } from '@pages/thiet-lap-de-thi/khung-de'
import { useStore } from '@tanstack/react-store'
import {
    useFindManyExamMatrix,
    useFindManyKnowledgeBlock,
    useFindManyQuestion,
    useFindUniqueQuestionBank,
} from '@workspace/db/hooks'
import { Button, Col, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface QuestionBankLiteProps {
    examFrameworkId?: string
    questionBankId: string
}

export default function QuestionBankLite({
    examFrameworkId,
    questionBankId,
}: QuestionBankLiteProps) {
    const matrixId = useStore(store, (s) => s.matrixId)

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
        matrixId: string
    }>({
        tag: 'PickQuestionFromBankModal',
    })

    const { data: examMatrixs = [] } = useFindManyExamMatrix(
        examFrameworkId
            ? {
                  where: {
                      examFrameworkId: examFrameworkId,
                      deletedAt: null,
                  },
              }
            : undefined,
        {
            enabled: !!examFrameworkId,
        }
    )

    const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock(
        {
            where: { examMatrixId: matrixId, deletedAt: null },
            include: {
                configExams: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        },
        { enabled: !!matrixId }
    )

    const knowledgeBlockIds = useMemo(() => knowledgeBlocks.map((k) => k.id), [knowledgeBlocks])

    const { data: allQuestionsForStats = [] } = useFindManyQuestion(
        {
            where: {
                knowledgeBlockId: { in: knowledgeBlockIds },
                deletedAt: null,
            },
            select: {
                id: true,
                knowledgeBlockId: true,
                difficult: true,
            },
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
            const qs = allQuestionsForStats.filter((q) => q.knowledgeBlockId === kb.id)

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
                examMatrixName: matrixMap.get(kb.examMatrixId) || '',
                knowledgeBlockName: kb.name,
                knowledgeBlockId: kb.id,
                ...stats,
            }
        })
    }, [knowledgeBlocks, allQuestionsForStats, matrixMap])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24} className="mt-4">
                    <Row justify="end" gutter={8} className="gap-2">
                        <Button
                            type="primary"
                            size="middle"
                            onClick={() => {
                                if (!examFrameworkId || !matrixId) return
                                store.setState((s) => ({
                                    ...s,
                                    matrixId,
                                }))
                                localStorage.setItem('currentMatrixId', matrixId)
                                onOpenPickQuestionFromBank({
                                    examFrameworkId: examFrameworkId,
                                    matrixId: matrixId,
                                })
                            }}
                        >
                            <BookPlus size={15} />
                            Thêm câu hỏi từ ngân hàng
                        </Button>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        className="mt-2"
                        bordered
                        data={data}
                        pagination={false}
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
                                            className="text-sm cursor-pointer text-blue-600 hover:text-blue-800"
                                            onClick={() => {
                                                onOpenQuestionListModal({
                                                    knowledgeBlockId: record.knowledgeBlockId,
                                                    questionBankId,
                                                    subjectVersionId:
                                                        initialValue?.subjectVersionId || '',
                                                    matrixName: record.examMatrixName,
                                                })
                                            }}
                                        />
                                    </Tooltip>
                                ),
                            },
                        ]}
                    />
                </Col>
            </Row>
        </div>
    )
}
