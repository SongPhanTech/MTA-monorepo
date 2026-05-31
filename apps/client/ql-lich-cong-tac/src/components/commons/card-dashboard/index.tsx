import { Card } from "antd"
import Link from "next/link"
import type React from "react"

interface CardDashBoardProps {
  icon: React.ReactNode
  title: string
  content: string | number
  description: string
  backgroundIcon?: string
  href?: string
  onClick?: () => void
}

export const CardDashBoard = ({
  icon,
  title,
  content,
  description,
  backgroundIcon,
  href,
  onClick,
}: CardDashBoardProps) => {
  const isInteractive = Boolean(href || onClick)

  const card = (
    <Card
      style={{ minHeight: "140px" }}
      bordered={true}
      size="small"
      hoverable={isInteractive}
      className={isInteractive ? "cursor-pointer transition-shadow hover:shadow-md" : undefined}
      onClick={href ? undefined : onClick}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: 16,
          paddingBottom: 16,
        },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              background: `${backgroundIcon || "#13ab55"}`,
              color: "white",
              borderRadius: "50%",
              width: "25px",
              height: "25px",
              minWidth: "25px",
              minHeight: "25px",
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
      <p className="text-gray-700 text-4xl font-bold leading-none mb-2">{content}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
