import { DownOutlined } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import type { TableProps as TableAntdProps } from "antd"
import type { ColumnType, TablePaginationConfig } from "antd/es/table"
import {
  Fragment,
  memo,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { cn } from "@workspace/ui/lib/utils"
import Table, { type ColumnOption } from "../table"

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
  header?: ReactNode
  data?: Data<T, ChildKey>[]
  columns?: (ColumnType<Data<T, ChildKey>[ChildKey][number]> & {
    type?: "input" | "input_search" | "select" | "tree_select" | "order" | "date" | "cmp"
    distinctFilters?: string[]
    options?: ColumnOption[]
  })[]
  pagination?:
    | (TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
      })
    | false

  headerTitleKey: keyof T | ((record: T) => ReactNode)
  headerColumn?: ColumnType<Data<T, ChildKey>>[]
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
  resetIndexPerGroup?: boolean
  shouldCellUpdate?: (record: ChildData, prevRecord: ChildData) => boolean
  // Đóng nhóm chỉ ẩn dòng con bằng CSS thay vì unmount ⇒ đóng/mở không phải mount lại control trong ô
  keepCollapsedRowsMounted?: boolean
} & Omit<
  TableAntdProps,
  "columns" | "data" | "pagination" | "headerTitleKey" | "onRow" | "childrenFieldName" | "number"
>

// Trạng thái nhóm đang đóng để ngoài React state: bấm đóng/mở chỉ render lại thẻ <style> và icon của nhóm,
// không render lại cả bảng (dùng cho keepCollapsedRowsMounted)
function createCollapsedGroupStore() {
  let collapsedKeys = new Set<string>()
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => collapsedKeys,
    toggle: (key: string) => {
      const next = new Set(collapsedKeys)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      collapsedKeys = next
      emit()
    },
    reset: (keys: string[]) => {
      collapsedKeys = new Set(keys)
      emit()
    },
  }
}

type CollapsedGroupStore = ReturnType<typeof createCollapsedGroupStore>

const toCssToken = (value: React.Key) => String(value).replace(/[^a-zA-Z0-9_-]/g, "_")
const groupRowClassName = (groupKey: React.Key) => `tc-group-${toCssToken(groupKey)}`

function CollapsedGroupStyle({
  store,
  scopeClassName,
}: {
  store: CollapsedGroupStore
  scopeClassName: string
}) {
  const collapsedKeys = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return (
    <style>
      {[...collapsedKeys]
        .map((key) => `.${scopeClassName} tr.${groupRowClassName(key)} { display: none; }`)
        .join("\n")}
    </style>
  )
}

function ExpandArrow({
  expanded,
  onClick,
}: {
  expanded: boolean
  onClick: React.MouseEventHandler<HTMLSpanElement>
}) {
  return (
    <DownOutlined
      onClick={onClick}
      style={{
        transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 0.2s ease",
        marginRight: 8,
        fontSize: 12,
        position: "sticky",
        top: 0,
        left: 10,
      }}
    />
  )
}

function StoreExpandArrow({
  store,
  groupKey,
  onClick,
}: {
  store: CollapsedGroupStore
  groupKey: string
  onClick: React.MouseEventHandler<HTMLSpanElement>
}) {
  const collapsed = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().has(groupKey),
    () => store.getSnapshot().has(groupKey)
  )
  return <ExpandArrow expanded={!collapsed} onClick={onClick} />
}

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
  headerColumn,
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
  filters,
  setFilters,
  resetIndexPerGroup = false,
  shouldCellUpdate,
  keepCollapsedRowsMounted = false,
  className,
  ...rest
}: TableProps<T, ChildKey>) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [collapsedGroupStore] = useState(createCollapsedGroupStore)
  const scopeClassName = `tc-scope-${toCssToken(useId())}`

  const handleExpand = (expanded: boolean, record: T) => {
    const children = record[childrenFieldName]

    if (!Array.isArray(children) || children?.length === 0) return
    if (keepCollapsedRowsMounted) {
      if (record.key) collapsedGroupStore.toggle(String(record.key))
      return
    }
    setExpandedKeys((prev) => {
      if (expanded && record.key) {
        return [...prev, record.key]
      }
      return prev.filter((k) => k !== record.key)
    })
  }

  const dataWithKey: T[] = useMemo(() => {
    if (!data) return []

    return data.map((item) => {
      const children = item[childrenFieldName]
      const hasChildren = Array.isArray(children)
      if (!item.key) {
        // @ts-expect-error
        item.key = item.id || item?.[rowKey]
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
        const newItem = {
          ...item,
          $type: "parent",
          [childrenFieldName]: childrenArray,
        }
        return newItem
      }
      if (!item.key) {
        item.key = item.id
      }
      return {
        ...item,
        $type: "child",
      }
    })
  }, [data, childrenFieldName, rowKey])

  // Chỉ mở lại tất cả khi danh sách nhóm đổi, không phải mỗi lần data đổi tham chiếu (vd. sửa 1 ô)
  const parentKeys = useMemo(() => dataWithKey.map((d) => d.key as React.Key), [dataWithKey])
  const parentKeysSignature = parentKeys.join("|")

  useEffect(() => {
    if (keepCollapsedRowsMounted) {
      collapsedGroupStore.reset(
        !defaultExpandAll && parentKeysSignature ? parentKeysSignature.split("|") : []
      )
      return
    }

    if (!defaultExpandAll) {
      setExpandedKeys([])
      return
    }

    if (defaultExpandAll && parentKeysSignature) {
      setExpandedKeys(parentKeysSignature.split("|"))
      return
    }
  }, [defaultExpandAll, parentKeysSignature, keepCollapsedRowsMounted, collapsedGroupStore])

  const groupKeyByChildKey = useMemo(() => {
    const groupKeys = new Map<React.Key, React.Key>()
    if (!keepCollapsedRowsMounted) return groupKeys
    for (const item of dataWithKey) {
      const itemChildren = item[childrenFieldName]
      if (item.$type !== "parent" || !Array.isArray(itemChildren)) continue
      for (const child of itemChildren) groupKeys.set(child.key, item.key as React.Key)
    }
    return groupKeys
  }, [keepCollapsedRowsMounted, dataWithKey, childrenFieldName])

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
    const indexMap = new Map<string, number>()
    if (resetIndexPerGroup) {
      dataWithKey.forEach((parent) => {
        const children = parent[childrenFieldName] as any[]
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            indexMap.set(child.key, index + 1)
          })
        }
      })
    }

    const childIndexByKey = new Map<string, number>()
    allChildren.forEach((item: any, index) => {
      if (item?.key != null) childIndexByKey.set(item.key, index)
    })

    const baseColumns = [
      {
        title: "TT",
        align: "center",
        width: 40,
        render: (_: any, record: T) => {
          if (record.$type !== "child") return ""

          if (resetIndexPerGroup) {
            return indexMap.get(record.key as string) ?? ""
          }

          const order = childIndexByKey.get(record.key as string)
          return order != null
            ? order +
                1 +
                (((typeof pagination !== "boolean" && pagination?.current) || currentPage || 1) -
                  1) *
                  DEFAULT_PAGINATE_SIZE
            : ""
        },
      },
      ...columns.map((col) => (shouldCellUpdate ? { ...col, shouldCellUpdate } : col)),
    ]

    return baseColumns?.map((col, index) => ({
      ...col,
      onCell: (record: T) => {
        const isParent = record.$type === "parent"
        if (isParent && headerColumn && headerColumn.length > 0) {
          const headerCol = headerColumn[index]
          if (headerCol) {
            return {
              colSpan: headerCol.colSpan || 1,
            }
          }
        }
        return {
          colSpan: isParent ? (index === 0 ? baseColumns.length : 0) : 1,
        }
      },
      render: (text: any, record: Data<T, ChildKey>, idx: number) => {
        const isParent = record.$type === "parent"
        if (isParent && headerColumn && headerColumn.length > 0) {
          const headerCol = headerColumn[index]
          if (headerCol) {
            return headerCol?.render?.(text, record, idx)
          }
        }
        if (isParent) {
          return ""
        }
        if (col.render) {
          return col.render(text, record, index)
        }
        return text
      },
    }))
  }, [
    columns,
    allChildren,
    currentPage,
    pagination,
    headerColumn,
    dataWithKey,
    childrenFieldName,
    resetIndexPerGroup,
    shouldCellUpdate,
  ])

  return (
    <Fragment>
      <Table
        id={id}
        rowKey="key"
        className={cn("mt-2", className, keepCollapsedRowsMounted && scopeClassName)}
        scrollable={scrollable}
        maxHeight={maxHeight}
        bordered
        data={dataWithKey}
        pagination={pagination}
        onRow={(record, index) => {
          const children = record[childrenFieldName]
          const isParent = Array.isArray(children)

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
            className: record.id && selectedRow && record.id === selectedRow ? "bg-blue-100" : "",
            ...rest.onRow?.(record, index),
          }
        }}
        expandable={{
          expandedRowKeys: keepCollapsedRowsMounted ? parentKeys : expandedKeys,
          onExpand: handleExpand,
          rowExpandable: (record) => {
            const children = record[childrenFieldName]
            return Array.isArray(children) && children.length > 0
          },
          expandRowByClick: true,
          expandIcon: ({ expanded, onExpand, record }) => {
            const children = record[childrenFieldName]
            const handleArrowClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
              e.stopPropagation()
              onExpand(record, e)
            }
            return Array.isArray(children) ? (
              <div className="flex justify-center">
                {children.length > 0 &&
                  (keepCollapsedRowsMounted ? (
                    <StoreExpandArrow
                      store={collapsedGroupStore}
                      groupKey={String(record.key)}
                      onClick={handleArrowClick}
                    />
                  ) : (
                    <ExpandArrow expanded={expanded} onClick={handleArrowClick} />
                  ))}
                {!headerColumn && (
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
                )}
              </div>
            ) : null
          },
          childrenColumnName: childrenFieldName as string,
          ...expandable,
        }}
        {...rest}
        {...(keepCollapsedRowsMounted
          ? {
              rowClassName: (record: T, index: number, indent: number) => {
                const groupKey = groupKeyByChildKey.get(record.key as React.Key)
                return cn(
                  typeof rest.rowClassName === "function"
                    ? rest.rowClassName(record, index, indent)
                    : rest.rowClassName,
                  groupKey !== undefined && groupRowClassName(groupKey)
                )
              },
            }
          : {})}
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
      {keepCollapsedRowsMounted && (
        <CollapsedGroupStyle store={collapsedGroupStore} scopeClassName={scopeClassName} />
      )}
    </Fragment>
  )
}

export default memo(TableCollapse) as typeof TableCollapse
