import { DownOutlined } from "@ant-design/icons";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import type { FilterProps } from "@constants/type";
import type { TableProps as TableAntdProps } from "antd";
import type { ColumnType, TablePaginationConfig } from "antd/es/table";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import Table, { type ColumnOption } from "../table";

interface BaseNode {
  id: string;
  key?: string;
  $type?: "parent" | "child";
}

export type ChildData = BaseNode & {
  [key: string]: any;
};

export type Data<T, ChildKey extends keyof T> = T &
  BaseNode & {
    [key in ChildKey]: ChildData[];
  };

type TableProps<T, ChildKey extends keyof T> = {
  data?: Data<T, ChildKey>[];
  columns?: (ColumnType<Data<T, ChildKey>[ChildKey][number]> & {
    type?:
      | "input"
      | "input_search"
      | "select"
      | "tree_select"
      | "order"
      | "date"
      | "cmp";
    distinctFilters?: string[];
    options?: ColumnOption[];
  })[];
  pagination?:
    | (TablePaginationConfig & {
        onShowSizeChange?: ((size: number) => void) | undefined;
      })
    | false;
  headerTitleKey: keyof T | ((record: T) => ReactNode);
  headerColumn?: ColumnType<Data<T, ChildKey>>[];
  onRow?: (
    data: T,
    index?: number,
  ) => React.HTMLAttributes<any> & React.TdHTMLAttributes<any>;
  onRowClick?: (record: T) => void;
  expandable?: TableAntdProps<T>["expandable"];
  rowKey?: string;
  id?: string;
  selectedRow?: string | null;
  scrollable?: boolean;
  maxHeight?: number | string;
  currentPage?: number;
  filters?: FilterProps;
  setFilters?: (record: FilterProps) => void;
  headerRight?: (record: T) => ReactNode | ReactNode[];
  childrenFieldName: ChildKey;
  onRowDoubleClick?: (record: T) => void;
  defaultExpandAll?: boolean;
  resetIndexPerGroup?: boolean;
} & Omit<
  TableAntdProps,
  | "columns"
  | "data"
  | "pagination"
  | "headerTitleKey"
  | "onRow"
  | "childrenFieldName"
  | "number"
>;

const TableCollapse = <
  T extends {
    id: string;
    key?: string;
    $type?: "parent" | "child";
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
  ...rest
}: TableProps<T, ChildKey>) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const handleExpand = (expanded: boolean, record: T) => {
    const children = record[childrenFieldName];

    if (!Array.isArray(children) || children?.length === 0) return;
    setExpandedKeys((prev) => {
      if (expanded && record.key) {
        // Mở rộng thêm key
        return [...prev, record.key];
      }
      // Thu gọn bớt key
      return prev.filter((k) => k !== record.key);
    });
  };

  const dataWithKey: T[] = useMemo(() => {
    if (!data) return [];

    return data.map((item) => {
      const children = item[childrenFieldName];
      const hasChildren = Array.isArray(children);
      // Nếu item không có key thì tạo key mới
      if (!item.key) {
        // @ts-expect-error
        item.key = item.id || item?.[rowKey];
      }

      if (hasChildren) {
        const childrenArray = children?.map((child) => {
          if (!child.key) {
            child.key = child.id;
          }
          return {
            ...child,
            $type: "child",
          };
        });
        // Đảm bảo trường children được đặt đúng tên
        const newItem = {
          ...item,
          $type: "parent",
          [childrenFieldName]: childrenArray,
        };
        return newItem;
      }
      // Item không có children thì chắc chắn là child
      if (!item.key) {
        item.key = item.id;
      }
      return {
        ...item,
        $type: "child",
      };
    });
  }, [data, childrenFieldName, rowKey]);

  useEffect(() => {
    if (!defaultExpandAll) {
      setExpandedKeys([]);
      return;
    }

    if (defaultExpandAll && dataWithKey.length > 0) {
      setExpandedKeys(dataWithKey.map((d) => d.key as React.Key));
      return;
    }

    // const firstWithChildren = dataWithKey.find(
    //     (item) => Array.isArray(item[childrenFieldName]) && item[childrenFieldName]?.length > 0
    // )
    // if (firstWithChildren?.key) {
    //     setExpandedKeys([firstWithChildren.key])
    // }
    // }, [defaultExpandAll, dataWithKey, childrenFieldName])
  }, [defaultExpandAll, dataWithKey]);

  const allChildren = useMemo(() => {
    const children: T[ChildKey][] = [];
    if (!dataWithKey) return children;
    for (const item of dataWithKey) {
      const itemChildren = item[childrenFieldName] as T[ChildKey][] | undefined;
      if (item.$type === "parent" && Array.isArray(itemChildren)) {
        children.push(...itemChildren);
      } else if (item.$type === "child") {
        children.push(item as T[ChildKey]);
      }
    }
    return children;
  }, [dataWithKey, childrenFieldName]);

  const restColumns = useMemo(() => {
    const indexMap = new Map<string, number>();
    if (resetIndexPerGroup) {
      dataWithKey.forEach((parent) => {
        const children = parent[childrenFieldName] as any[];
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            indexMap.set(child.key, index + 1);
          });
        }
      });
    }

    const baseColumns = [
      {
        title: "TT",
        align: "center",
        width: 40,
        render: (_: any, record: T) => {
          if (record.$type !== "child") return "";

          if (resetIndexPerGroup) {
            return indexMap.get(record.key as string) ?? "";
          }

          const order = allChildren.findIndex(
            (item: any) => item.key === record.key,
          );
          return order >= 0
            ? order +
                1 +
                (((typeof pagination !== "boolean" && pagination?.current) ||
                  currentPage ||
                  1) -
                  1) *
                  DEFAULT_PAGINATE_SIZE
            : "";
        },
      },
      ...columns,
    ];

    // Merge onCell for colSpan handling
    return baseColumns?.map((col, index) => ({
      ...col,
      onCell: (record: T) => {
        const isParent = record.$type === "parent";
        if (isParent && headerColumn && headerColumn.length > 0) {
          const headerCol = headerColumn[index];
          if (headerCol) {
            return {
              colSpan: headerCol.colSpan || 1,
            };
          }
        }
        return {
          colSpan: isParent ? (index === 0 ? baseColumns.length : 0) : 1,
        };
      },
      render: (text: any, record: Data<T, ChildKey>, idx: number) => {
        const isParent = record.$type === "parent";
        if (isParent && headerColumn && headerColumn.length > 0) {
          const headerCol = headerColumn[index];
          if (headerCol) {
            return headerCol?.render?.(text, record, idx);
          }
        }
        // Nếu là child thì hiển thị dữ liệu bình thường
        if (col.render) {
          return col.render(text, record, index);
        }
        return text;
      },
    }));
  }, [
    columns,
    allChildren,
    currentPage,
    pagination,
    headerColumn,
    resetIndexPerGroup,
    dataWithKey,
  ]);

  return (
    <>
      <Table
        id={id}
        rowKey="key"
        className="mt-2"
        scrollable={scrollable}
        maxHeight={maxHeight}
        bordered
        data={dataWithKey}
        pagination={pagination}
        onRow={(record, index) => {
          const children = record[childrenFieldName];
          const isParent = Array.isArray(children);

          // Nếu là cha -> không cho click/doubleClick
          if (isParent) {
            return {
              style: { cursor: "default" },
            };
          }

          return {
            onClick: () => {
              if (onRowClick) {
                onRowClick(record);
              }
            },
            onDoubleClick: () => {
              if (onRowDoubleClick) {
                onRowDoubleClick(record);
              }
            },
            style: { cursor: "pointer" },
            className:
              record.id && selectedRow && record.id === selectedRow
                ? "bg-blue-100"
                : "",
            ...rest.onRow?.(record, index),
          };
        }}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpand: handleExpand,
          rowExpandable: (record) => {
            const children = record[childrenFieldName];
            return Array.isArray(children) && children.length > 0;
          },
          expandRowByClick: true,
          expandIcon: ({ expanded, onExpand, record }) => {
            const children = record[childrenFieldName];
            return Array.isArray(children) ? (
              <div className="flex">
                {children.length > 0 && (
                  <DownOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpand(record, e);
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
                {!headerColumn && (
                  <div className="flex w-full items-center justify-between">
                    <strong className="select-none sticky left-[30px]">
                      {typeof headerTitleKey === "function"
                        ? headerTitleKey(record as T)
                        : ((record as T)[
                            headerTitleKey as keyof T
                          ] as ReactNode)}
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
            ) : null;
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
  );
};

export default TableCollapse;
