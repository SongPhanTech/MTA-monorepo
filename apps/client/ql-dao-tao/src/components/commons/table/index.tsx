import { FilterFilled } from '@ant-design/icons'
import type { ColumnTypeProps, FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import {
    AutoComplete,
    Button,
    Checkbox,
    type CheckboxChangeEvent,
    Empty,
    Input,
    Table as TableAntd,
    type TableProps as TableAntdProps,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterDropdownProps, TableRowSelection } from 'antd/es/table/interface'
import { useState } from 'react'

type TableProps<T> = {
    columns?: ColumnsType<T> & {
        type?: string
        multiple?: string[]
        options?: { value: string; label: string }[]
    }
    data?: T[]
    pagination?: TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined
    }
    onRowClick?: (record: T) => void
    filters: FilterProps
    setFilters: (record: FilterProps) => void
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
    const [filtersTable, setFiltersTable] = useState<FilterProps>({})

    const onCheckAllChange = (item: ColumnTypeProps, e: CheckboxChangeEvent) => {
        if (e.target.checked) {
            setFiltersTable({
                ...filters,
                trainingObjectTypes: item.options?.map(
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
        return item.options?.length === filtersTable[item.dataIndex as keyof FilterProps]?.length
    }

    const indeterminate = (item: ColumnTypeProps) => {
        const filter = filtersTable[item.dataIndex as keyof FilterProps]
        if (!item.options || !filter) return false
        return item.options.length > filter.length && filter.length > 0
    }

    const renderFilter = (item: ColumnTypeProps) => {
        if (item?.type === 'input') {
            return {
                filterDropdown: (props: FilterDropdownProps) => (
                    <div className="p-4 flex flex-col  w-full min-w-[200px] max-w-[300px]">
                        <Input
                            placeholder="Tìm kiếm"
                            value={filtersTable[item.dataIndex as keyof FilterProps]}
                            onChange={(e) => {
                                setFiltersTable({
                                    ...filters,
                                    [item.dataIndex as keyof FilterProps]: e.target.value
                                        ? e.target.value
                                        : '',
                                })
                            }}
                            onPressEnter={() => {
                                const result = {
                                    [item.dataIndex as keyof FilterProps]:
                                        filtersTable[item.dataIndex as keyof FilterProps],
                                }
                                setFilters(result)
                                props.confirm()
                            }}
                            className="mb-3"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                size="small"
                                onClick={() => {
                                    setFiltersTable({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: '',
                                    })
                                    setFilters({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: '',
                                    })
                                    props.confirm()
                                }}
                            >
                                Bỏ lọc
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    const result = {
                                        [item.dataIndex as keyof FilterProps]:
                                            filtersTable[item.dataIndex as keyof FilterProps],
                                    }
                                    setFilters(result)
                                    props.confirm()
                                }}
                            >
                                Lọc
                            </Button>
                        </div>
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

                        <div className="flex justify-end gap-2">
                            <Button
                                size="small"
                                onClick={() => {
                                    setFiltersTable({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: '',
                                    })
                                    setFilters({
                                        ...filtersTable,
                                        [item.dataIndex as keyof FilterProps]: '',
                                    })
                                    props.confirm()
                                }}
                            >
                                Bỏ lọc
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    const result = {
                                        [item.dataIndex as keyof FilterProps]:
                                            filtersTable[item.dataIndex as keyof FilterProps],
                                    }
                                    setFilters(result)
                                    props.confirm()
                                }}
                            >
                                Lọc
                            </Button>
                        </div>
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
                        <div className="p-4 w-full min-w-[200px] max-w-[300px]">
                            {item.options.length > 0 && (
                                <>
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
                                </>
                            )}
                            <div className="flex justify-end gap-2 mt-2">
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setFiltersTable({
                                            ...filtersTable,
                                            [item.dataIndex as keyof FilterProps]: undefined,
                                        })
                                        setFilters({
                                            ...filtersTable,
                                            [item.dataIndex as keyof FilterProps]: undefined,
                                        })
                                        props.confirm()
                                    }}
                                >
                                    Bỏ lọc
                                </Button>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => {
                                        const result = {
                                            [item.dataIndex as keyof FilterProps]:
                                                filtersTable[item.dataIndex as keyof FilterProps]
                                                    ?.length,
                                        }
                                        setFilters(result)
                                        props.confirm()
                                    }}
                                >
                                    Lọc
                                </Button>
                            </div>
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
                    if (!item.options) return
                    return (
                        <div className="p-4 w-full min-w-[200px] max-w-[300px]">
                            {item.options.length > 0 && (
                                <>
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
                                </>
                            )}
                            <div className="flex justify-end gap-2 mt-2">
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setFiltersTable({
                                            ...filtersTable,
                                            [item.dataIndex as keyof FilterProps]: undefined,
                                        })
                                        setFilters({
                                            ...filtersTable,
                                            [item.dataIndex as keyof FilterProps]: undefined,
                                        })
                                        props.confirm()
                                    }}
                                >
                                    Bỏ lọc
                                </Button>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => {
                                        const result = {
                                            [item.dataIndex as keyof FilterProps]:
                                                filtersTable[item.dataIndex as keyof FilterProps]
                                                    ?.length,
                                        }
                                        setFilters(result)
                                        props.confirm()
                                    }}
                                >
                                    Lọc
                                </Button>
                            </div>
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
                    ...renderFilter(column as ColumnTypeProps),
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
                onShowSizeChange(current, size) {
                    pagination?.onShowSizeChange?.(size)
                },
                ...pagination,
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
