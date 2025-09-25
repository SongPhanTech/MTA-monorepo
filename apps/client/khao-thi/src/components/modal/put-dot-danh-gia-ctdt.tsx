import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { createId, type EvaluationPeriod } from '@workspace/db'
import {
    useFindManyStandardCatalog,
    useFindUniqueEvaluationPeriod,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Col, Form, Input, message, Tree } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvaluationPeriod = EvaluationPeriod
dayjs.locale('vi')

type TreeNode = {
    key: string
    title: string
    children?: TreeNode[]
}

const filterTree = (nodes: TreeNode[], checkedKeys: string[]): TreeNode[] => {
    return nodes
        .map((node) => {
            const children = node.children ? filterTree(node.children, checkedKeys) : []
            if (checkedKeys.includes(node.key) || children.length > 0) {
                return {
                    ...node,
                    children: children.length > 0 ? children : [],
                }
            }
            return null
        })
        .filter(Boolean) as TreeNode[]
}

const getAllKeys = (nodes: TreeNode[]) => {
    let keys: string[] = []
    for (const node of nodes) {
        keys.push(node.key)
        if (node.children) {
            keys = keys.concat(getAllKeys(node.children))
        }
    }
    return keys
}

const PutEvaluationPeriod = () => {
    const [form] = Form.useForm<PutEvaluationPeriod>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvaluationPeriod',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialData } = useFindUniqueEvaluationPeriod(
        { where: { id } },
        { enabled: !!id }
    )

    const { data: dataCatalog } = useFindManyStandardCatalog(
        {
            select: {
                id: true,
                name: true,
                criteria: {
                    select: {
                        id: true,
                        name: true,
                        scoreScaleId: true,
                        requirementCriterionCatalog: {
                            select: { id: true, name: true, questions: true },
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        },
        { enabled: !id }
    )

    const treeData = useMemo(() => {
        return (
            dataCatalog?.map(({ criteria, ...standard }) => ({
                key: standard.id,
                title: standard.name,
                name: standard.name,
                children: criteria.map(({ requirementCriterionCatalog, ...cri }) => ({
                    key: cri.id,
                    title: cri.name,
                    ...cri,
                    children: requirementCriterionCatalog.map((req) => ({
                        key: req.id,
                        title: req.name,
                        ...req,
                    })),
                })),
            })) || []
        )
    }, [dataCatalog])

    type TreeData = typeof treeData
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [catalogSelected, setCatalogSelected] = useState<TreeData>([])

    useEffect(() => {
        setCatalogSelected(treeData)
        const allKeys = getAllKeys(treeData)
        setCheckedKeys(allKeys)
    }, [treeData])

    const onCheck = (checked: string[]) => {
        setCheckedKeys(checked)
        const filtered = filterTree(treeData, checkedKeys as string[])
        setCatalogSelected(filtered as TreeData)
    }

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
    async function onOk(output?: PutEvaluationPeriod) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name.trim(),
                startDate: output.startDate,
                endDate: output.endDate,
                description: output.description,
            }
            if (id) {
                await updateEvaluationPeriod({ data, where: { id } })
                message.success('Cập nhật thành công')
            } else {
                const periodId = createId()

                const standards = catalogSelected.map((s, i1) => {
                    const standardId = createId()
                    const criteria = s.children.map((c, i2) => {
                        const evaluationCriterionId = createId()
                        const requirements = c.children.map(({ name, questions }, i3) => {
                            return {
                                evaluationCriterionId,
                                id: createId(),
                                order: i3 + 1,
                                name: name,
                                questions,
                            }
                        })
                        return {
                            standardId,
                            id: evaluationCriterionId,
                            order: i2 + 1,
                            name: c.name,
                            scoreScaleId: c.scoreScaleId,
                            requirementCriterionCatalog: requirements,
                        }
                    })

                    return {
                        periodId,
                        id: standardId,
                        name: s.name,
                        order: i1 + 1,
                        criteria,
                    }
                })

                const res = await sqlTransaction([
                    {
                        model: 'EvaluationPeriod',
                        operation: 'create',
                        data: {
                            data: { id: periodId, ...data },
                        },
                    },
                    {
                        model: 'EvaluationStandard',
                        operation: 'createMany',
                        data: {
                            data: standards.map(({ criteria, ...standard }) => standard),
                        },
                    },
                    {
                        model: 'EvaluationCriterion',
                        operation: 'createMany',
                        data: {
                            data: standards.flatMap((standard) =>
                                standard.criteria.map(
                                    ({ requirementCriterionCatalog, ...criterion }) => criterion
                                )
                            ),
                        },
                    },
                    {
                        model: 'RequirementCriterion',
                        operation: 'createMany',
                        data: {
                            data: standards.flatMap((standard) =>
                                standard.criteria.flatMap(
                                    ({ requirementCriterionCatalog }) => requirementCriterionCatalog
                                )
                            ),
                        },
                    },
                ])

                if (res.status !== 200) {
                    message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                    return
                }

                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationPeriod'],
            })
            onClose()
        } catch (error) {
            console.log(error)

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                startDate: dayjs(initialData.startDate),
                endDate: initialData.endDate ? dayjs(initialData.endDate) : undefined,
            })
        } else {
            form.setFieldsValue({
                startDate: dayjs(),
            })
        }
    }, [initialData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đợt đánh giá CTĐT' : 'Thêm mới đợt đánh giá CTĐT'}
            className="w-[700px]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên đợt đánh giá" required>
                    <Input placeholder="Nhập tên đợt đánh giá" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        defaultValue={dayjs()}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('startDate')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('day')
                        }}
                    />
                </FormItem>
            </Col>
            {!id && (
                <Col span={24}>
                    <Form.Item label="Tiêu chuẩn đánh giá của đợt" required>
                        <Tree
                            checkable
                            checkedKeys={checkedKeys}
                            treeData={treeData}
                            onCheck={(checked) => onCheck(checked as string[])}
                        />
                    </Form.Item>
                </Col>
            )}
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationPeriod
