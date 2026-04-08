import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import { useStore } from "@tanstack/react-store"
import type { ExamBank } from "@workspace/db/client"
import {
  useCreateExamBank,
  useFindManyKnowledgeBlock,
  useFindManySubjectVersion,
  useFindUniqueExam,
  useFindUniqueExamBank,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Checkbox, Col, DatePicker, Form, Input, message, Row, Steps } from "antd"
import dayjs from "dayjs"
import { GripVertical } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useDisclosure } from "react-hook-disclosure-modal"
import { store } from "@/pages/thiet-lap-de-thi/danh-sach-de"
import { examTypeOptions } from "@workspace/libs/constants"

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
          include: {
            multipleChoiceOptions: true,
            fillInBlankSlots: true,
            orderingItems: true,
            questionBank: true,
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
            question: true,
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

  const treeData = useMemo(() => {
    return KnowledgeBlockData.map((item) => {
      return {
        value: item.id,
        title: item.name,
        isParent: true,
        children: item.questions.map((question) => {
          return {
            value: question.id,
            title: renderWithMath(question.content),
            isParent: false,
            html: question.content,
          }
        }),
      }
    })
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

  const { mutateAsync: create } = useCreateExamBank()
  const orderedQuestionIds = items.map((it: { value: string }) => it.value)
  const onOk = async (values: PutMaTranDeInputType) => {
    try {
      if (!values || !selectedExamId) return

      // Lấy examMatrixId từ KnowledgeBlock
      const examMatrixId = KnowledgeBlockData[0]?.examMatrixId

      if (input?.id) {
        const res = await sqlTransaction([
          {
            model: "ExamBank",
            operation: "update",
            data: {
              where: {
                id: input.id,
              },
              data: {
                examCode: values.examCode,
                explain: values.explain,
                examDay: values.examDay ? dayjs(values.examDay).toDate() : null,
                examId: selectedExamId,
                examType: values.examType,
                subjectClassId: values.subjectClassId ?? undefined,
                isGroup: values.isGroup || true,
                isNote: values.isNote,
                examMatrixId: examMatrixId ?? undefined,
              },
            },
          },
          {
            model: "ExamBankQuestion",
            operation: "deleteMany",
            data: {
              where: {
                examBankId: input.id,
              },
            },
          },
          {
            model: "ExamBankQuestion",
            operation: "createMany",
            data: {
              data: orderedQuestionIds.map((questionId, index) => ({
                questionId,
                order: index + 1,
                examBankId: input.id,
              })),
            },
          },
        ])
        if (res?.status === 200) {
          message.success("Cập nhật đề thành công!")
          queryClient.invalidateQueries({
            queryKey: ["zenstack", "ExamBank"],
          })
        } else {
          message.error("Cập nhật đề thất bại!")
          return
        }
      } else {
        await create({
          data: {
            examCode: values.examCode,
            explain: values.explain,
            examDay: values.examDay ? dayjs(values.examDay).toDate() : null,
            examId: selectedExamId,
            examType: values.examType,
            subjectClassId: values.subjectClassId ?? undefined,
            isGroup: values.isGroup || true,
            isNote: values.isNote,
            examMatrixId: examMatrixId ?? undefined,
            questions: {
              createMany: {
                data: orderedQuestionIds.map((questionId, index) => ({
                  questionId,
                  order: index + 1,
                })),
              },
            },
          },
        })
        message.success("Tạo đề thành công!")
      }

      queryClient.invalidateQueries({
        queryKey: ["ExamBank"],
      })
      onClose()
    } catch (error) {
      console.log(error)
      message.error("Tạo đề thất bại!")
    }
  }
  const ItemType = "LIST_ITEM"
  type Item = {
    value: string
    label: any
    title?: string
    html: any
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
        className="p-2 flex items-center border rounded mb-2 bg-white shadow-sm cursor-move w-full"
      >
        <GripVertical className="text-blue-400" />

        {item?.label?.props?.dangerouslySetInnerHTML?.__html ? (
          <div
            className="ml-2 font-[500]"
            dangerouslySetInnerHTML={{
              __html: item?.label?.props?.dangerouslySetInnerHTML?.__html,
            }}
          />
        ) : (
          <div
            className="ml-2 font-[500]"
            dangerouslySetInnerHTML={{
              __html: item?.label,
            }}
          />
        )}
      </div>
    )
  }
  const handleOnChange = (value: string[], label: React.ReactNode[]) => {
    if (value?.length) {
      const newItems = value.map((i, idx) => ({
        value: i,
        label: label?.[idx],
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
              <FormItem
                form={form}
                name="examType"
                label="Hình thức thi"
                required
                initialValue={!input?.id ? dataExam?.subjectVersion?.examType : undefined}
              >
                <Select
                  options={examTypeOptions
                    .filter(
                      (opt) =>
                        opt.value === "OfflineWritten" ||
                        opt.value === "Oral" ||
                        opt.value === "OnlineWritten"
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
              <FormItem
                form={form}
                name="subjectClassId"
                label="Dùng cho lớp"
                initialValue={!input?.id ? dataExam?.subjectClass?.[0]?.id : undefined}
              >
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
                  treeTitleRender={(node) => {
                    return (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: node?.title || "",
                        }}
                      />
                    )
                  }}
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
          label: i.question.content,
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
