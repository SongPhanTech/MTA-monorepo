import { useFindUniqueFAQ } from "@workspace/db/hooks"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

interface FAQCitation {
  index: number
  content: string
  faq_id: string
  score?: number
  source: string
}

interface FAQCitationTooltipProps {
  citation: FAQCitation
  onClick?: () => void
}

export default function FAQCitationTooltip({ citation, onClick }: FAQCitationTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom" as "top" | "bottom",
    maxHeight: "60vh",
  })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: faq } = useFindUniqueFAQ(
    {
      where: { id: citation.faq_id },
      select: {
        id: true,
        question: true,
        answer: true,
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    {
      enabled: !!citation.faq_id && isHovered,
    }
  )

  const question = faq?.question || ""
  const answer = faq?.answer || ""

  useEffect(() => {
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const tooltipHeight = tooltipRef.current?.offsetHeight || 300
        const tooltipWidth = Math.min(400, viewportWidth - 32)

        const spaceBelow = viewportHeight - rect.bottom - 16
        const spaceAbove = rect.top - 16

        const useTop = spaceBelow < tooltipHeight && spaceAbove > spaceBelow

        let maxHeight = "60vh"
        if (useTop) {
          maxHeight = `${Math.min(spaceAbove - 2, viewportHeight * 0.6)}px`
        } else {
          maxHeight = `${Math.min(spaceBelow - 2, viewportHeight * 0.6)}px`
        }

        let left = rect.left + rect.width / 2
        const halfTooltipWidth = tooltipWidth / 2

        if (left - halfTooltipWidth < 16) {
          left = halfTooltipWidth + 16
        }

        if (left + halfTooltipWidth > viewportWidth - 16) {
          left = viewportWidth - halfTooltipWidth - 16
        }

        setPosition({
          top: useTop ? rect.top - 2 : rect.bottom + 2,
          left,
          placement: useTop ? "top" : "bottom",
          maxHeight,
        })
      }
    }

    if (isHovered) {
      updatePosition()
      const timeoutId = setTimeout(updatePosition, 0)
      window.addEventListener("scroll", updatePosition, true)
      window.addEventListener("resize", updatePosition)

      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener("scroll", updatePosition, true)
        window.removeEventListener("resize", updatePosition)
      }
    }
  }, [isHovered])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsHovered(true)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 150)
  }

  const tooltipContent = isHovered ? (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] rounded-lg shadow-lg border border-gray-200 w-[min(400px,calc(100vw-32px))] transition-opacity duration-150 ease-in-out bg-gray-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: position.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        opacity: isVisible ? 1 : 0,
        fontFamily: '"Noto Serif", serif',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="overflow-y-auto px-3 pt-3"
        style={{
          maxHeight: position.maxHeight,
          scrollbarWidth: "thin",
        }}
      >
        <div className="space-y-3 mb-2">
          <div>
            <div className="font-bold text-primary text-xs mb-1">Câu hỏi:</div>
            <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
              {question}
            </p>
          </div>

          <div>
            <div className="font-bold text-primary text-xs mb-1">Câu trả lời:</div>
            <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
              {answer}
            </p>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-gray-200 pb-3 space-y-2">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>Trích:</span>
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
              Câu hỏi thường gặp
            </span>
          </div>

          {faq?.topic?.name && (
            <div className="text-xs text-gray-500">
              <div className="flex items-start gap-1">
                <span className="flex-shrink-0 pt-0.5">Chủ đề:</span>
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {faq.topic.name}
                </span>
              </div>
            </div>
          )}

          {citation.score && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>Độ liên quan:</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {(citation.score * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div>
      <span
        ref={triggerRef}
        className="inline-flex items-center justify-center w-5 h-5 ml-0.5 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full cursor-pointer hover:bg-orange-600 hover:text-white transition-all border border-orange-600"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (onClick) {
            onClick()
          } else {
            setIsHovered(!isHovered)
          }
        }}
      >
        {citation.index}
      </span>
      {typeof window !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, window.document.body)}
    </div>
  )
}
