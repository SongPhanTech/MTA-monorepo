import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Empty, Table as TableAntd, type TableProps as TableAntdProps } from "antd"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"

type TableProps<T> = {
  columns?: ColumnsType<T>
  data?: T[]
  pagination?: TablePaginationConfig & {
    onShowSizeChange?: ((size: number) => void) | undefined
  }
} & Omit<TableAntdProps<T>, "columns">

const Table = <T extends Record<PropertyKey, any>>({
  columns = [],
  data,
  pagination,
  ...rest
}: TableProps<T>) => {
  return (
    <TableAntd<T>
      className="mt-4"
      bordered
      dataSource={data}
      locale={{
        emptyText: <Empty description="Không có dữ liệu" />,
      }}
      {...rest}
      columns={columns.map((column) => ({
        ...column,
        key: column.key || (column as unknown as { dataIndex: string }).dataIndex,
        dataIndex: (column as unknown as { dataIndex: string }).dataIndex,
      }))}
      pagination={{
        position: ["bottomRight"],
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
