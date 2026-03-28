"use client"

import type { FilterProps } from "@constants/type"
import { Table } from "antd"
import type { ColumnType, TableProps } from "antd/es/table"
import type React from "react"

export interface NestedColumn<T = any> extends Omit<ColumnType<T>, "render"> {
  type?: "input" | "select" | "order"
  options?: Array<{ value: any; label: string }>
  render?: (value: any, record: T, index: number) => React.ReactNode
  hidden?: boolean
}

export interface NestedCollapsibleTableProps<T = any> {
  data: T[]
  columns: NestedColumn<T>[]
  nestedKeys?: string[] // Optional now - for nested mode
  mode?: "nested" | "tree" // New: specify data structure mode
  childrenKey?: string // New: key for children in tree mode (default: 'children')
  maxDepth?: number // New: maximum depth to display in tree mode
  defaultExpandAllRows?: boolean
  rowKey?: string | ((record: T) => string)
  expandable?: TableProps<T>["expandable"]
  className?: string
  loading?: boolean
  scroll?: TableProps<T>["scroll"]
  getParentLabel?: (record: T, level: number) => string
  getParentCount?: (record: T, level: number) => number
  renderParentActions?: (record: T, level: number, parentIndex: string[]) => React.ReactNode
  showLeafOnly?: boolean // New: only show leaf nodes with full columns
  filters?: FilterProps
  setFilters?: (filters: object[]) => void
  pagination?: object | false
  buildFromParentId?: boolean
  parentIdKey?: string
}

export function NestedCollapsibleTable<T extends Record<string, any>>({
  data,
  columns,
  nestedKeys = [],
  mode = "nested",
  childrenKey = "children",
  maxDepth,
  filters,
  defaultExpandAllRows = false,
  rowKey = "id",
  expandable,
  className,
  loading = false,
  pagination = false,
  scroll = { x: "max-content" },
  getParentLabel,
  getParentCount,
  renderParentActions,
  showLeafOnly = false,
  buildFromParentId = false,
  parentIdKey = "parentId",
}: NestedCollapsibleTableProps<T>) {
  const transformTreeData = (items: T[], currentLevel = 0): any[] => {
    return items.map((item) => {
      const children = item[childrenKey]
      const hasChildren = children && Array.isArray(children) && children.length > 0

      const shouldStopExpanding = maxDepth !== undefined && currentLevel >= maxDepth

      if (hasChildren && !shouldStopExpanding) {
        return {
          ...item,
          children: transformTreeData(children, currentLevel + 1),
          _level: currentLevel,
          _isParent: true,
        }
      }
      const leafNode = {
        ...item,
        _level: currentLevel,
        _isParent: false,
      }
      if (Array.isArray(leafNode[childrenKey]) && leafNode[childrenKey].length === 0) {
        delete leafNode[childrenKey]
      }
      return leafNode
    })
  }

  const transformNestedData = (items: T[], currentLevel = 0): any[] => {
    if (currentLevel >= nestedKeys.length) {
      return items
    }

    return items.map((item) => {
      const childKey = nestedKeys[currentLevel]
      const children = item[childKey]

      if (children && Array.isArray(children) && children.length > 0) {
        return {
          ...item,
          children: transformNestedData(children, currentLevel + 1),
          _level: currentLevel,
          _isParent: true,
        }
      }

      return {
        ...item,
        _level: currentLevel,
        _isParent: false,
      }
    })
  }
  const buildTreeFromParentId = (items: T[], key = "id", parentKey = "parentId") => {
    const map: Record<string, number> = {}
    const roots: T[] = []

    // Tạo bản sao để tránh mutate dữ liệu gốc từ React Query cache
    const clonedItems: T[] = items.map((item) => ({ ...item, children: [] as T[] }))

    clonedItems.forEach((item, index) => {
      map[item[key]] = index
    })

    clonedItems.forEach((node) => {
      const parentId = node[parentKey]
      if (parentId !== null && parentId !== undefined && map[parentId] !== undefined) {
        clonedItems[map[parentId]].children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const transformData = mode === "tree" ? transformTreeData : transformNestedData

  const createDynamicColumns = (): ColumnType<any>[] => {
    const getMaxLevel = (record: any): boolean => {
      if (mode === "tree") {
        return record._isParent
      }
      const level = record._level ?? nestedKeys.length
      return level < nestedKeys.length
    }

    const sttColumn: ColumnType<any> = {
      title: "STT",
      key: "_hierarchy",
      fixed: "left",
      onCell: (record) => {
        if (mode === "tree") {
          return {} // No colSpan in tree mode
        }

        const isParent = getMaxLevel(record)
        if (isParent && !showLeafOnly) {
          return {
            colSpan: renderParentActions ? columns.length : columns.length + 1,
          }
        }
        return {}
      },
      render: (_, record, index) => {
        const level = record._level ?? 0
        const indentSize = 2
        const paddingLeft = level * indentSize

        if (mode === "tree") {
          return (
            <span style={{ paddingLeft: `${paddingLeft}px`, display: "inline-block" }}>
              {index + 1}
            </span>
          )
        }

        const isParent = getMaxLevel(record)
        if (isParent && !showLeafOnly) {
          let label = ""
          let count = 0

          if (getParentLabel) {
            label = getParentLabel(record, level)
          } else {
            const code = record.code || record.sMa || record.Id || ""
            const name = record.name || record.sTen || ""
            label = `${code} - ${name}`
          }

          if (getParentCount) {
            count = getParentCount(record, level)
          } else {
            const childKey = nestedKeys[level]
            const children = record[childKey]
            count = Array.isArray(children) ? children.length : 0
          }

          return (
            <span
              className="font-medium"
              style={{ paddingLeft: `${paddingLeft}px`, display: "inline-block" }}
            >
              {label} ({count})
            </span>
          )
        }

        return (
          <span style={{ paddingLeft: `${paddingLeft}px`, display: "inline-block" }}>
            {index + 1}
          </span>
        )
      },
    }

    const dataColumns: ColumnType<any>[] = columns
      .filter((col) => !col.hidden)
      .map((col, index) => {
        const isLastColumn = index === columns.filter((c) => !c.hidden).length - 1
        const shouldRenderParentActions = isLastColumn && renderParentActions

        return {
          ...col,
          key: (col.dataIndex as string) || col.key,
          onCell: (record: any) => {
            if (mode === "tree") {
              return {} // No colSpan manipulation in tree mode
            }

            const isParent = getMaxLevel(record)
            if (isParent && !showLeafOnly) {
              if (shouldRenderParentActions) {
                return {}
              }
              return {
                colSpan: 0,
              }
            }
            return {}
          },
          render: (value: any, record: any, index: number) => {
            if (mode === "tree") {
              return col.render ? col.render(value, record, index) : value
            }

            const isParent = getMaxLevel(record)
            if (isParent && !showLeafOnly) {
              if (shouldRenderParentActions) {
                const parentIndex = nestedKeys.slice(0, record._level + 1)
                return renderParentActions(record, record._level ?? 0, parentIndex)
              }
              return null
            }

            return col.render ? col.render(value, record, index) : value
          },
        }
      })

    return [sttColumn, ...dataColumns]
  }

  const dataToTransform =
    mode === "tree" && buildFromParentId
      ? buildTreeFromParentId(data, typeof rowKey === "function" ? "id" : rowKey, parentIdKey)
      : data

  const transformedData = transformData(dataToTransform)
  const tableColumns = createDynamicColumns()

  return (
    <Table
      columns={tableColumns}
      dataSource={transformedData}
      rowKey={rowKey}
      className={className}
      loading={loading}
      scroll={scroll}
      defaultExpandAllRows={defaultExpandAllRows}
      expandable={{
        indentSize: 24,
        ...expandable,
      }}
      bordered
      // filters={filters}
      pagination={pagination}
      onRow={(record) => {
        return {
          onClick: (event) => {
            if ((event.target as HTMLElement).closest(".no-row-click")) {
              return
            }
            const targetRow = event.currentTarget
            const expandButton = targetRow.querySelector(
              ".ant-table-row-expand-icon"
            ) as HTMLElement

            if (expandButton) {
              expandButton.click()
            }
          },
        }
      }}
    />
  )
}
