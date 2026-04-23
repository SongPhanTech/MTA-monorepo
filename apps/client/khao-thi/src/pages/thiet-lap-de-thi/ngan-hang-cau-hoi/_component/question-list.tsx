import { FileWordOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import HtmlTruncate from "@components/commons/html-truncate"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { LEVEL_COLUMNS, QUESTION_TYPE_LABELS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import type { QuestionType } from "@workspace/db/client"
import {
  useFindManyKnowledgeBlock,
  useFindManyQuestion,
  useFindUniqueQuestionBank,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Col, Flex, message, Popconfirm, Row } from "antd"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface QuestionListProps {
  questionBankId: string
}

export default function QuestionList({ questionBankId }: QuestionListProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as string[])
  }
  const [filters, setFilters] = useState<FilterProps>({
    questionType: undefined,
    content: "",
    explanation: "",
    difficult: undefined,
  })

  const { onOpen: onOpenPutQuestion } = useDisclosure<{
    id: string
    questionBankId: string
    subjectVersionId: string
  }>({
    tag: "PutQuestionModal",
  })

  const { onOpen: onOpenWordImport } = useDisclosure<{
    questionBankId: string
    knowledgeBlockId: string
  }>({
    tag: "WordImportModal",
  })

  const { onOpen: onOpenMoveQuestion } = useDisclosure<{
    questionIds: string[]
    onDone?: () => void
  }>({
    tag: "MoveQuestionModal",
  })

  const { onOpen: onOpenNganHangKhungDe } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "AddNganHangKhungDe",
  })

  const { data: initialValue } = useFindUniqueQuestionBank(
    {
      where: { id: questionBankId },
      include: {
        subjectVersion: true,
        questions: {
          include: {
            multipleChoiceOptions: true,
            fillInBlankSlots: true,
            orderingItems: true,
          },
        },
      },
    },
    { enabled: !!questionBankId }
  )

  const { data: knowledgeBlockData = [] } = useFindManyKnowledgeBlock()

  const where = useMemo(
    () => ({
      deletedAt: null as null,
      questionBankId,
      ...(filters.questionType && filters.questionType.length > 0
        ? {
            type: { in: filters.questionType },
          }
        : {}),
      ...(filters.content && filters.content !== ""
        ? {
            content: {
              contains: filters.content,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.explanation && filters.explanation !== ""
        ? {
            explanation: {
              contains: filters.explanation,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.difficult && filters.difficult.length > 0
        ? {
            difficult: { in: filters.difficult },
          }
        : {}),
    }),
    [questionBankId, filters.questionType, filters.content, filters.explanation, filters.difficult]
  )

  const queryOptions = useMemo(
    () => ({
      enabled: !!questionBankId,
    }),
    [questionBankId]
  )

  const { data } = useFindManyQuestion(
    {
      where,
      include: {
        knowledgeBlock: true,
        multipleChoiceOptions: true,
        fillInBlankSlots: true,
        orderingItems: true,
      },
    },
    queryOptions
  )

  async function handleDeleteQuestion(id: string) {
    try {
      const res = await sqlTransaction([
        {
          model: "ExamBankQuestion",
          operation: "deleteMany",
          data: {
            where: {
              questionId: id,
            },
          },
        },
        {
          model: "Question",
          operation: "delete",
          data: {
            where: {
              id: id,
            },
          },
        },
      ])

      if (res.status !== 200) {
        message.error("Xóa câu hỏi thất bại")
        return
      }

      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Question"],
      })

      message.success("Xóa câu hỏi thành công")
    } catch (error: any) {
      return message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  async function handleDeleteMany() {
    try {
      const res = await sqlTransaction([
        {
          model: "ExamBankQuestion",
          operation: "deleteMany",
          data: {
            where: {
              questionId: { in: selectedRowKeys },
            },
          },
        },
        {
          model: "Question",
          operation: "deleteMany",
          data: {
            where: {
              id: { in: selectedRowKeys },
            },
          },
        },
      ])

      if (res.status !== 200) {
        message.error("Xóa câu hỏi thất bại")
        return
      }
      message.success(`Đã xóa ${selectedRowKeys.length} câu hỏi`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Question"],
      })
    } catch {
      message.error("Xóa câu hỏi thất bại")
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[8, 8]} align="top" justify="end">
            <Col span={24}>
              <Flex justify="end" align="center" gap={8}>
                {selectedRowKeys.length > 0 && (
                  <>
                    <span className="font-medium">(Đã chọn {selectedRowKeys.length} mục)</span>
                    <Button
                      type="primary"
                      className="bg-blue-600"
                      onClick={() => setSelectedRowKeys([])}
                    >
                      Bỏ chọn
                    </Button>
                    <Popconfirm
                      title="Xóa câu hỏi"
                      description={`Bạn có chắc muốn xóa ${selectedRowKeys.length} câu hỏi không?`}
                      onConfirm={handleDeleteMany}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button className="bg-red-600" type="primary">
                        Xóa
                      </Button>
                    </Popconfirm>
                    <Button
                      type="primary"
                      onClick={() =>
                        onOpenMoveQuestion({
                          questionIds: selectedRowKeys,
                          onDone: () => {
                            setSelectedRowKeys([])
                          },
                        })
                      }
                    >
                      Chuyển tới
                    </Button>
                  </>
                )}
                <Button
                  type="primary"
                  onClick={() =>
                    onOpenNganHangKhungDe({
                      subjectVersionId: initialValue?.subjectVersionId || undefined,
                    })
                  }
                >
                  Thêm mới khung đề
                </Button>
                <Button
                  size="middle"
                  icon={<FileWordOutlined />}
                  onClick={() =>
                    onOpenWordImport({
                      questionBankId: questionBankId,
                      knowledgeBlockId: "",
                    })
                  }
                  type="primary"
                >
                  Nhập dữ liệu bằng word
                </Button>

                <Button
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
            }}
            className="mt-2"
            rowSelection={{
              type: "checkbox",
              selectedRowKeys,
              onChange: onSelectChange,
            }}
            scroll={{ y: "calc(100vh - 260px)" }}
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
                type: "input",
                render: (__, record) => (
                  <HtmlTruncate>
                    <div>
                      {/* Nội dung câu hỏi */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: record.content
                            ? renderWithMath(record.content)
                            : "<i>Chưa có nội dung</i>",
                        }}
                      />

                      {/* Các đáp án trắc nghiệm */}
                      {/* {(record.type === QuestionType.MULTIPLE_CHOICE ||
                        record.type === QuestionType.SINGLE_CHOICE) && (
                        <div className="mt-2 space-y-1">
                          {record?.multipleChoiceOptions
                            ?.sort(
                              (
                                a: MultipleChoiceOption,
                                b: MultipleChoiceOption
                              ) => (a.order || 0) - (b.order || 0)
                            )
                            .map((option: MultipleChoiceOption) => (
                              <div
                                key={option.id}
                                className={`text-xs ${"text-gray-600"}`}
                              >
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: option.content
                                      ? renderWithMath(option.content)
                                      : "",
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      )} */}

                      {/* Các đáp án sắp xếp thứ tự */}
                      {/* {record.type === QuestionType.ORDERING && (
                        <div className="mt-2 space-y-1">
                          {record?.orderingItems
                            ?.sort(
                              (a: OrderingItem, b: OrderingItem) =>
                                (a.correctOrder || 0) - (b.correctOrder || 0)
                            )
                            .map((item: OrderingItem, index: number) => (
                              <div
                                key={item.id}
                                className="text-xs text-gray-600"
                              >
                                {index + 1}.{" "}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: item.content
                                      ? renderWithMath(item.content)
                                      : "",
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      )} */}
                    </div>
                  </HtmlTruncate>
                ),
              },
              {
                title: "Loại câu hỏi",
                dataIndex: "questionType",
                width: 140,
                align: "center",
                type: "select",
                options: QUESTION_TYPE_OPTIONS,
                render: (__, record) => QUESTION_TYPE_LABELS[record?.type as QuestionType] || "",
              },
              {
                title: "Độ khó",
                dataIndex: "difficult",
                width: 100,
                align: "center",
                type: "select",
                options: LEVEL_COLUMNS.map((level) => ({
                  value: level.difficult,
                  label: level.label,
                })),
                render: (__, record) => {
                  return (
                    LEVEL_COLUMNS.find((level) => level.difficult === record.difficult)?.label || ""
                  )
                },
              },
              {
                title: "Chuẩn đầu ra",
                dataIndex: "knowledgeBlockId",
                width: 150,
                align: "center",
                type: "select",
                options: knowledgeBlockData.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (__, record) => {
                  return record?.knowledgeBlock?.name || ""
                },
              },
              {
                title: "Thao tác",
                width: 90,
                align: "center",
                fixed: "right",
                render: (__, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        <EditIcon
                          className="text-sm text-blue-700 cursor-pointer"
                          onClick={() =>
                            onOpenPutQuestion({
                              id: record.id,
                              questionBankId,
                              subjectVersionId: initialValue?.subjectVersionId || "",
                            })
                          }
                        />
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: () => handleDeleteQuestion(record.id),
                          }}
                        />
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            data={data}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}
