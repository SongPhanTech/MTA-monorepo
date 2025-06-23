import type { TreeNodeType } from '@/utils/convertOrganizationToTree'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type { TreeSelectProps } from 'antd'
import type React from 'react'
import { useState } from 'react'
// Define props for our custom component
interface CustomTreeSelectProps {
    treeData: TreeNodeType[]
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue?: string
    onChange?: (value: string) => void
    onPopupScroll?: TreeSelectProps['onPopupScroll']
}

const TreeSelect: React.FC<CustomTreeSelectProps> = ({
    treeData,
    placeholder = 'Please select',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    onChange,
    onPopupScroll,
}) => {
    const [value, setValue] = useState<string | undefined>(defaultValue)

    const handleChange = (newValue: string) => {
        setValue(newValue)
        if (onChange) {
            onChange(newValue)
        }
    }

    const handlePopupScroll: TreeSelectProps['onPopupScroll'] = (e) => {
        if (onPopupScroll) {
            onPopupScroll(e)
        }
    }

    const filterTreeNode = (inputValue: string, treeNode: any) => {
        const title = treeNode.title?.toLowerCase() || ''
        const searchTerm = inputValue.toLowerCase()
        let titleIndex = 0
        for (let i = 0; i < searchTerm.length; i++) {
            const charToFind = searchTerm[i]
            const foundIndex = title.indexOf(charToFind, titleIndex)

            if (foundIndex < 0) {
                return false
            }

            titleIndex = foundIndex + 1
        }

        return true
    }

    return (
        <TreeSelectAnt
            showSearch
            style={style}
            value={value}
            dropdownStyle={dropdownStyle}
            placeholder={placeholder}
            allowClear
            treeDefaultExpandAll
            onChange={handleChange}
            treeData={treeData}
            onPopupScroll={handlePopupScroll}
            filterTreeNode={filterTreeNode}
            treeNodeFilterProp="title"
        />
    )
}

export default TreeSelect
