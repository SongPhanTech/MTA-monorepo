import { EyeOutlined, RightOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import { LEVEL_COLORS, QUESTION_TYPE_LABELS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import { store } from "@pages/thiet-lap-de-thi/khung-de"
import { useStore } from "@tanstack/react-store"
import type { ConfigExam } from "@workspace/db/client"
import {
  useFindManyExamMatrix,
  useFindManyKnowledgeBlock,
  useFindManyQuestion,
  useFindUniqueQuestionBank,
} from "@workspace/db/hooks"
import { Button, Col, Row, Tooltip, Alert } from "antd"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface QuestionBankLiteProps {
  examFrameworkId?: string
  questionBankId: string
}

const matchesConfigExam = (
  q: { difficult: string | null; type: string | null; point: number },
  config: ConfigExam
) =>
  q.difficult != null &&
  q.difficult === config.difficult &&
  (config.type == null || q.type === config.type) &&
  q.point === config.point

/**
 * Mô phỏng thứ tự bốc câu của backend khi sinh đề (be-khao-thi: compareConfigExamByType):
 * dòng có loại câu hỏi cụ thể được phân bổ trước, dòng "Tất cả" sau, và mỗi câu chỉ
 * được dùng cho 1 dòng. Trả về số câu còn thiếu của từng dòng cấu hình (theo id).
 * Nhờ vậy các dòng có tập câu giao nhau (vd. "Tất cả" + Trắc nghiệm cùng điểm)
 * không bị đếm trùng 1 câu cho nhiều dòng.
 */
const allocateConfigExams = (
  qs: { id: string; difficult: string | null; type: string | null; point: number }[],
  configs: ConfigExam[]
) => {
  const usedIds = new Set<string>()
  const missingById = new Map<string, number>()

  const sorted = configs
    .filter((c) => c.quantity > 0)
    .sort((a, b) => Number(a.type == null) - Number(b.type == null))

  for (const config of sorted) {
    const available = qs.filter((q) => !usedIds.has(q.id) && matchesConfigExam(q, config))
    const taken = available.slice(0, config.quantity)
    taken.forEach((q) => usedIds.add(q.id))
    missingById.set(config.id, config.quantity - taken.length)
  }

  return missingById
}

const formatMissingQuestionTypes = (labels: string[]) =>
  labels.length === QUESTION_TYPE_OPTIONS.length ? "Tất cả" : labels.join(", ")

export default function QuestionBankLite({
  examFrameworkId,
  questionBankId,
}: QuestionBankLiteProps) {
  const matrixId = useStore(store, (s) => s.matrixId)
  const [warningExpanded, setWarningExpanded] = useState(true)

  const { onOpen: onOpenQuestionListModal } = useDisclosure<{
    knowledgeBlockId: string
    questionBankId: string
    subjectVersionId: string
    matrixName: string
  }>({
    tag: "QuestionListByKnowledgeBlockModal",
  })

  const { onOpen: onOpenPickQuestionFromBank } = useDisclosure<{
    examFrameworkId: string
    matrixId: string
  }>({
    tag: "PickQuestionFromBankModal",
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
        createdAt: "desc",
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
        parentQuestionId: null,
      },
      select: {
        id: true,
        knowledgeBlockId: true,
        difficult: true,
        type: true,
        point: true,
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
          details: string[]
        }
      > = {}

      const missingById = allocateConfigExams(qs, kb.configExams ?? [])

      LEVEL_COLORS.forEach((l) => {
        const configs = (kb.configExams ?? []).filter(
          (c) => c.difficult === l.key && c.quantity > 0
        )
        const required = configs.reduce((sum, c) => sum + c.quantity, 0)
        // Câu hiện có: câu khớp ít nhất 1 dòng cấu hình của mức này
        const current = qs.filter((q) => configs.some((c) => matchesConfigExam(q, c))).length
        // Số thiếu theo phân bổ giống backend (không đếm 1 câu cho nhiều dòng)
        const missing = configs.reduce((sum, c) => sum + (missingById.get(c.id) ?? 0), 0)
        const details = configs.map((c) => {
          const typeLabel = c.type
            ? (QUESTION_TYPE_LABELS[c.type as keyof typeof QUESTION_TYPE_LABELS] ?? c.type)
            : "Tất cả"
          return `${c.quantity} câu ${typeLabel}, ${c.point} điểm/câu`
        })

        stats[l.key] = { current, required, missing, details }
      })

      return {
        key: kb.id,
        examMatrixName: matrixMap.get(kb.examMatrixId) || "",
        knowledgeBlockName: kb.name,
        knowledgeBlockId: kb.id,
        ...stats,
      }
    })
  }, [knowledgeBlocks, allQuestionsForStats, matrixMap])

  const missingByBlock = useMemo(() => {
    const groups: {
      knowledgeBlockId: string
      knowledgeBlockName: string
      items: {
        key: string
        levelLabel: string
        typeLabel: string
        point: number
        missing: number
        missingTypeLabels: string[]
      }[]
    }[] = []

    for (const kb of knowledgeBlocks) {
      const qs = allQuestionsForStats.filter((q) => q.knowledgeBlockId === kb.id)
      const items: (typeof groups)[number]["items"] = []
      const missingById = allocateConfigExams(qs, kb.configExams ?? [])

      for (const config of kb.configExams ?? []) {
        if (!config.quantity) continue

        const missing = missingById.get(config.id) ?? 0
        if (missing <= 0) continue

        const levelLabel =
          LEVEL_COLORS.find((l) => l.key === config.difficult)?.label ?? config.difficult
        const typeLabel = config.type
          ? (QUESTION_TYPE_LABELS[config.type as keyof typeof QUESTION_TYPE_LABELS] ?? config.type)
          : "Tất cả"

        const poolAtSlot = qs.filter(
          (q) => q.difficult === config.difficult && q.point === config.point
        )
        const missingTypeLabels = config.type
          ? [typeLabel]
          : QUESTION_TYPE_OPTIONS.filter(
              ({ value }) => poolAtSlot.filter((q) => q.type === value).length === 0
            ).map(({ label }) => label)

        items.push({
          key: config.id,
          levelLabel,
          typeLabel,
          point: config.point,
          missing,
          missingTypeLabels,
        })
      }

      if (items.length > 0) {
        groups.push({
          knowledgeBlockId: kb.id,
          knowledgeBlockName: kb.name,
          items,
        })
      }
    }

    return groups
  }, [knowledgeBlocks, allQuestionsForStats])

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
                localStorage.setItem("currentMatrixId", matrixId)
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
          {missingByBlock.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mt-2 mb-4"
              message={
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => setWarningExpanded((v) => !v)}
                >
                  <RightOutlined
                    className={`text-xs transition-transform duration-200 ${warningExpanded ? "rotate-90" : ""}`}
                  />
                  Ngân hàng câu hỏi chưa đủ để sinh đề theo ma trận. Cần bổ sung:
                </button>
              }
              description={
                warningExpanded ? (
                  <ul className="mt-2 mb-0 pl-5 list-disc">
                    {missingByBlock.map((block) => (
                      <li key={block.knowledgeBlockId}>
                        <strong>{block.knowledgeBlockName}</strong>
                        <ul className="mt-1 mb-0 pl-5 list-[circle]">
                          {block.items.map((item) => (
                            <li key={item.key}>
                              {item.levelLabel}, {item.point} đ/câu: thiếu {item.missing} câu
                              {item.missingTypeLabels.length > 0 && (
                                <span className="block text-[13px] text-gray-700 mt-0.5">
                                  Các loại đang thiếu:{" "}
                                  <strong>
                                    {formatMissingQuestionTypes(item.missingTypeLabels)}
                                  </strong>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
          )}
          <Table
            rowKey="id"
            className="mt-2"
            bordered
            data={data}
            pagination={false}
            columns={[
              {
                title: "Ma trận",
                dataIndex: "examMatrixName",
                width: 180,
              },
              {
                title: "Chuẩn đầu ra",
                dataIndex: "knowledgeBlockName",
                width: 220,
              },
              ...LEVEL_COLORS.map((l) => ({
                title: l.label,
                dataIndex: l.key,
                align: "center" as const,
                render: (v: {
                  current: number
                  required: number
                  missing: number
                  details: string[]
                }) => (
                  <Tooltip
                    title={
                      v.required > 0 ? (
                        <div>
                          <div>Cần:</div>
                          {v.details.map((d) => (
                            <div key={d}>- {d}</div>
                          ))}
                        </div>
                      ) : undefined
                    }
                  >
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
                  </Tooltip>
                ),
              })),
              {
                title: "Thao tác",
                width: 100,
                align: "center" as const,
                render: (_: unknown, record: any) => (
                  <Tooltip title="Xem câu hỏi">
                    <EyeOutlined
                      className="text-sm cursor-pointer text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        onOpenQuestionListModal({
                          knowledgeBlockId: record.knowledgeBlockId,
                          questionBankId,
                          subjectVersionId: initialValue?.subjectVersionId || "",
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
