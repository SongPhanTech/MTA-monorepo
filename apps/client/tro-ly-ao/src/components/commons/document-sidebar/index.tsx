import { CloseOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'
import { useFindUniqueDocument } from '@workspace/db/hooks'
import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'antd'

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
    const contentRef = useRef<HTMLDivElement>(null)

    const { data: document } = useFindUniqueDocument(
        {
            where: { id: documentId || '' },
            select: {
                id: true,
                title: true,
                body: true,
                uri: true,
                topic: {
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

    // Highlight citation content in document
    useEffect(() => {
        if (document?.body && citationContent) {
            const content = document.body
            const citation = citationContent.trim()

            let result = content
            const index = content.indexOf(citation)

            if (index !== -1) {
                result =
                    content.substring(0, index) +
                    `<mark class="bg-yellow-300 font-semibold">${citation}</mark>` +
                    content.substring(index + citation.length)
            } else {
                const citationPreview = citation.substring(0, Math.min(100, citation.length))
                const fuzzyIndex = content.indexOf(citationPreview)

                if (fuzzyIndex !== -1) {
                    result =
                        content.substring(0, fuzzyIndex) +
                        `<mark class="bg-yellow-300 font-semibold">${citationPreview}</mark>` +
                        content.substring(fuzzyIndex + citationPreview.length)
                }
            }

            setHighlightedContent(result)

            setTimeout(() => {
                const markElement = contentRef.current?.querySelector('mark')
                if (markElement) {
                    markElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }, 300)
        } else if (document?.body) {
            setHighlightedContent(document.body)
        }
    }, [document, citationContent])

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

                        {document.topic?.name && (
                            <div className="flex items-center gap-1 text-xs">
                                <span className="text-gray-500">Chủ đề:</span>
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                    {document.topic.name}
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
                </div>
            )}
        </Drawer>
    )
}
