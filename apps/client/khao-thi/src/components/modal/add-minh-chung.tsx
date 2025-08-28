import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { AnalysisFormEvidence, Evidence, RequirementCriterion } from '@workspace/db'
import { useFindManyEvidence, useFindUniqueRequirementCriterion } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { diffArrays, type ItemProps } from '@workspace/libs/utils'
import { Col, Form, message, Select } from 'antd'
import { GripVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvidenceType = RequirementCriterion & {
    evidences: string[]
}

interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}
const AddEvidenceToPeriod = () => {
    const [items, setItems] = useState<ItemProps[] | []>([])
    const [form] = Form.useForm<PutEvidenceType>()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; refetch: () => void }>({
        tag: AddEvidenceToPeriod.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output?: PutEvidenceType) {
        if (!output) return
        try {
            showSpinner()

            if (input?.id) {
                const { onlyInA: onlyInNew, onlyInB: onlyInOld } = diffArrays(
                    items,
                    initialValue?.evidences?.length
                        ? initialValue?.evidences.map(
                              (i: { evidenceId: string; evidence: Evidence }) => ({
                                  value: i?.evidenceId,
                                  label: i?.evidence?.name,
                              })
                          )
                        : [],
                    'value'
                )
                let listTransition: any = []

                if (onlyInOld.length) {
                    listTransition = [
                        ...listTransition,
                        ...items.map((i) => {
                            return {
                                model: 'AnalysisFormEvidence',
                                operation: 'delete',
                                data: {
                                    where: {
                                        requirementCriterionId_evidenceId: {
                                            requirementCriterionId: input?.id,
                                            evidenceId: i.value,
                                        },
                                    },
                                },
                            }
                        }),
                    ]
                }
                if (onlyInNew.length) {
                    listTransition = [
                        ...listTransition,
                        ...onlyInNew.map((i) => {
                            return {
                                model: 'AnalysisFormEvidence',
                                operation: 'create',
                                data: {
                                    data: {
                                        requirementCriterionId: input?.id,
                                        evidenceId: i.value,
                                        order: 1,
                                    },
                                },
                            }
                        }),
                    ]
                }

                listTransition = [
                    ...listTransition,
                    ...onlyInNew.map((i, index: number) => {
                        return {
                            model: 'AnalysisFormEvidence',
                            operation: 'update',
                            data: {
                                where: {
                                    requirementCriterionId_evidenceId: {
                                        requirementCriterionId: input?.id,
                                        evidenceId: i.value,
                                    },
                                },
                                data: {
                                    order: index + 1,
                                },
                            },
                        }
                    }),
                ]
                if (listTransition?.length) {
                    await sqlTransaction(listTransition)
                }

                message.success('Cập nhật thành công')
            }
            input?.refetch()
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { data: listEvidence } = useFindManyEvidence()
    const { data: initialValue } = useFindUniqueRequirementCriterion(
        {
            where: { id: input?.id },
            include: {
                evidences: {
                    include: {
                        evidence: true,
                    },
                },
            },
        },
        {
            enabled: !!input?.id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                evidences: initialValue.evidences.map(
                    (evi: AnalysisFormEvidence) => evi.evidenceId
                ),
            })
            setItems(
                initialValue.evidences.map((evi: AnalysisFormEvidence & { evidence: Evidence }) => {
                    return {
                        key: evi.evidenceId,
                        label: evi.evidence.name,
                        value: evi.evidenceId,
                    }
                })
            )
        }
    }, [initialValue])

    const ItemType = 'LIST_ITEM'
    type Item = {
        value: string
        label: string
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
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Gán minh chứng cho phiếu đánh giá'}
            className="w-[700px]"
        >
            <Col span={24}>
                <Form.Item name="evidences" label="Minh chứng" required>
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
                    {/* <Tree
                        defaultExpandAll
                        checkedKeys={initValue}
                        treeData={treeData}
                        checkable
                        multiple
                        onCheck={onCheck}
                    /> */}
                </Form.Item>
            </Col>
            <Col span={24}>
                <Col span={24} className="font-semibold mb-3">
                    Danh sách khối kiến thức trong CTĐT
                </Col>
                <Col span={24}>
                    <DndProvider backend={HTML5Backend}>
                        <div className="">
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
            </Col>
        </PutFormModal>
    )
}

export default AddEvidenceToPeriod
