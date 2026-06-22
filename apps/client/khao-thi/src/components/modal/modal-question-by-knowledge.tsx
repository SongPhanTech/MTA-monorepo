import HtmlTruncate from "@components/commons/html-truncate"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { CLUSTER_QUESTION_TYPE, formatClusterSubLabel } from "@/utils/cluster-question-utils"
import { LEVEL_COLUMNS, QUESTION_TYPE_LABELS } from "@constants/constants"
import type { QuestionType } from "@workspace/db/client"
import {
  useCountQuestion,
  useFindManyQuestion,
  useUpdateManyQuestion,
  useUpdateQuestion,
} from "@workspace/db/hooks"
import { Button, Modal, message, Popconfirm, Row } from "antd"
import { RowSelectMethod } from "antd/es/table/interface"
import { Key, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
// import type { MultipleChoiceOption } from "../../../../prisma/client";

export default function QuestionListByKnowledgeBlockModal() {
  const { isOpen, onClose, input } = useDisclosure<{
    knowledgeBlockId: string
    questionBankId: string
    subjectVersionId: string
  }>({
    tag: "QuestionListByKnowledgeBlockModal",
  })
  const { onOpen: onOpenPutQuestion } = useDisclosure<{
    id: string
    questionBankId: string
    subjectVersionId: string
  }>({
    tag: "PutQuestionModal",
  })
  const { knowledgeBlockId } = input || {}
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)

  const where = useMemo(
    () => ({
      knowledgeBlockId,
      deletedAt: null,
      parentQuestionId: null,
    }),
    [knowledgeBlockId]
  )

  const { data: questions = [] } = useFindManyQuestion(
    {
      where,
      include: {
        knowledgeBlock: true,
        multipleChoiceOptions: true,
        fillInBlankSlots: true,
        orderingItems: true,
        subQuestions: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          include: {
            multipleChoiceOptions: { orderBy: { order: "asc" } },
          },
        },
        questionBank: {
          include: {
            subjectVersion: true,
          },
        },
      },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!knowledgeBlockId && isOpen }
  )
  const { data: totalQuestions = 0 } = useCountQuestion(
    {
      where,
    },
    { enabled: !!knowledgeBlockId && isOpen }
  )

  const { data: allQuestions = [] } = useFindManyQuestion(
    {
      where,
      select: {
        id: true,
      },
    },
    { enabled: !!knowledgeBlockId && isOpen }
  )

  const { mutateAsync: updateQuestion } = useUpdateQuestion()
  const { mutateAsync: updateManyQuestion } = useUpdateManyQuestion()

  async function handleDeleteQuestion(id: string) {
    try {
      await updateQuestion({
        where: { id },
        data: { deletedAt: new Date() },
      })
      message.success("Đã xoá câu hỏi")
    } catch {
      message.error("Không thể xoá câu hỏi")
    }
  }
  async function handleDeleteManyQuestions() {
    if (!selectedRowKeys.length) {
      message.warning("Vui lòng chọn ít nhất 1 câu hỏi")
      return
    }

    try {
      await updateManyQuestion({
        where: isAllSelected
          ? where
          : {
              id: {
                in: selectedRowKeys,
              },
            },
        data: { deletedAt: new Date() },
      })

      message.success(`Đã xoá ${selectedRowKeys.length} câu hỏi`)
      setSelectedRowKeys([])
      setIsAllSelected(false)
    } catch (error) {
      message.error("Không thể xoá nhiều câu hỏi")
    }
  }

  useEffect(() => {
    if (!knowledgeBlockId) return
    setCurrentPage(1)
    setSelectedRowKeys([])
    setIsAllSelected(false)
  }, [knowledgeBlockId])

  const rowSelection = {
    type: "checkbox" as const,
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onSelect: (record: any, selected: boolean) => {
      if (selected) {
        setSelectedRowKeys((prev) => {
          if (prev.includes(record.id)) return prev
          return [...prev, record.id]
        })
      } else {
        setIsAllSelected(false)
        setSelectedRowKeys((prev) => prev.filter((id) => id !== record.id))
      }
    },
    onChange: (
      _keys: Key[],
      _rows: any,
      info: {
        type: RowSelectMethod
      }
    ) => {
      if (info?.type !== "all") return

      if (isAllSelected) {
        setSelectedRowKeys([])
        setIsAllSelected(false)
        return
      }

      setSelectedRowKeys(allQuestions.map((q) => q.id))
      setIsAllSelected(true)
    },
  }

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
        scroll={{ y: "60vh" }}
        data={questions}
        rowSelection={rowSelection}
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
          showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} câu hỏi`,
        }}
        columns={[
          {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1 + (currentPage - 1) * pageSize,
          },
          {
            title: "Nội dung câu hỏi",
            dataIndex: "content",
            width: 300,
            fixed: "left",
            render: (_, record) => {
              const row = record as typeof record & {
                subQuestions?: Array<{
                  id: string
                  content: string
                  multipleChoiceOptions?: Array<{ id: string; content: string }>
                }>
              }

              return (
                <HtmlTruncate>
                  <div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: row.content
                          ? renderWithMath(row.content)
                          : "<i>Chưa có nội dung</i>",
                      }}
                    />
                    {(row.subQuestions?.length ?? 0) > 0 && row.type === CLUSTER_QUESTION_TYPE && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-2">
                        {(row.subQuestions ?? []).map((sub, subIndex) => {
                          const { prefix, body } = formatClusterSubLabel(subIndex, sub.content)
                          return (
                            <div key={sub.id} className="text-xs">
                              <div className="font-medium text-gray-700 mb-1">
                                {prefix}
                                {body ? (
                                  <>
                                    {" "}
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: renderWithMath(body),
                                      }}
                                    />
                                  </>
                                ) : null}
                              </div>
                              {sub.multipleChoiceOptions?.map((option) => (
                                <div key={option.id} className="text-gray-600 pl-2">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: option.content ? renderWithMath(option.content) : "",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </HtmlTruncate>
              )
            },
          },
          {
            title: "Loại",
            dataIndex: "type",
            width: 120,
            align: "center",
            render: (_, r) => QUESTION_TYPE_LABELS[r.type as QuestionType] || "",
          },
          {
            title: "Độ khó",
            dataIndex: "difficult",
            width: 100,
            align: "center",
            render: (_, r) => LEVEL_COLUMNS.find((l) => l.difficult === r.difficult)?.label,
          },
          {
            title: "Điểm",
            dataIndex: "point",
            width: 80,
            align: "center",
            render: (point: number) => point ?? 0,
          },
          {
            title: "Thao tác",
            width: 90,
            align: "center",
            fixed: "right",
            render: (_, record) => (
              <Row className="justify-center gap-2">
                <EditIcon
                  className="text-blue-600"
                  onClick={(e) => {
                    onOpenPutQuestion({
                      id: record.id,
                      questionBankId: record.questionBankId,
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
            <span className="text-sm text-gray-500">Đã chọn {selectedRowKeys.length} câu hỏi</span>
          )}
        </div>

        <Popconfirm
          title="Xoá các câu hỏi đã chọn?"
          description="Thao tác này không thể hoàn tác"
          onConfirm={handleDeleteManyQuestions}
          okText="Xoá"
          cancelText="Huỷ"
        >
          {selectedRowKeys.length > 0 && <Button danger>Xoá</Button>}
        </Popconfirm>
      </Row>
    </Modal>
  )
}
