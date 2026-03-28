import { FilterFilled } from "@ant-design/icons"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
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
} from "antd"
import type { ColumnGroupType, ColumnType, TablePaginationConfig } from "antd/es/table"
import type { FilterDropdownProps, TableRowSelection } from "antd/es/table/interface"
import dayjs from "dayjs"
import { useCallback, useState } from "react"
import type { ColumnTypeProps, FilterProps } from "../typeFilter"
import FilterSelect from "./filter-select"
import FilterTreeSelect from "./filter-tree-select"

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
  columns?: ColumnsType<T> & {
    distinctFilters?: string[]
    options?: ColumnOption[]
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
  maxHeight?: number
  rowSelection?: TableRowSelection<T>
  summary?: TableAntdProps<T>["summary"]
} & Omit<TableAntdProps, "pagination">

const Table = <T extends AnyObject>({
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
  summary,
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
          return (
            <div className="p-4 w-full min-w-[200px] max-w-[300px]">
              <FilterTreeSelect
                item={item}
                filtersTable={filtersTable}
                setFiltersTable={setFiltersTable}
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
                      // @ts-expect-error
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
    <TableAntd<T>
      id={id}
      rowKey={rowKey}
      size="small"
      className="mt-2 custom-scrollbar"
      rowSelection={rowSelection}
      columns={
        columns.map((column) => ({
          ...column,
          key: column.key || (column as unknown as { dataIndex: string }).dataIndex,
          onCell: (record: T) => ({
            className: cn("px-2 py-[2px]", column.className || ""),
            ...(column.onCell ? column.onCell(record) : {}),
          }),
          ...genFilter(column as ColumnTypeProps),
        })) as ColumnsType<T>
      }
      // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
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
      summary={summary}
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
  )
}

Table.Summary = TableAntd.Summary

export default Table
