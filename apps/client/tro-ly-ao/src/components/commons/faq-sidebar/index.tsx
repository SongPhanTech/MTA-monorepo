import { CloseOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons"
import { useFindUniqueFAQ } from "@workspace/db/hooks"
import { Drawer, Input } from "antd"
import { useEffect, useRef, useState } from "react"

interface FAQSidebarProps {
  faqData: {
    index: number
    content: string
    faq_id: string
    score?: number
    source: string
  } | null
  onClose: () => void
}

export default function FAQSidebar({ faqData, onClose }: FAQSidebarProps) {
  const [highlightedQuestion, setHighlightedQuestion] = useState<string>("")
  const [highlightedAnswer, setHighlightedAnswer] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0)
  const [totalMatches, setTotalMatches] = useState<number>(0)
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Fetch FAQ data from database
  const { data: faq } = useFindUniqueFAQ(
    {
      where: { id: faqData?.faq_id || "" },
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
      enabled: !!faqData?.faq_id,
    }
  )

  // Use FAQ data from database if available, otherwise parse from content
  const question = faq?.question || ""
  const answer = faq?.answer || ""

  useEffect(() => {
    if (!question || !answer) return

    const highlightText = (text: string) => {
      if (!searchQuery.trim()) {
        return text
      }

      const searchMatches: Array<{ start: number; end: number; isCurrent: boolean }> = []
      let matchCount = 0

      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(escapedQuery, "gi")

      let match: RegExpExecArray | null
      regex.lastIndex = 0
      // biome-ignore lint/suspicious/noAssignInExpressions: need to iterate through regex matches
      while ((match = regex.exec(text)) !== null) {
        matchCount++
        searchMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          isCurrent: matchCount === currentMatchIndex + 1,
        })
      }

      const segments: Array<{
        start: number
        end: number
        type: "search-current" | "search-other" | "normal"
      }> = []

      let i = 0
      while (i < text.length) {
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
        } else {
          let segmentEnd = text.length

          for (const match of searchMatches) {
            if (match.start > i && match.start < segmentEnd) {
              segmentEnd = match.start
            }
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
        const segmentText = text.substring(segment.start, segment.end)

        if (segment.type === "search-current") {
          result += `<mark style="background-color: #fde047;">${segmentText}</mark>`
        } else if (segment.type === "search-other") {
          result += `<mark style="background-color: #fef9c3;">${segmentText}</mark>`
        } else {
          result += segmentText
        }
      }

      return result
    }

    // Count total matches across both Q and A
    if (searchQuery.trim()) {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(escapedQuery, "gi")
      const questionMatches = question.match(regex)
      const answerMatches = answer.match(regex)
      const total = (questionMatches?.length || 0) + (answerMatches?.length || 0)
      setTotalMatches(total)
    } else {
      setTotalMatches(0)
      setCurrentMatchIndex(0)
    }

    setHighlightedQuestion(highlightText(question))
    setHighlightedAnswer(highlightText(answer))

    // Scroll to current match
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
      }
    }, 100)
  }, [question, answer, searchQuery, currentMatchIndex, totalMatches])

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
        <div className="flex items-center gap-2">
          <QuestionCircleOutlined className="text-primary" />
          <span className="font-semibold">Câu hỏi thường gặp</span>
        </div>
      }
      size="default"
      placement="right"
      onClose={onClose}
      open={!!faqData}
      width={600}
      closeIcon={<CloseOutlined />}
      mask={false}
      styles={{
        body: { padding: 0 },
      }}
    >
      {faqData && (
        <div className="h-full flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            {/* Source Label */}
            <div className="text-xs mb-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Trích:</span>
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                  Câu hỏi thường gặp
                </span>
              </div>
            </div>

            {/* Topic from FAQ database */}
            {faq?.topic?.name && (
              <div className="text-xs mb-1">
                <div className="flex items-start gap-1">
                  <span className="text-gray-500 flex-shrink-0 pt-0.5">Chủ đề:</span>
                  <div className="flex-1 min-w-0">
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                      {faq.topic.name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {faqData.score && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Độ liên quan:</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {(faqData.score * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            {!question || !answer ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <QuestionCircleOutlined className="text-4xl mb-2" />
                  <p>Không tìm thấy nội dung FAQ</p>
                </div>
              </div>
            ) : (
              <div ref={contentRef} className="space-y-4 text-gray-800 leading-relaxed">
                {/* Question Section */}
                <div>
                  <div className="font-bold text-primary text-base mb-2">Câu hỏi:</div>
                  <div
                    className="text-sm text-gray-900 whitespace-pre-wrap break-words"
                    style={{ overflowWrap: "anywhere" }}
                    dangerouslySetInnerHTML={{
                      __html: highlightedQuestion,
                    }}
                  />
                </div>

                {/* Answer Section */}
                <div>
                  <div className="font-bold text-primary text-base mb-2">Câu trả lời:</div>
                  <div
                    className="text-sm text-gray-900 whitespace-pre-wrap break-words"
                    style={{ overflowWrap: "anywhere" }}
                    dangerouslySetInnerHTML={{ __html: highlightedAnswer }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm kiếm trong FAQ..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                allowClear
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
