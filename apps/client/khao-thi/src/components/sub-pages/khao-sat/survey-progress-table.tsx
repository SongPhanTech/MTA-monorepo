import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons"
import { Table, Typography } from "antd"
import { useEffect, useMemo, useState } from "react"

const { Text } = Typography

interface ProgressRow {
  key: string
  parentKey?: string
  type: "faculty" | "department" | "lecturer" | "total"
  name: string
  completed: number
  total: number
  indent?: number
}

function getStatusStyles(row: ProgressRow) {
  const isComplete = row.completed === row.total && row.total > 0

  if (row.type === "total") {
    return {
      color: "#0f172a",
      backgroundColor: "rgba(15, 23, 42, 0.08)",
    }
  }

  if (isComplete) {
    return {
      color: "#52c41a",
      backgroundColor: "rgba(82, 196, 26, 0.12)",
    }
  }

  if (row.completed > 0) {
    return {
      color: "#faad14",
      backgroundColor: "rgba(250, 173, 20, 0.12)",
    }
  }

  return {
    color: "#ff4d4f",
    backgroundColor: "rgba(255, 77, 79, 0.12)",
  }
}

export function SurveyProgressTable({ data }: { data: ProgressRow[] }) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => data.filter((row) => row.type !== "total"), [data])
  const totalRow = useMemo(() => data.find((row) => row.type === "total"), [data])

  useEffect(() => {
    setExpandedKeys((prev) => {
      const next = rows.reduce<Record<string, boolean>>((acc, row) => {
        if (row.type === "faculty" || row.type === "department") {
          acc[row.key] = prev[row.key] ?? true
        }
        return acc
      }, {})

      return { ...next, ...prev }
    })
  }, [rows])

  const visibleRows = useMemo(() => {
    const result: Array<ProgressRow & { depth: number }> = []

    const hasDepartmentChildren = (row: ProgressRow) =>
      rows.some((child) => child.parentKey === row.key && child.type === "department")

    const hasLectureChildren = (row: ProgressRow) =>
      rows.some((child) => child.parentKey === row.key && child.type === "lecturer")

    const visit = (row: ProgressRow, depth = 0) => {
      result.push({ ...row, depth })

      if (row.type === "faculty") {
        if (expandedKeys[row.key] !== false) {
          rows
            .filter((child) => child.parentKey === row.key && child.type === "department")
            .forEach((child) => visit(child, depth + 1))

          rows
            .filter((child) => child.parentKey === row.key && child.type === "lecturer")
            .forEach((child) => visit(child, depth + 1))
        }
        return
      }

      if (row.type === "department" && expandedKeys[row.key] !== false) {
        rows
          .filter((child) => child.parentKey === row.key && child.type === "lecturer")
          .forEach((child) => visit(child, depth + 1))
      }
    }

    rows.filter((row) => row.type === "faculty").forEach((row) => visit(row))

    return result
  }, [expandedKeys, rows])

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const hasDepartmentChildren = (row: ProgressRow) =>
    rows.some((child) => child.parentKey === row.key && child.type === "department")

  const hasLectureChildren = (row: ProgressRow) =>
    rows.some((child) => child.parentKey === row.key && child.type === "lecturer")

  const dataSource = totalRow ? [...visibleRows, totalRow] : visibleRows

  return (
    <div style={{ marginTop: 16, marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Text strong style={{ fontSize: 15 }}>
          Tiến độ khảo sát theo đơn vị
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Số giảng viên đã có ý kiến / tổng số giảng viên
        </Text>
      </div>

      <Table
        bordered
        size="middle"
        pagination={false}
        scroll={{ x: 420 }}
        dataSource={dataSource}
        rowKey="key"
        rowClassName={(record) => (record.type === "total" ? "survey-progress-total-row" : "")}
        columns={[
          {
            title: "Đơn vị",
            dataIndex: "name",
            width: 360,
            onHeaderCell: () => ({
              style: { textAlign: "center" },
            }),
            render: (_, row: ProgressRow & { depth?: number }) => {
              const isExpanded = expandedKeys[row.key] !== false
              const canToggleFaculty = row.type === "faculty" && hasDepartmentChildren(row)
              const canToggleDepartment = row.type === "department" && hasLectureChildren(row)
              const canToggle = canToggleFaculty || canToggleDepartment

              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: (row.depth ?? 0) * 18,
                    fontWeight:
                      row.type === "faculty" || row.type === "total"
                        ? 700
                        : row.type === "department"
                          ? 600
                          : 500,
                    fontStyle: row.type === "lecturer" ? "italic" : "normal",
                    color:
                      row.type === "lecturer"
                        ? row.completed === row.total
                          ? "#111827"
                          : "#ff4d4f"
                        : row.type === "total"
                          ? "#0f172a"
                          : row.type === "faculty"
                            ? "#111827"
                            : "#374151",
                  }}
                >
                  {canToggle ? (
                    <span
                      onClick={() => toggleExpand(row.key)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          toggleExpand(row.key)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                    >
                      {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                    </span>
                  ) : (
                    <span style={{ display: "inline-block", width: 12 }} />
                  )}
                  <span>{row.name}</span>
                </div>
              )
            },
          },
          {
            title: "Ý kiến",
            align: "center",
            width: 160,
            render: (_, row: ProgressRow) => {
              const status = getStatusStyles(row)

              return (
                <span
                  style={{
                    color: status.color,
                    backgroundColor: status.backgroundColor,
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "2px 10px",
                    display: "inline-block",
                  }}
                >
                  {row.completed}/{row.total}
                </span>
              )
            },
          },
        ]}
      />
    </div>
  )
}
