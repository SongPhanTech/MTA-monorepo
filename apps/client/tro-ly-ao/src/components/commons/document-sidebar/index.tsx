import {
  CloseOutlined,
  DownCircleOutlined,
  DownOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SearchOutlined,
  UpCircleOutlined,
  UpOutlined,
} from "@ant-design/icons"
import { useFindUniqueDocument } from "@workspace/db/hooks"
import { Drawer, Input, Tooltip } from "antd"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface DocumentSidebarProps {
  documentId: string | null
  citationContent: string | null
  onClose: () => void
}

export default function DocumentSidebar({
  documentId,
  citationContent,
  onClose,
}: DocumentSidebarProps) {
  const [highlightedContent, setHighlightedContent] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0)
  const [totalMatches, setTotalMatches] = useState<number>(0)
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const { onOpen: openPreviewTaiLieu } = useDisclosure<string>({
    tag: "PreviewTaiLieu",
  })

  const { data: document } = useFindUniqueDocument(
    {
      where: { id: documentId || "" },
      select: {
        id: true,
        title: true,
        body: true,
        uri: true,
        topics: {
          select: {
            id: true,
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        classification: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    {
      enabled: !!documentId,
    }
  )

  useEffect(() => {
    if (!document?.body) return

    const originalContent = document.body
    let citationStart = -1
    let citationLength = 0

    if (citationContent) {
      const citation = citationContent.trim()
      citationStart = originalContent.indexOf(citation)

      if (citationStart !== -1) {
        citationLength = citation.length
      } else {
        const citationPreview = citation.substring(0, Math.min(100, citation.length))
        citationStart = originalContent.indexOf(citationPreview)
        if (citationStart !== -1) {
          citationLength = citationPreview.length
        }
      }
    }

    const searchMatches: Array<{ start: number; end: number; isCurrent: boolean }> = []
    let matchCount = 0

    if (searchQuery.trim()) {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(escapedQuery, "gi")
      const matches = originalContent.match(regex)
      setTotalMatches(matches?.length || 0)

      let match: RegExpExecArray | null
      regex.lastIndex = 0
      // biome-ignore lint/suspicious/noAssignInExpressions: need to iterate through regex matches
      while ((match = regex.exec(originalContent)) !== null) {
        matchCount++
        searchMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          isCurrent: matchCount === currentMatchIndex + 1,
        })
      }
    } else {
      setTotalMatches(0)
      setCurrentMatchIndex(0)
    }

    const segments: Array<{
      start: number
      end: number
      type: "search-current" | "search-other" | "citation" | "normal"
    }> = []
    const citationEnd = citationStart + citationLength

    let i = 0
    while (i < originalContent.length) {
      const searchMatch = searchMatches.find((m) => i >= m.start && i < m.end)
      if (searchMatch) {
        if (i === searchMatch.start) {
          segments.push({
            start: searchMatch.start,
            end: searchMatch.end,
            type: searchMatch.isCurrent ? "search-current" : "search-other",
          })
        }
        i = searchMatch.end
      } else if (citationStart !== -1 && i >= citationStart && i < citationEnd) {
        let segmentEnd = citationEnd
        for (const match of searchMatches) {
          if (match.start > i && match.start < segmentEnd) {
            segmentEnd = match.start
            break
          }
        }
        segments.push({
          start: i,
          end: segmentEnd,
          type: "citation",
        })
        i = segmentEnd
      } else {
        let segmentEnd = originalContent.length

        for (const match of searchMatches) {
          if (match.start > i && match.start < segmentEnd) {
            segmentEnd = match.start
          }
        }

        if (citationStart > i && citationStart < segmentEnd) {
          segmentEnd = citationStart
        }

        segments.push({
          start: i,
          end: segmentEnd,
          type: "normal",
        })
        i = segmentEnd
      }
    }

    let result = ""
    for (const segment of segments) {
      const text = originalContent.substring(segment.start, segment.end)

      if (segment.type === "search-current") {
        result += `<mark style="background-color: #fde047;">${text}</mark>`
      } else if (segment.type === "search-other") {
        result += `<mark style="background-color: #fef9c3;">${text}</mark>`
      } else if (segment.type === "citation") {
        result += `<mark style="background-color: rgba(2, 136, 80, 0.25); color: #000;">${text}</mark>`
      } else {
        result += text
      }
    }

    setHighlightedContent(result)

    setTimeout(() => {
      if (searchQuery.trim() && totalMatches > 0) {
        const allMarks = contentRef.current?.querySelectorAll("mark")
        if (allMarks && allMarks.length > 0) {
          const currentMark = Array.from(allMarks).find(
            (mark) => mark.style.backgroundColor === "rgb(253, 224, 71)"
          )
          if (currentMark) {
            currentMark.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }
      } else {
        const markElement = contentRef.current?.querySelector("mark")
        if (markElement) {
          markElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    }, 100)
  }, [document, citationContent, searchQuery, currentMatchIndex, totalMatches])

  const handleSearchChange = (value: string) => {
    setInputValue(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value)
      setCurrentMatchIndex(0)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && totalMatches > 0) {
      e.preventDefault()
      handleNextMatch()
    }
  }

  const handleNextMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches)
    }
  }

  const handlePrevMatch = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches)
    }
  }

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-primary" />
            <span className="font-semibold">Tài liệu</span>
          </div>
          {documentId && (
            <Tooltip title="Xem thông tin chi tiết" placement="left">
              <button
                type="button"
                onClick={() => openPreviewTaiLieu(documentId)}
                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                <InfoCircleOutlined className="text-lg" />
              </button>
            </Tooltip>
          )}
        </div>
      }
      size="default"
      placement="right"
      onClose={onClose}
      open={!!documentId}
      width={600}
      closeIcon={<CloseOutlined />}
      mask={false}
      styles={{
        body: { padding: 0 },
      }}
    >
      {document && (
        <div className="h-full flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            {document.uri ? (
              <a
                href={document.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium transition-colors group mb-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <LinkOutlined className="text-sm flex-shrink-0" />
                <span className="line-clamp-2 group-hover:underline">{document.title}</span>
              </a>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-900 text-sm font-medium mb-1.5">
                <FileTextOutlined className="text-sm flex-shrink-0" />
                <span className="line-clamp-2">{document.title}</span>
              </div>
            )}

            {document.topics && document.topics.length > 0 && (
              <div className="text-xs mb-1">
                <div className="flex items-start gap-1">
                  <span className="text-gray-500 flex-shrink-0 pt-0.5">Chủ đề:</span>
                  <div className="flex-1 min-w-0 flex items-start gap-1">
                    <div
                      className={`flex gap-1 flex-1 min-w-0 ${isTopicsExpanded ? "flex-wrap" : "overflow-hidden"}`}
                    >
                      {document.topics.map((dt) => (
                        <span
                          key={dt.id}
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

            {document.classification && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Phân loại:</span>
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {document.classification.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            {!document?.body || document.body.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileTextOutlined className="text-4xl mb-2" />
                  <p className="mb-2">Tài liệu chưa được phân đoạn</p>
                  <p className="text-sm">
                    Vui lòng nhấn biểu tượng <InfoCircleOutlined className="text-primary" /> để tải
                    xuống tài liệu
                  </p>
                </div>
              </div>
            ) : highlightedContent ? (
              <div
                ref={contentRef}
                className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                style={{
                  fontFamily: '"Noto Serif", serif',
                  overflowWrap: "anywhere",
                }}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileTextOutlined className="text-4xl mb-2" />
                  <p>Đang tải nội dung tài liệu...</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm kiếm trong tài liệu..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                allowClear
                className="flex-1"
              />
              {totalMatches > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {currentMatchIndex + 1}/{totalMatches}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    <UpCircleOutlined className="text-lg" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    <DownCircleOutlined className="text-lg" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
