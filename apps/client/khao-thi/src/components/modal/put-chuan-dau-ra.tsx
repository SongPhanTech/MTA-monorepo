import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import { LEVEL_COLUMNS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import type { ConfigExam } from "@workspace/db/client"
import {
  useCreateKnowledgeBlock,
  useFindManyKnowledgeBlock,
  useFindUniqueKnowledgeBlock,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Col, Form, Input, InputNumber, Switch, message, Row } from "antd"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
type ConfigExamFormValue = Partial<ConfigExam> & {
  percent?: number
}

const toIntPercent = (value: unknown) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.trunc(n)
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
export interface KnowledgeBlockFormData extends Record<string, unknown> {
  name: string
  code: string
  totalQuestions?: number
  biet?: ConfigExamFormValue
  hieu?: ConfigExamFormValue
  vanDung?: ConfigExamFormValue
  VanDungCao?: ConfigExamFormValue
}

const allocateByPercent = (total: number, percents: number[]) => {
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0
  if (safeTotal <= 0) return percents.map(() => 0)

  const raw = percents.map((p) => (safeTotal * (Number.isFinite(p) ? p : 0)) / 100)
  const floors = raw.map((x) => Math.floor(Math.max(0, x)))
  let remainder = safeTotal - floors.reduce((a, b) => a + b, 0)

  const order = raw
    .map((x, idx) => ({ idx, frac: x - Math.floor(Math.max(0, x)) }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floors]
  for (let i = 0; i < order.length && remainder > 0; i++) {
    out[order[i].idx] += 1
    remainder -= 1
  }
  return out
}

const PutChuongMucModal = () => {
  const [form] = Form.useForm<KnowledgeBlockFormData>()
  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    matrixId?: string
  }>({
    tag: "PutChuongMucModal",
    onClose: form.resetFields,
  })

  const [isQuantityMode, setIsQuantityMode] = useState(true) // switch ON = nhập theo số câu
  const watchedValues = Form.useWatch([], form)
  const percentBaseTotalRef = useRef<number>(0)
  const lastEditRef = useRef<"quantity" | "percent" | null>(null)
  const totalQuestions =
    LEVEL_COLUMNS.reduce<number>((sum, col) => {
      const quantity = (watchedValues?.[col.key] as ConfigExamFormValue | undefined)?.quantity
      return sum + (typeof quantity === "number" ? quantity : 0)
    }, 0) || 0

  // Tự động cập nhật tỷ lệ (%) theo số lượng câu hỏi hiện tại
  useEffect(() => {
    if (!isQuantityMode) return
    if (lastEditRef.current === "percent") return
    const patch: any = {}
    LEVEL_COLUMNS.forEach((col) => {
      const quantity = (watchedValues?.[col.key] as ConfigExamFormValue | undefined)?.quantity ?? 0
      const percent =
        totalQuestions > 0 ? Math.trunc((Number(quantity) / totalQuestions) * 100) : 0
      patch[col.key] = {
        ...(watchedValues?.[col.key] as any),
        percent,
      }
    })
    form.setFieldsValue(patch)
  }, [isQuantityMode, totalQuestions, watchedValues, form])

  const recalcQuantitiesFromPercents = () => {
    const total = Number(form.getFieldValue("totalQuestions") ?? 0)
    const percents = LEVEL_COLUMNS.map((col) =>
      Number(form.getFieldValue([col.key, "percent"]) ?? 0)
    )

    const quantities = allocateByPercent(total, percents)
    const patch: any = {}
    LEVEL_COLUMNS.forEach((col, idx) => {
      patch[col.key] = {
        ...(form.getFieldValue(col.key) as any),
        quantity: quantities[idx],
      }
    })
    lastEditRef.current = "percent"
    form.setFieldsValue(patch)
    lastEditRef.current = "quantity"
  }

  const syncPercentsTo100 = (editedKey: string, nextValue: unknown) => {
    const nextEdited = clamp(toIntPercent(nextValue), 0, 100)

    // pick an "adjust" column (prefer last col, otherwise the previous one)
    const adjustKey =
      LEVEL_COLUMNS.findLast((c) => c.key !== editedKey)?.key ??
      LEVEL_COLUMNS.find((c) => c.key !== editedKey)?.key

    if (!adjustKey) {
      form.setFieldValue([editedKey, "percent"], nextEdited)
      return
    }

    const sumOthers = LEVEL_COLUMNS.reduce((acc, c) => {
      if (c.key === editedKey || c.key === adjustKey) return acc
      return acc + clamp(toIntPercent(form.getFieldValue([c.key, "percent"])), 0, 100)
    }, 0)

    // try keep edited as user typed; adjust the adjustKey to fill the remainder
    let remainder = 100 - (sumOthers + nextEdited)

    // if remainder < 0 => total would exceed 100, clamp edited down so remainder becomes 0
    let editedFinal = nextEdited
    if (remainder < 0) {
      editedFinal = clamp(100 - sumOthers, 0, 100)
      remainder = 0
    }

    form.setFieldsValue({
      [editedKey]: {
        ...(form.getFieldValue(editedKey) as any),
        percent: editedFinal,
      },
      [adjustKey]: {
        ...(form.getFieldValue(adjustKey) as any),
        percent: clamp(remainder, 0, 100),
      },
    })
  }

  const { mutateAsync: createKnowledgeBlock } = useCreateKnowledgeBlock()

  const { data: knowledgeBlockData } = useFindUniqueKnowledgeBlock(
    {
      where: { id: input?.id },
      include: { configExams: true },
    },
    {
      enabled: !!input?.id,
    }
  )
  const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock({
    select: { id: true, code: true },
  })

  const existingCodes = knowledgeBlocks.map((item) => item.code).filter(Boolean)
  const currentCode = knowledgeBlockData?.code

  useEffect(() => {
    if (knowledgeBlockData && input?.id) {
      const formData: any = {
        name: knowledgeBlockData.name,
        code: knowledgeBlockData.code,
      }

      knowledgeBlockData.configExams?.forEach((config: ConfigExam) => {
        const levelColumn = LEVEL_COLUMNS.find((col) => col.difficult === config.difficult)
        if (levelColumn) {
          formData[levelColumn.key] = {
            type: config.type,
            quantity: config.quantity,
          }
        }
      })

      form.setFieldsValue(formData)
    }
  }, [knowledgeBlockData, input?.id, form])

  const onOk = async (values: KnowledgeBlockFormData) => {
    if (!isQuantityMode) {
      const total = Number(values.totalQuestions ?? 0)
      const sumPercent = LEVEL_COLUMNS.reduce((acc, col) => {
      const p = Number((values?.[col.key] as ConfigExamFormValue | undefined)?.percent ?? 0)
        return acc + (Number.isFinite(p) ? p : 0)
      }, 0)

      if (total <= 0) {
        message.error("Vui lòng nhập tổng số câu hỏi")
        return
      }
      if (Math.abs(sumPercent - 100) > 1e-6) {
        message.error("Tổng tỷ lệ phải bằng 100%")
        return
      }

      // đảm bảo số câu được tính đúng trước khi submit
      recalcQuantitiesFromPercents()
      values = form.getFieldsValue(true) as KnowledgeBlockFormData
    }

    const configExams = LEVEL_COLUMNS.reduce<any[]>((acc, level) => {
      const levelData = values[level.key] as ConfigExamFormValue
      if (!levelData?.quantity) return acc

      acc.push({
        difficult: level.difficult,
        type: levelData.type,
        quantity: levelData.quantity,
      })

      return acc
    }, [])

    try {
      if (!values) return

      if (input?.id) {
        const res = await sqlTransaction([
          {
            model: "KnowledgeBlock",
            operation: "update",
            data: {
              where: {
                id: input.id,
              },
              data: {
                name: values.name,
                code: values.code,
              },
            },
          },
          {
            model: "ConfigExam",
            operation: "deleteMany",
            data: {
              where: {
                knowledgeBlockId: input.id,
              },
            },
          },
          {
            model: "ConfigExam",
            operation: "createMany",
            data: {
              data: configExams.map((config) => ({
                ...config,
                knowledgeBlockId: input.id,
              })),
            },
          },
        ])
        if (res?.status === 200) {
          message.success("Cập nhật chuẩn đầu ra thành công")
        }

        queryClient.invalidateQueries({
          queryKey: ["zenstack", "KnowledgeBlock"],
        })
      } else {
        const createData: any = {
          code: values.code,
          name: values.name,
          configExams: {
            create: configExams,
          },
        }

        if (input?.matrixId) {
          createData.examMatrixId = input.matrixId
        }

        await createKnowledgeBlock({
          data: createData,
        })
        message.success("Thêm mới chuẩn đầu ra thành công")

        queryClient.invalidateQueries({
          queryKey: ["KnowledgeBlock"],
        })
      }

      onClose()
    } catch (error: any) {
      message.error(input?.id ? "Cập nhật chuẩn đầu ra thất bại" : "Thêm mới chuẩn đầu ra thất bại")
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      title={input?.id ? "Cập nhật chuẩn đầu ra" : "Thêm mới chuẩn đầu ra"}
      onCancel={onClose}
      onFinish={onOk}
      width="60vw"
    >
      <Col span={19}>
        <FormItem form={form} name="name" label="Tên chuẩn đầu ra" required>
          <Input placeholder="Nhập tên chuẩn đầu ra" />
        </FormItem>
      </Col>

      <Col span={5}>
        <FormItem
          form={form}
          name="code"
          label="Mã chuẩn đầu ra"
          rules={[
            { required: true, message: "Vui lòng nhập mã chuẩn đầu ra" },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve()
                if (input?.id && value === currentCode) {
                  return Promise.resolve()
                }
                const isDuplicate = existingCodes.includes(value)

                if (isDuplicate) {
                  return Promise.reject(
                    new Error("Mã chuẩn đầu ra đã tồn tại, vui lòng nhập mã khác")
                  )
                }

                return Promise.resolve()
              },
            },
          ]}
        >
          <Input
            placeholder="Nhập mã chuẩn đầu ra"
            onChange={(e) => {
              form.setFieldValue("code", e.target.value.toUpperCase())
            }}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <Row gutter={12} align="middle" className="mb-2">
          <Col xs={24} sm={6}>
            <div className="flex items-center gap-2">
              <Switch
                checked={isQuantityMode}
                onChange={(checked) => {
                  setIsQuantityMode(checked)
                  if (!checked) {
                    form.setFieldValue("totalQuestions", totalQuestions)
                    percentBaseTotalRef.current = totalQuestions
                  } else {
                    lastEditRef.current = "quantity"
                  }
                }}
              />
              <span>Nhập theo số câu</span>
            </div>
          </Col>

          {!isQuantityMode && (
            <Col xs={24} sm={18}>
              <Row gutter={12} align="middle">
                <Col xs={24} sm={6}>
                  <Form.Item
                    name="totalQuestions"
                    style={{ marginBottom: 0 }}
                    label="Tổng số câu hỏi"
                    initialValue={totalQuestions}
                    rules={[
                      { required: true, message: "Vui lòng nhập tổng số câu hỏi" },
                      {
                        validator: async (_, value) => {
                          const n = Number(value)
                          if (!Number.isFinite(n) || n <= 0) {
                            return Promise.reject(new Error("Tổng số câu hỏi phải > 0"))
                          }
                          return Promise.resolve()
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      className="w-full"
                      onFocus={() => {
                        percentBaseTotalRef.current = Number(form.getFieldValue("totalQuestions") ?? 0)
                      }}
                      onBlur={() => {
                        percentBaseTotalRef.current = Number(form.getFieldValue("totalQuestions") ?? 0)
                        recalcQuantitiesFromPercents()
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </Col>

      <Col span={24}>
        <Row gutter={12} align="middle" className="mb-1">
          <Col xs={24} sm={6}>
            &nbsp;
          </Col>
          <Col xs={24} sm={18}>
            <Row gutter={12}>
              {LEVEL_COLUMNS.map((col) => (
                <Col xs={12} sm={6} key={col.key}>
                  <div className="text-center font-medium text-sm py-1">{col.label}</div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Col>

      {!isQuantityMode ? (
        <>
          <Col span={24} className="transition-all duration-200">
            <Row gutter={12} align="middle">
              <Col xs={24} sm={6}>
                Tỷ lệ (%)
              </Col>
              <Col xs={24} sm={18}>
                <Row gutter={12}>
                  {LEVEL_COLUMNS.map((col) => (
                    <Col xs={12} sm={6} key={col.key}>
                      <Form.Item
                        name={[col.key, "percent"]}
                        style={{ marginBottom: 8 }}
                        initialValue={0}
                      >
                        <InputNumber<number>
                          className="w-full"
                          controls={false}
                          precision={0}
                          min={0}
                          max={100}
                          onChange={(value) => {
                            syncPercentsTo100(col.key, value)
                          }}
                          onFocus={() => {
                            percentBaseTotalRef.current = Number(form.getFieldValue("totalQuestions") ?? 0)
                          }}
                          onBlur={() => {
                            recalcQuantitiesFromPercents()
                          }}
                          style={{
                            width: "100%",
                            textAlign: "center",
                            color: "#16a34a",
                            fontSize: 12,
                            borderRadius: 8,
                          }}
                          formatter={(value) => {
                            return `${toIntPercent(value)}%`
                          }}
                          parser={(value) => {
                            const raw = (value ?? "").toString().replace("%", "").trim()
                            return toIntPercent(raw)
                          }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Col>

          <Col span={24} className="transition-all duration-200">
            <Row gutter={12} align="middle">
              <Col xs={24} sm={6}>
                Số lượng câu hỏi
              </Col>
              <Col xs={24} sm={18}>
                <Row gutter={12}>
                  {LEVEL_COLUMNS.map((col) => (
                    <Col xs={12} sm={6} key={col.key}>
                      <Form.Item name={[col.key, "quantity"]} style={{ marginBottom: 8 }} initialValue={0}>
                        <InputNumber min={0} className="w-full" readOnly />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Col>
        </>
      ) : (
        <>
          <Col span={24} className="transition-all duration-200">
            <Row gutter={12} align="middle">
              <Col xs={24} sm={6}>
                Số lượng câu hỏi
              </Col>
              <Col xs={24} sm={18}>
                <Row gutter={12}>
                  {LEVEL_COLUMNS.map((col) => (
                    <Col xs={12} sm={6} key={col.key}>
                      <Form.Item name={[col.key, "quantity"]} style={{ marginBottom: 8 }} initialValue={0}>
                        <InputNumber
                          min={0}
                          className="w-full"
                          onChange={() => {
                            lastEditRef.current = "quantity"
                          }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Col>

          <Col span={24} className="transition-all duration-200">
            <Row gutter={12} align="middle">
              <Col xs={24} sm={6}>
                Tỷ lệ (%)
              </Col>
              <Col xs={24} sm={18}>
                <Row gutter={12}>
                  {LEVEL_COLUMNS.map((col) => (
                    <Col xs={12} sm={6} key={col.key}>
                      <Form.Item name={[col.key, "percent"]} style={{ marginBottom: 8 }} initialValue={0}>
                        <InputNumber
                          className="w-full"
                          controls={false}
                          readOnly
                          precision={0}
                          style={{
                            width: "100%",
                            textAlign: "center",
                            color: "#16a34a",
                            fontSize: 12,
                            borderRadius: 8,
                          }}
                          formatter={(value) => {
                            return `${toIntPercent(value)}%`
                          }}
                          parser={(value) => {
                            const raw = (value ?? "").toString().replace("%", "").trim()
                            return toIntPercent(raw)
                          }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Col>
        </>
      )}

      <Col span={24}>
        <Row gutter={12} align="middle">
          <Col xs={24} sm={6}>
            Loại câu hỏi
          </Col>
          <Col xs={24} sm={18}>
            <Row gutter={12}>
              {LEVEL_COLUMNS.map((col) => {
                const quantity = (watchedValues?.[col.key] as ConfigExamFormValue)?.quantity
                const isDisabled = !quantity || quantity === 0

                return (
                  <Col xs={12} sm={6} key={col.key}>
                    <Form.Item name={[col.key, "type"]} style={{ marginBottom: 8 }}>
                      <Select
                        className="w-full"
                        placeholder="Tất cả"
                        options={QUESTION_TYPE_OPTIONS}
                        disabled={isDisabled}
                      />
                    </Form.Item>
                  </Col>
                )
              })}
            </Row>
          </Col>
        </Row>
      </Col>
    </PutFormModal>
  )
}

export default PutChuongMucModal
