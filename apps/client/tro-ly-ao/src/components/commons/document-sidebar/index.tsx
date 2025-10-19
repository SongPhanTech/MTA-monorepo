import { CloseOutlined, FileTextOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons'
import { useFindUniqueDocument } from '@workspace/db/hooks'
import { useEffect, useRef, useState } from 'react'
import { Drawer, Input } from 'antd'

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
    const [highlightedContent, setHighlightedContent] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0)
    const [totalMatches, setTotalMatches] = useState<number>(0)
    const contentRef = useRef<HTMLDivElement>(null)

    const { data: document } = useFindUniqueDocument(
        {
            where: { id: documentId || '' },
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

    // Highlight citation content and search results in document
    useEffect(() => {
        if (!document?.body) return

        const originalContent = document.body
        let citationStart = -1
        let citationLength = 0

        // Step 1: Find citation position in original content
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

        // Step 2: Apply search highlighting (avoiding citation area)
        let result = ''
        let lastIndex = 0
        let matchCount = 0

        if (searchQuery.trim()) {
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escapedQuery, 'gi')
            const matches = originalContent.match(regex)
            setTotalMatches(matches?.length || 0)

            let match: RegExpExecArray | null
            regex.lastIndex = 0
            // biome-ignore lint/suspicious/noAssignInExpressions: need to iterate through regex matches
            while ((match = regex.exec(originalContent)) !== null) {
                const matchStart = match.index
                const matchEnd = matchStart + match[0].length

                // Add content before this match
                result += originalContent.substring(lastIndex, matchStart)

                // Highlight the match
                matchCount++
                const isCurrentMatch = matchCount === currentMatchIndex + 1
                result += isCurrentMatch
                    ? `<mark style="background-color: #108850; color: white;" class="font-semibold">${match[0]}</mark>`
                    : `<mark style="background-color: #E0EEEA;">${match[0]}</mark>`

                lastIndex = matchEnd
            }
            result += originalContent.substring(lastIndex)
        } else {
            result = originalContent
            setTotalMatches(0)
            setCurrentMatchIndex(0)
        }

        // Step 3: Apply citation highlighting (on result that may contain search marks)
        if (citationStart !== -1 && citationLength > 0) {
            // We need to find the same position in the result string (which now has HTML tags)
            // Count characters before citation position to account for added tags
            let resultPos = 0
            let originalPos = 0

            // Navigate through result string to find where original citation starts
            while (originalPos < citationStart && resultPos < result.length) {
                if (result[resultPos] === '<') {
                    // Skip HTML tag
                    const tagEnd = result.indexOf('>', resultPos)
                    if (tagEnd !== -1) {
                        resultPos = tagEnd + 1
                    } else {
                        resultPos++
                    }
                } else {
                    resultPos++
                    originalPos++
                }
            }

            const citationStartInResult = resultPos

            // Find citation end
            let citationCharsFound = 0
            while (citationCharsFound < citationLength && resultPos < result.length) {
                if (result[resultPos] === '<') {
                    // Skip HTML tag
                    const tagEnd = result.indexOf('>', resultPos)
                    if (tagEnd !== -1) {
                        resultPos = tagEnd + 1
                    } else {
                        resultPos++
                    }
                } else {
                    resultPos++
                    citationCharsFound++
                }
            }

            const citationEndInResult = resultPos

            result =
                result.substring(0, citationStartInResult) +
                '<mark class="bg-yellow-300 font-semibold">' +
                result.substring(citationStartInResult, citationEndInResult) +
                '</mark>' +
                result.substring(citationEndInResult)
        }

        setHighlightedContent(result)

        // Scroll to highlighted element
        setTimeout(() => {
            const markElement = contentRef.current?.querySelector('mark')
            if (markElement) {
                markElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }, 300)
    }, [document, citationContent, searchQuery, currentMatchIndex])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentMatchIndex(0)
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
                <div className="flex items-center justify-between pr-8">
                    <div className="flex items-center gap-2">
                        <FileTextOutlined className="text-primary" />
                        <span className="font-semibold">Tài liệu nguồn</span>
                    </div>
                </div>
            }
            size="default"
            placement="right"
            onClose={onClose}
            open={!!documentId}
            width={600}
            closeIcon={<CloseOutlined />}
            styles={{
                body: { padding: 0 },
            }}
        >
            {document && (
                <div className="h-full flex flex-col">
                    {/* Header */}
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
                                <span className="line-clamp-2 group-hover:underline">
                                    {document.title}
                                </span>
                            </a>
                        ) : (
                            <div className="flex items-center gap-1.5 text-gray-900 text-sm font-medium mb-1.5">
                                <FileTextOutlined className="text-sm flex-shrink-0" />
                                <span className="line-clamp-2">{document.title}</span>
                            </div>
                        )}

                        {document.topics && document.topics.length > 0 && (
                            <div className="flex items-start gap-1 text-xs mb-1">
                                <span className="text-gray-500 mt-0.5">Chủ đề:</span>
                                <div className="flex flex-wrap gap-1">
                                    {document.topics.map((dt) => (
                                        <span
                                            key={dt.id}
                                            className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                                        >
                                            {dt.topic?.name}
                                        </span>
                                    ))}
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {highlightedContent ? (
                            <div
                                ref={contentRef}
                                className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap"
                                style={{ fontFamily: '"Noto Serif", serif' }}
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

                    {/* Search Footer */}
                    <div className="border-t border-gray-200 p-3 bg-white">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Tìm kiếm trong tài liệu..."
                                prefix={<SearchOutlined className="text-gray-400" />}
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
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
                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextMatch}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        ↓
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
