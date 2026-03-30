import { DownOutlined, FileTextOutlined, LinkOutlined, UpOutlined } from "@ant-design/icons"
import { useFindUniqueDocument } from "@workspace/db/hooks"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

interface Citation {
  index: number
  content: string
  document_id: string
}

interface CitationTooltipProps {
  citation: Citation
  onClick?: () => void
}

export default function CitationTooltip({ citation, onClick }: CitationTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom" as "top" | "bottom",
    maxHeight: "60vh",
  })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: document } = useFindUniqueDocument(
    {
      where: { id: citation.document_id },
      select: {
        id: true,
        title: true,
        uri: true,
        topics: {
          select: {
            topic: {
              select: {
                name: true,
              },
            },
          },
        },
        classification: {
          select: {
            name: true,
          },
        },
      },
    },
    {
      enabled: !!citation.document_id,
    }
  )

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
          // scrollbarColor: '#108850 rgba(70, 137, 81, 0.1)',
        }}
      >
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
          {citation.content}
        </p>

        {document?.title && (
          <div className="pt-3 mt-3 border-t border-gray-200 pb-3 space-y-2">
            {document?.uri ? (
              <a
                href={document.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#108850] hover:text-[#0f7a3b] text-sm font-medium transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <LinkOutlined className="text-sm flex-shrink-0" />
                <span className="truncate">{document.title}</span>
              </a>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                <FileTextOutlined className="text-sm flex-shrink-0" />
                <span className="truncate">{document.title}</span>
              </div>
            )}

            {document?.topics && document.topics.length > 0 && (
              <div className="text-xs text-gray-500">
                <div className="flex items-start gap-1">
                  <span className="flex-shrink-0 pt-0.5">Chủ đề:</span>
                  <div className="flex-1 min-w-0 flex items-start gap-1">
                    <div
                      className={`flex gap-1 flex-1 min-w-0 ${isTopicsExpanded ? "flex-wrap" : "overflow-hidden"}`}
                    >
                      {document.topics.map((dt) => (
                        <span
                          key={dt.topic?.name}
                          className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium whitespace-nowrap flex-shrink-0"
                        >
                          {dt.topic?.name}
                        </span>
                      ))}
                    </div>
                    {document.topics.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsTopicsExpanded(!isTopicsExpanded)
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors pt-0.5"
                      >
                        {isTopicsExpanded ? (
                          <UpOutlined className="text-[10px]" />
                        ) : (
                          <DownOutlined className="text-[10px]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {document?.classification?.name && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>Phân loại:</span>
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {document.classification.name}
                </span>
              </div>
            )}
          </div>
        )}

        {!document?.title && <div className="pb-3" />}
      </div>
    </div>
  ) : null

  return (
    <div>
      <span
        ref={triggerRef}
        className="inline-flex items-center justify-center w-5 h-5 ml-0.5 text-xs font-semibold text-[#108850] bg-[#e8f5f0] rounded-full cursor-pointer hover:bg-[#108850] hover:text-white transition-all border border-[#108850]"
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
