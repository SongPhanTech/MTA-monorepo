import React, { useMemo, useState } from 'react'
import { TreeSelect as TreeSelectAnt } from 'antd'
import type { TreeSelectProps } from 'antd'
import { TreeNodeType } from '@/utils/convertOrganizationToTree'
import {
    useFindManyOrganization,
} from '@workspace/db/hooks'

// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
    defaultValue: string | undefined
    onChange?: (value: string) => void
    onPopupScroll?: TreeSelectProps['onPopupScroll']
}

const TreeSelectDepartment: React.FC<CustomTreeSelectProps> = ({
    placeholder = 'Chọn bộ môn',
    style = { width: '100%' },
    dropdownStyle = { maxHeight: 400, overflow: 'auto' },
    defaultValue,
    onChange,
    onPopupScroll,
}) => {
    const [value, setValue] = useState<string | undefined>(defaultValue)

    // Lấy thông tin SchoolYear
    const {
            data: organizationDataKhoa = [],
            refetch: refetchOrganizationKhoa,
        } = useFindManyOrganization({
            include: {
                type: true,
            },
            where: {
                type: {
                    code: 'KHOA',
                },
            },
        })
        const {
            data: organizationDataBoMon = [],
            refetch: refetchOrganizationBoMon,
        } = useFindManyOrganization({
            include: {
                type: true,
            },
            where: {
                type: {
                    code: 'BOMON',
                },
            },
        })
    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
        const khoaList = organizationDataKhoa || []
        const bomonList = organizationDataBoMon || []
        return khoaList.map((khoa) => ({
            value: `khoa-${khoa.id}`,
            title: khoa.name,
            selectable: false, // Make the node unselectable without changing its color
            children: bomonList
                .filter((bomon) => bomon.parentId === khoa.id)
                .map((bomon) => ({
                    value: bomon.id,
                    title: bomon.name,
                })),
        }))
    }, [organizationDataKhoa, organizationDataBoMon])

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

    // Hàm lọc tùy chỉnh cho tìm kiếm
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode.title.toLowerCase().includes(input.toLowerCase())
    }

    return (
        <TreeSelectAnt
            // treeCheckable
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
            // loading={
            //     semesterLoading
            // }
        />
    )
}

export default TreeSelectDepartment
