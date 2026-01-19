import { useDisclosure } from 'react-hook-disclosure-modal'
import { Col, Form, Input, Row, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import {
    useCreateKnowledgeBlock,
    useFindManyKnowledgeBlock,
    useFindUniqueKnowledgeBlock,
    useUpdateKnowledgeBlock,
} from '@workspace/db/hooks'
import { LEVEL_COLUMNS, QUESTION_TYPE_OPTIONS } from '@constants/constants'
import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import type { ConfigExam } from '@workspace/db/client'

export interface KnowledgeBlockFormData extends Record<string, unknown> {
    name: string
    code: string
    description?: string
    biet: ConfigExam
    hieu: ConfigExam
    vanDung: ConfigExam
    VanDungCao: ConfigExam
}

const PutChuongMucModal = () => {
    const [form] = Form.useForm<KnowledgeBlockFormData>()
    const { isOpen, onClose, input } = useDisclosure<{
        id?: string
        matrixId?: string
        subjectVersionId?: string
    }>({
        tag: 'PutChuongMucModal',
        onClose: form.resetFields,
    })


    const watchedValues = Form.useWatch([], form)

    const { mutateAsync: createKnowledgeBlock } = useCreateKnowledgeBlock()
    const { mutateAsync: updateKnowledgeBlock } = useUpdateKnowledgeBlock()

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

    const existingCodes = knowledgeBlocks.map((item: any) => item.code).filter(Boolean)
    const currentCode = knowledgeBlockData?.code

    useEffect(() => {
        if (knowledgeBlockData && input?.id) {
            const formData: any = {
                name: knowledgeBlockData.name,
                code: knowledgeBlockData.code,
                description: knowledgeBlockData.description,
            }

            knowledgeBlockData.configExams?.forEach((config: any) => {
                const levelColumn = LEVEL_COLUMNS.find((col) => col.difficult === config.difficult)
                if (levelColumn) {
                    formData[levelColumn.key] = {
                        type: config.type,
                        quantity: config.quantity,
                        point: config.point,
                    }
                }
            })

            form.setFieldsValue(formData)
        }
    }, [knowledgeBlockData, input?.id, form])

    const onOk = async (values: KnowledgeBlockFormData) => {
        const configExams = LEVEL_COLUMNS.reduce<any[]>((acc, level) => {
            const levelData = values[level.key] as ConfigExam
            if (!levelData?.quantity || levelData.quantity <= 0) return acc

            acc.push({
                difficult: level.difficult,
                type: levelData.type,
                quantity: levelData.quantity,
                point: levelData.point ?? 0,
            })

            return acc
        }, [])

        try {
            if (!values) return

            if (input?.id) {
                await updateKnowledgeBlock({
                    where: {
                        id: input.id,
                    },
                    data: {
                        name: values.name,
                        code: values.code,
                        description: values.description,
                        configExams: {
                            deleteMany: {},
                            create: configExams,
                        },
                    },
                })
            } else {
                if (!input?.matrixId) {
                    message.error('Thiếu Ma trận đề')
                    return
                }

                if (!input?.subjectVersionId) {
                    message.error('Thiếu Phiên bản môn học')
                    return
                }

                await createKnowledgeBlock({
                    data: {
                        code: values.code,
                        name: values.name,
                        description: values.description,
                        examMatrixId: input.matrixId,
                        subjectVersionId: input.subjectVersionId,
                        configExams: {
                            create: configExams,
                        },
                    },
                })
            }

            message.success(
                input?.id ? 'Cập nhật chuẩn đầu ra thành công' : 'Thêm mới chuẩn đầu ra thành công'
            )

            queryClient.invalidateQueries({
                queryKey: ['KnowledgeBlock'],
            })

            onClose()
        } catch (error: any) {
            message.error(
                input?.id ? 'Cập nhật chuẩn đầu ra thất bại' : 'Thêm mới chuẩn đầu ra thất bại'
            )
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            title={input?.id ? 'Cập nhật chuẩn đầu ra' : 'Thêm mới chuẩn đầu ra'}
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
                        { required: true, message: 'Vui lòng nhập mã chuẩn đầu ra' },
                        {
                            validator: async (_, value) => {
                                if (!value) return Promise.resolve()
                                if (input?.id && value === currentCode) {
                                    return Promise.resolve()
                                }
                                const isDuplicate = existingCodes.includes(value)

                                if (isDuplicate) {
                                    return Promise.reject(
                                        new Error(
                                            'Mã chuẩn đầu ra đã tồn tại, vui lòng nhập mã khác'
                                        )
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
                            form.setFieldValue('code', e.target.value.toUpperCase())
                        }}
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input placeholder="Nhập mô tả" />
                </FormItem>
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
                                    <div className="text-center font-medium text-sm py-1">
                                        {col.label}
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <Row gutter={12} align="middle">
                    <Col xs={24} sm={6}>
                        Số lượng câu hỏi
                    </Col>
                    <Col xs={24} sm={18}>
                        <Row gutter={12}>
                            {LEVEL_COLUMNS.map((col) => (
                                <Col xs={12} sm={6} key={col.key}>
                                    <Form.Item
                                        name={[col.key, 'quantity']}
                                        style={{ marginBottom: 8 }}
                                        initialValue={0}
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (value == null) return Promise.resolve()
                                                    if (value === 0 || value === undefined) {
                                                        return Promise.reject(
                                                            new Error(
                                                                'Số lượng câu hỏi phải lớn hơn 0'
                                                            )
                                                        )
                                                    }
                                                    return Promise.resolve()
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber min={0} className="w-full" />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Col>

            <Col span={24}>
                <Row gutter={12} align="middle">
                    <Col xs={24} sm={6}>
                        Loại câu hỏi
                    </Col>
                    <Col xs={24} sm={18}>
                        <Row gutter={12}>
                            {LEVEL_COLUMNS.map((col) => {
                                const quantity = (watchedValues?.[col.key] as ConfigExam)?.quantity
                                const isDisabled = !quantity || quantity === 0

                                return (
                                    <Col xs={12} sm={6} key={col.key}>
                                        <Form.Item
                                            name={[col.key, 'type']}
                                            style={{ marginBottom: 8 }}
                                        >
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

            <Col span={24}>
                <Row gutter={12} align="middle">
                    <Col xs={24} sm={6}>
                        Điểm
                    </Col>
                    <Col xs={24} sm={18}>
                        <Row gutter={12}>
                            {LEVEL_COLUMNS.map((col) => {
                                const quantity = (watchedValues?.[col.key] as ConfigExam)?.quantity
                                const isDisabled = !quantity || quantity === 0

                                return (
                                    <Col xs={12} sm={6} key={col.key}>
                                        <Form.Item
                                            name={[col.key, 'point']}
                                            style={{ marginBottom: 8 }}
                                            initialValue={1}
                                        >
                                            <InputNumber
                                                min={0}
                                                className="w-full"
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
