import { FilterFilled } from '@ant-design/icons'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
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
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterDropdownProps, TableRowSelection } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import type { ColumnTypeProps, FilterProps } from '../typeFilte'

dayjs.locale('vi')

export type ColumnOption = {
    value: string | boolean
    label: string
    children?: ColumnOption[]
}

type TableProps<T> = {
    columns?: ColumnsType<T> & {
        type?: string
        distinctFilters?: string[]
        options?: ColumnOption[]
    }
    data?: T[]
    pagination?:
        | (TablePaginationConfig & {
              onShowSizeChange?: ((size: number) => void) | undefined
          })
        | false
    onRowClick?: (record: T) => void
    filters?: FilterProps
    setFilters?: (record: FilterProps) => void
    expandable?: TableAntdProps<T>['expandable']
    rowKey?: string
    id?: string
    selectedRow?: string | null
    scrollable?: boolean
    maxHeight?: number
    rowSelection?: TableRowSelection<T>
} & Omit<TableAntdProps, 'pagination'>

const Table = <T extends Record<string, unknown>>({
    columns = [],
    data,
    pagination,
    onRowClick,
    filters,
    setFilters,
    expandable,
    rowKey,
    id,
    selectedRow,
    scrollable,
    maxHeight,
    rowSelection,
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
                if (value === 'asc' || value === 'desc') {
                    result[key] = undefined
                } else if (typeof value === 'string' || typeof value === 'number') {
                    result[key] = ''
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

    const genFilter = (item: ColumnTypeProps) => {
        const ListButton = useCallback(
            ({ clear, click }: { clear: () => void; click: () => void }) => {
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
            },
            []
        )
        if (item?.type === 'input') {
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
                                        [item.dataIndex as keyof FilterProps]: e.target.value
                                            ? e.target.value
                                            : '',
                                    })
                                }}
                                onPressEnter={() => {
                                    if (item.distinctFilters) {
                                        const result = {
                                            ...updateObjectExcept(
                                                filtersTable,
                                                item.distinctFilters
                                            ),
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
                                    [item.dataIndex as keyof FilterProps]: '',
                                })
                                setFilters?.({
                                    [item.dataIndex as keyof FilterProps]: '',
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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
                            }}
                        />
                    )
                },
            }
        }
        if (item?.type === 'input_search') {
            return {
                filterDropdown: (props: FilterDropdownProps) => (
                    <div className="p-4 flex flex-col">
                        <AutoComplete
                            className="mb-3 w-full min-w-[200px] max-w-[300px]"
                            placeholder="Tìm kiếm"
                            allowClear
                            options={item.options}
                            filterOption={(
                                inputValue,
                                option: { value: string; label: string } | undefined
                            ) =>
                                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                                    -1 ||
                                option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                            onSelect={(value) => {
                                setFiltersTable({
                                    ...filters,
                                    [item?.dataIndex as keyof FilterProps]: value ? value : '',
                                })
                            }}
                            onChange={(e) => {
                                setFiltersTable({
                                    ...filters,
                                    [item.dataIndex as keyof FilterProps]: e ? e : '',
                                })
                            }}
                        />
                        <ListButton
                            clear={() => {
                                setFiltersTable({
                                    [item.dataIndex as keyof FilterProps]: '',
                                })
                                setFilters?.({
                                    [item.dataIndex as keyof FilterProps]: '',
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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
                            }}
                        />
                    )
                },
            }
        }
        if (item?.type === 'select') {
            return {
                filterDropdown: (props: FilterDropdownProps) => {
                    if (!item.options) return
                    return (
                        <div className="p-4 w-full min-w-[200px] max-w-[300px] ">
                            {item.options.length > 0 && (
                                <div className="max-h-[500px] overflow-y-auto">
                                    <Checkbox
                                        onChange={(e: CheckboxChangeEvent) =>
                                            onCheckAllChange(item, e)
                                        }
                                        indeterminate={indeterminate(item)}
                                        checked={checkAll(item)}
                                        className="mb-3"
                                    >
                                        Chọn tất cả
                                    </Checkbox>
                                    <Checkbox.Group
                                        className="mb-3"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                        }}
                                        value={
                                            filtersTable[
                                                item.dataIndex as keyof FilterProps
                                            ] as string[]
                                        }
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
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    props.confirm()
                                }}
                                click={() => {
                                    if (item.distinctFilters) {
                                        const filter = filtersTable[
                                            item.dataIndex as keyof FilterProps
                                        ] as string[]
                                        const result = {
                                            ...updateObjectExcept(
                                                filtersTable,
                                                item.distinctFilters
                                            ),
                                            [item.dataIndex as keyof FilterProps]: filter?.length
                                                ? filter
                                                : undefined,
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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
                            }}
                        />
                    )
                },
            }
        }
        if (item?.type === 'tree_select') {
            return {
                filterDropdown: (props: FilterDropdownProps) => {
                    if (!item.options) return
                    return (
                        <div className="p-4 w-full min-w-[200px] max-w-[300px]">
                            <div className="mb-2">Tìm kiếm</div>
                            <Tree
                                autoExpandParent={true}
                                checkable={true}
                                defaultExpandAll={true}
                                multiple={true}
                                treeData={item.options}
                                checkedKeys={
                                    filtersTable[item.dataIndex as keyof FilterProps] as string[]
                                }
                                onCheck={(checkedKeys) => {
                                    setFiltersTable({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: checkedKeys,
                                    })
                                }}
                                fieldNames={{ title: 'label', key: 'value', children: 'children' }}
                                className="w-full mb-3 max-h-[500px] overflow-y-auto"
                            />
                            <ListButton
                                clear={() => {
                                    setFiltersTable({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    setFilters?.({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    props.confirm()
                                }}
                                click={() => {
                                    if (item.distinctFilters) {
                                        const filter = filtersTable[
                                            item.dataIndex as keyof FilterProps
                                        ] as string[]
                                        const result = {
                                            ...updateObjectExcept(
                                                filtersTable,
                                                item.distinctFilters
                                            ),
                                            [item.dataIndex as keyof FilterProps]: filter?.length
                                                ? filter
                                                : undefined,
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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
                            }}
                        />
                    )
                },
            }
        }
        if (item?.type === 'order') {
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
                                    <Radio value={'asc'}>Tăng dần</Radio>
                                    <Radio value={'desc'}>Giảm dần</Radio>
                                </Radio.Group>
                            </div>
                            {item.options && (
                                <div>
                                    <div className="mb-2">Tìm kiếm</div>
                                    <Radio.Group
                                        onChange={(e) => {
                                            setFiltersTable({
                                                ...filters,
                                                [item.dataIndex as keyof FilterProps]: e.target
                                                    .value
                                                    ? e.target.value
                                                    : undefined,
                                            })
                                        }}
                                        buttonStyle="solid"
                                        className="w-full mb-3"
                                    >
                                        {item.options.map(
                                            (option: { value: string; label: string }) => (
                                                <Radio
                                                    key={option.value}
                                                    value={option}
                                                    style={{ display: 'block', marginBottom: 8 }}
                                                >
                                                    {option.label}
                                                </Radio>
                                            )
                                        )}
                                    </Radio.Group>
                                    <Checkbox
                                        onChange={(e: CheckboxChangeEvent) =>
                                            onCheckAllChange(item, e)
                                        }
                                        indeterminate={indeterminate(item)}
                                        checked={checkAll(item)}
                                        className="mb-3"
                                    >
                                        Chọn tất cả
                                    </Checkbox>
                                    <Checkbox.Group
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                        }}
                                        value={
                                            filtersTable[
                                                item.dataIndex as keyof FilterProps
                                            ] as string[]
                                        }
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
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    props.confirm()
                                }}
                                click={() => {
                                    if (item.distinctFilters) {
                                        const result = {
                                            ...updateObjectExcept(
                                                filtersTable,
                                                item.distinctFilters
                                            ),
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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
                            }}
                        />
                    )
                },
            }
        }
        if (item?.type === 'date') {
            return {
                filterDropdown: (props: FilterDropdownProps) => {
                    // if (!item.options) return
                    return (
                        <div className="p-4 w-full min-w-[200px] max-w-[300px]">
                            <DatePicker.RangePicker
                                placeholder={['Từ ngày', 'Đến ngày']}
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
                                format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                            />

                            <ListButton
                                clear={() => {
                                    setFiltersTable({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    setFilters?.({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: undefined,
                                    })
                                    props.confirm()
                                }}
                                click={() => {
                                    if (item.distinctFilters) {
                                        const result = {
                                            ...updateObjectExcept(
                                                filtersTable,
                                                item.distinctFilters
                                            ),
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
                                    console.log(result)

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
                                color: filters?.[item.dataIndex as keyof FilterProps]
                                    ? '#005f37'
                                    : undefined,
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
            className="mt-4 custom-scrollbar"
            rowSelection={rowSelection}
            columns={
                columns.map((column) => ({
                    ...column,
                    key: column.key || (column as unknown as { dataIndex: string }).dataIndex,
                    ...genFilter(column as ColumnTypeProps),
                })) as ColumnsType<T>
            }
            // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
            scroll={{ x: '100%', y: scrollable ? maxHeight : undefined }}
            bordered
            dataSource={data}
            locale={{
                emptyText: <Empty description="Không có dữ liệu" />,
            }}
            pagination={
                pagination !== false
                    ? {
                          position: ['bottomRight'],
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
