import { FileTextOutlined, LinkOutlined } from '@ant-design/icons'
import { useFindUniqueDocument } from '@workspace/db/hooks'
import { Popover, Tooltip } from 'antd'
import { useState } from 'react'

interface Citation {
    index: number
    content: string
    document_id: string
    document_type: string
}

interface CitationTooltipProps {
    citation: Citation
}

export default function CitationTooltip({ citation }: CitationTooltipProps) {
    const [open, setOpen] = useState(false)

    const { data: document } = useFindUniqueDocument(
        {
            where: { id: citation.document_id },
            include: {
                topic: true,
            },
        },
        {
            enabled: !!citation.document_id,
        }
    )

    const tooltipContent = (
        <div className="w-full max-w-[90vw] md:max-w-md lg:max-w-lg">
            <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-[#468951] text-white rounded-md text-xs font-semibold">
                    Trích dẫn #{citation.index}
                </span>
            </div>

            {/* Content - Nội dung trích dẫn */}
            <div className="mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                    Nội dung trích dẫn
                </div>
                <div
                    className="text-sm text-gray-700 leading-relaxed max-h-[60vh] md:max-h-96 overflow-y-auto"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#468951 rgba(70, 137, 81, 0.1)',
                    }}
                >
                    <p className="whitespace-pre-wrap break-words">{citation.content}</p>
                </div>
            </div>

            {/* Footer - Document link with topic on hover */}
            {document?.title && (
                <div className="pt-3 border-t border-gray-300">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                        Nguồn tài liệu
                    </div>
                    {document?.uri ? (
                        <Tooltip
                            title={document?.topic?.name ? `Chủ đề: ${document.topic.name}` : null}
                            placement="bottom"
                        >
                            <a
                                href={document.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#468951] hover:text-[#3a7043] text-sm font-medium transition-colors group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <LinkOutlined className="group-hover:scale-110 transition-transform" />
                                <span className="underline">{document.title}</span>
                            </a>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={document?.topic?.name ? `Chủ đề: ${document.topic.name}` : null}
                            placement="bottom"
                        >
                            <div className="flex items-center gap-2 text-gray-700 text-sm cursor-help">
                                <FileTextOutlined />
                                <span>{document.title}</span>
                            </div>
                        </Tooltip>
                    )}
                </div>
            )}
        </div>
    )

    return (
        <Popover
            content={tooltipContent}
            trigger="hover"
            open={open}
            onOpenChange={setOpen}
            overlayStyle={{
                maxWidth: '95vw',
            }}
            color="#f9fafb"
            arrow={{ pointAtCenter: true }}
        >
            <span className="inline-flex items-center justify-center w-6 h-6 ml-1 text-xs font-bold text-white bg-[#468951] rounded-full cursor-pointer hover:bg-[#3a7043] transition-all hover:scale-110 shadow-md">
                {citation.index}
            </span>
        </Popover>
    )
}
