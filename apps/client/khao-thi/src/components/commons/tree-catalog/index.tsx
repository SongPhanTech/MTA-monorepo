import { Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type React from 'react'
import { useMemo, useState } from 'react'

type Item = {
    id: string
    name: string
}

interface ExtendedStandardCatalog extends Item {
    criteria: (Item & {
        requirementCriterionCatalog: Item[]
    })[]
}

interface Props {
    data?: ExtendedStandardCatalog[]
    onCheckSplit?: (checked: {
        standards: string[]
        criteria: string[]
        requirements: string[]
    }) => void
}

const TreeCatalog: React.FC<Props> = ({ data, onCheckSplit }) => {
    const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])

    const treeData: DataNode[] = useMemo(() => {
        return (
            data?.map((standard) => ({
                key: standard.id,
                title: standard.name,
                children: standard.criteria.map((cri) => ({
                    key: `${standard.id}-${cri.id}`,
                    title: cri.name,
                    children: cri.requirementCriterionCatalog.map((req) => ({
                        key: `${standard.id}-${cri.id}-${req.id}`,
                        title: req.name,
                    })),
                })),
            })) || []
        )
    }, [data])

    const handleCheck = (checkedKeysValue: string[]) => {
        setCheckedKeys(checkedKeysValue)

        const standards: string[] = []
        const criteria: string[] = []
        const requirements: string[] = []

        ;(checkedKeysValue as string[]).forEach((key) => {
            const [standardId, criteriaId, requirementId] = key.split('-')

            standards.push(standardId)
            criteria.push(criteriaId)
            requirements.push(requirementId)
        })

        onCheckSplit?.({ standards, criteria, requirements })
    }

    return (
        <Tree
            checkable
            defaultExpandAll
            treeData={treeData}
            checkedKeys={checkedKeys}
            onCheck={(checkedKeys) => handleCheck(checkedKeys as string[])}
        />
    )
}

export default TreeCatalog
