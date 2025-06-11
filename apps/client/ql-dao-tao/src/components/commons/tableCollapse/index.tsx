import { DownOutlined } from '@ant-design/icons'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Table as TableAntd, type TableProps as TableAntdProps } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { type ReactNode, useMemo, useState } from 'react'
import Table from '../table'
import { uniqueId } from 'lodash'

type Data = Record<string, unknown> & {
    key?: string
    children?: Data[]
}

type TableProps<T extends Data> = {
    data?: T[]
    pagination?: TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
    }
    headerTitleKey: keyof T | ((record: T) => ReactNode)
    onRowClick?: (record: T) => void
    expandable?: TableAntdProps<T>['expandable']
    rowKey?: string
    id?: string
    selectedRow?: string | null
    scrollable?: boolean
    maxHeight?: number
    currentPage: number
    headerRight?: (record: T) => ReactNode | ReactNode[]
    childrenFieldName?: string
    onRowDoubleClick?: (record: T) => void
} & TableAntdProps
function generateKey(prefix = 'key') {
    return `${uniqueId(prefix)}`
}
const TableCollapse = <T extends Data>({
    data,
    headerTitleKey,
    headerRight,
    pagination,
    onRowClick,
    expandable,
    rowKey,
    id,
    selectedRow,
    scrollable,
    maxHeight,
    currentPage,
    childrenFieldName = 'children',
    onRowDoubleClick,
    ...rest
}: TableProps<T>) => {
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

    const handleExpand = (expanded: boolean, record: T) => {
        const children = record[childrenFieldName]
        if (!Array.isArray(children) || children?.length === 0) return
        setExpandedKeys((prev) => {
            if (expanded && record.key) {
                // Mở rộng thêm key
                return [...prev, record.key]
            }
            // Thu gọn bớt key
            return prev.filter((k) => k !== record.key)
        })
    }

    const dataWithKey = useMemo(() => {
        if (!data) return []

        return data.map((item) => {
            const children = item[childrenFieldName] as Data[] | undefined
            const hasChildren = Array.isArray(children)
            // Nếu item không có key thì tạo key mới
            if (!item.key) {
                item.key = generateKey('parent')
            }

            if (hasChildren) {
                const childrenArray = children?.map((child) => {
                    if (!child.key) {
                        child.key = generateKey('child')
                    }
                    return {
                        ...child,
                        type: 'child',
                    }
                })
                // Đảm bảo trường children được đặt đúng tên
                const newItem = {
                    ...item,
                    type: 'parent',
                    [childrenFieldName]: childrenArray,
                }
                return newItem
            }
            // Item không có children thì chắc chắn là child
            if (!item.key) {
                item.key = generateKey('child')
            }
            return {
                ...item,
                type: 'child',
            }
        })
    }, [data, childrenFieldName])

    const allChildren = useMemo(() => {
        const children: Data[] = []
        if (!dataWithKey) return children
        for (const item of dataWithKey) {
            const itemChildren = item[childrenFieldName] as Data[] | undefined
            if (item.type === 'parent' && Array.isArray(itemChildren)) {
                children.push(...itemChildren)
            } else if (item.type === 'child') {
                children.push(item)
            }
        }
        return children
    }, [dataWithKey, childrenFieldName])

    const columns: ColumnsType<T> = useMemo(() => {
        const baseColumns: ColumnsType<T> = [
            {
                title: 'STT',
                width: 10,
                align: 'center',
                fixed: 'left',
                render: (_, record) => {
                    // const children = record[childrenFieldName]
                    // if (Array.isArray(children)) {
                    //     return (
                    //         <div className="flex items-center justify-between">
                    //             <strong className="select-none sticky left-[30px]">
                    //                 {typeof headerTitleKey === 'function'
                    //                     ? headerTitleKey(record)
                    //                     : (record[headerTitleKey] as ReactNode)}
                    //             </strong>
                    //             <div className="select-none sticky right-[10px]">
                    //                 {headerRight}
                    //             </div>
                    //         </div>
                    //     )
                    // }
                    const order = allChildren.findIndex(
                        (item) => item.key === record.key
                    )
                    return order >= 0
                        ? order + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE
                        : null
                },
            },
            ...(rest.columns as ColumnsType<T>),
        ]

        // Merge onCell for colSpan handling
        return baseColumns?.map((col, index) => ({
            ...col,
            onCell: (record: T) => ({
                colSpan: Array.isArray(record[childrenFieldName])
                    ? index === 0
                        ? baseColumns?.length - 1
                        : 0
                    : 1,
            }),
        }))
    }, [currentPage, rest.columns, allChildren, childrenFieldName])

    return (
        <>
            <Table
                id={id}
                rowKey={rowKey}
                className="mt-4"
                // sticky={{ offsetHeader: 100 }} // Ghim header ở đầu bảng khi scroll y
                // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
                // scroll={{ x: '100%', y: scrollable ? maxHeight : 500 }} // Ghim header ở đầu bảng khi scroll y
                scroll={{
                    x: 'max-content',
                    y: scrollable ? maxHeight : undefined,
                }}
                bordered
                data={dataWithKey}
                pagination={pagination}
                onRow={(record) => {
                    const children = record[childrenFieldName]
                    const isParent =
                        Array.isArray(children) && children.length > 0

                    // Nếu là cha -> không cho click/doubleClick
                    if (isParent) {
                        return {
                            style: { cursor: 'default' },
                        }
                    }

                    return {
                        onClick: () => {
                            if (onRowClick) {
                                onRowClick(record)
                            }
                        },
                        onDoubleClick: () => {
                            if (onRowDoubleClick) {
                                onRowDoubleClick(record)
                            }
                        },
                        style: { cursor: 'pointer' },
                        className:
                            record.id === selectedRow ? 'bg-blue-100' : '',
                    }
                }}
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpand: handleExpand,
                    rowExpandable: (record) => {
                        const children = record[childrenFieldName]
                        return Array.isArray(children) && children.length > 0
                    },
                    expandRowByClick: true,
                    expandIcon: ({ expanded, onExpand, record }) => {
                        const children = record[childrenFieldName]
                        return Array.isArray(children) &&
                            children.length > 0 ? (
                            <div className="flex w-full">
                                <DownOutlined
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onExpand(record, e)
                                    }}
                                    style={{
                                        transform: expanded
                                            ? 'rotate(0deg)'
                                            : 'rotate(-90deg)',
                                        marginRight: 8,
                                        fontSize: 12,
                                        position: 'sticky',
                                        top: 0,
                                        left: 10,
                                    }}
                                />
                                <div className="flex w-full items-center justify-between">
                                    <strong className="select-none sticky left-[30px]">
                                        {typeof headerTitleKey === 'function'
                                            ? headerTitleKey(record)
                                            : ((record as T)[
                                                  headerTitleKey as keyof T
                                              ] as ReactNode)}
                                    </strong>
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="select-none sticky right-[11px]"
                                    >
                                        {headerRight?.(record)}
                                    </div>
                                </div>
                            </div>
                        ) : null
                    },
                    childrenColumnName: childrenFieldName,
                    ...expandable,
                }}
                {...rest}
                columns={columns}
            />
            <style>
                {`
                .indent-level-1 {
                    display: none !important
                }
                .ant-table-cell[colspan] {
                    text-align: left !important;
                }
            `}
            </style>
        </>
    )
}

export default TableCollapse
