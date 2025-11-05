import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { createId, type EvaluationPeriod } from '@workspace/db'
import { useFindManyStandardCatalog } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Col, Form, message, Tree } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export type PutEvaluationPeriod = EvaluationPeriod & {
    councilIds: string[]
}

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

const PutTieuChuanTieuChi = () => {
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure({
        tag: 'PutTieuChuanTieuChi',
    })

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const [form] = Form.useForm<PutEvaluationPeriod>()

    type TreeData = typeof treeData
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [catalogSelected, setCatalogSelected] = useState<TreeData>([])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: dataCatalog } = useFindManyStandardCatalog({
        select: {
            id: true,
            name: true,
            criteria: {
                select: {
                    id: true,
                    name: true,
                    scoreScaleId: true,
                    requirementCriterionCatalog: {
                        select: {
                            id: true,
                            name: true,
                            questions: true,
                        },
                        orderBy: {
                            order: 'asc',
                        },
                    },
                },
                orderBy: {
                    order: 'asc',
                },
            },
        },
    })
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

    const onOk = async () => {
        try {
            showSpinner()
            if (id) {
            } else {
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
                        periodId: selectedEvaluationPeriodId,
                        id: standardId,
                        name: s.name,
                        order: i1 + 1,
                        criteria,
                    }
                })

                const res = await sqlTransaction([
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
                queryKey: ['EvaluationStandard'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            form={form}
            title="Cập nhật tiêu chuẩn - tiêu chí"
            open={isOpen}
            onCancel={onClose}
            className="w-[500px]"
            onFinish={onOk}
        >
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
        </PutFormModal>
    )
}

export default PutTieuChuanTieuChi
