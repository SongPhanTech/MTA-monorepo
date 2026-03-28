import { Col, Row } from "antd"
import type { ReactNode } from "react"

export interface GridItem {
  key: string
  content: ReactNode
}

interface GridBlockProps {
  columns: number
  items: GridItem[]
}

export const GridBlock: React.FC<GridBlockProps> = ({ columns, items }) => {
  const colSpan = 24 / columns

  return (
    <Row gutter={[16, 8]}>
      {items.map(({ key, content }) => (
        <Col span={colSpan} key={key}>
          <div className="flex items-center gap-1 min-w-0">
            <span className="whitespace-nowrap !font-time-news-roman">{content}</span>
          </div>
        </Col>
      ))}
    </Row>
  )
}
