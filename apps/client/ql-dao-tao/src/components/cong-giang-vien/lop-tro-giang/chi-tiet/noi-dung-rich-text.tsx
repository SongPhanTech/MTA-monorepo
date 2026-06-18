// Hiển thị nội dung rich text (HTML do Tiptap sinh) ở dạng chỉ-đọc, có render công thức toán.
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import { Empty } from "antd"
import { useEffect, useState } from "react"

interface NoiDungRichTextProps {
  value?: string | null
}

const NoiDungRichText = ({ value }: NoiDungRichTextProps) => {
  // Render thô ở lần đầu (khớp SSR), sau đó nâng cấp render công thức toán phía client.
  const [html, setHtml] = useState(value || "")

  useEffect(() => {
    setHtml(renderWithMath(value || ""))
  }, [value])

  if (!value || !value.trim()) {
    return <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <div
      className="prose max-w-none text-sm leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-gray-100 [&_th]:p-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default NoiDungRichText
