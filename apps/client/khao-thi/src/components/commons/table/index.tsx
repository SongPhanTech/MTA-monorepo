import { Table as TableAntd, type TableProps as TableAntdProps } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

export type TableParamsAntdType = {
    pagination: {
        current: number
        pageSize: number
        total?: number
    }
}

export type TableProps<T> = Omit<TableAntdProps<T>, 'onChange'> & {
    columns?: ColumnsType<T>
    data?: T[]
    pagination?: TablePaginationConfig | false
    /**
     * Custom onChange handler chỉ nhận pagination đơn giản
     */
    onChange?: (params: TableParamsAntdType) => void
    expandable?: TableAntdProps<T>['expandable']
    rowKey?: string | number | ((record: T) => string | number)
}

const Table = <T extends Record<string, unknown>>({
    columns = [],
    data,
    pagination,
    onChange,
    expandable,
    rowKey,
    ...rest
}: TableProps<T>) => {
    const handleChange: TableAntdProps<T>['onChange'] = (
        paginationConfig,
        _filters,
        _sorter,
        _extra
    ) => {
        if (onChange) {
            onChange({
                pagination: {
                    current: paginationConfig.current ?? 1,
                    pageSize: paginationConfig.pageSize ?? 10,
                    total: paginationConfig.total,
                },
            })
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <TableAntd
                className="mt-4"
                columns={columns as ColumnsType<T>}
                dataSource={data}
                locale={{
                    emptyText: 'Không có dữ liệu',
                }}
                onChange={handleChange}
                pagination={pagination}
                rowClassName={(_, index) => (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                expandable={expandable}
                rowKey={rowKey}
                {...rest}
            />
        </div>
    )
}

export default Table
