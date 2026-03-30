import { useEffect, useMemo, useRef, useState } from "react"

type TypeProps = {
  arr: { key: string; label: string }[]
}
export default function TextTruncate({ arr }: TypeProps) {
  const [show, setShow] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  const handleShowMore = () => {
    setShow(!show)
  }
  const classContent = useMemo(() => {
    if (showButton) {
      if (!show) {
        return "is-collapsed"
      }
    }
    return ""
  }, [show, showButton])

  useEffect(() => {
    if (textRef.current) {
      const el = textRef.current
      if (el.scrollHeight >= 44 && arr?.length > 2) {
        setShowButton(true)
      }
    }
  }, [arr?.length])
  return (
    <div ref={textRef} className="relative">
      <ul
        style={{
          paddingLeft: 0,
          margin: 0,
        }}
        className={`content text-left ${classContent}  ${show ? "" : "line-clamp-3"} `}
      >
        {arr?.map((val) => (
          <li key={val.key}>- {val.label}</li>
        ))}
      </ul>
      {showButton && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            handleShowMore()
          }}
          className="flex  justify-end text-xs text-green-700"
        >
          {show ? "Ẩn bớt" : "Xem thêm"}
        </div>
      )}
    </div>
  )
}
