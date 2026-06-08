import { Typography } from "antd"
import { useFindManySurvey, useFindManyDM_DonVi } from "@workspace/db/hooks"
import React, { useMemo } from "react"

const { Title } = Typography

interface ProgressRow {
  key: string
  type: "faculty" | "department" | "lecturer" | "total"
  name: string
  completed: number
  total: number
  indent: number
}

interface SurveyProgressTableProps {
  data: ProgressRow[]
  loading?: boolean
}

export function SurveyProgressTable({ data, loading }: SurveyProgressTableProps) {
  if (loading) {
    return <div className="text-center py-4 text-primary">Đang tải bảng thống kê...</div>
  }

  if (!data.length) {
    return null
  }

  return (
    <div style={{ padding: "24px 0", marginTop: "24px" }}>
      <Title level={4} style={{ color: "#333333", marginBottom: "16px" }}>
        Tiến độ lấy ý kiến phản hồi của người học
      </Title>
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "24px",
          borderRadius: "8px",
          color: "#ffffff",
          fontFamily: '"Times New Roman", Times, serif',
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ffffff",
            color: "#ffffff",
            fontSize: "15px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  backgroundColor: "#2d2d2d",
                  width: "70%",
                }}
              >
                Đơn vị
              </th>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  backgroundColor: "#2d2d2d",
                  width: "30%",
                }}
              >
                Ý kiến
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: ProgressRow) => {
              const isFaculty = row.type === "faculty"
              const isDept = row.type === "department"
              const isTotal = row.type === "total"
              const isLec = row.type === "lecturer"

              // Determine row background
              let rowBg = "#1e1e1e"
              if (isFaculty || isTotal) {
                rowBg = "#2d2d2d"
              } else if (isDept) {
                rowBg = "#252526"
              }

              // Determine text style for name
              let nameStyle: React.CSSProperties = {
                padding: "10px 16px",
                border: "1px solid #ffffff",
                textAlign: "left",
              }

              if (isFaculty || isDept || isTotal) {
                nameStyle.fontWeight = "bold"
              }

              if (isLec) {
                nameStyle.paddingLeft = `${16 + row.indent * 16}px`
                if (row.completed < row.total) {
                  nameStyle.fontStyle = "italic"
                  nameStyle.color = "#f87171"
                }
              }

              // Determine text style for opinion count
              let valueStyle: React.CSSProperties = {
                padding: "10px 16px",
                border: "1px solid #ffffff",
                textAlign: "center",
                fontWeight: isFaculty || isDept || isTotal ? "bold" : "normal",
              }

              const isCompleted = row.completed === row.total && row.total > 0
              if (isCompleted) {
                valueStyle.color = "#4ade80"
              } else if (row.total > 0) {
                valueStyle.color = "#f87171"
                if (isLec) {
                  valueStyle.fontStyle = "italic"
                }
              } else {
                valueStyle.color = "#a1a1aa"
              }

              return (
                <tr key={row.key} style={{ backgroundColor: rowBg }}>
                  <td style={nameStyle}>{row.name}</td>
                  <td style={valueStyle}>
                    {row.completed}/{row.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
