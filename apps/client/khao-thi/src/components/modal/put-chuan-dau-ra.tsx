import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
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
import { Button, Col, Form, Input, InputNumber, message, Row } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
type LevelRow = {
  type?: ConfigExam["type"]
  quantity?: number | null
  point?: number | null
}

type LevelKey = (typeof LEVEL_COLUMNS)[number]["key"]

export type KnowledgeBlockFormData = {
  name: string
  code: string
} & Partial<Record<LevelKey, LevelRow[]>>

const EMPTY_ROW: LevelRow = { quantity: 0, point: 1 }

// Trong cùng 1 mức độ, các dòng cùng điểm không được trùng loại câu hỏi,
// và dòng "Tất cả" (type rỗng) không được đi chung với dòng khác cùng điểm
// (vì tập câu hỏi sẽ giao nhau → có thể bốc trùng câu khi sinh đề).
const validateLevelRows = async (rows?: LevelRow[]) => {
  const activeRows = (rows ?? []).filter((r) => r?.quantity)
  const byPoint = new Map<number, LevelRow[]>()
  for (const row of activeRows) {
    const point = row.point ?? 0
    byPoint.set(point, [...(byPoint.get(point) ?? []), row])
  }

  for (const [point, group] of byPoint) {
    if (group.length < 2) continue
    if (group.some((r) => !r.type)) {
      throw new Error(
        `Mức ${point} điểm/câu đã có dòng "Tất cả" nên không thể thêm loại câu hỏi khác cùng điểm`
      )
    }
    const types = group.map((r) => r.type)
    if (new Set(types).size !== types.length) {
      throw new Error(`Có loại câu hỏi bị trùng ở mức ${point} điểm/câu`)
    }
  }
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

  const watchedValues = Form.useWatch([], form)

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

      for (const level of LEVEL_COLUMNS) {
        const rows = (knowledgeBlockData.configExams ?? [])
          .filter((config: ConfigExam) => config.difficult === level.difficult)
          .map((config: ConfigExam) => ({
            type: config.type,
            quantity: config.quantity,
            point: config.point,
          }))
        formData[level.key] = rows.length ? rows : [{ ...EMPTY_ROW }]
      }

      form.setFieldsValue(formData)
    }
  }, [knowledgeBlockData, input?.id, form])

  const onOk = async (values: KnowledgeBlockFormData) => {
    const configExams = LEVEL_COLUMNS.flatMap((level) =>
      (values[level.key] ?? [])
        .filter((row) => row?.quantity)
        .map((row) => ({
          difficult: level.difficult,
          type: row.type ?? null,
          quantity: row.quantity as number,
          point: row.point ?? 0,
        }))
    )

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

      {LEVEL_COLUMNS.map((level) => (
        <Col span={24} key={level.key}>
          <div className="font-medium text-sm mb-1">{level.label}</div>
          <Form.List
            name={level.key}
            initialValue={[{ ...EMPTY_ROW }]}
            rules={[{ validator: (_, rows) => validateLevelRows(rows) }]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div className="mb-3">
                {fields.length > 0 && (
                  <Row gutter={8} className="text-xs text-gray-500 mb-1">
                    <Col span={10}>Loại câu hỏi</Col>
                    <Col span={6}>Số lượng câu hỏi</Col>
                    <Col span={6}>Điểm/câu</Col>
                  </Row>
                )}
                {fields.map(({ key, name }) => {
                  const quantity = watchedValues?.[level.key]?.[name]?.quantity
                  const isDisabled = !quantity

                  return (
                    <Row gutter={8} key={key} align="middle">
                      <Col span={10}>
                        <Form.Item name={[name, "type"]} style={{ marginBottom: 8 }}>
                          <Select
                            className="w-full"
                            placeholder="Tất cả"
                            options={QUESTION_TYPE_OPTIONS}
                            disabled={isDisabled}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[name, "quantity"]} style={{ marginBottom: 8 }}>
                          <InputNumber
                            min={0}
                            className="w-full"
                            onChange={(value) => {
                              if (!value) {
                                form.setFieldValue([level.key, name, "type"], undefined)
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[name, "point"]} style={{ marginBottom: 8 }}>
                          <InputNumber min={0} className="w-full" disabled={isDisabled} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          style={{ marginBottom: 8 }}
                        />
                      </Col>
                    </Row>
                  )
                })}
                <Form.ErrorList errors={errors} />
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => add({ ...EMPTY_ROW })}
                >
                  Thêm loại câu hỏi
                </Button>
              </div>
            )}
          </Form.List>
        </Col>
      ))}
    </PutFormModal>
  )
}

export default PutChuongMucModal
