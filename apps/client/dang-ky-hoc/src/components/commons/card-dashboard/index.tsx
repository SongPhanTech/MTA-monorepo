import { Card } from "antd"
import type React from "react"

interface CardDashBoardProps {
  icon: React.ReactNode
  title: string
  content: string | number
  description: string
  backgroundIcon?: string
}
export const CardDashBoard = ({
  icon,
  title,
  content,
  description,
  backgroundIcon,
}: CardDashBoardProps) => {
  return (
    <Card
      style={{ minHeight: "120px" }}
      bordered={true}
      size="small"
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              background: `${backgroundIcon || "#13ab55"}`,
              color: "white",
              borderRadius: "50%",
              width: "25px",
              height: "25px",
              minWidth: "25px", // Ngăn bị bóp
              minHeight: "25px", // Ngăn bị bóp
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: "10px",
            }}
          >
            {icon}
          </div>
          <span className="font-semibold">{title}</span>
        </div>
      }
    >
      <p className="text-gray-700 text-xl font-semibold">{content}</p>
      <p className="text-gray-500">{description}</p>
    </Card>
  )
}
