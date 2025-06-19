import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import {
    Empty,
    Table as TableAntd,
    type TableProps as TableAntdProps,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
type TableProps<T> = {
    columns?: ColumnsType<T>
    data?: T[]
    pagination?: TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
    }
    onRowClick?: (record: T) => void
    expandable?: TableAntdProps<T>['expandable']
    rowKey?: string
    id?: string
    selectedRow?: string | null
    scrollable?: boolean
    maxHeight?: number
    rowSelection?: TableRowSelection<T>
} & TableAntdProps

const Table = <T extends Record<string, unknown>>({
    columns = [],
    data,
    pagination,
    onRowClick,
    expandable,
    rowKey,
    id,
    selectedRow,
    scrollable,
    maxHeight,
    rowSelection,
    ...rest
}: TableProps<T>) => {
    return (
        <TableAntd<T>
            id={id}
            rowKey={rowKey}
            className="mt-4 custom-scrollbar"
            rowSelection={rowSelection}
            columns={
                columns.map((column) => ({
                    ...column,
                    key:
                        column.key ||
                        (column as unknown as { dataIndex: string }).dataIndex,
                })) as ColumnsType<T>
            }
            // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
            scroll={{ x: '100%', y: scrollable ? maxHeight : undefined }}
            bordered
            dataSource={data}
            locale={{
                emptyText: <Empty description="Không có dữ liệu" />,
            }}
            pagination={{
                position: ['bottomRight'],
                defaultPageSize: DEFAULT_PAGINATE_SIZE,
                showSizeChanger: {
                    labelRender: ({ value }) => `${value} / trang`,
                    optionRender: (oriOption) => `${oriOption.value} / trang`,
                },
                showTotal: (total, range) =>
                    `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                ...pagination,
                onShowSizeChange(current, size) {
                    pagination?.onShowSizeChange?.(size)
                },
            }}
            expandable={expandable}
            onRow={(record) => ({
                onClick: () => {
                    if (onRowClick) {
                        onRowClick(record)
                    }
                },
                style: { cursor: 'pointer' },
                className: record.id === selectedRow ? 'bg-blue-100' : '',
            })}
            {...rest}
        />
    )
}

export default Table
