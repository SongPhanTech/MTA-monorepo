import ChatInput from "@components/commons/input-chat-bot"
import ChatLayout from "@layouts/chat-layout"
import { MessageSender } from "@workspace/db"
import { useCreateConversation, useFindManyTopic } from "@workspace/db/hooks"
import { Button, Card, message } from "antd"
import { useRouter } from "next/router"
import type React from "react"
import { useRef, useState } from "react"
import { fetchRecommendByTopicId } from "@/api/hoi-dap"
import { useSSOSession } from "@/hooks/useSSOSession"
import { useUserSession } from "@/hooks/useUserSession"

export default function TroLyAo() {
  const router = useRouter()
  const { ensureSession, isLoading: sessionLoading } = useUserSession()
  const { isAuthenticated: isSSOAuthenticated, session: ssoSession } = useSSOSession()

  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null)
  const [faqQuestions, setFaqQuestions] = useState<string[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const { mutateAsync: createConversation } = useCreateConversation()
  const isProcessingRef = useRef(false)

  // Fetch pinned topics for suggestions
  const { data: pinnedTopics = [] } = useFindManyTopic({
    where: {
      isPinned: true,
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const handleSend = async () => {
    if (!input.trim() || loading || isProcessingRef.current) return

    isProcessingRef.current = true
    setLoading(true)

    try {
      // Kiểm tra có sessionId trước khi tạo conversation
      const currentSessionId = await ensureSession()

      // Calculate label from first message (user input)
      const label = input.trim()

      const res = await createConversation({
        data: {
          sessionId: currentSessionId,
          // Nếu đăng nhập SSO thì lưu userId
          userId: isSSOAuthenticated && ssoSession?.userId ? ssoSession.userId : null,
          message: {
            create: [
              {
                content: label,
                sender: MessageSender.USER,
              },
            ],
          },
        },
      })

      const newId = res?.id
      if (newId) {
        setInput("") // Reset input after successful creation
        router.push({
          pathname: `/hoi-thoai/${newId}`,
          query: {
            isInitMessage: "true",
            documentIds: selectedDocumentIds.join(","),
          },
        })
      } else {
        throw new Error("Không tạo được cuộc trò chuyện mới")
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại sau")
    } finally {
      setLoading(false)
      isProcessingRef.current = false
    }
  }

  const handleTopicClick = async (topic: { id: string; name: string; type: string }) => {
    if (loading || isProcessingRef.current) return

    setLoading(true)
    try {
      const response = await fetchRecommendByTopicId({
        topic_id: topic.id,
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      const questions: string[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.includes("--SUGGESTION_FAQ---")) {
              const question = line.replace("--SUGGESTION_FAQ---", "").trim()
              if (question) questions.push(question)
            }
          }
        }
      }

      setSelectedTopic(topic)
      setFaqQuestions(questions)
    } catch (error) {
      console.error(error)
      message.error("Không thể tải danh sách câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  const handleFaqQuestionClick = async (question: string) => {
    if (loading || isProcessingRef.current || !selectedTopic) return

    isProcessingRef.current = true
    setInput(question)
    setLoading(true)

    try {
      const currentSessionId = await ensureSession()

      const res = await createConversation({
        data: {
          sessionId: currentSessionId,
          userId: isSSOAuthenticated && ssoSession?.userId ? ssoSession.userId : null,
          message: {
            create: [
              {
                content: question,
                sender: MessageSender.USER,
              },
            ],
          },
        },
      })

      const newId = res?.id
      if (newId) {
        setInput("")
        router.push({
          pathname: `/hoi-thoai/${newId}`,
          query: { isInitMessage: "true", isFaq: "true", topicId: selectedTopic.id },
        })
      } else {
        throw new Error("Không tạo được cuộc trò chuyện mới")
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại sau")
    } finally {
      setLoading(false)
      isProcessingRef.current = false
    }
  }

  const handleSuggestionClick = async (question: string) => {
    if (loading || isProcessingRef.current) return

    isProcessingRef.current = true
    setInput(question)
    setLoading(true)

    try {
      const currentSessionId = await ensureSession()
      const label = question.trim()

      const res = await createConversation({
        data: {
          sessionId: currentSessionId,
          userId: isSSOAuthenticated && ssoSession?.userId ? ssoSession.userId : null,
          message: {
            create: [
              {
                content: label,
                sender: MessageSender.USER,
              },
            ],
          },
        },
      })

      const newId = res?.id
      if (newId) {
        setInput("")
        router.push({
          pathname: `/hoi-thoai/${newId}`,
          query: {
            isInitMessage: "true",
            documentIds: selectedDocumentIds.join(","),
          },
        })
      } else {
        throw new Error("Không tạo được cuộc trò chuyện mới")
      }
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại sau")
    } finally {
      setLoading(false)
      isProcessingRef.current = false
    }
  }
  return (
    <div className="flex flex-col h-full items-center bg-white overflow-hidden">
      <div className="w-full flex flex-col h-full min-w-0 relative">
        <div className="flex-1 overflow-y-auto pb-4 no-scrollbar">
          {/* Welcome message */}
          <div className="text-center mb-8 mt-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Xin chào! Tôi có thể giúp gì cho bạn?
            </h1>
            {/* <p className="text-gray-600">
                            Hỏi tôi bất kỳ điều gì về Học viện Kỹ thuật Quân sự
                        </p> */}
          </div>

          {/* Show FAQ questions if topic is selected */}
          {selectedTopic && faqQuestions.length > 0 ? (
            <div className="w-full max-w-4xl mx-auto mb-8 px-4 md:px-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">
                  Câu hỏi gợi ý về {selectedTopic.name}
                </h3>
                <Button
                  type="link"
                  className="text-primary"
                  onClick={() => {
                    setSelectedTopic(null)
                    setFaqQuestions([])
                  }}
                >
                  ← Quay lại
                </Button>
              </div>
              <div className="space-y-2">
                {faqQuestions.map((question, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 py-2 px-3 rounded ${
                      loading || isProcessingRef.current
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      !loading && !isProcessingRef.current && handleFaqQuestionClick(question)
                    }
                  >
                    <span className="text-primary font-medium">{index + 1}.</span>
                    <p className="text-sm text-primary font-medium m-0 flex-1">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Suggested topics */
            pinnedTopics.length > 0 && (
              <div className="w-full max-w-5xl mx-auto mb-8 px-4 md:px-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">
                  Chủ đề thường gặp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pinnedTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className={`transition-all duration-200 border-0 ${
                        loading || isProcessingRef.current
                          ? "cursor-not-allowed opacity-50 pointer-events-none"
                          : "cursor-pointer hover:shadow-md"
                      }`}
                      style={{
                        backgroundColor: "#D9EDE4",
                      }}
                      onClick={() =>
                        !loading && !isProcessingRef.current && handleTopicClick(topic)
                      }
                      styles={{ body: { padding: "12px 16px" } }}
                    >
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-primary m-0 flex-1">{topic.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div className="relative">
          <ChatInput
            input={input}
            loading={loading || sessionLoading}
            onInputChange={setInput}
            onSend={handleSend}
            selectedDocumentIds={selectedDocumentIds}
            onDocumentIdsChange={setSelectedDocumentIds}
          />
        </div>
      </div>
    </div>
  )
}

TroLyAo.getLayout = function getLayout(page: React.ReactElement) {
  return <ChatLayout>{page}</ChatLayout>
}
