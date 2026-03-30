import { Col } from "antd"
import type { ReactNode } from "react"
import { useState } from "react"

interface CollapsibleFieldProps {
  title: string
  summary: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  icon?: ReactNode
}

const CollapsibleField = ({
  title,
  summary,
  children,
  defaultExpanded = false,
  icon,
}: CollapsibleFieldProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <Col span={24}>
      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
        }}
      >
        {/* Header - always visible */}
        <div
          style={{
            padding: "12px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {icon && <span style={{ color: "#000" }}>{icon}</span>}
          {title && <span style={{ fontWeight: 500, fontSize: "14px" }}>{title}</span>}
          <div style={{ fontSize: "13px", color: "#000" }}>{summary}</div>
        </div>

        {/* Content - always rendered, visibility controlled by CSS */}
        <div
          style={{
            visibility: expanded ? "visible" : "hidden",
            height: expanded ? "auto" : "0px",
            overflow: "hidden",
            padding: expanded ? "0 16px 16px 16px" : "0",
          }}
        >
          {children}
        </div>
      </div>
    </Col>
  )
}

export { CollapsibleField }
