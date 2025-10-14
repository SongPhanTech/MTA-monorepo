import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingBlock, TrainingBlockOnCurriculumVersion } from '@workspace/db'
import { useFindManyTrainingBlock, useFindUniqueCurriculumVersion } from '@workspace/db/hooks'
import { Col, Form, message, Row, Select,TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { sqlTransaction } from '@workspace/libs/api/model'
import { diffArrays, type ItemProps } from '@workspace/libs/utils'
import { GripVertical } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
export type PutTrainingBlockOnCurriculumVersion = TrainingBlockOnCurriculumVersion & {
    trainingBlockIds: string[]
}
type TreeNode = {
    value: string
    title: string
    children?: TreeNode[]
}

dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    curriculumVersionId: string
}
const PutTrainingBlockOnCurriculumVersion = () => {
    const [form] = Form.useForm<PutTrainingBlockOnCurriculumVersion>()
    const { isOpen, onClose, input } = useDisclosure<TrainingBlockOnCurriculumVersionInput>({
        tag: 'PutTrainingBlockOnCurriculumVersion',
        onClose: form.resetFields,
    })

    const [items, setItems] = useState<ItemProps[] | []>([])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueCurriculumVersion(
        {
            where: { id: input?.curriculumVersionId },
            include: {
                trainingBlocks: {
                    include: {
                        trainingBlock: true,
                    },
                    orderBy: {
                        priority: 'asc',
                    },
                },
            },
        },
        { enabled: !!input?.curriculumVersionId }
    )

    const { data: trainingBlockData = [] } = useFindManyTrainingBlock()
    console.log('trainingBlockData', trainingBlockData)

    useEffect(() => {
        if (initialValue) {
            const initialItems =
                initialValue?.trainingBlocks.map(
                    (i: TrainingBlockOnCurriculumVersion & { trainingBlock: TrainingBlock }) => ({
                        value: i.trainingBlockId,
                        label: i.trainingBlock.name,
                    })
                ) || []
            setItems(initialItems)

            form.setFieldsValue({
                trainingBlockIds: initialItems.map(item => item.value),
            })
        }
    }, [initialValue, form.setFieldsValue])

    async function onOk(output?: PutTrainingBlockOnCurriculumVersion) {
        if (!output) return
        try {
            showSpinner()
            if (!items?.length) {
                message.error('Vui lòng chọn ít nhất một khối kiến thức')
                return
            }
            const { onlyInA: onlyInNew, onlyInB: onlyInOld } = diffArrays(
                items,
                initialValue?.trainingBlocks?.length
                    ? initialValue?.trainingBlocks.map(
                          (i: { trainingBlockId: string; trainingBlock: TrainingBlock }) => ({
                              value: i?.trainingBlockId,
                              label: i?.trainingBlock?.name,
                          })
                      )
                    : [],
                'value' // Tiếp tục so sánh dựa trên key 'value'
            )
            let listTransition: any = []

            if (onlyInOld.length) {
                listTransition = [
                    ...listTransition,
                    ...onlyInOld.map((i) => {
                        return {
                            model: 'TrainingBlockOnCurriculumVersion',
                            operation: 'delete',
                            data: {
                                where: {
                                    trainingBlockId_curriculumVersionId: {
                                        trainingBlockId: i.value,
                                        curriculumVersionId: input?.curriculumVersionId as string,
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
                            model: 'TrainingBlockOnCurriculumVersion',
                            operation: 'create',
                            data: {
                                data: {
                                    curriculumVersionId: input?.curriculumVersionId as string,
                                    trainingBlockId: i.value,
                                    priority: 1,
                                },
                            },
                        }
                    }),
                ]
            }

            listTransition = [
                ...listTransition,
                ...items.map((i, index: number) => {
                    return {
                        model: 'TrainingBlockOnCurriculumVersion',
                        operation: 'update',
                        data: {
                            where: {
                                trainingBlockId_curriculumVersionId: {
                                    trainingBlockId: i.value,
                                    curriculumVersionId: input?.curriculumVersionId as string,
                                },
                            },
                            data: {
                                priority: index + 1,
                            },
                        },
                    }
                }),
            ]
            if (listTransition?.length) {
                await sqlTransaction(listTransition)
            }

            message.success('Cập nhật thông tin khối kiến thức thành công')
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
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

    // const trainingBlockIdForm = Form.useWatch('trainingBlockIds', form)

    // use
    const treeData = useMemo(() => {
        const buildTree = (nodes: TrainingBlock[]): TreeNode[] => {
            const map = new Map<string, TreeNode>()
            const roots: TreeNode[] = []

            // Khởi tạo map với các node, thêm thuộc tính children
            nodes.forEach((node) => {
                map.set(node.id, {
                    value: node.id,
                    title: node.name,
                    children: [],
                })
            })

            // Xây dựng cây bằng cách liên kết cha-con
            nodes.forEach((node) => {
                if (node.parentId && map.has(node.parentId)) {
                    const parentNode = map.get(node.parentId)
                    const currentNode = map.get(node.id)
                    if (parentNode && currentNode) {
                        parentNode.children?.push(currentNode)
                    }
                } else {
                    const rootNode = map.get(node.id)
                    if (rootNode) {
                        roots.push(rootNode)
                    }
                }
            })
            // Lọc bỏ các children rỗng để giao diện đẹp hơn
            const cleanEmptyChildren = (nodes: TreeNode[]) => {
                nodes.forEach(node => {
                    if (node.children && node.children.length > 0) {
                        cleanEmptyChildren(node.children);
                    } else {
                        delete node.children;
                    }
                });
                return nodes;
            }

            return cleanEmptyChildren(roots)
        }
        return buildTree(trainingBlockData)
    }, [trainingBlockData])
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Cập nhật khối kiến thức'}
            className="min-w-[800px] w-[1000px]"
        >
            <Col span={24}>
                <FormItem form={form} name="trainingBlockIds" label="Khối kiến thức" required>
                <TreeSelect
                        treeData={treeData}
                        multiple
                        allowClear
                        treeCheckable={true} // Cho phép checkbox để chọn
                        treeCheckStrictly 
                        placeholder="Chọn khối kiến thức"
                        maxTagCount={'responsive'}
                        treeDefaultExpandAll // Mặc định mở rộng tất cả các node
                        onChange={hanldeOnchange}
                        style={{ width: '100%' }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <Row gutter={[16, 16]}>
                    <Col span={24} className="font-semibold pl-4">
                        Danh sách khối kiến thức trong CTĐT
                    </Col>
                    <Col span={24}>
                        <DndProvider backend={HTML5Backend}>
                            <div className=" mt-6">
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
        </PutFormModal>
    )
}

export default PutTrainingBlockOnCurriculumVersion
