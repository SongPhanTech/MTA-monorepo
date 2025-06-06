import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import {
    Empty,
    Table as TableAntd,
    type TableProps as TableAntdProps,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useMemo } from 'react'
type TableProps<T> = {
    baseColumn?: any
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
    currentPage: number
} & TableAntdProps

const TableCollapse = <T extends Record<string, unknown>>({
    baseColumn = [],
    data,
    pagination,
    onRowClick,
    expandable,
    rowKey,
    id,
    selectedRow,
    scrollable,
    maxHeight,
    currentPage,
}: TableProps<T>) => {

    const dataFake = useMemo(() => {
        let keyCounter = 0;

        function generateKey(prefix = 'key') {
            keyCounter++;
            return `${prefix}-${keyCounter}`;
        }

        return data?.map((item: any) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            // Nếu item không có key thì tạo key mới
            if (!item.key) {
                item.key = generateKey('parent');
            }

            if (hasChildren) {
                return {
                    ...item,
                    type: 'parent',
                    children: item.children.map((child: any) => {
                        if (!child.key) {
                            child.key = generateKey('child');
                        }
                        return {
                            ...child,
                            type: 'child',
                            parentKey: item.key,
                            subject: undefined,
                        }
                    }),
                };
            } else {
                // Item không có children thì chắc chắn là child
                if (!item.key) {
                    item.key = generateKey('child');
                }
                return {
                    ...item,
                    type: 'child',
                    parentKey: undefined,
                    subject: undefined,
                };
            }
        });
    }, [data]);

    const allChildren = useMemo(() => {
        const children: any[] = [];

        dataFake?.forEach(item => {
            if (item.type === 'parent' && Array.isArray(item.children)) {
                children.push(...item.children);
            } else if (item.type === 'child') {
                children.push(item);
            }
        });

        return children;
    }, [dataFake]);


    const columns: ColumnsType<T> = useMemo(() => {
        const baseColumns: ColumnsType<T> = [
            {
                title: 'STT',
                width: 60,
                align: 'center',
                fixed: 'left',
                render: (_, record: any, index: number) => {
                    if (Array.isArray(record?.children) && record?.children?.length > 0) {
                        return <strong className="select-none">{record?.subject}</strong>;
                    }

                    const order = allChildren.findIndex(item => item.key === record.key);

                    return order >= 0
                        ? order + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE
                        : null;
                },
            },
            ...(baseColumn as ColumnsType<T>)
        ];

        // Merge onCell for colSpan handling
        return baseColumns?.map((col, index) => ({
            ...col,
            onCell: (record: T) => ({
                colSpan:
                    Array.isArray((record as any)?.children) && (record as any)?.children?.length > 0
                        ? index === 0
                            ? baseColumns?.length
                            : 0
                        : 1,
            }),
        }));
    }, [dataFake, currentPage]);

    return (
        <>
            <TableAntd
                id={id}
                rowKey={rowKey}
                className="mt-4 custom-scrollbar"
                columns={columns.map((column) => ({
                    ...column,
                    key:
                        column.key ||
                        (column as unknown as { dataIndex: string }).dataIndex,
                }))}
                // scroll={{ x: 'max-content', y: scrollable ? maxHeight : undefined }}
                scroll={{ x: '100%', y: scrollable ? maxHeight : undefined }}
                bordered
                dataSource={dataFake}
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
            />
            <style>{`
                .indent-level-1 {
                    display: none !important
                }
                .ant-table-cell[colspan] {
                    text-align: left !important;
                }
            `}
            </style>

        </>
    )
}

export default TableCollapse
