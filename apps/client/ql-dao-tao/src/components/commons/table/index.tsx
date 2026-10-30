import { FilterFilled } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { ColumnTypeProps, FilterProps } from "@constants/type"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { cn } from "@workspace/ui/lib/utils"
import {
  AutoComplete,
  Button,
  Checkbox,
  type CheckboxChangeEvent,
  DatePicker,
  Empty,
  Input,
  Radio,
  Table as TableAntd,
  type TableProps as TableAntdProps,
  Tree,
} from "antd"
import type { ColumnGroupType, ColumnType, TablePaginationConfig } from "antd/es/table"
import type { FilterDropdownProps, TableRowSelection } from "antd/es/table/interface"
import dayjs from "dayjs"
import { Search } from "lucide-react"
import { Key, useCallback, useState } from "react"
import FilterSelect from "./filter-select"
import clsx from "clsx"

dayjs.locale("vi")

export type ColumnOption = {
  value: string | boolean
  label: string
  children?: ColumnOption[]
}

declare type PropertyKey = string | number | symbol
export type AnyObject = Record<PropertyKey, any>
export type ColumnsType<RecordType = AnyObject> = ((
  | ColumnGroupType<RecordType>
  | ColumnType<RecordType>
) & {
  type?:
    | "input"
    | "input_search"
    | "select"
    | "tree_select"
    | "order"
    | "date"
    | "cmp"
    | (string & {})
})[]

type TableProps<T = AnyObject> = {
  header?: React.ReactNode
  columns?: ColumnsType<T> & {
    distinctFilters?: string[]
    // options?: ColumnOption[]
  }
  data?: readonly T[]
  pagination?:
    | (TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
      })
    | false
  onRowClick?: (record: T) => void
  onRowDoubleClick?: (record: T) => void
  filters?: FilterProps
  setFilters?: (record: FilterProps) => void
  expandable?: TableAntdProps<T>["expandable"]
  rowKey?: string
  id?: string
  selectedRow?: string | null
  scrollable?: boolean
  maxHeight?: number | string
  rowSelection?: TableRowSelection<T>
} & Omit<TableAntdProps, "pagination">

export const Table = <T extends AnyObject>({
  columns = [],
  data,
  pagination,
  onRowClick,
  onRowDoubleClick,
  filters,
  setFilters,
  expandable,
  rowKey,
  id,
  selectedRow,
  scrollable,
  maxHeight,
  rowSelection,
  header,
  ...rest
}: TableProps<T>) => {
  const [filtersTable, setFiltersTable] = useState<FilterProps>(filters || {})

  const onCheckAllChange = (item: ColumnTypeProps, e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setFiltersTable({
        ...filters,
        [item.dataIndex as keyof FilterProps]: item.options?.map(
          (item: { value: string; label: string }) => item.value
        ),
      })
    } else {
      setFiltersTable({
        ...filtersTable,
        [item.dataIndex as keyof FilterProps]: [],
      })
    }
  }

  const onCheckChange = (item: ColumnTypeProps, e: string[]) => {
    setFiltersTable({
      ...filtersTable,
      [item.dataIndex as keyof FilterProps]: e || [],
    })
  }

  const checkAll = (item: ColumnTypeProps) => {
    const filter = filtersTable[item.dataIndex as keyof FilterProps] as string[]
    if (!item.options || !filter) return false
    return item.options?.length === filter?.length
  }

  const indeterminate = (item: ColumnTypeProps) => {
    const filter = filtersTable[item.dataIndex as keyof FilterProps] as string[]
    if (!item.options || !filter) return false
    return item?.options.length > filter.length && filter.length > 0
  }

  function updateObjectExcept(obj: Record<string, any>, excludeKeys: string[]) {
    const result: Record<string, any> = {}

    for (const key in obj) {
      if (excludeKeys.includes(key)) {
        // reset theo kiểu dữ liệu
        const value = obj[key]
        if (value === "asc" || value === "desc") {
          result[key] = undefined
        } else if (typeof value === "string" || typeof value === "number") {
          result[key] = ""
        } else if (Array.isArray(value)) {
          result[key] = []
        } else {
          result[key] = undefined // fallback cho các kiểu khác
        }
      } else {
        result[key] = obj[key] // giữ nguyên
      }
    }

    return result
  }

  function searchVietnamese(
    data: { value: string; label: string }[],
    keyword: string
  ): { value: string; label: string }[] {
    const normalizedKeyword = normalizeVietnamese(keyword.trim())
    if (!normalizedKeyword) return data

    return data.filter((item) => {
      const normalizedLabel = normalizeVietnamese(item.label)
      const normalizedValue = normalizeVietnamese(item.value)
      return (
        normalizedLabel.includes(normalizedKeyword) || normalizedValue.includes(normalizedKeyword)
      )
    })
  }

  function searchVietnameseTree(
    data: TreeNode[],
    keyword: string
  ): { tree: TreeNode[]; expanded: string[] } {
    const normalizedKeyword = normalizeVietnamese(keyword.trim())
    if (!normalizedKeyword) return { tree: data, expanded: [] }

    const expandedKeys: string[] = []

    const searchRecursive = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []

      for (const node of nodes) {
        const normalizedLabel = normalizeVietnamese(node.label)

        const match = normalizedLabel.includes(normalizedKeyword)

        const children = node.children ? searchRecursive(node.children) : []

        if (match || children.length > 0) {
          if (children.length > 0) {
            expandedKeys.push(node.value)
          }

          result.push({
            ...node,
            children: children.length > 0 ? children : node.children,
          })
        }
      }

      return result
    }

    return {
      tree: searchRecursive(data),
      expanded: expandedKeys,
    }
  }

  type TreeNode = {
    value: string
    label: string
    children?: TreeNode[]
  }
  const ListButton = useCallback(({ clear, click }: { clear: () => void; click: () => void }) => {
    return (
      <div className="flex justify-end gap-2">
        <Button size="small" onClick={clear}>
          Bỏ lọc
        </Button>
        <Button type="primary" size="small" onClick={click}>
          Lọc
        </Button>
      </div>
    )
  }, [])
  const genFilter = (item: ColumnTypeProps) => {
    if (item?.type === "input") {
      return {
        filterDropdown: (props: FilterDropdownProps) => (
          <div className="p-4 flex flex-col  w-full min-w-[200px] max-w-[300px]">
            <div>
              <div className="mb-2">Tìm kiếm</div>
              <Input
                placeholder="Tìm kiếm"
                value={filtersTable[item.dataIndex as keyof FilterProps] as string}
                onChange={(e) => {
                  setFiltersTable({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: e.target.value ? e.target.value : "",
                  })
                }}
                onPressEnter={() => {
                  if (item.distinctFilters) {
                    const result = {
                      ...updateObjectExcept(filtersTable, item.distinctFilters),
                    }
                    setFilters?.(result)
                    props.confirm()
                    return
                  }
                  const result = {
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]:
                      filtersTable[item.dataIndex as keyof FilterProps],
                  }
                  setFilters?.(result)
                  props.confirm()
                }}
                className="mb-3"
              />
            </div>
            <ListButton
              clear={() => {
                setFiltersTable({
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]: "",
                })
                setFilters?.({
                  ...filters,
                  [item.dataIndex as keyof FilterProps]: "",
                })
                props.confirm()
              }}
              click={() => {
                if (item.distinctFilters) {
                  const result = {
                    ...updateObjectExcept(filtersTable, item.distinctFilters),
                  }
                  setFilters?.(result)
                  props.confirm()
                  return
                }
                const result = {
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]:
                    filtersTable[item.dataIndex as keyof FilterProps],
                }
                setFilters?.(result)
                props.confirm()
              }}
            />
          </div>
        ),
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "input_search") {
      return {
        filterDropdown: (props: FilterDropdownProps) => (
          <div className="p-4 flex flex-col">
            <AutoComplete
              className="mb-3 w-full min-w-[200px] max-w-[300px]"
              placeholder="Tìm kiếm"
              allowClear
              options={item.options}
              filterOption={(inputValue, option: { value: string; label: string } | undefined) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1 ||
                option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              onSelect={(value) => {
                setFiltersTable({
                  ...filters,
                  [item?.dataIndex as keyof FilterProps]: value ? value : "",
                })
              }}
              onChange={(e) => {
                setFiltersTable({
                  ...filters,
                  [item.dataIndex as keyof FilterProps]: e ? e : "",
                })
              }}
            />
            <ListButton
              clear={() => {
                setFiltersTable({
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]: "",
                })
                setFilters?.({
                  ...filters,
                  [item.dataIndex as keyof FilterProps]: "",
                })
                props.confirm()
              }}
              click={() => {
                if (item.distinctFilters) {
                  const result = {
                    ...updateObjectExcept(filtersTable, item.distinctFilters),
                  }
                  setFilters?.(result)
                  props.confirm()
                  return
                }
                const result = {
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]:
                    filtersTable[item.dataIndex as keyof FilterProps],
                }
                setFilters?.(result)
                props.confirm()
              }}
            />
          </div>
        ),
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "select") {
      return {
        filterDropdown: (props: FilterDropdownProps) => {
          if (!item.options) return
          return (
            <div className="p-4 w-full min-w-[200px] max-w-[300px]">
              <FilterSelect
                item={item}
                onCheckAllChange={onCheckAllChange}
                onCheckChange={onCheckChange}
                checkAll={checkAll}
                indeterminate={indeterminate}
                filtersTable={filtersTable}
              />
              <ListButton
                clear={() => {
                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  setFilters?.({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  props.confirm()
                }}
                click={() => {
                  if (item.distinctFilters) {
                    const filter = filtersTable[item.dataIndex as keyof FilterProps] as string[]
                    const result = {
                      ...updateObjectExcept(filtersTable, item.distinctFilters),
                      [item.dataIndex as keyof FilterProps]: filter?.length ? filter : undefined,
                    }
                    setFilters?.(result)
                    props.confirm()
                    return
                  }
                  const result = {
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]:
                      filtersTable[item.dataIndex as keyof FilterProps],
                  }
                  setFilters?.(result)
                  props.confirm()
                }}
              />
            </div>
          )
        },
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "tree_select") {
      return {
        filterDropdown: (props: FilterDropdownProps) => {
          if (!item.options) return
          const [input, setInput] = useState("")
          const [optionsSearch, setOptionsSearch] = useState(item?.options || [])
          const [expandedKeys, setExpandedKeys] = useState<string[]>([])

          const handleSearchTree = async (value: string) => {
            if (!value.trim()) {
              setOptionsSearch(item?.options || [])
              return
            }

            try {
              const { tree, expanded } = searchVietnameseTree(item?.options || [], value.trim())

              setOptionsSearch(tree)
              setExpandedKeys(expanded)
            } catch (_error: unknown) {
              setOptionsSearch(item?.options || [])
            }
          }
          return (
            <div className="p-4 w-full min-w-[200px] max-w-[300px]">
              <div className="mb-2">Tìm kiếm</div>
              <Input
                placeholder="Nhập từ khoá cần tìm kiếm"
                prefix={
                  <Search
                    size={15}
                    style={{
                      color: "rgba(0, 0, 0, 0.25)",
                    }}
                  />
                }
                allowClear
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  handleSearchTree(e.target.value)
                }}
                style={{ height: 36, width: "100%", marginBottom: 16 }}
              />
              <Tree
                checkable
                selectable={false}
                multiple
                treeData={optionsSearch}
                checkedKeys={(filtersTable[item.dataIndex as keyof FilterProps] as string[]) || []}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys as string[])}
                onCheck={(checkedKeys) => {
                  const checked = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked

                  const prevChecked =
                    (filtersTable[item.dataIndex as keyof FilterProps] as string[]) || []

                  /** node đang hiển thị khi search */
                  const visibleKeys: string[] = []

                  const collectVisible = (nodes: any[]) => {
                    nodes.forEach((n) => {
                      visibleKeys.push(n.value)
                      if (n.children?.length) collectVisible(n.children)
                    })
                  }

                  collectVisible(optionsSearch)

                  /** giữ node không nằm trong search */
                  const remain = prevChecked.filter((k) => !visibleKeys.includes(k))

                  let final: Key[] = [...new Set([...remain, ...checked])]

                  /**
                   * DUYỆT LẠI TOÀN BỘ TREE (allData = item.options)
                   * để tính trạng thái cha
                   */
                  const walk = (nodes: any[]) => {
                    nodes.forEach((node) => {
                      if (!node.children?.length) return

                      const childrenKeys: string[] = node.children.map((c: any) => c.value)

                      const checkedChildren = childrenKeys.filter((k) => final.includes(k))

                      /**
                       * chỉ một phần con được check
                       * → cha phải indeterminate
                       */
                      if (
                        checkedChildren.length > 0 &&
                        checkedChildren.length < childrenKeys.length
                      ) {
                        final = final.filter((k) => k !== node.value)
                      }

                      /**
                       * tất cả con được check
                       * → cha được check
                       */
                      if (checkedChildren.length === childrenKeys.length) {
                        final.push(node.value)
                      }

                      walk(node.children)
                    })
                  }

                  walk(item.options || [])

                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: [...new Set(final)],
                  })
                }}
                autoExpandParent
                fieldNames={{
                  title: "label",
                  key: "value",
                  children: "children",
                }}
                className="w-full mb-3 max-h-[500px] overflow-y-auto"
              />
              <ListButton
                clear={() => {
                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  setFilters?.({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  props.confirm()
                }}
                click={() => {
                  if (item.distinctFilters) {
                    const filter = filtersTable[item.dataIndex as keyof FilterProps] as string[]
                    const result = {
                      ...updateObjectExcept(filtersTable, item.distinctFilters),
                      [item.dataIndex as keyof FilterProps]: filter?.length ? filter : undefined,
                    }
                    setFilters?.(result)
                    props.confirm()
                    return
                  }
                  const result = {
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]:
                      filtersTable[item.dataIndex as keyof FilterProps],
                  }
                  setFilters?.(result)
                  props.confirm()
                }}
              />
            </div>
          )
        },
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "order") {
      return {
        filterDropdown: (props: FilterDropdownProps) => {
          // if (!item.options) return
          return (
            <div className="p-4 w-full min-w-[200px] max-w-[300px]">
              <div className="mb-3">
                <div className="mb-2">Sắp xếp</div>
                <Radio.Group
                  onChange={(e) => {
                    setFiltersTable({
                      ...filters,
                      [item.dataIndex as keyof FilterProps]: e.target.value
                        ? e.target.value
                        : undefined,
                    })
                  }}
                  buttonStyle="solid"
                >
                  <Radio value={"asc"}>Tăng dần</Radio>
                  <Radio value={"desc"}>Giảm dần</Radio>
                </Radio.Group>
              </div>
              {item.options && (
                <div>
                  <div className="mb-2">Tìm kiếm</div>
                  <Radio.Group
                    onChange={(e) => {
                      setFiltersTable({
                        ...filters,
                        [item.dataIndex as keyof FilterProps]: e.target.value
                          ? e.target.value
                          : undefined,
                      })
                    }}
                    buttonStyle="solid"
                    className="w-full mb-3"
                  >
                    {item.options.map((option: { value: string; label: string }) => (
                      <Radio
                        key={option.value}
                        value={option}
                        style={{ display: "block", marginBottom: 8 }}
                      >
                        {option.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                  <Checkbox
                    onChange={(e: CheckboxChangeEvent) => onCheckAllChange(item, e)}
                    indeterminate={indeterminate(item)}
                    checked={checkAll(item)}
                    className="mb-3"
                  >
                    Chọn tất cả
                  </Checkbox>
                  <Checkbox.Group
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                    value={filtersTable[item.dataIndex as keyof FilterProps] as string[]}
                    onChange={(e: string[]) => onCheckChange(item, e)}
                    options={item.options}
                  />
                </div>
              )}

              <ListButton
                clear={() => {
                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  setFilters?.({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  props.confirm()
                }}
                click={() => {
                  if (item.distinctFilters) {
                    const result = {
                      ...updateObjectExcept(filtersTable, item.distinctFilters),
                    }
                    setFilters?.(result)
                    props.confirm()
                    return
                  }
                  const result = {
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]:
                      filtersTable[item.dataIndex as keyof FilterProps],
                  }
                  setFilters?.(result)
                  props.confirm()
                }}
              />
            </div>
          )
        },
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "date") {
      return {
        filterDropdown: (props: FilterDropdownProps) => {
          // if (!item.options) return
          return (
            <div className="p-4 w-full min-w-[200px] max-w-[300px]">
              <div className="mb-2">Tìm kiếm</div>
              <DatePicker.RangePicker
                placeholder={["Từ ngày", "Đến ngày"]}
                className="w-full mb-3"
                allowClear
                onChange={(dates, dateStrings) => {
                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: dateStrings.length
                      ? [dateStrings[0], dateStrings[1]]
                      : null,
                  })
                }}
                format={{ format: "DD/MM/YYYY", type: "mask" }}
              />

              <ListButton
                clear={() => {
                  setFiltersTable({
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  setFilters?.({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: undefined,
                  })
                  props.confirm()
                }}
                click={() => {
                  if (item.distinctFilters) {
                    const result = {
                      ...updateObjectExcept(filtersTable, item.distinctFilters),
                    }

                    setFilters?.(result)
                    props.confirm()
                    return
                  }
                  const result = {
                    ...filtersTable,
                    [item.dataIndex as keyof FilterProps]:
                      filtersTable[item.dataIndex as keyof FilterProps],
                  }
                  setFilters?.(result)
                  props.confirm()
                }}
              />
            </div>
          )
        },
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }
    if (item?.type === "cmp") {
      return {
        filterDropdown: (props: FilterDropdownProps) => (
          <div className="p-4 flex flex-col w-full min-w-[200px] max-w-[300px]">
            <div>
              Lớn hơn hoặc bằng
              <Input
                placeholder="0"
                type="number"
                value={
                  // @ts-expect-error
                  filtersTable[item.dataIndex as keyof FilterProps]?.gte as string
                }
                onChange={(e) => {
                  setFiltersTable({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: {
                      //   @ts-expect-error
                      ...filtersTable[item.dataIndex as keyof FilterProps],
                      gte: e.target.value,
                    },
                  })
                }}
                className="mb-3"
              />
              Nhỏ hơn hoặc bằng
              <Input
                placeholder="10"
                type="number"
                value={
                  // @ts-expect-error
                  filtersTable[item.dataIndex as keyof FilterProps]?.lte as string
                }
                onChange={(e) => {
                  setFiltersTable({
                    ...filters,
                    [item.dataIndex as keyof FilterProps]: {
                      // @ts-expect-error
                      ...filtersTable[item.dataIndex as keyof FilterProps],
                      lte: e.target.value,
                    },
                  })
                }}
                className="mb-3"
              />
            </div>
            <ListButton
              clear={() => {
                setFiltersTable({
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]: null,
                })
                setFilters?.({
                  ...filters,
                  [item.dataIndex as keyof FilterProps]: null,
                })
                props.confirm()
              }}
              click={() => {
                if (item.distinctFilters) {
                  const result = {
                    ...updateObjectExcept(filtersTable, item.distinctFilters),
                  }
                  setFilters?.(result)
                  props.confirm()
                  return
                }
                const result = {
                  ...filtersTable,
                  [item.dataIndex as keyof FilterProps]:
                    filtersTable[item.dataIndex as keyof FilterProps],
                }
                setFilters?.(result)
                props.confirm()
              }}
            />
          </div>
        ),
        filterIcon: () => {
          return (
            <FilterFilled
              style={{
                color: filters?.[item.dataIndex as keyof FilterProps] ? "#005f37" : undefined,
              }}
            />
          )
        },
      }
    }

    if (item.slot) {
      return item.slot
    }
  }

  return (
    <div className={clsx("flex flex-col", rest?.className)}>
      {header && (
        <div className="mt-5 border-gray-200 border border-b-0 px-2.5 py-2.5">{header}</div>
      )}
      <TableAntd<T>
        id={id}
        rowKey={rowKey}
        size="small"
        className="mt-2"
        rowSelection={rowSelection}
        columns={
          columns.map((column) => ({
            ...column,
            key: column.key || (column as unknown as { dataIndex: string }).dataIndex,
            onCell: (record: T) => ({
              className: cn("px-2.5 py-4", column.className || ""),
              ...(column.onCell ? column.onCell(record) : {}),
            }),
            ...genFilter(column as ColumnTypeProps),
          })) as ColumnsType<T>
        }
        scroll={{ x: "100%", y: scrollable ? maxHeight : undefined }}
        bordered
        dataSource={data}
        locale={{
          emptyText: <Empty description="Không có dữ liệu" />,
        }}
        pagination={
          pagination !== false
            ? {
                position: ["bottomRight"],
                defaultPageSize: DEFAULT_PAGINATE_SIZE,
                showSizeChanger: {
                  labelRender: ({ value }) => `${value} / trang`,
                  optionRender: (oriOption) => `${oriOption.value} / trang`,
                },
                showTotal: (total, range) =>
                  `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                ...pagination,
              }
            : false
        }
        expandable={expandable}
        {...rest}
        onRow={(record) => ({
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
          className: cn(record.id && selectedRow && record.id === selectedRow ? "bg-blue-200" : ""),
          ...rest.onRow?.(record),
        })}
      />
    </div>
  )
}

export default Table
