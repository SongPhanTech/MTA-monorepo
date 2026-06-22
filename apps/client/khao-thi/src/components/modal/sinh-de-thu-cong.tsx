import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import { useStore } from "@tanstack/react-store"
import { $Enums, type ExamBank } from "@workspace/db/client"
import {
  useFindManyKnowledgeBlock,
  useFindManySubjectVersion,
  useFindUniqueExam,
  useFindUniqueExamBank,
} from "@workspace/db/hooks"
import { Button, Checkbox, Col, DatePicker, Form, Input, message, Row, Steps } from "antd"
import dayjs from "dayjs"
import { GripVertical } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useDisclosure } from "react-hook-disclosure-modal"
import { store } from "@/pages/thiet-lap-de-thi/danh-sach-de"
import { renderQuestionPreviewHtml } from "@/utils/cluster-question-utils"
import { examTypeOptions } from "@workspace/libs/constants"
import { useSingleTopicGeneration } from "@workspace/libs/api/exam"

type PutMaTranDeInputType = ExamBank & {
  questions: string[]
  subjectVersionId: string
}

type StepItem = {
  title: string
  content: React.ReactNode
  fields?: string[]
}

const { Step } = Steps

export type ItemProps = {
  value: string
  label: string
  title?: string
  isParent?: boolean
}

const SinhDeThuCongModal = () => {
  const [form] = Form.useForm<PutMaTranDeInputType>()
  const selectedExamId = useStore(store, (state) => state.selectedExamId)
  const [current, setCurrent] = useState(0)
  const [showExplain, setShowExplain] = useState(false)
  const [items, setItems] = useState<any[] | []>([])
  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    subjectVersionId?: string
  }>({
    tag: "SinhDeThuCongModal",
    onClose: form.resetFields,
  })

  const { data: subjectVersions = [] } = useFindManySubjectVersion({
    orderBy: { createdAt: "desc" },
  })

  const { data: KnowledgeBlockData = [] } = useFindManyKnowledgeBlock(
    {
      where: {
        examMatrix: {
          examFramework: {
            subjectVersionId: input?.subjectVersionId,
          },
        },
      },
      include: {
        examMatrix: {
          include: {
            examFramework: true,
          },
        },
        questions: {
          where: {
            parentQuestionId: null,
            deletedAt: null,
          },
          include: {
            multipleChoiceOptions: true,
            fillInBlankSlots: true,
            orderingItems: true,
            questionBank: true,
            subQuestions: {
              where: { deletedAt: null },
              orderBy: { order: "asc" },
              include: {
                multipleChoiceOptions: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    {
      enabled: !!input?.subjectVersionId,
    }
  )

  const { data } = useFindUniqueExamBank(
    {
      where: { id: input?.id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                subQuestions: {
                  where: { deletedAt: null },
                  orderBy: { order: "asc" },
                  include: {
                    multipleChoiceOptions: { orderBy: { order: "asc" } },
                  },
                },
              },
            },
          },
        },
        examMatrix: {
          include: {
            examFramework: true,
          },
        },
      },
    },
    { enabled: !!input?.id }
  )

  const { data: dataExam } = useFindUniqueExam(
    {
      where: { id: selectedExamId },
      include: {
        subjectClass: true,
        subjectVersion: true,
      },
    },
    {
      enabled: !!selectedExamId,
    }
  )

  const dataOption = useMemo(() => {
    return dataExam?.subjectClass
      ? dataExam?.subjectClass.map((item) => {
          return {
            value: item?.id,
            label: `${item?.code}-${item?.name}`,
          }
        })
      : []
  }, [dataExam])

  const questionById = useMemo(() => {
    const map = new Map<string, Parameters<typeof renderQuestionPreviewHtml>[0]>()
    for (const block of KnowledgeBlockData) {
      for (const question of block.questions) map.set(question.id, question)
    }
    for (const eq of data?.questions ?? []) {
      if (eq.question) map.set(eq.questionId, eq.question)
    }
    return map
  }, [KnowledgeBlockData, data?.questions])

  const treeData = useMemo(() => {
    return KnowledgeBlockData.map((item) => ({
      value: item.id,
      title: item.name,
      isParent: true,
      children: item.questions.map((question) => ({
        value: question.id,
        title: question.content,
        label: question.content,
        html: renderQuestionPreviewHtml(question),
        isParent: false,
      })),
    }))
  }, [KnowledgeBlockData])

  const next = async () => {
    try {
      await form.validateFields(steps[current].fields)
      setCurrent(current + 1)
    } catch (err) {
      message.error("Vui lòng nhập đủ thông tin trước khi tiếp tục!")
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const { mutateAsync: generateSingleTopic } = useSingleTopicGeneration()
  const onOk = async (values: PutMaTranDeInputType) => {
    try {
      if (!values || !selectedExamId) return

      const examMatrixId = KnowledgeBlockData[0]?.examMatrixId
      const examFrameworkId = KnowledgeBlockData[0]?.examMatrix?.examFramework?.id

      const res = await generateSingleTopic({
        data: {
          id: input?.id ?? "",
          examCode: values.examCode,
          explain: values.explain,
          examDay: values.examDay ? dayjs(values.examDay).toISOString() : null,
          examId: selectedExamId,
          examType: values.examType,
          subjectClassId: values.subjectClassId ?? "",
          isGroup: values.isGroup ?? true,
          isNote: values.isNote ?? false,
          examMatrixId: examMatrixId ?? "",
          examFrameworkId: examFrameworkId ?? "",
        },
      })

      if (res?.status === 200) {
        message.success(input?.id ? "Cập nhật đề thành công!" : "Tạo đề thành công!")
        queryClient.invalidateQueries({ queryKey: ["zenstack", "ExamBank"] })
        onClose()
      } else {
        message.error(input?.id ? "Cập nhật đề thất bại!" : "Tạo đề thất bại!")
      }
    } catch (error) {
      console.log(error)
      message.error("Tạo đề thất bại!")
    }
  }
  const ItemType = "LIST_ITEM"
  type Item = {
    value: string
  }

  type DragItem = {
    id: number
    index: number
    type: string
  }

  const moveItem = (from: number, to: number) => {
    const updated = [...items]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setItems(updated)
    // đồng bộ thứ tự (để values.questions cũng đúng)
    form.setFieldValue(
      "questions",
      updated.map((it: { value: string }) => it.value)
    )
  }
  const DraggableItem = ({
    item,
    index,
    moveItem,
  }: {
    item: Item
    index: number
    moveItem: (from: number, to: number) => void
  }) => {
    const ref = useRef<HTMLDivElement>(null)

    const [, drop] = useDrop<DragItem>({
      accept: ItemType,
      hover(draggedItem) {
        if (draggedItem.index !== index) {
          moveItem(draggedItem.index, index)
          draggedItem.index = index
        }
      },
    })

    const [, drag] = useDrag({
      type: ItemType,
      item: { id: item.value, index },
    })

    drag(drop(ref))

    return (
      <div
        ref={ref}
        className="p-2 flex items-start border rounded mb-2 bg-white shadow-sm cursor-move w-full"
      >
        <GripVertical className="text-blue-400 shrink-0 mt-1" />
        <div
          className="ml-2 font-[500] flex-1 min-w-0"
          dangerouslySetInnerHTML={{
            __html: renderQuestionPreviewHtml(questionById.get(item.value) ?? {}),
          }}
        />
      </div>
    )
  }
  const handleOnChange = (value: string[]) => {
    if (value?.length) {
      const newItems = value.map((i) => ({
        value: i,
      }))
      setItems(newItems)

      form.setFieldValue(
        "questions",
        newItems.map((it) => it.value)
      )
    } else {
      setItems([])
    }
  }

  useEffect(() => {
    if (input?.subjectVersionId) {
      form.setFieldValue("subjectVersionId", input.subjectVersionId)
    }
  }, [input?.subjectVersionId, form.setFieldValue])

  useEffect(() => {
    form.setFieldsValue({
      examType: dataExam?.subjectVersion?.examType,
      subjectClassId: dataExam?.subjectClass?.[0]?.id,
      examDay: dataExam?.subjectClass?.[0]?.examDate
        ? dayjs(dataExam?.subjectClass?.[0]?.examDate)
        : undefined,
    })
  }, [dataExam?.subjectVersion?.examType, dataExam?.subjectClass])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const steps: StepItem[] = useMemo(() => {
    return [
      {
        title: "Thông tin chung",
        content: (
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <FormItem form={form} name="examCode" label="Mã đề" required>
                <Input placeholder="Nhập mã đề" />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="examType" label="Hình thức thi" required>
                <Select
                  options={examTypeOptions
                    .filter(
                      (opt) =>
                        opt.value === $Enums.ExamType.OfflineWritten ||
                        opt.value === $Enums.ExamType.Oral ||
                        opt.value === $Enums.ExamType.OnlineWritten
                    )
                    .map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                  placeholder="Chọn hình thức thi"
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="examDay" label="Ngày thi" required>
                <DatePicker
                  format={{
                    format: "DD/MM/YYYY",
                    type: "mask",
                  }}
                  className="w-full"
                  placeholder="Chọn ngày thi"
                  disabledDate={(current) => {
                    return current && current < dayjs().subtract(1, "d")
                  }}
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="subjectClassId" label="Dùng cho lớp">
                <Select options={dataOption} placeholder="Chọn lớp môn học" />
              </FormItem>
            </Col>
            <Col span={44}>
              <FormItem form={form} name="isGroup" valuePropName="checked" initialValue={true}>
                <Checkbox>Hiển thị tiêu đề</Checkbox>
              </FormItem>
            </Col>
            <Col span={5}>
              <FormItem form={form} name="isNote" valuePropName="checked" initialValue={false}>
                <Checkbox>Được sử dụng tài liệu</Checkbox>
              </FormItem>
            </Col>
            <Col span={4}>
              <Form.Item>
                <Checkbox checked={showExplain} onChange={(e) => setShowExplain(e.target.checked)}>
                  Khác
                </Checkbox>
              </Form.Item>
            </Col>

            {showExplain && (
              <Col span={24} className="mt-3">
                <FormItem form={form} name="explain" label="Chú thích">
                  <Input.TextArea placeholder="Nhập chú thích" />
                </FormItem>
              </Col>
            )}
          </Row>
        ),
        fields: ["examCode", "examType", "examDay"],
      },
      {
        title: "Cấu hình sinh đề",
        content: (
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <FormItem form={form} name="questions" label="Chọn câu hỏi" required>
                <TreeSelect
                  maxTagCount={"responsive"}
                  treeData={treeData}
                  multiple
                  treeCheckable={true}
                  // treeCheckStrictly
                  showCheckedStrategy="SHOW_CHILD"
                  placeholder="Chọn câu hỏi"
                  // maxTagCount={'responsive'} // overflow hidden
                  treeDefaultExpandAll
                  onChange={handleOnChange}
                  style={{ width: "100%" }}
                  treeTitleRender={(node) =>
                    node.isParent ? (
                      <span>{String(node.title)}</span>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: String((node as { html?: string }).html ?? ""),
                        }}
                      />
                    )
                  }
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <Row gutter={[16, 16]}>
                <Col span={24} className="font-semibold pl-4">
                  Danh sách câu hỏi trong đề:
                </Col>
                <Col span={24}>
                  <DndProvider backend={HTML5Backend}>
                    <div className="mt-3 max-h-[400px] overflow-y-auto pr-2">
                      {items.map((item: Item, index: number) => (
                        <DraggableItem
                          key={item.value}
                          item={item}
                          index={index}
                          moveItem={moveItem}
                        />
                      ))}
                    </div>
                  </DndProvider>
                </Col>
              </Row>
            </Col>
          </Row>
        ),
        fields: ["subjectVersionId", "questions"],
      },
    ]
  }, [input, subjectVersions, treeData, items, current, form, showExplain])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (data) {
      const initialItems =
        data?.questions.map((i: any) => ({
          value: i.questionId,
        })) || []
      setItems(initialItems)
      setShowExplain(!!data.explain)
      form.setFieldsValue({
        ...data,
        examDay: data.examDay ? dayjs(data.examDay) : undefined,
        questions: initialItems.map((i) => i?.value),
        subjectVersionId: input?.subjectVersionId,
        subjectClassId: data?.subjectClassId || null,
        isGroup: data?.isGroup || true,
        isNote: data?.isNote || false,
      })
    }
  }, [data])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      title="Thông tin tạo đề"
      onCancel={onClose}
      onFinish={onOk}
      footer={null}
      className="w-[50vw] top-2"
    >
      <Col span={24}>
        <div className="w-full max-w-[500px] mx-auto mt-6">
          <Steps current={current} style={{ marginBottom: 24 }}>
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </div>
      </Col>
      <Col span={24}>
        {steps.map((step, index) => (
          <div key={step.title} style={{ display: index === current ? "block" : "none" }}>
            {step.content}
          </div>
        ))}

        <div className="flex justify-end" style={{ marginTop: 24 }}>
          {current > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              Quay lại
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Tiếp theo
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          )}
        </div>
      </Col>
    </PutFormModal>
  )
}

export default SinhDeThuCongModal
