import { useEffect, useMemo, useRef, useState } from "react"

type TypeProps = {
  children: React.ReactNode
}
export default function HtmlTruncate({ children }: TypeProps) {
  const [show, setShow] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  const classContent = useMemo(() => {
    if (showButton) {
      if (!show) {
        return "is-collapsed"
      }
    }
    return ""
  }, [show, showButton])
  const handleShowMore = () => {
    setShow(!show)
  }

  useEffect(() => {
    if (textRef.current) {
      const el = textRef.current

      if (el.scrollHeight > 54) {
        setShowButton(true)
      }
    }
  }, [])
  return (
    <div className="relative collapse-content">
      <div className={`content text-left ${classContent} ${show ? "" : "max-h-[44px]"}  `}>
        <div ref={textRef}>{children}</div>
      </div>
      {showButton && (
        <div className="flex justify-end">
          <div onClick={() => handleShowMore()} className="text-xs text-green-600 ">
            {show ? "Ẩn bớt" : "Xem thêm"}
          </div>
        </div>
      )}
    </div>
  )
}
