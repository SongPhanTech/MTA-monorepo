import { ArrowDownOutlined, CopyOutlined, FileTextOutlined } from "@ant-design/icons"
import CitationTooltip from "@components/commons/citation-tooltip"
import DocumentSidebar from "@components/commons/document-sidebar"
import FAQCitationTooltip from "@components/commons/faq-citation-tooltip"
import FAQSidebar from "@components/commons/faq-sidebar"
import ChatInput from "@components/commons/input-chat-bot"
import ChatLayout from "@layouts/chat-layout"
import { MessageSender } from "@workspace/db"
import {
  useFindManyMessage,
  useFindUniqueConversation,
  useUpdateConversation,
} from "@workspace/db/hooks"
import { Button, List, message } from "antd"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { fetchHoiDap, fetchHoiDapFaq } from "@/api/hoi-dap"

interface Citation {
  index: number
  content: string
  document_id: string
  metadata?: any
}

interface FAQCitation {
  index: number
  content: string
  faq_id: string
  score?: number
  source: string
}

// Transform FAQ content: Q: -> Câu hỏi:, A: -> Câu trả lời:
function transformFAQContent(content: string): string {
  return content.replace(/^Q:/gm, "Câu hỏi:").replace(/^A:/gm, "Câu trả lời:")
}

function parseResponseWithCitations(text: string): {
  answer: string
  citations: Citation[]
  faqCitations: FAQCitation[]
} {
  try {
    // Tìm vị trí của separator "---CITATIONS---"
    const separatorIndex = text.indexOf("---CITATIONS---")

    if (separatorIndex === -1) {
      // Nếu không có citations, trả về toàn bộ text
      return { answer: text, citations: [], faqCitations: [] }
    }

    // Phần trước: answer content
    const answer = text.substring(0, separatorIndex).trim()
    // Phần sau: JSON chứa citations
    const citationsText = text.substring(separatorIndex + "---CITATIONS---".length).trim()

    const citations: Citation[] = []
    const faqCitations: FAQCitation[] = []

    if (citationsText) {
      try {
        const parsed = JSON.parse(citationsText)
        const allCitations = parsed.citations || []

        // Phân loại citations theo source
        for (const citation of allCitations) {
          if (citation.source === "FAQ") {
            // Transform FAQ content before saving
            faqCitations.push({
              ...citation,
              content: transformFAQContent(citation.content),
            })
          } else {
            citations.push(citation)
          }
        }
      } catch (e) {
        // console.error('Failed to parse citations JSON:', e)
      }
    }

    return { answer, citations, faqCitations }
  } catch (error) {
    console.error("Error parsing response:", error)
    return { answer: text, citations: [], faqCitations: [] }
  }
}

export default function Page() {
  const router = useRouter()
  const { id, isInitMessage, documentIds } = router.query
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isFaqMode, setIsFaqMode] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<
    {
      id: number
      role: string
      content: string
      citations?: Citation[]
      faqCitations?: FAQCitation[]
    }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [hasAutoReplied, setHasAutoReplied] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedCitationContent, setSelectedCitationContent] = useState<string | null>(null)
  const [selectedFaqData, setSelectedFaqData] = useState<FAQCitation | null>(null)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [isStoppedByUser, setIsStoppedByUser] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Idle timeout configuration (60 seconds without new data)
  const API_TIMEOUT_MS = 60000

  // Initialize selectedDocumentIds from query params
  useEffect(() => {
    if (documentIds && typeof documentIds === "string") {
      const ids = documentIds.split(",").filter(Boolean)
      if (ids.length > 0) {
        setSelectedDocumentIds(ids)
      }
    }
  }, [documentIds])

  const { mutateAsync: updateConversation } = useUpdateConversation()

  const { data: conversationCurrent } = useFindUniqueConversation(
    {
      where: { id: id as string },
    },
    {
      enabled: !!id,
    }
  )

  const { data: messageList, refetch: refetchMessages } = useFindManyMessage({
    where: { conversationId: id as string },
    include: {
      citations: true,
    },
  })

  const handleSend = async () => {
    if (!input.trim() || !id || loading || isStreaming) return

    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }

    const currentInput = input
    setInput("")

    const userMessage = {
      id: Date.now(),
      role: "USER",
      content: currentInput,
    }
    setMessages((prev) => [...prev, userMessage])

    await sendMessage(currentInput, userMessage.id)
  }

  const sendMessage = useCallback(
    async (text: string, userMessageId: number, skipUserMessage = false) => {
      setLoading(true)
      setIsStoppedByUser(false)
      const controller = new AbortController()
      setAbortController(controller)

      const clearRequestTimeout = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }

      const resetIdleTimeout = () => {
        clearRequestTimeout()
        timeoutRef.current = setTimeout(() => {
          if (controller && !controller.signal.aborted) {
            controller.abort()
            message.warning("Không nhận được dữ liệu mới trong 60s. Vui lòng thử lại.")
            setLoading(false)
            setIsStreaming(false)
            setAbortController(null)
          }
        }, API_TIMEOUT_MS)
      }

      // Start idle timeout while waiting for the first response bytes
      resetIdleTimeout()

      timeoutRef.current = setTimeout(() => {
        if (controller && !controller.signal.aborted) {
          controller.abort()
          message.warning("Không nhận được dữ liệu mới trong 60s. Vui lòng thử lại.")
          setLoading(false)
          setIsStreaming(false)
          setAbortController(null)
        }
      }, API_TIMEOUT_MS)

      try {
        // Chỉ tạo USER message nếu chưa có (khi user gửi từ input)
        if (!skipUserMessage) {
          await updateConversation({
            where: { id: id as string },
            data: {
              message: {
                create: [
                  {
                    content: text,
                    sender: MessageSender.USER,
                  },
                ],
              },
            },
          })
        }

        const response = await (isFaqMode
          ? fetchHoiDapFaq({
              prompt: text,
              conversation_id: id as string,
              signal: controller.signal,
            })
          : fetchHoiDap({
              prompt: text,
              conversation_id: id as string,
              signal: controller.signal,
              document_ids: selectedDocumentIds,
            }))

        if (!response.ok) {
          message.error("Lỗi từ server")
          setLoading(false)
          return
        }

        let botReply = ""

        if (isFaqMode) {
          const json = await response.json()
          if (json?.error === "True") {
            message.error("Đã xảy ra lỗi từ máy chủ")
            return
          }
          botReply = json?.success_detail || "Không có phản hồi"

          // Hiển thị response với chức năng FAQ
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: "BOT",
              content: botReply,
            },
          ])
        } else {
          // Tạo message BOT trống trước
          const botMessageId = Date.now()
          setMessages((prev) => [
            ...prev,
            {
              id: botMessageId,
              role: "BOT",
              content: "",
            },
          ])

          // lấy từ steam và cập nhật
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (reader) {
            let accumulatedText = ""
            setLoading(false) // Tắt loading khi bắt đầu trả lời
            setIsStreaming(true) // Bắt đầu streaming

            while (true) {
              // Check if request was aborted
              if (controller.signal.aborted) {
                break
              }

              const { done, value } = await reader.read()
              if (done) break

              resetIdleTimeout()

              const chunk = decoder.decode(value, { stream: true })
              accumulatedText += chunk

              // Parse citations và answer từ accumulated text
              const { answer, citations, faqCitations } =
                parseResponseWithCitations(accumulatedText)

              // Cập nhật toàn bộ message của BOT với answer (chỉ để hiển thị real-time)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: answer, citations, faqCitations }
                    : msg
                )
              )
            }

            setIsStreaming(false) // Kết thúc streaming

            const { citations, faqCitations } = parseResponseWithCitations(accumulatedText)

            await new Promise((resolve) => setTimeout(resolve, 500))

            const { data: latestMessages } = await refetchMessages()

            const latestBotMessage = latestMessages
              ? [...latestMessages]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .find((msg) => msg.sender === MessageSender.BOT)
              : null

            if (latestBotMessage && (citations.length > 0 || faqCitations.length > 0)) {
              const allCitationsToCreate = [
                ...citations.map((citation: Citation) => ({
                  content: citation.content,
                  index: citation.index,
                  documentId: citation.document_id,
                  documentType: "DOCUMENT",
                })),
                ...faqCitations.map((faqCitation: FAQCitation) => ({
                  content: faqCitation.content,
                  index: faqCitation.index,
                  documentId: faqCitation.faq_id,
                  documentType: "FAQ",
                })),
              ]

              await updateConversation({
                where: { id: id as string },
                data: {
                  message: {
                    update: {
                      where: { id: latestBotMessage.id },
                      data: {
                        citations: {
                          create: allCitationsToCreate,
                        },
                      },
                    },
                  },
                },
              })
            }
          } else {
            // Fallback nếu không có stream
            const fullText = await response.text()
            const { answer, citations, faqCitations } = parseResponseWithCitations(fullText)
            botReply = answer

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, content: botReply, citations, faqCitations }
                  : msg
              )
            )

            // Similar logic for non-streaming case
            await new Promise((resolve) => setTimeout(resolve, 500))

            const { data: latestMessages } = await refetchMessages()

            const latestBotMessage = latestMessages
              ? [...latestMessages]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .find((msg) => msg.sender === MessageSender.BOT)
              : null

            if (latestBotMessage && (citations.length > 0 || faqCitations.length > 0)) {
              const allCitationsToCreate = [
                ...citations.map((citation: Citation) => ({
                  content: citation.content,
                  index: citation.index,
                  documentId: citation.document_id,
                  documentType: "DOCUMENT",
                })),
                ...faqCitations.map((faqCitation: FAQCitation) => ({
                  content: faqCitation.content,
                  index: faqCitation.index,
                  documentId: faqCitation.faq_id,
                  documentType: "FAQ",
                })),
              ]

              await updateConversation({
                where: { id: id as string },
                data: {
                  message: {
                    update: {
                      where: { id: latestBotMessage.id },
                      data: {
                        citations: {
                          create: allCitationsToCreate,
                        },
                      },
                    },
                  },
                },
              })
            }
          }
        }

        setTimeout(() => {
          setLoading(false)
          setIsStreaming(false)
          setAbortController(null)
        }, 0)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Hiển thị thông báo phù hợp dựa trên nguyên nhân abort
          if (isStoppedByUser) {
            message.info("Đã dừng trả lời")
          }
          // Nếu là timeout thì đã hiển thị thông báo ở timeout handler
        } else {
          console.error(err)
          message.error("Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.")
        }
        setLoading(false)
        setIsStreaming(false)
      } finally {
        // Clear timeout khi hoàn thành
        clearRequestTimeout()
        setAbortController(null)
      }
    },
    [id, isFaqMode, updateConversation, refetchMessages, isStoppedByUser, selectedDocumentIds]
  )

  const handleStop = () => {
    // Đánh dấu là user chủ động dừng
    setIsStoppedByUser(true)

    // Clear timeout nếu có
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setLoading(false)
    setIsStreaming(false)
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setIsUserScrolling(false)
      setShowScrollButton(false)
    }
  }

  const handleScroll = () => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

    if (isAtBottom) {
      setIsUserScrolling(false)
      setShowScrollButton(false)
    } else {
      setIsUserScrolling(true)
      setShowScrollButton(true)
    }
  }

  const handleCitationClick = (citation: Citation) => {
    setSelectedDocumentId(citation.document_id)
    setSelectedCitationContent(citation.content)
    setSelectedFaqData(null) // Close FAQ sidebar if open
  }

  const handleFaqCitationClick = (faqCitation: FAQCitation) => {
    setSelectedFaqData(faqCitation)
    setSelectedDocumentId(null) // Close document sidebar if open
    setSelectedCitationContent(null)
  }

  const handleCloseSidebar = () => {
    setSelectedDocumentId(null)
    setSelectedCitationContent(null)
  }

  const handleCloseFaqSidebar = () => {
    setSelectedFaqData(null)
  }

  useEffect(() => {
    if (messageList) {
      const sortedMessages = [...messageList].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      const mappedMessages = sortedMessages.map((msg) => {
        const documentCitations: Citation[] = []
        const faqCitations: FAQCitation[] = []

        // Separate citations by documentType
        msg.citations?.forEach((citation) => {
          if (citation.documentType === "FAQ") {
            faqCitations.push({
              index: citation.index || 0,
              content: citation.content || "",
              faq_id: citation.documentId || "",
              source: "FAQ", // Always FAQ for documentType === 'FAQ'
              score: undefined,
            })
          } else {
            documentCitations.push({
              index: citation.index || 0,
              content: citation.content || "",
              document_id: citation.documentId || "",
              metadata: {},
            })
          }
        })

        return {
          id: Number(msg.id),
          role: msg.sender === "USER" ? "USER" : "BOT",
          content: msg.content || "",
          citations: documentCitations,
          faqCitations: faqCitations,
        }
      })
      setMessages(mappedMessages)
    }
  }, [messageList])

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to reset when conversation changes
  useEffect(() => {
    if (abortController) {
      abortController.abort()
    }

    // Clear timeout khi chuyển conversation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setLoading(false)
    setIsStreaming(false)
    setAbortController(null)
    setInput("")
    setIsUserScrolling(false)
    setShowScrollButton(false)
    setHasAutoReplied(false)
    setSelectedDocumentId(null)
    setSelectedCitationContent(null)
    setSelectedFaqData(null)
    setIsStoppedByUser(false)
  }, [id])

  // Tự động gọi API cho conversation mới (chỉ có USER message, chưa có BOT reply)
  useEffect(() => {
    if (
      messageList &&
      messageList.length === 1 &&
      messageList[0].sender === "USER" &&
      id &&
      !loading &&
      !isStreaming &&
      !hasAutoReplied &&
      conversationCurrent && // conversationCurrent đã load
      !messageList.some((msg) => msg.sender === "BOT") && // Chưa có tin nhắn BOT
      isInitMessage === "true" // Chỉ auto reply cho tin nhắn init
    ) {
      const userMessage = messageList[0]
      setHasAutoReplied(true)
      sendMessage(userMessage.content || "", Date.now(), true) // skipUserMessage = true

      // Xóa param isInitMessage khỏi URL sau khi đã xử lý
      router.replace(`/hoi-thoai/${id}`, undefined, { shallow: true })
    }
  }, [
    messageList,
    id,
    conversationCurrent,
    loading,
    isStreaming,
    hasAutoReplied,
    sendMessage,
    isInitMessage,
    router,
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (scrollRef.current && !isUserScrolling) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isUserScrolling])

  return (
    <div className="flex flex-col h-full items-center bg-white overflow-hidden">
      <div className="w-full flex flex-col h-full min-w-0 relative max-w-5xl mx-auto">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pb-4 no-scrollbar px-4 md:px-6"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              Bắt đầu cuộc trò chuyện...
            </div>
          ) : (
            <List
              dataSource={
                loading && !messages.some((m) => m.role === "BOT" && m.content === "")
                  ? [...messages, { id: -1, role: "BOT", content: "loading" }]
                  : messages
              }
              renderItem={(msg) => (
                <List.Item
                  key={msg.id}
                  style={{
                    justifyContent: msg.role === "USER" ? "flex-end" : "flex-start",
                    border: "none",
                    padding: "8px 0",
                  }}
                >
                  {msg.content === "loading" ? (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-1 px-4 py-3 bg-[#D5DAE7] text-black rounded-2xl rounded-bl-md shadow-sm max-w-[95%]">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce flex-shrink-0 [animation-delay:0.4s]" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"} min-w-0`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl break-words overflow-hidden shadow-sm ${
                          msg.content.length <= 50 ? "max-w-max" : "max-w-[75%]"
                        } ${
                          msg.role === "USER"
                            ? "bg-[#BEDACE] text-black rounded-br-md"
                            : "bg-[#D5DAE7] text-black rounded-bl-md"
                        }`}
                      >
                        <div className="relative group">
                          {msg.role === "USER" ? (
                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                              }}
                              className="font-normal"
                            >
                              {msg.content}
                            </div>
                          ) : (
                            <div>
                              <div className="overflow-x-auto">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                              {(msg.citations && msg.citations.length > 0) ||
                              (msg.faqCitations && msg.faqCitations.length > 0) ? (
                                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-300">
                                  <span className="text-xs text-gray-600 font-semibold mr-1 flex items-center">
                                    <FileTextOutlined className="mr-1" />
                                    Tài liệu tham khảo:
                                  </span>
                                  {msg.citations &&
                                    [...msg.citations]
                                      .sort((a, b) => a.index - b.index)
                                      .map((citation) => (
                                        <CitationTooltip
                                          key={`doc-${citation.document_id}-${citation.index}`}
                                          citation={citation}
                                          onClick={() => handleCitationClick(citation)}
                                        />
                                      ))}
                                  {msg.faqCitations &&
                                    [...msg.faqCitations]
                                      .sort((a, b) => a.index - b.index)
                                      .map((faqCitation) => (
                                        <FAQCitationTooltip
                                          key={`faq-${faqCitation.faq_id}-${faqCitation.index}`}
                                          citation={faqCitation}
                                          onClick={() => handleFaqCitationClick(faqCitation)}
                                        />
                                      ))}
                                </div>
                              ) : null}
                            </div>
                          )}
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            className={`absolute -bottom-1 ${
                              msg.role === "USER" ? "-left-1" : "-right-1"
                            } opacity-0 group-hover:opacity-100 transition-all duration-200 border-0 shadow-lg rounded-full w-8 h-8 flex items-center justify-center ${
                              msg.role === "USER"
                                ? "bg-white hover:bg-gray-50 text-primary"
                                : "bg-primary hover:bg-primary/90 text-white"
                            }`}
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content)
                              message.success("Đã sao chép nội dung!")
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </List.Item>
              )}
            />
          )}
        </div>

        <div className="relative">
          {showScrollButton && (
            <div
              onClick={scrollToBottom}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10 w-8 h-8 bg-white hover:bg-gray-50 text-primary rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 shadow-md"
            >
              <ArrowDownOutlined className="text-sm" />
            </div>
          )}
          <ChatInput
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={handleSend}
            onStop={handleStop}
            isFaqMode={isFaqMode}
            selectedDocumentIds={selectedDocumentIds}
            onDocumentIdsChange={setSelectedDocumentIds}
          />
        </div>
      </div>

      <DocumentSidebar
        documentId={selectedDocumentId}
        citationContent={selectedCitationContent}
        onClose={handleCloseSidebar}
      />
      <FAQSidebar faqData={selectedFaqData} onClose={handleCloseFaqSidebar} />
    </div>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <ChatLayout>{page}</ChatLayout>
}
