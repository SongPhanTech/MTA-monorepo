import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useSession } from "@workspace/auth/react"
import { useStore } from "@tanstack/react-store"
import {
  createId,
  type Evidence,
  type EvidenceFile,
  type RequirementCriterion,
} from "@workspace/db"
import {
  useCreateEvidence,
  useFindManyEvidence,
  useFindManyEvidenceCategory,
  useFindUniqueEvaluationPeriod,
  useFindUniqueRequirementCriterion,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { diffArrays, type ItemProps } from "@workspace/libs/utils"
import { Button, Col, Form, Input, InputNumber, type InputRef, message, Row, Tabs } from "antd"
import { GripVertical } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useDisclosure } from "react-hook-disclosure-modal"

const { TextArea } = Input

type PutRequirementCriterion = RequirementCriterion & {
  evidences: string[]
}

type DragItem = {
  id: number
  index: number
  type: string
}

type Item = {
  value: string
  label: string
}

const ItemType = "LIST_ITEM"

const PutTieuChiMinhChungModal = () => {
  const [form] = Form.useForm<PutRequirementCriterion>()
  const [evidenceForm] = Form.useForm<Evidence & { evidenceFile?: EvidenceFile[] }>()
  const [items, setItems] = useState<ItemProps[]>([])
  const [activeTab, setActiveTab] = useState<string>("1")
  const [document, setDocument] = useState<EvidenceFile[]>([])

  const { data: dataUser } = useSession()
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    analysisCriterionId?: string
    refetch?: () => void
    count?: number
  }>({
    tag: "PutTieuChiMinhChungModal",
    onClose: () => {
      form.resetFields()
      evidenceForm.resetFields()
      setDocument([])
      setActiveTab("1")
    },
  })

  const { hideSpinner, showSpinner } = useSpinner()

  const lastInputRef = useRef<InputRef | null>(null)

  const { data: evaluationPeriod } = useFindUniqueEvaluationPeriod(
    {
      where: {
        id: selectedEvaluationPeriodId,
      },
      select: {
        evidenceCategories: {
          select: {
            id: true,
          },
        },
      },
    },
    {
      enabled: !!selectedEvaluationPeriodId,
    }
  )

  const allowedCategoryIds = evaluationPeriod?.evidenceCategories?.map((item) => item.id) ?? []
  const hasAllowedCategories = allowedCategoryIds.length > 0

  // Chỉ list minh chứng thuộc nhóm đã chọn ở đợt; chưa chọn → list rỗng (không load hết)
  const { data: listEvidence } = useFindManyEvidence(
    {
      where: {
        categoryId: {
          in: allowedCategoryIds,
        },
      },
    },
    {
      enabled: hasAllowedCategories,
    }
  )
  const { data: listEvidenceCategory } = useFindManyEvidenceCategory(
    {
      where: {
        id: {
          in: allowedCategoryIds,
        },
      },
    },
    {
      enabled: hasAllowedCategories,
    }
  )
  const { mutateAsync: createEvidence } = useCreateEvidence()

  const treeData = useMemo(() => {
    if (!listEvidenceCategory || !listEvidence) return []
    return listEvidenceCategory.map((cat) => {
      const children = listEvidence
        .filter((evi) => evi.categoryId === cat.id)
        .map((evi) => ({
          title: evi.name,
          label: evi.name,
          value: evi.id,
          key: evi.id,
        }))
      return {
        title: cat.name,
        label: cat.name,
        value: cat.id,
        key: cat.id,
        selectable: false,
        children,
      }
    })
  }, [listEvidenceCategory, listEvidence])

  const { data: initialValue } = useFindUniqueRequirementCriterion(
    {
      where: {
        id: input?.id,
      },
      include: {
        evidences: {
          include: {
            evidence: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        evidences: initialValue.evidences.map((evi) => evi.evidenceId),
      })
      setItems(
        initialValue.evidences.map((evi) => ({
          key: evi.evidenceId,
          label: evi.evidence.name,
          value: evi.evidenceId,
        }))
      )
    } else if (input?.count !== undefined) {
      form.setFieldsValue({ order: input?.count + 1 })
    }
  }, [initialValue, form, input?.count])

  const onOk = async (output: PutRequirementCriterion) => {
    if (!output) return
    try {
      showSpinner()

      if (input?.id) {
        const currentEvidenceIds = initialValue?.evidences?.map((e) => e.evidenceId) || []
        const newEvidenceIds = items.map((i) => i.value)

        const { onlyInA: toCreate, onlyInB: toDelete } = diffArrays(
          newEvidenceIds.map((id) => ({ value: id })),
          currentEvidenceIds.map((id) => ({ value: id })),
          "value"
        )

        const listTransition: any[] = [
          {
            model: "RequirementCriterion",
            operation: "update",
            data: {
              where: { id: input.id },
              data: {
                name: output.name,
                questions: output.questions,
                evidencePlaces: output.evidencePlaces || "",
                collectionMethod: output.collectionMethod || "",
              },
            },
          },
        ]

        if (toDelete.length > 0) {
          listTransition.push(
            ...toDelete.map((item) => ({
              model: "AnalysisFormEvidence",
              operation: "delete",
              data: {
                where: {
                  requirementCriterionId_evidenceId: {
                    requirementCriterionId: input.id,
                    evidenceId: item.value,
                  },
                },
              },
            }))
          )
        }

        if (toCreate.length > 0) {
          listTransition.push(
            ...toCreate.map((item) => {
              const index = newEvidenceIds.indexOf(item.value)
              return {
                model: "AnalysisFormEvidence",
                operation: "create",
                data: {
                  data: {
                    requirementCriterionId: input.id,
                    evidenceId: item.value,
                    order: index + 1,
                  },
                },
              }
            })
          )
        }

        const evidencesToUpdate = newEvidenceIds.filter(
          (id) => !toCreate.some((item) => item.value === id)
        )

        if (evidencesToUpdate.length > 0) {
          listTransition.push(
            ...evidencesToUpdate.map((evidenceId) => {
              const index = newEvidenceIds.indexOf(evidenceId)
              return {
                model: "AnalysisFormEvidence",
                operation: "update",
                data: {
                  where: {
                    requirementCriterionId_evidenceId: {
                      requirementCriterionId: input.id,
                      evidenceId: evidenceId,
                    },
                  },
                  data: {
                    order: index + 1,
                  },
                },
              }
            })
          )
        }

        const res = await sqlTransaction(listTransition)

        if (res.status !== 200) {
          message.error("Cập nhật thất bại, vui lòng thử lại sau!")
          return
        }

        message.success("Cập nhật thành công")
      } else {
        const id = createId()

        const listTransition: any[] = [
          {
            model: "RequirementCriterion",
            operation: "create",
            data: {
              data: {
                id: id,
                analysisCriterionId: input?.analysisCriterionId,
                name: output.name,
                order: Number(output.order),
                questions: output.questions,
                evidencePlaces: output.evidencePlaces || "",
                collectionMethod: output.collectionMethod || "",
              },
            },
          },
        ]

        if (items.length > 0) {
          listTransition.push(
            ...items.map((item, index) => ({
              model: "AnalysisFormEvidence",
              operation: "create",
              data: {
                data: {
                  requirementCriterionId: id,
                  evidenceId: item.value,
                  order: index + 1,
                },
              },
            }))
          )
        }

        const res = await sqlTransaction(listTransition)
        if (res.status !== 200) {
          message.error("Thêm mới thất bại, vui lòng thử lại sau!")
          return
        }
        message.success("Thêm mới thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["RequirementCriterion"],
      })

      queryClient.invalidateQueries({
        queryKey: ["AnalysisFormEvidence"],
      })

      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })

      queryClient.invalidateQueries({
        queryKey: ["AnalysisCriterion"],
      })

      if (input?.refetch) {
        input.refetch()
      }

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Có lỗi xảy ra, vui lòng thử lại sau!")
    } finally {
      hideSpinner()
    }
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
        <div className="ml-2 font-[500]">{item?.label}</div>
      </div>
    )
  }

  const moveItem = (from: number, to: number) => {
    const updated = [...items]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setItems(updated)
  }

  const hanldeOnchange = (selectedIds: string[]) => {
    if (selectedIds?.length && listEvidence) {
      const existingItems = items.filter((item) => selectedIds.includes(item.value))
      const existingIds = existingItems.map((item) => item.value)
      const newIds = selectedIds.filter((id) => !existingIds.includes(id))

      const newItems = newIds.map((id) => {
        const found = listEvidence.find((e) => e.id === id)
        return {
          value: id,
          label: found ? found.name : id,
        }
      })

      setItems([...existingItems, ...newItems])
    } else {
      setItems([])
    }
  }

  const handleCreateNewEvidence = async () => {
    try {
      const values = await evidenceForm.validateFields()
      showSpinner()

      const result = await createEvidence({
        data: {
          name: values.name,
          categoryId: values.categoryId,
          information: values.information,
          issuer: values.issuer,
          evidenceFile: {
            create: (values.evidenceFile || []).map((file: EvidenceFile) => ({
              name: file.name,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
              userProfileId: dataUser?.sDM_NhanVienId || null,
            })),
          },
        },
      })

      queryClient.invalidateQueries({
        queryKey: ["Evidence"],
      })

      message.success("Tạo mới minh chứng thành công")
      evidenceForm.resetFields()
      setDocument([])
      setActiveTab("1")

      if (result) {
        const newItem = {
          value: result.id,
          label: result.name,
          key: result.id,
        }
        setItems([...items, newItem])

        const currentEvidences = form.getFieldValue("evidences") || []
        form.setFieldsValue({
          evidences: [...currentEvidences, result.id],
        })
      }
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Tạo mới minh chứng thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      form={form}
      title="Thêm mới tiêu chí, minh chứng"
      open={isOpen}
      onCancel={onClose}
      onFinish={onOk}
      className="w-[70vw] top-2"
    >
      <Col span={24}>
        <FormItem form={form} label="Yêu cầu tiêu chí" name="name" required>
          <TextArea placeholder="Yêu cầu tiêu chí" spellCheck={false} />
        </FormItem>
      </Col>
      <Col span={24}>
        <Form.Item label="Câu hỏi" required>
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: "Nhập câu hỏi" }]}
                      className="flex-1 mb-0"
                    >
                      <Input
                        placeholder="Nhập mô tả"
                        spellCheck={false}
                        className="w-full"
                        ref={index === fields.length - 1 ? lastInputRef : null}
                      />
                    </Form.Item>
                    <DeleteOutlined
                      onClick={() => remove(name)}
                      className="text-red-500 cursor-pointer"
                    />
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => {
                      add()
                      setTimeout(() => {
                        if (lastInputRef.current) {
                          lastInputRef.current.focus()
                        }
                      }, 0)
                    }}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm câu hỏi
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="order" label="Thứ tự" required hidden>
          <InputNumber className="w-full" placeholder="Thứ tự" disabled={true} />
        </FormItem>
      </Col>
      <Col span={24}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: "Chọn minh chứng",
              children: (
                <>
                  <Col span={24}>
                    <FormItem form={form} label="Minh chứng" name="evidences" required>
                      <TreeSelect
                        multiple
                        maxTagCount="responsive"
                        placeholder="Chọn minh chứng"
                        treeData={treeData}
                        onChange={(value: any) => {
                          hanldeOnchange(value)
                        }}
                      />
                    </FormItem>
                  </Col>
                  <Col span={24}>
                    <Col span={24} className="font-semibold mb-3">
                      Danh sách minh chứng
                    </Col>
                    <Col span={24}>
                      <DndProvider backend={HTML5Backend}>
                        {items.map((i: Item, index: number) => (
                          <DraggableItem key={i.value} item={i} index={index} moveItem={moveItem} />
                        ))}
                      </DndProvider>
                    </Col>
                  </Col>
                </>
              ),
            },
            {
              key: "2",
              label: "Tạo mới minh chứng",
              children: (
                <Form form={evidenceForm}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <FormItem form={evidenceForm} name="name" label="Tên minh chứng" required>
                        <Input placeholder="Nhập tên minh chứng" />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem
                        form={evidenceForm}
                        name="categoryId"
                        label="Danh mục minh chứng"
                        required
                      >
                        <Select
                          placeholder="Chọn danh mục minh chứng"
                          options={listEvidenceCategory?.map((i) => ({
                            label: i.name,
                            value: i.id,
                            key: i.id,
                          }))}
                        />
                      </FormItem>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <FormItem
                        form={evidenceForm}
                        name="information"
                        label="Số ngày/tháng ban hành"
                        required
                      >
                        <TextArea placeholder="Nhập số ngày/tháng ban hành" spellCheck={false} />
                      </FormItem>
                    </Col>
                    <Col span={12}>
                      <FormItem form={evidenceForm} name="issuer" label="Nơi ban hành" required>
                        <Input placeholder="Nhập nơi ban hành" spellCheck={false} />
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <FormItem form={evidenceForm} name="evidenceFile" label="Tệp minh chứng">
                        <DocumentPaths
                          form={evidenceForm}
                          data={document}
                          relationId=""
                          relationType="evidenceId"
                        />
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Button type="primary" onClick={handleCreateNewEvidence} block>
                        Tạo mới minh chứng
                      </Button>
                    </Col>
                  </Row>
                </Form>
              ),
            },
          ]}
        />
      </Col>
      <Col span={24} className="mt-6">
        <FormItem form={form} name="evidencePlaces" label="Nơi thu thập minh chứng" required>
          <TextArea placeholder="Nơi thu thập" spellCheck={false} />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="collectionMethod" label="Phương pháp thu thập" required>
          <TextArea placeholder="Phương pháp thu thập" spellCheck={false} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutTieuChiMinhChungModal
