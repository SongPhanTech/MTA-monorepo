import { Tag, type TagProps } from "antd"
import type React from "react"

type TagVariant = "solid" | "filled" | "outlined"
type TagType = "success" | "error" | "warning"

interface BaseTagProps {
  styles?: TagProps["style"]
  className?: TagProps["className"]
  variant?: TagVariant
  type?: TagType
  content?: React.ReactNode
}

const TYPE_COLOR_MAP: Record<TagType, string> = {
  success: "green",
  error: "red",
  warning: "orange",
}

function BaseTag(props: BaseTagProps) {
  const { content, variant = "filled", type = "success", styles, className, ...rest } = props

  const color = TYPE_COLOR_MAP[type]

  let tagProps: TagProps = {
    ...rest,
    className,
    style: styles,
  }

  switch (variant) {
    case "outlined":
      tagProps = {
        ...tagProps,
        color,
        bordered: true,
      }
      break

    case "solid":
      tagProps = {
        ...tagProps,
        color,
      }
      break

    case "filled":
    default:
      tagProps = {
        ...tagProps,
        color,
      }
      break
  }

  return <Tag {...tagProps}>{content}</Tag>
}

export default BaseTag
