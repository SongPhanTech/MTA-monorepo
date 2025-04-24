import React, { useState } from 'react'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type { TreeSelectProps } from 'antd'
import { TreeNodeType } from '@/utils/convertOrganizationToTree'
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
        />
    )
}

export default TreeSelect
