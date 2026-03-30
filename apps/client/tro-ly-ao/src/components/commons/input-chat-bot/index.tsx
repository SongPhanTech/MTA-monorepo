import {
  ArrowUpOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  MoreOutlined,
} from "@ant-design/icons"
import { useFindManyDocument } from "@workspace/db/hooks"
import { Button, Dropdown, type MenuProps, Tag, Tooltip } from "antd"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface ChatInputProps {
  input: string
  loading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  onDelete?: () => void
  onStop?: () => void
  isFaqMode?: boolean
  selectedDocumentIds?: string[]
  onDocumentIdsChange?: (documentIds: string[]) => void
}

export default function ChatInput({
  input,
  loading,
  onInputChange,
  onSend,
  onStop,
  isFaqMode = false,
  selectedDocumentIds = [],
  onDocumentIdsChange,
}: ChatInputProps) {
  const _router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const callbackRef = useRef(onDocumentIdsChange)

  // Update callback ref
  useEffect(() => {
    callbackRef.current = onDocumentIdsChange
  }, [onDocumentIdsChange])

  const { onOpen } = useDisclosure<{ ids: string[]; callback: (ids: string[]) => void }, string[]>({
    tag: "ChonTaiLieu",
  })

  const openDocumentModal = () => {
    onOpen({
      ids: selectedDocumentIds,
      callback: (newIds: string[]) => {
        callbackRef.current?.(newIds)
      },
    })
  }

  const handleClearAll = () => {
    onDocumentIdsChange?.([])
  }

  const dropdownMenuItems: MenuProps["items"] = [
    {
      key: "clear-all",
      label: "Xóa toàn bộ tài liệu",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleClearAll,
    },
  ]

  const documentsCache = useRef<Map<string, { id: string; title: string | null }>>(new Map())

  const idsToFetch = useMemo(() => {
    return selectedDocumentIds.filter((id) => !documentsCache.current.has(id))
  }, [selectedDocumentIds])

  const { data: newDocuments = [] } = useFindManyDocument(
    {
      where: {
        id: { in: idsToFetch },
      },
      select: {
        id: true,
        title: true,
      },
    },
    {
      enabled: idsToFetch.length > 0,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 30 * 60 * 1000,
    }
  )

  useEffect(() => {
    if (newDocuments.length > 0) {
      for (const doc of newDocuments) {
        documentsCache.current.set(doc.id, doc)
      }
    }
  }, [newDocuments])

  // Get selected documents from cache OR from newDocuments if just fetched
  const selectedDocuments = useMemo(() => {
    return selectedDocumentIds
      .map((id) => {
        // First check cache
        const cached = documentsCache.current.get(id)
        if (cached) return cached

        // If not in cache, check if it's in the newly fetched documents
        const newDoc = newDocuments.find((doc) => doc.id === id)
        return newDoc
      })
      .filter((doc): doc is { id: string; title: string | null } => doc !== undefined)
  }, [selectedDocumentIds, newDocuments])

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight <= 160 ? `${scrollHeight}px` : "160px"
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    resizeTextarea()
  }, [input])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      const cursorPosition = e.currentTarget.selectionStart
      const newValue = `${input.slice(0, cursorPosition)}\n${input.slice(cursorPosition)}`
      onInputChange(newValue)
      setTimeout(resizeTextarea, 0)
    }
  }

  return (
    <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-white/95 to-white/60 backdrop-blur-md">
      {/* fade lên trên */}
      <div className="absolute left-0 right-0 bottom-full h-12 bg-gradient-to-t from-white/80 via-white/30 to-transparent pointer-events-none" />

      <div className="w-full flex justify-center pb-4">
        <div className="w-full max-w-5xl px-4 md:px-6">
          <div
            className="transition-all duration-300 overflow-hidden"
            style={{
              height: selectedDocumentIds.length > 0 ? "auto" : "0",
              marginBottom: selectedDocumentIds.length > 0 ? "8px" : "0",
              opacity: selectedDocumentIds.length > 0 ? 1 : 0,
            }}
          >
            <div className="flex gap-2 items-center relative">
              {/* Scrollable tags container */}
              <div
                className="flex gap-2 overflow-x-auto flex-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {selectedDocuments.map((doc) => (
                  <Tag
                    key={doc.id}
                    closable
                    onClose={() => {
                      const newIds = selectedDocumentIds.filter((id) => id !== doc.id)
                      onDocumentIdsChange?.(newIds)
                    }}
                    icon={<FileTextOutlined />}
                    className="flex items-center gap-1 m-0 flex-shrink-0"
                    style={{
                      backgroundColor: "#D9EDE4",
                      borderColor: "#00AA55",
                      padding: "4px 8px",
                      fontSize: "13px",
                    }}
                  >
                    <span className="max-w-[200px] truncate inline-block">
                      {doc.title || "Không có tiêu đề"}
                    </span>
                  </Tag>
                ))}
              </div>
              {/* Fixed menu button at the end */}
              {selectedDocumentIds.length > 0 && (
                <Dropdown menu={{ items: dropdownMenuItems }} trigger={["click"]}>
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined style={{ fontSize: 16 }} />}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-200"
                    style={{ padding: 0, minWidth: "auto", border: "none" }}
                  />
                </Dropdown>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-300 px-3 py-2 bg-white/90 backdrop-blur-sm flex flex-col gap-2 transition-all duration-200 hover:border-primary/60 focus-within:border-primary hover:bg-white hover:shadow-md">
            <textarea
              ref={textareaRef}
              className={`py-1 px-3 outline-none border-none text-base bg-transparent resize-none min-h-[32px] w-full placeholder:text-gray-400 focus:placeholder:text-gray-300 transition-colors ${
                loading ? "cursor-not-allowed opacity-60" : ""
              }`}
              placeholder="Hỏi bất kỳ điều gì..."
              value={input}
              onChange={loading ? undefined : handleChange}
              onKeyDown={loading ? undefined : handleKeyDown}
              style={{
                maxHeight: "160px",
                overflowY: "auto",
                lineHeight: "1.6",
              }}
            />

            <div className="flex justify-between items-center px-1">
              <Tooltip title="Chọn tài liệu tham khảo">
                <Button
                  onClick={openDocumentModal}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-0 transition-all duration-200 ${
                    selectedDocumentIds.length > 0
                      ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                  icon={<FileSearchOutlined style={{ fontSize: 16 }} />}
                />
              </Tooltip>
              {loading ? (
                <Button
                  className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 border-0 flex items-center justify-center shadow-md transition-all duration-200"
                  icon={<div className="w-3 h-3 bg-white rounded-sm" />}
                  onClick={onStop}
                />
              ) : (
                <Button
                  onClick={() => {
                    if (!loading && input.trim()) {
                      onSend()
                    }
                  }}
                  className={`w-9 h-9 rounded-full border-0 flex items-center justify-center shadow-md transition-all duration-200 ${
                    input.trim()
                      ? "bg-primary text-white hover:bg-primary/90 hover:scale-105"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  icon={<ArrowUpOutlined className="text-[16px]" />}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
