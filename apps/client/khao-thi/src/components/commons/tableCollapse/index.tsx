import { DownOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { TableProps as TableAntdProps } from "antd"
import type { ColumnType, TablePaginationConfig } from "antd/es/table"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import Table, { type ColumnOption } from "../table"
import type { FilterProps } from "../typeFilter"

interface BaseNode {
  id: string
  key?: string
  $type?: "parent" | "child"
}

export type ChildData = BaseNode & {
  [key: string]: any
}

export type Data<T, ChildKey extends keyof T> = T &
  BaseNode & {
    [key in ChildKey]: ChildData[]
  }

type TableProps<T, ChildKey extends keyof T> = {
  data?: Data<T, ChildKey>[]
  columns?: (ColumnType<Data<T, ChildKey>[ChildKey][number]> & {
    type?: "input" | "input_search" | "select" | "tree_select" | "order" | "date"
    distinctFilters?: string[]
    options?: ColumnOption[]
  })[]
  pagination?:
    | (TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
      })
    | false
  headerTitleKey: keyof T | ((record: T) => ReactNode)
  onRow?: (data: T, index?: number) => React.HTMLAttributes<any> & React.TdHTMLAttributes<any>
  onRowClick?: (record: T) => void
  expandable?: TableAntdProps<T>["expandable"]
  rowKey?: string
  id?: string
  selectedRow?: string | null
  scrollable?: boolean
  maxHeight?: number | string
  currentPage?: number
  filters?: FilterProps
  setFilters?: (record: FilterProps) => void
  headerRight?: (record: T) => ReactNode | ReactNode[]
  childrenFieldName: ChildKey
  onRowDoubleClick?: (record: T) => void
  defaultExpandAll?: boolean
  hideDefaultSTT?: boolean
} & Omit<
  TableAntdProps,
  "columns" | "data" | "pagination" | "headerTitleKey" | "onRow" | "childrenFieldName"
>

const TableCollapse = <
  T extends {
    id: string
    key?: string
    $type?: "parent" | "child"
  },
  ChildKey extends keyof T,
>({
  data = [],
  columns = [],
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
  childrenFieldName,
  onRowDoubleClick,
  defaultExpandAll,
  hideDefaultSTT = false,
  filters,
  setFilters,
  ...rest
}: TableProps<T, ChildKey>) => {
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

  const dataWithKey: T[] = useMemo(() => {
    if (!data) return []

    return data.map((item) => {
      const children = item[childrenFieldName]
      const hasChildren = Array.isArray(children)
      // Nếu item không có key thì tạo key mới
      if (!item.key) {
        item.key = item.id
      }

      if (hasChildren) {
        const childrenArray = children?.map((child) => {
          if (!child.key) {
            child.key = child.id
          }
          return {
            ...child,
            $type: "child",
          }
        })
        // Đảm bảo trường children được đặt đúng tên
        const newItem = {
          ...item,
          $type: "parent",
          [childrenFieldName]: childrenArray,
        }
        return newItem
      }
      // Item không có children thì chắc chắn là child
      if (!item.key) {
        item.key = item.id
      }
      return {
        ...item,
        $type: "child",
      }
    })
  }, [data, childrenFieldName])

  useEffect(() => {
    if (defaultExpandAll && dataWithKey.length > 0) {
      setExpandedKeys(dataWithKey.map((d) => d.key as React.Key))
    } else {
      const firstWithChildren = dataWithKey.find(
        (item) => Array.isArray(item[childrenFieldName]) && item[childrenFieldName]?.length > 0
      )
      if (firstWithChildren?.key) {
        setExpandedKeys([firstWithChildren.key])
      }
    }
  }, [defaultExpandAll, dataWithKey, childrenFieldName])

  const allChildren = useMemo(() => {
    const children: T[ChildKey][] = []
    if (!dataWithKey) return children
    for (const item of dataWithKey) {
      const itemChildren = item[childrenFieldName] as T[ChildKey][] | undefined
      if (item.$type === "parent" && Array.isArray(itemChildren)) {
        children.push(...itemChildren)
      } else if (item.$type === "child") {
        children.push(item as T[ChildKey])
      }
    }
    return children
  }, [dataWithKey, childrenFieldName])

  const restColumns = useMemo(() => {
    const defaultSTTColumn = {
      title: "STT",
      align: "center",
      width: 60,
      // fixed: 'left',
      render: (_: any, record: T) => {
        if (record.$type !== "child") return ""

        // @ts-expect-error
        const order = allChildren.findIndex((item) => item.key === record.key)
        return order >= 0
          ? order +
              1 +
              (((typeof pagination !== "boolean" && pagination?.current) || currentPage || 1) -
                1) *
                DEFAULT_PAGINATE_SIZE
          : ""
      },
    }

    const baseColumns = hideDefaultSTT ? [...columns] : [defaultSTTColumn, ...columns]

    // Merge onCell for colSpan handling
    return baseColumns?.map((col, index) => ({
      ...col,
      onCell: (record: T) => ({
        colSpan: Array.isArray(record[childrenFieldName])
          ? index === 0
            ? baseColumns.length
            : 0
          : 1,
      }),
    }))
  }, [columns, childrenFieldName, allChildren, currentPage, pagination, hideDefaultSTT])

  return (
    <>
      <Table
        id={id}
        rowKey={rowKey}
        // className="mt-4"
        // sticky={{ offsetHeader: 100 }} // Ghim header ở đầu bảng khi scroll y
        // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
        // scroll={{ x: '100%', y: scrollable ? maxHeight : 500 }} // Ghim header ở đầu bảng khi scroll y
        // scroll={{
        //     x: 'max-content',
        //     y: scrollable ? maxHeight : undefined,
        // }}
        bordered
        data={dataWithKey}
        pagination={pagination}
        onRow={(record) => {
          const children = record[childrenFieldName]
          const isParent = Array.isArray(children)

          // Nếu là cha -> không cho click/doubleClick
          if (isParent) {
            return {
              style: { cursor: "default" },
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
            style: { cursor: "pointer" },
            className: record.id === selectedRow ? "bg-blue-100" : "",
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
            return Array.isArray(children) ? (
              <div className="flex w-full">
                {children.length > 0 && (
                  <DownOutlined
                    onClick={(e) => {
                      e.stopPropagation()
                      onExpand(record, e)
                    }}
                    style={{
                      transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                      marginRight: 8,
                      fontSize: 12,
                      position: "sticky",
                      top: 0,
                      left: 10,
                    }}
                  />
                )}

                <div className="flex w-full items-center justify-between">
                  <strong className="select-none sticky left-[30px]">
                    {typeof headerTitleKey === "function"
                      ? headerTitleKey(record as T)
                      : ((record as T)[headerTitleKey as keyof T] as ReactNode)}
                  </strong>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="select-none sticky right-[11px]"
                  >
                    {headerRight?.(record as T)}
                  </div>
                </div>
              </div>
            ) : null
          },
          childrenColumnName: childrenFieldName as string,
          ...expandable,
        }}
        {...rest}
        columns={restColumns as any[]}
        filters={filters}
        setFilters={setFilters}
      />
      <style>
        {`
                .indent-level-1 {
                    display: none !important
                }
                .ant-table-cell[colspan] {
                    text-align: left !important;
                }
                .ant-table-row > td:first-child:not(:hover) {
                    background-color: white;
                }
            `}
      </style>
    </>
  )
}

export default TableCollapse
