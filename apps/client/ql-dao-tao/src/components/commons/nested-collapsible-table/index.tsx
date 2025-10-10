import { Table } from 'antd'
import type { ColumnType, TableProps } from 'antd/es/table'

export interface NestedColumn<T = any> extends Omit<ColumnType<T>, 'render'> {
    type?: 'input' | 'select' | 'order'
    options?: Array<{ value: any; label: string }>
    render?: (value: any, record: T, index: number) => React.ReactNode
    hidden?: boolean
}

export interface NestedCollapsibleTableProps<T = any> {
    data: T[]
    columns: NestedColumn<T>[]
    nestedKeys: string[] // e.g., ['trainingLocation', 'buildings']
    defaultExpandAllRows?: boolean
    rowKey?: string | ((record: T) => string)
    expandable?: TableProps<T>['expandable']
    className?: string
    loading?: boolean
    pagination?: TableProps<T>['pagination']
    scroll?: TableProps<T>['scroll']
    getParentLabel?: (record: T, level: number) => string
    getParentCount?: (record: T, level: number) => number
    renderParentActions?: (record: T, level: number, parentIndex: string[]) => React.ReactNode
}

export function NestedCollapsibleTable<T extends Record<string, any>>({
    data,
    columns,
    nestedKeys,
    defaultExpandAllRows = false,
    rowKey = 'id',
    expandable,
    className,
    loading = false,
    pagination = false,
    scroll = { x: 'max-content' },
    getParentLabel,
    getParentCount,
    renderParentActions,
}: NestedCollapsibleTableProps<T>) {
    const transformData = (items: T[], currentLevel = 0): any[] => {
        if (currentLevel >= nestedKeys.length) {
            return items
        }

        return items.map((item) => {
            const childKey = nestedKeys[currentLevel]
            const children = item[childKey]

            if (children && Array.isArray(children) && children.length > 0) {
                return {
                    ...item,
                    children: transformData(children, currentLevel + 1),
                    _level: currentLevel,
                    _isParent: true,
                }
            }

            return {
                ...item,
                _level: currentLevel,
                _isParent: false,
            }
        })
    }

    const createDynamicColumns = (): ColumnType<any>[] => {
        // First column shows the hierarchy label for all levels
        const sttColumn: ColumnType<any> = {
            title: 'STT',
            key: '_hierarchy',
            width: 300,
            fixed: 'left',
            onCell: (record) => {
                const level = record._level ?? nestedKeys.length
                if (level < nestedKeys.length) {
                    return {
                        colSpan: renderParentActions ? columns.length : columns.length + 1,
                    }
                }
                return {}
            },
            render: (_, record, index) => {
                const level = record._level ?? nestedKeys.length
                const indentSize = 24 // pixels per level
                const paddingLeft = level * indentSize
                // For parent levels, show custom label with count
                if (level < nestedKeys.length) {
                    let label = ''
                    let count = 0

                    if (getParentLabel) {
                        label = getParentLabel(record, level)
                    } else {
                        // Default label format: "code - name"
                        const code = record.code || record.sMa || record.Id || ''
                        const name = record.name || record.sTen || ''
                        label = `${code} - ${name}`
                    }

                    if (getParentCount) {
                        count = getParentCount(record, level)
                    } else {
                        // Default count: number of children
                        const childKey = nestedKeys[level]
                        const children = record[childKey]
                        count = Array.isArray(children) ? children.length : 0
                    }

                    return (
                        <span
                            className="font-medium"
                            style={{ paddingLeft: `${paddingLeft}px`, display: 'inline-block' }}
                        >
                            {label} ({count})
                        </span>
                    )
                }

                return (
                    <span style={{ paddingLeft: `${paddingLeft}px`, display: 'inline-block' }}>
                        {index + 1}
                    </span>
                )
            },
        }

        const dataColumns: ColumnType<any>[] = columns
            .filter((col) => !col.hidden)
            .map((col, index) => {
                const isLastColumn = index === columns.filter((c) => !c.hidden).length - 1
                const shouldRenderParentActions = isLastColumn && renderParentActions

                return {
                    ...col,
                    key: (col.dataIndex as string) || col.key,
                    onCell: (record: any) => {
                        const level = record._level ?? nestedKeys.length
                        // Hide this cell for parent rows (colSpan: 0 makes it hidden)
                        if (level < nestedKeys.length) {
                            if (shouldRenderParentActions) {
                                return {}
                            }
                            return {
                                colSpan: 0,
                            }
                        }
                        return {}
                    },
                    render: (value: any, record: any, index: number) => {
                        const level = record._level ?? nestedKeys.length

                        if (level < nestedKeys.length) {
                            if (shouldRenderParentActions) {
                                const parentIndex = nestedKeys.slice(0, level + 1)
                                return renderParentActions(record, level, parentIndex)
                            }
                            return null
                        }

                        return col.render ? col.render(value, record, index) : value
                    },
                }
            })

        return [sttColumn, ...dataColumns]
    }

    const transformedData = transformData(data)
    const tableColumns = createDynamicColumns()

    return (
        <Table
            columns={tableColumns}
            dataSource={transformedData}
            rowKey={rowKey}
            className={className}
            loading={loading}
            pagination={pagination}
            scroll={scroll}
            defaultExpandAllRows={defaultExpandAllRows}
            expandable={{
                indentSize: 24,
                ...expandable,
            }}
            bordered
        />
    )
}
