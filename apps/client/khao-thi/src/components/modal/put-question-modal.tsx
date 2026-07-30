import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import ClusterSubQuestionsForm, {
  defaultSubQuestion,
} from "@components/modal/cluster-sub-questions-form"
import {
  buildSubQuestionCreateData,
  CLUSTER_QUESTION_TYPE,
  formatClusterSubLabel,
  mapSubQuestionFromDb,
  updateSubQuestion,
  validateSubQuestion,
} from "@/utils/cluster-question-utils"
import type { SubQuestionFormItem } from "@components/modal/cluster-sub-questions-form"
import { DIFFICULT_OPTIONS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import { type Prisma, QuestionType } from "@workspace/db/client"
import {
  useCreateQuestion,
  useFindManyKnowledgeBlock,
  useFindUniqueQuestion,
  useUpdateQuestion,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Checkbox, Col, Form, Input, InputNumber, message, Radio, Row, Tooltip } from "antd"
import { Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutQuestionType = Prisma.QuestionGetPayload<{
  include: {
    multipleChoiceOptions: {
      select: {
        id?: true
        isCorrect: true
        content: true
      }
    }
    fillInBlankSlots: {
      select: {
        id: true
        order: true
        correctAnswer: true
      }
    }
    orderingItems: {
      select: {
        id?: true
        content: true
        correctOrder: true
      }
    }
  }
}> & {
  subQuestions?: SubQuestionFormItem[]
}

const PutQuestionModal = () => {
  const [form] = Form.useForm<PutQuestionType>()
  const [storageType, setStorageType] = useState<"khung" | "kho">("khung")
  const [dataOptions, setDataOptions] = useState<any>([
    {
      key: "1",
      content: "",
      isCorrect: false,
    },
    {
      key: "2",
      content: "",
      isCorrect: false,
    },
    {
      key: "3",
      content: "",
      isCorrect: false,
    },
    {
      key: "4",
      content: "",
      isCorrect: false,
    },
  ])

  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    questionBankId: string
    subjectVersionId: string
  }>({
    tag: "PutQuestionModal",
    onClose: form.resetFields,
  })

  const typeQuestion = Form.useWatch("type", form)
  const parentDifficult = Form.useWatch("difficult", form)
  const content = Form.useWatch("content", form)
  const explanation = Form.useWatch("explanation", form)
  const listForm =
    (Form.useWatch("multipleChoiceOptions", form) as Array<{
      key?: string
      content: string
      isCorrect?: boolean
      correctOrder?: number
    }>) || []
  const subQuestionsPreview = Form.useWatch("subQuestions", form) || []

  const syncSubQuestionsDifficult = (difficult = parentDifficult) => {
    if (!difficult) return
    const subs: SubQuestionFormItem[] = form.getFieldValue("subQuestions") ?? []
    if (!subs.length) return
    if (subs.every((sq) => sq.difficult === difficult)) return
    form.setFieldValue(
      "subQuestions",
      subs.map((sq) => ({ ...sq, difficult }))
    )
  }

  useEffect(() => {
    if (typeQuestion !== CLUSTER_QUESTION_TYPE) return
    syncSubQuestionsDifficult()
  }, [parentDifficult, typeQuestion, subQuestionsPreview.length])

  const { mutateAsync: createQuestion } = useCreateQuestion()
  const { mutateAsync: updateQuestion } = useUpdateQuestion()

  const { data: initialValue } = useFindUniqueQuestion(
    {
      where: { id: input?.id },
      include: {
        questionBank: true,
        multipleChoiceOptions: true,
        fillInBlankSlots: true,
        orderingItems: true,
        subQuestions: {
          orderBy: { order: "asc" },
          include: {
            multipleChoiceOptions: true,
            fillInBlankSlots: true,
            orderingItems: true,
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
    where: {
      deletedAt: null,
      examMatrix: {
        examFramework: {
          subjectVersionId: input?.subjectVersionId,
        },
      },
    },
  })

  async function onOk(output?: PutQuestionType) {
    if (!output) return
    try {
      if (!input?.questionBankId) {
        message.error("Thiếu mã ngân hàng câu hỏi")
        return
      }
      const data = {
        content: output.content,
        type: output.type,
        explanation: output.explanation,
        isAutoGraded: output.isAutoGraded,
        questionBankId: input?.questionBankId,
        knowledgeBlockId: output.knowledgeBlockId,
        difficult: output.difficult,
        point: output.point ?? 0,
      }

      let res: any = null

      if (output.type === QuestionType.FILL_IN_BLANK) {
        if (!output.multipleChoiceOptions?.length) {
          message.error("Vui lòng nhập đáp án")
          return
        }

        if (input?.id) {
          await updateQuestion({
            data: {
              ...data,
              fillInBlankSlots: {
                upsert: output.multipleChoiceOptions.map((i, index) => ({
                  where: {
                    questionId_order: {
                      questionId: input.id,
                      order: index + 1,
                    },
                  },
                  update: {
                    correctAnswer: i.content,
                  },
                  create: {
                    order: index + 1,
                    correctAnswer: i.content,
                  },
                })),
              },
            },
            where: { id: input.id },
          })
        } else {
          await createQuestion({
            data: {
              ...data,
              fillInBlankSlots: {
                createMany: {
                  data: output.multipleChoiceOptions.map((i, index) => ({
                    order: index + 1,
                    correctAnswer: i.content,
                  })),
                },
              },
            },
          })
        }
      }

      if (output.type === QuestionType.ORDERING) {
        if (!output.multipleChoiceOptions?.length) {
          message.error("Vui lòng nhập các bước")
          return
        }

        const orderingData = (output.multipleChoiceOptions as any[])
          .filter((i) => i.content && i.correctOrder !== undefined)
          .map((i) => ({
            content: i.content,
            correctOrder: Number(i.correctOrder),
          }))

        if (input?.id) {
          await updateQuestion({
            data: {
              ...data,
              orderingItems: {
                upsert: orderingData.map((i) => ({
                  where: {
                    questionId_correctOrder: {
                      questionId: input.id,
                      correctOrder: i.correctOrder,
                    },
                  },
                  update: {
                    content: i.content,
                  },
                  create: {
                    content: i.content,
                    correctOrder: i.correctOrder,
                  },
                })),
              },
            },
            where: { id: input.id },
          })
        } else {
          await createQuestion({
            data: {
              ...data,
              orderingItems: {
                createMany: {
                  data: orderingData,
                },
              },
            },
          })
        }
      }

      if (
        output.type === QuestionType.MULTIPLE_CHOICE ||
        output.type === QuestionType.SINGLE_CHOICE
      ) {
        const error = output.multipleChoiceOptions.find((i) => !i.content)
        if (error || !output.multipleChoiceOptions.length) {
          message.error("Vui lòng nhập đáp án")
          return
        }
        const error1 = output.multipleChoiceOptions.filter((i) => !!i.isCorrect)
        if (
          error1.length === 0 ||
          (error1.length < 2 && output.type === QuestionType.MULTIPLE_CHOICE) ||
          (error1.length > 1 && output.type === QuestionType.SINGLE_CHOICE)
        ) {
          message.error("Vui lòng nhập đúng đáp án")
          return
        }
        if (input?.id) {
          await updateQuestion({
            data: {
              ...data,
              multipleChoiceOptions: {
                upsert: output.multipleChoiceOptions.map((i, index) => ({
                  where: { id: i.id || "" },
                  update: {
                    content: i.content,
                    isCorrect: i.isCorrect,
                    order: index + 1,
                  },
                  create: {
                    content: i.content,
                    isCorrect: i.isCorrect,
                    order: index + 1,
                  },
                })),
              },
            },
            where: { id: input.id },
          })
          message.success("Cập nhật thành công")
        } else {
          res = await createQuestion({
            data: {
              ...data,
              multipleChoiceOptions: {
                createMany: {
                  data: output.multipleChoiceOptions.map((i, index: number) => {
                    return {
                      content: i.content,
                      isCorrect: i.isCorrect,
                      order: index + 1,
                    }
                  }),
                },
              },
            },
          })
          message.success("Thêm câu hỏi thành công")
        }
      } else if (output.type === CLUSTER_QUESTION_TYPE) {
        const subQuestions: SubQuestionFormItem[] = (
          (form.getFieldValue("subQuestions") ?? []) as SubQuestionFormItem[]
        ).map((sq) => ({ ...sq, difficult: output.difficult ?? sq.difficult ?? "D1" }))

        if (!subQuestions.length) {
          message.error("Vui lòng thêm ít nhất một câu hỏi con")
          return
        }

        for (let i = 0; i < subQuestions.length; i++) {
          const err = validateSubQuestion(subQuestions[i], i)
          if (err) {
            message.error(err)
            return
          }
        }

        const clusterData = {
          ...data,
          type: CLUSTER_QUESTION_TYPE,
          isAutoGraded: true,
        }

        if (input?.id) {
          const existingIds =
            (initialValue?.subQuestions as { id: string }[] | undefined)?.map((s) => s.id) ?? []
          const formIds = subQuestions.filter((s) => s.id).map((s) => s.id!)
          const toDelete = existingIds.filter((id) => !formIds.includes(id))

          if (toDelete.length) {
            await sqlTransaction([
              {
                model: "Question",
                operation: "deleteMany",
                data: { where: { id: { in: toDelete } } },
              },
            ])
          }

          await updateQuestion({ where: { id: input.id }, data: clusterData })

          for (let i = 0; i < subQuestions.length; i++) {
            const sq = subQuestions[i]
            if (sq.id) {
              await updateSubQuestion(sq.id, sq, i + 1, input.questionBankId, updateQuestion)
            } else {
              await createQuestion({
                data: buildSubQuestionCreateData(sq, i + 1, input.questionBankId, input.id),
              })
            }
          }
          message.success("Cập nhật thành công")
        } else {
          await createQuestion({
            data: {
              ...clusterData,
              subQuestions: {
                create: subQuestions.map((sq, i) =>
                  buildSubQuestionCreateData(sq, i + 1, input.questionBankId)
                ),
              },
            },
          })
          message.success("Thêm câu hỏi thành công")
        }
      } else if (
        output.type !== QuestionType.FILL_IN_BLANK &&
        output.type !== QuestionType.ORDERING
      ) {
        if (input?.id) {
          await updateQuestion({
            data,
            where: {
              id: input.id,
            },
          })
          message.success("Cập nhật thành công")
        } else {
          res = await createQuestion({
            data,
          })
          message.success("Thêm câu hỏi thành công")
        }
      }

      queryClient.invalidateQueries({
        queryKey: ["Question"],
      })

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  const handleDeleteAnswer = (index: number) => {
    const data = form.getFieldValue("multipleChoiceOptions") || []
    const newData = data.filter((_: any, i: number) => i !== index)

    form.setFieldValue("multipleChoiceOptions", newData)
    setDataOptions(newData)
  }

  const handleAddAnswer = () => {
    const data = form.getFieldValue("multipleChoiceOptions") || []

    const newItem =
      typeQuestion === QuestionType.SINGLE_CHOICE || typeQuestion === QuestionType.MULTIPLE_CHOICE
        ? { key: String(data.length + 1), content: "", isCorrect: false }
        : { key: String(data.length + 1), content: "" }

    const newData = [...data, newItem]
    form.setFieldValue("multipleChoiceOptions", newData)
    setDataOptions(newData)
  }

  // useEffect(() => {
  //   if (initialValue) {
  //     setDataOptions(
  //       initialValue.multipleChoiceOptions.map((i) => ({
  //         key: String(i.order),
  //         content: i.content,
  //         isCorrect: i.isCorrect,
  //         id: i.id,
  //       }))
  //     );
  //     form.setFieldsValue({
  //       ...initialValue,
  //       multipleChoiceOptions: initialValue.multipleChoiceOptions.map((i) => ({
  //         content: i.content,
  //         isCorrect: i.isCorrect,
  //         key: String(i.order),
  //       })),
  //     });
  //   } else {
  //     form.setFieldsValue({ isAutoGraded: false });
  //     setStorageType("khung");
  //   }
  // }, [initialValue, form]);
  useEffect(() => {
    if (!isOpen) return
    if (input?.id) return
    form.setFieldsValue({ point: 0, isAutoGraded: false })
    setStorageType("khung")
  }, [isOpen, input?.id, form])

  useEffect(() => {
    if (!initialValue) return
    const type = initialValue.type
    let options: any[] = []

    switch (type) {
      // ===== TRẮC NGHIỆM =====
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.MULTIPLE_CHOICE:
        options =
          initialValue.multipleChoiceOptions
            ?.sort((a, b) => a.order - b.order)
            .map((i) => ({
              key: String(i.order),
              content: i.content,
              isCorrect: i.isCorrect,
              id: i.id,
            })) || []
        break

      // ===== ĐIỀN KHUYẾT =====
      case QuestionType.FILL_IN_BLANK:
        options =
          initialValue.fillInBlankSlots
            ?.sort((a, b) => a.order - b.order)
            .map((s) => ({
              key: String(s.order),
              content: s.correctAnswer,
            })) || []
        break

      // ===== SẮP XẾP =====
      case QuestionType.ORDERING:
        options =
          initialValue.orderingItems?.map((o) => ({
            key: String(o.id),
            content: o.content,
            correctOrder: o.correctOrder,
          })) || []
        break

      // ===== TỰ LUẬN / VẤN ĐÁP =====
      case QuestionType.ESSAY:
      case QuestionType.ORAL:
        options = []
        break

      default:
        options = []
    }

    if (type === CLUSTER_QUESTION_TYPE) {
      setDataOptions([])
      const { subQuestions: _subs, ...rest } = initialValue
      form.setFieldsValue({
        ...rest,
        multipleChoiceOptions: [],
        subQuestions: initialValue.subQuestions?.map((sub) => ({
          ...mapSubQuestionFromDb(sub),
          difficult: initialValue.difficult ?? "D1",
        })) || [{ ...defaultSubQuestion(), difficult: initialValue.difficult ?? "D1" }],
      })
      return
    }

    setDataOptions(options)

    const { subQuestions: _subs, ...rest } = initialValue
    form.setFieldsValue({
      ...rest,
      multipleChoiceOptions: options,
    })
  }, [initialValue, form])

  useEffect(() => {
    if (!typeQuestion) return

    if (input?.id) return

    if (typeQuestion === CLUSTER_QUESTION_TYPE) {
      setDataOptions([])
      form.setFieldValue("multipleChoiceOptions", [])
      form.setFieldValue("subQuestions", [
        { ...defaultSubQuestion(), difficult: form.getFieldValue("difficult") ?? "D1" },
      ])
      return
    }

    let defaultOptions: any[] = []

    if (typeQuestion === QuestionType.FILL_IN_BLANK) {
      defaultOptions = [{ key: "1", content: "" }]
    } else if (typeQuestion === QuestionType.ORDERING) {
      defaultOptions = [
        { key: "1", content: "" },
        { key: "2", content: "" },
        { key: "3", content: "" },
      ]
    } else if (
      typeQuestion === QuestionType.SINGLE_CHOICE ||
      typeQuestion === QuestionType.MULTIPLE_CHOICE
    ) {
      defaultOptions = [
        { key: "1", content: "", isCorrect: false },
        { key: "2", content: "", isCorrect: false },
        { key: "3", content: "", isCorrect: false },
        { key: "4", content: "", isCorrect: false },
      ]
    }

    setDataOptions(defaultOptions)
    form.setFieldValue("multipleChoiceOptions", defaultOptions)
  }, [typeQuestion, input?.id, form])

  const fixedHtmlContent = useMemo(() => {
    return content?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, "<li>$1</li>")
  }, [content])

  const fixedHtmlExplanation = useMemo(() => {
    return explanation?.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, "<li>$1</li>")
  }, [explanation])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
      width="80vw"
      className="top-2"
    >
      <Col span={24}>
        <div className="flex">
          <Col span={12}>
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <FormItem form={form} name="type" label="Loại câu hỏi" required>
                  <Select
                    maxTagCount={"responsive"}
                    placeholder="Chọn loại câu hỏi"
                    options={QUESTION_TYPE_OPTIONS}
                  />
                </FormItem>
              </Col>
              <Col span={12}>
                <div>
                  <div className="text-sm font-medium mb-3">Vị trí lưu trữ</div>
                  <Radio.Group value={storageType} onChange={(e) => setStorageType(e.target.value)}>
                    <Radio value="khung">Lưu tại khung</Radio>
                    <Radio value="kho">Lưu tại kho</Radio>
                  </Radio.Group>
                </div>
              </Col>
              {storageType === "khung" && (
                <Col span={12}>
                  <FormItem form={form} name="knowledgeBlockId" label="Chuẩn đầu ra">
                    <Select
                      maxTagCount={"responsive"}
                      placeholder="Chọn chuẩn đầu ra"
                      options={knowledgeBlockData?.map(({ id, name }) => ({
                        value: id,
                        label: name,
                      }))}
                    />
                  </FormItem>
                </Col>
              )}
              <Col span={12}>
                <FormItem form={form} name="difficult" label="Mức độ tư duy" required>
                  <Select
                    maxTagCount={"responsive"}
                    placeholder="Chọn mức độ"
                    options={DIFFICULT_OPTIONS}
                  />
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem form={form} name="point" label="Điểm" required>
                  <InputNumber min={0} placeholder="Nhập điểm" step={0.25} className="w-full" />
                </FormItem>
              </Col>
              <Col span={24}>
                <div className="border-t border-[#D1D5DB] x-auto my-2" />
              </Col>
              <Col span={24}>
                <FormItem
                  form={form}
                  label={typeQuestion === CLUSTER_QUESTION_TYPE ? "Đề bài chung" : "Câu hỏi"}
                  name={"content"}
                  required
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập câu hỏi",
                    },
                  ]}
                >
                  <RichTextEditor />
                </FormItem>
              </Col>
              {typeQuestion === CLUSTER_QUESTION_TYPE && <ClusterSubQuestionsForm />}
              {/* Tự luận */}
              <Col span={24}>
                {(typeQuestion === QuestionType.ESSAY || typeQuestion === QuestionType.ORAL) && (
                  <FormItem form={form} label="Giải thích đáp án" name={"explanation"}>
                    <RichTextEditor />
                  </FormItem>
                )}
                {(typeQuestion === QuestionType.SINGLE_CHOICE ||
                  typeQuestion === QuestionType.MULTIPLE_CHOICE) && (
                  <>
                    <FormItem form={form} label="Đáp án" name={"multipleChoiceOptions"}>
                      <Table
                        rowKey="key"
                        pagination={false}
                        data={dataOptions}
                        columns={[
                          {
                            title: "Đáp án",
                            width: 100,
                            align: "left",
                            render: (_, __, index) => {
                              return `Đáp án ${index + 1}`
                            },
                          },
                          {
                            title: "Đáp án",
                            dataIndex: "content",
                            align: "center",
                            render: (__, record, index: number) => {
                              return (
                                <Form.Item
                                  className="w-full mb-0"
                                  name={["multipleChoiceOptions", index, "content"]}
                                  label=""
                                  required
                                >
                                  <Input placeholder="Nhập đáp án" />
                                  {/* <EditorContent editor={editor} {...editorProps} /> */}
                                </Form.Item>
                              )
                            },
                          },
                          {
                            title: "Đúng/sai",
                            dataIndex: "questionType",
                            width: 100,
                            align: "center",
                            render: (__, record, index: number) => {
                              return (
                                <Form.Item
                                  className="w-full mb-0"
                                  name={["multipleChoiceOptions", index, "isCorrect"]}
                                  label=""
                                  valuePropName="checked"
                                >
                                  <Checkbox />
                                </Form.Item>
                              )
                            },
                          },
                          {
                            title: "",
                            dataIndex: "questionType",
                            width: 50,
                            align: "center",
                            render: (__, record, index: number) => {
                              return (
                                <Tooltip title={"Xoá"}>
                                  <Trash2
                                    size={16}
                                    strokeWidth={1.5}
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => {
                                      handleDeleteAnswer(index)
                                    }}
                                  />
                                </Tooltip>
                              )
                            },
                          },
                        ]}
                      />
                    </FormItem>
                    <div className="flex justify-end">
                      <Button onClick={handleAddAnswer}>Thêm đáp án</Button>
                    </div>
                  </>
                )}
                {typeQuestion === QuestionType.FILL_IN_BLANK && (
                  <>
                    <FormItem
                      form={form}
                      label="Đáp án đúng theo thứ tự ô trống"
                      name="multipleChoiceOptions"
                    >
                      <Table
                        rowKey="key"
                        pagination={false}
                        data={dataOptions}
                        columns={[
                          {
                            title: "Ô trống",
                            width: 80,
                            render: (_, __, index) => `#${index + 1}`,
                          },
                          {
                            title: "Đáp án",
                            render: (_, __, index) => (
                              <Form.Item
                                name={["multipleChoiceOptions", index, "content"]}
                                className="mb-0"
                                rules={[
                                  {
                                    required: true,
                                    message: "Nhập đáp án",
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            ),
                          },
                          {
                            width: 50,
                            render: (_, __, index) => (
                              <Trash2
                                size={16}
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteAnswer(index)}
                              />
                            ),
                          },
                        ]}
                      />
                    </FormItem>

                    <div className="flex justify-end">
                      <Button onClick={handleAddAnswer}>Thêm ô trống</Button>
                    </div>
                  </>
                )}
                {typeQuestion === QuestionType.ORDERING && (
                  <>
                    <FormItem form={form} label="Đáp án" name="multipleChoiceOptions">
                      <Table
                        rowKey="key"
                        pagination={false}
                        data={dataOptions}
                        columns={[
                          {
                            title: "Đáp án",
                            width: 100,
                            render: (_, __, index) => `Đáp án ${index + 1}`,
                          },
                          {
                            title: "Đáp án",
                            render: (_, __, index) => (
                              <Form.Item
                                name={["multipleChoiceOptions", index, "content"]}
                                className="mb-0"
                                rules={[
                                  {
                                    required: true,
                                    message: "Nhập đáp án",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập đáp án" />
                              </Form.Item>
                            ),
                          },
                          {
                            title: "Thứ tự đúng",
                            width: 120,
                            align: "center",
                            render: (_, __, index) => (
                              <Form.Item
                                name={["multipleChoiceOptions", index, "correctOrder"]}
                                className="mb-0"
                                rules={[
                                  {
                                    required: true,
                                    message: "Nhập số thứ tự",
                                  },
                                ]}
                              >
                                <Input type="number" placeholder="VD: 1" />
                              </Form.Item>
                            ),
                          },
                          {
                            width: 50,
                            align: "center",
                            render: (_, __, index) => (
                              <Tooltip title="Xoá">
                                <Trash2
                                  size={16}
                                  className="text-red-600 cursor-pointer"
                                  onClick={() => handleDeleteAnswer(index)}
                                />
                              </Tooltip>
                            ),
                          },
                        ]}
                      />
                    </FormItem>

                    <div className="flex justify-end">
                      <Button onClick={handleAddAnswer}>Thêm đáp án</Button>
                    </div>
                  </>
                )}
              </Col>
            </Row>
          </Col>

          <div className="border-r border-[#D1D5DB] h-auto mx-2" />

          <Col span={12}>
            <Row gutter={[16, 0]}>
              <Col span={24}>
                <div className="flex gap-4 flex-col">
                  <div className="flex gap-2 flex-col">
                    <p className="font-medium text-sm text-[#111827]">Câu hỏi</p>
                    <div className="bg-[#FAFAFA] rounded-xl p-4">
                      <div
                        className="prose max-w-none text-sm text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html: fixedHtmlContent
                            ? renderWithMath(fixedHtmlContent)
                            : "<i>Chưa có nội dung</i>",
                        }}
                      />
                    </div>
                  </div>
                  {/* Tự luận */}
                  {(typeQuestion === QuestionType.ESSAY || typeQuestion === QuestionType.ORAL) && (
                    <div className="flex gap-2 flex-col">
                      <p className="font-medium text-sm text-[#111827]">Giải thích đáp án</p>
                      <div className="bg-white p-2 rounded-lg border border-[#D1D5DB] min-h-[164px]">
                        <div
                          className="prose max-w-none text-sm text-gray-800"
                          dangerouslySetInnerHTML={{
                            __html: fixedHtmlExplanation
                              ? renderWithMath(fixedHtmlExplanation)
                              : "<i>Chưa có giải thích</i>",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {(typeQuestion === QuestionType.SINGLE_CHOICE ||
                    typeQuestion === QuestionType.MULTIPLE_CHOICE) && (
                    <div>
                      <div className="mb-3 font-[500]">Đáp án</div>
                      {listForm.length &&
                        listForm.map((i: any) => {
                          return (
                            <div
                              key={i.key}
                              className={`flex items-center gap-3 border-solid border-[1px] p-3 mb-3 rounded-[8px] ${i?.isCorrect ? "border-green-500 bg-green-100" : ""}`}
                            >
                              <Checkbox checked={i?.isCorrect} />
                              <div>{i.content}</div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                  {typeQuestion === QuestionType.FILL_IN_BLANK && (
                    <div>
                      <div className="mb-3 font-[500]">Đáp án đúng</div>
                      {listForm.map((i: any, index: number) => (
                        <div
                          key={i.key}
                          className="border border-dashed border-gray-300 p-3 mb-2 rounded"
                        >
                          <span className="font-medium mr-2">Ô trống {index + 1}:</span>
                          <span className="text-green-700">{i.content || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {typeQuestion === QuestionType.ORDERING && (
                    <div>
                      <div className="mb-3 font-[500]">Các lựa chọn</div>

                      {listForm.map((i: any, index: number) => (
                        <div
                          key={i.key}
                          className="flex items-center gap-3 border border-gray-300 p-3 mb-2 rounded"
                        >
                          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 text-white text-sm">
                            {index + 1}
                          </div>
                          <div>{i.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {typeQuestion === CLUSTER_QUESTION_TYPE && (
                    <div>
                      <div className="mb-3 font-[500]">Câu hỏi con</div>
                      {subQuestionsPreview.map((sq, subIndex) => {
                        const { prefix, body } = formatClusterSubLabel(subIndex, sq.content)
                        return (
                          <div key={subIndex} className="mb-4">
                            <div className="font-medium text-sm text-[#111827] mb-2">
                              {prefix}
                              {body ? ` ${body}` : " (chưa có nội dung)"}
                            </div>
                            {sq.multipleChoiceOptions?.map((opt, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-3 border-solid border-[1px] p-3 mb-3 rounded-[8px] ${
                                  opt.isCorrect ? "border-green-500 bg-green-100" : ""
                                }`}
                              >
                                <Checkbox checked={opt.isCorrect} />
                                <div>{opt.content || `Đáp án ${optIndex + 1}`}</div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Col>
        </div>
      </Col>
    </PutFormModal>
  )
}

export default PutQuestionModal
