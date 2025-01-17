import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Empty, Table as TableAntd } from 'antd'
import { ColumnsType, TablePaginationConfig } from 'antd/es/table'
type TableProps<T> = {
    columns?: ColumnsType<T>
    data?: T[]
    pagination?: TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
    }
}

const Table = <T extends Record<string, any>>({
    columns = [],
    data,
    pagination,
}: TableProps<T>) => {
    return (
        <TableAntd
            className="mt-4"
            columns={columns.map((column) => ({
                ...column,
                key: column.key || (column as any).dataIndex,
            }))}
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
                ...pagination,
                onShowSizeChange(current, size) {
                    pagination?.onShowSizeChange?.(size)
                },
            }}
        />
    )
}

export default Table
