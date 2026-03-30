import { useLayoutEffect, useRef, useState } from "react"
import "./ExpandableContent.css"

const ExpandableContent = ({ htmlContent }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    const element = contentRef.current
    if (element) {
      const hasOverflow = element.scrollHeight > element.clientHeight
      if (hasOverflow !== isClamped) {
        setIsClamped(hasOverflow)
      }
    }
  }, [htmlContent, isClamped])

  const toggleExpand = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const showButton = isClamped || isExpanded

  return (
    <div>
      <div
        ref={contentRef}
        className={isExpanded ? "" : "truncate-text"}
        dangerouslySetInnerHTML={{ __html: htmlContent || "" }}
      />

      {showButton && (
        <button
          type="button"
          onClick={toggleExpand}
          style={{ color: "#1677ff", cursor: "pointer", float: "right" }}
        >
          {isExpanded ? "Thu gọn" : "...Xem thêm"}
        </button>
      )}
    </div>
  )
}

export default ExpandableContent
