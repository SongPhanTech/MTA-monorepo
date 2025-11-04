import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import {
    createId,
    type AnalysisFormEvidence,
    type Evidence,
    type RequirementCriterion,
} from '@workspace/db'
import { useFindManyEvidence, useFindUniqueRequirementCriterion } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { diffArrays, type ItemProps } from '@workspace/libs/utils'
import { Button, Col, Form, Input, InputNumber, type InputRef, message } from 'antd'
import { GripVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { TextArea } = Input

type PutRequirementCriterion = RequirementCriterion & {
    evidences: AnalysisFormEvidence[]
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

const ItemType = 'LIST_ITEM'

const PutTieuChiMinhChungModal = () => {
    const [form] = Form.useForm<PutRequirementCriterion>()
    const [items, setItems] = useState<ItemProps[]>([])

    const { isOpen, onClose, input } = useDisclosure<{
        id?: string
        evaluationCriterionId: string
    }>({
        tag: 'PutTieuChiMinhChungModal',
        onClose: form.resetFields,
    })

    const { hideSpinner, showSpinner } = useSpinner()

    const lastInputRef = useRef<InputRef | null>(null)

    const { data: listEvidence } = useFindManyEvidence()

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
                        order: 'asc',
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
                evidences: initialValue.evidences.map((evi) => evi.evidenceId) as any,
            })
            setItems(
                initialValue.evidences.map((evi) => ({
                    key: evi.evidenceId,
                    label: evi.evidence.name,
                    value: evi.evidenceId,
                }))
            )
        }
    }, [initialValue, form])

    const onOk = async (output: PutRequirementCriterion) => {
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                const { onlyInA: onlyInNew, onlyInB: onlyInOld } = diffArrays(
                    items,
                    initialValue?.evidences?.length
                        ? initialValue.evidences.map(
                              (i: { evidenceId: string; evidence: Evidence }) => ({
                                  value: i?.evidenceId,
                                  label: i?.evidence?.name,
                              })
                          )
                        : [],
                    'value'
                )

                let listTransition: any[] = []

                if (onlyInOld.length) {
                    listTransition = [
                        ...listTransition,
                        ...onlyInOld.map((i) => ({
                            model: 'AnalysisFormEvidence',
                            operation: 'delete',
                            data: {
                                where: {
                                    requirementCriterionId_evidenceId: {
                                        requirementCriterionId: input.id,
                                        evidenceId: i.value,
                                    },
                                },
                            },
                        })),
                    ]
                }

                if (onlyInNew.length) {
                    listTransition = [
                        ...listTransition,
                        ...onlyInNew.map((i) => ({
                            model: 'AnalysisFormEvidence',
                            operation: 'create',
                            data: {
                                data: {
                                    requirementCriterionId: input.id,
                                    evidenceId: i.value,
                                    order: 1,
                                },
                            },
                        })),
                    ]
                }

                listTransition = [
                    ...listTransition,
                    ...items.map((i, index: number) => ({
                        model: 'AnalysisFormEvidence',
                        operation: 'update',
                        data: {
                            where: {
                                requirementCriterionId_evidenceId: {
                                    requirementCriterionId: input.id,
                                    evidenceId: i.value,
                                },
                            },
                            data: {
                                order: index + 1,
                            },
                        },
                    })),
                    {
                        model: 'RequirementCriterion',
                        operation: 'update',
                        data: {
                            where: {
                                id: input.id,
                            },
                            data: {
                                name: output.name,
                                questions: output.questions,
                                evidencePlaces: output.evidencePlaces,
                                collectionMethod: output.collectionMethod,
                            },
                        },
                    },
                ]

                if (listTransition?.length) {
                    await sqlTransaction(listTransition)
                }

                message.success('Cập nhật thành công')
            } else {
                const id = createId()

                const listTransition: any[] = [
                    {
                        model: 'RequirementCriterion',
                        operation: 'create',
                        data: {
                            data: {
                                id: id,
                                evaluationCriterion: {
                                    connect: {
                                        id: input?.evaluationCriterionId,
                                    },
                                },
                                name: output.name,
                                order: Number(output.order),
                                questions: output.questions,
                                evidencePlaces: output.evidencePlaces || '',
                                collectionMethod: output.collectionMethod || '',
                            },
                        },
                    },
                ]

                if (items.length > 0) {
                    const evidenceTransactions = items.map((i, index: number) => ({
                        model: 'AnalysisFormEvidence',
                        operation: 'create',
                        data: {
                            data: {
                                requirementCriterionId: id,
                                evidenceId: i.value,
                                order: index + 1,
                            },
                        },
                    }))

                    listTransition.push(...evidenceTransactions)
                }

                await sqlTransaction(listTransition)

                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['RequirementCriterion'],
            })

            queryClient.invalidateQueries({
                queryKey: ['RequirementCriterion'],
            })

            onClose()
        } catch (error: any) {
            if (error?.infor?.messgae) {
                message.error(error?.infor?.message)
                return
            }
            message.error('Có lỗi xảy ra, vui lòng thử lại sau!')
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

    const hanldeOnchange = (value: ItemProps[]) => {
        if (value?.length) {
            setItems(
                value.map((i: ItemProps) => {
                    return {
                        value: i?.value,
                        label: i?.label,
                    }
                })
            )
        } else {
            setItems([])
        }
    }

    return (
        <PutFormModal
            form={form}
            title="Thêm mới tiêu chí, minh chứng"
            open={isOpen}
            onCancel={onClose}
            onFinish={onOk}
            className="w-[50vw] top-2"
        >
            <Col span={24}>
                <FormItem form={form} label="Yêu cầu tiêu chí" name="name" required>
                    <TextArea placeholder="Yêu cầu tiêu chí" />
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
                                            rules={[{ required: true, message: 'Nhập câu hỏi' }]}
                                            className="flex-1 mb-0"
                                        >
                                            <Input
                                                placeholder="Nhập mô tả"
                                                className="w-full"
                                                ref={
                                                    index === fields.length - 1
                                                        ? lastInputRef
                                                        : null
                                                }
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
                <FormItem form={form} name="order" label="Thứ tự" required>
                    <InputNumber className="w-full" placeholder="Thứ tự" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} label="Minh chứng" name="evidences">
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn minh chứng"
                        options={listEvidence?.map((i) => {
                            return {
                                label: i.name,
                                value: i.id,
                                key: i.id,
                            }
                        })}
                        onChange={(value, option: any) => {
                            hanldeOnchange(option)
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <Col span={24} className="font-semibold mb-3">
                    Danh sách khối kiến thức trong CTĐT
                </Col>
                <Col span={24}>
                    <DndProvider backend={HTML5Backend}>
                        {items.map((i: Item, index: number) => (
                            <DraggableItem
                                key={i.value}
                                item={i}
                                index={index}
                                moveItem={moveItem}
                            />
                        ))}
                    </DndProvider>
                </Col>
            </Col>
            <Col span={24} className="mt-6">
                <FormItem form={form} name="evidencePlaces" label="Nơi thu thập minh chứng">
                    <TextArea placeholder="Nơi thu thập" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="collectionMethod" label="Phương pháp thu thập">
                    <TextArea placeholder="Phương pháp thu thập" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTieuChiMinhChungModal
