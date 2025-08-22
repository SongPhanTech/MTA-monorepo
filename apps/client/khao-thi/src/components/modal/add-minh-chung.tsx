import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { RequirementCriterion } from '@workspace/db'
import {
    useFindManyEvidenceCategory,
    useFindUniqueRequirementCriterion,
    useUpdateRequirementCriterion,
} from '@workspace/db/hooks'
import type { ItemProps } from '@workspace/libs/utils'
import { Col, Form, message, Select, type TreeProps } from 'antd'
import { GripVertical } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
    const [initValue, setInitValue] = useState<string[]>([])
    const [items, setItems] = useState<ItemProps[] | []>([])
    const [form] = Form.useForm<PutEvidenceType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: AddEvidenceToPeriod.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateRequirementCriterion } = useUpdateRequirementCriterion()
    async function onOk(output?: PutEvidenceType) {
        if (!output) return
        try {
            showSpinner()

            await updateRequirementCriterion({
                where: {
                    id: id,
                },
                data: {},
            })
            if (id) {
                message.success('Cập nhật thành công')
            } else {
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Evidence'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { data: listEvidence } = useFindManyEvidenceCategory({
        include: {
            evidences: true,
        },
    })
    const { data: initialValue } = useFindUniqueRequirementCriterion(
        {
            where: { id: id },
            include: {
                evidences: {
                    include: {
                        evidence: true,
                    },
                },
            },
        },
        {
            enabled: !!id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                evidences: initialValue.evidences.map((evi) => evi.evidenceId),
            })
        }
    }, [initialValue])

    const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
        // info.checkedNodes: (DataNode & { children?: DataNode[] })[]
        const onlyLeafValues = (info.checkedNodes as MyTreeNode[])
            .filter((node) => !node.children?.length) // chỉ lấy node không có children
            .map((node) => node.value ?? node.key) // lấy value nếu có, không thì lấy key

        // form.setFieldValue('evidences', onlyLeafValues)
        setInitValue(onlyLeafValues)
    }

    const treeData = useMemo(() => {
        return (
            listEvidence?.map(({ evidences, ...evidenceCategory }) => ({
                key: evidenceCategory.id,
                title: evidenceCategory.name,
                name: evidenceCategory.name,
                children: evidences.map(({ ...evi }) => ({
                    key: evi.id,
                    title: evi.name,
                    ...evi,
                })),
            })) || []
        )
    }, [listEvidence])
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
            title={'Thêm minh chứng cho tiêu chí'}
            className="w-[700px]"
        >
            <Col span={24}>
                <Form.Item label="Minh chứng" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn khối kiến thức"
                        onChange={(value, option: any) => {
                            hanldeOnchange(option)
                        }}
                    />
                    <Col span={24}>
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
                    </Col>
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
        </PutFormModal>
    )
}

export default AddEvidenceToPeriod
