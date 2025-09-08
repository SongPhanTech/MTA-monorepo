import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingBlock, TrainingBlockOnCurriculumVersion } from '@workspace/db'
import {
    useFindManyTrainingBlock,
    useFindUniqueCurriculumVersion,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Form, message, Row, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { sqlTransaction } from '@workspace/libs/api/model'
import { diffArrays, type ItemProps } from '@workspace/libs/utils'
import { GripVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
export type PutTrainingBlockOnCurriculumVersion = TrainingBlockOnCurriculumVersion & {
    trainingBlockIds: string[]
}

dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    curriculumVersionId: string
}
const PutTrainingBlockOnCurriculumVersion = () => {
    const [form] = Form.useForm<PutTrainingBlockOnCurriculumVersion>()
    const { isOpen, onClose, input } = useDisclosure<TrainingBlockOnCurriculumVersionInput>({
        tag: PutTrainingBlockOnCurriculumVersion.name,
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

    useEffect(() => {
        if (initialValue) {
            setItems(
                initialValue?.trainingBlocks.map(
                    (i: TrainingBlockOnCurriculumVersion & { trainingBlock: TrainingBlock }) => ({
                        value: i.trainingBlockId,
                        label: i.trainingBlock.name,
                    })
                ) || []
            )
            form.setFieldsValue({
                trainingBlockIds: initialValue?.trainingBlocks?.length
                    ? initialValue?.trainingBlocks.map(
                          (item: TrainingBlockOnCurriculumVersion) => item?.trainingBlockId
                      )
                    : [],
            })
        }
    }, [initialValue, form.setFieldsValue])

    const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()

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
                'value'
            )

            if (onlyInOld.length || onlyInNew.length) {
                await updateCurriculumVersion({
                    where: { id: input?.curriculumVersionId },
                    data: {
                        trainingBlocks: {
                            deleteMany: {
                                trainingBlockId: { in: onlyInOld.map((item) => item.value) },
                            },
                            createMany: {
                                data: onlyInNew.map(({ value }) => ({
                                    trainingBlockId: value,
                                    priority: 1,
                                })),
                            },
                        },
                    },
                })
            }
            const queries = items.map((item, index) => ({
                model: 'TrainingBlockOnCurriculumVersion' as const,
                operation: 'update' as const,
                data: {
                    where: {
                        trainingBlockId_curriculumVersionId: {
                            trainingBlockId: item.value,
                            curriculumVersionId: input?.curriculumVersionId as string,
                        },
                    },
                    data: { priority: index + 1 },
                },
            }))
            await sqlTransaction(queries)
            message.success('Cập nhật thông tin khối kiến thức thành công')
            queryClient.invalidateQueries({
                queryKey: ['TrainingBlock'],
            })
            onClose()
        } catch (_error) {
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
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn khối kiến thức"
                        options={trainingBlockData.map((i: TrainingBlock) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={(value, option: any) => {
                            hanldeOnchange(option)
                        }}
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
