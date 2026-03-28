import { QuestionCircleOutlined, TagsOutlined } from "@ant-design/icons"
import ChatLayout from "@layouts/chat-layout"
import { useFindManyFAQ } from "@workspace/db/hooks"
import { Collapse, Empty, Input, message, Select, Spin, Tag, Typography } from "antd"
import type { ReactElement } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

const { Title, Text, Paragraph } = Typography
const { Search } = Input

interface FAQItem {
  id: string
  question: string | null
  answer: string | null
  topic?: {
    name: string
    type: string
  } | null
  status: "PENDING" | "APPROVE" | "DENY"
}

interface GroupedFAQ {
  topicName: string
  topicType: string | null
  faqs: FAQItem[]
}

function Page() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>("all")

  const {
    data: faqData,
    isLoading,
    error,
  } = useFindManyFAQ({
    where: {
      status: "APPROVE",
    },
    include: {
      topic: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  useEffect(() => {
    if (!faqData) return

    let filtered = faqData as FAQItem[]

    if (selectedTopic && selectedTopic !== "all") {
      filtered = filtered.filter((faq) => {
        const topicName = faq.topic?.name || "Chưa phân loại"
        return topicName === selectedTopic
      })
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((faq) => {
        const questionMatch = faq.question?.toLowerCase().includes(searchLower) || false
        const answerMatch = faq.answer?.toLowerCase().includes(searchLower) || false
        const topicMatch = faq.topic?.name?.toLowerCase().includes(searchLower) || false

        return questionMatch || answerMatch || topicMatch
      })
    }

    setFilteredFAQs(filtered)
  }, [faqData, searchTerm, selectedTopic])

  const groupedFAQs = useMemo(() => {
    const groups: { [key: string]: GroupedFAQ } = {}

    filteredFAQs.forEach((faq) => {
      const topicKey = faq.topic?.name || "Chưa phân loại"

      if (!groups[topicKey]) {
        groups[topicKey] = {
          topicName: topicKey,
          topicType: faq.topic?.type || null,
          faqs: [],
        }
      }

      groups[topicKey].faqs.push(faq)
    })

    return Object.values(groups).sort((a, b) => {
      if (a.topicName === "Chưa phân loại") return 1
      if (b.topicName === "Chưa phân loại") return -1
      return a.topicName.localeCompare(b.topicName)
    })
  }, [filteredFAQs])

  const allTopics = useMemo(() => {
    if (!faqData) return []

    const topics = new Set<string>()
    faqData.forEach((faq: FAQItem) => {
      const topicName = faq.topic?.name || "Chưa phân loại"
      topics.add(topicName)
    })

    const sortedTopics = Array.from(topics).sort((a, b) => {
      if (a === "Chưa phân loại") return 1
      if (b === "Chưa phân loại") return -1
      return a.localeCompare(b)
    })

    return [
      { name: "Tất cả", key: "all" },
      ...sortedTopics.map((topic) => ({ name: topic, key: topic })),
    ]
  }, [faqData])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  if (error) {
    message.error("Không thể tải dữ liệu FAQ")
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Search
                placeholder="Nhập từ khoá cần tìm..."
                size="large"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                style={
                  {
                    "--ant-color-primary": "#028850",
                  } as any
                }
                className="[&_.ant-input-search-button]:!bg-[#028850] [&_.ant-input-search-button]:!border-[#028850] [&_.ant-input-search-button_.anticon]:!text-white"
              />
            </div>
            <div className="sm:w-64">
              <Select
                size="large"
                placeholder="Tất cả chủ đề"
                value={selectedTopic === "all" ? undefined : selectedTopic}
                onChange={(value) => setSelectedTopic(value || "all")}
                className="w-full"
                allowClear
              >
                {allTopics
                  .filter((topic) => topic.key !== "all")
                  .map((topic) => {
                    return (
                      <Select.Option key={topic.key} value={topic.key}>
                        {topic.name}
                      </Select.Option>
                    )
                  })}
              </Select>
            </div>
          </div>
          {searchTerm || selectedTopic !== "all" ? (
            <Text type="secondary" className="block mt-3 text-sm">
              {searchTerm && selectedTopic !== "all"
                ? `Tìm thấy ${filteredFAQs.length} câu hỏi trong chủ đề "${selectedTopic}" cho "${searchTerm}"`
                : searchTerm
                  ? `Tìm thấy ${filteredFAQs.length} câu hỏi cho "${searchTerm}"`
                  : `Hiển thị ${filteredFAQs.length} câu hỏi trong chủ đề "${selectedTopic}"`}
            </Text>
          ) : (
            <Text type="secondary" className="block mt-3 text-sm">
              Hiển thị {filteredFAQs.length} câu hỏi trong {groupedFAQs.length} chủ đề
            </Text>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Đang tải câu hỏi thường gặp..." />
              </div>
            ) : filteredFAQs.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchTerm.trim()
                      ? "Không tìm thấy câu hỏi phù hợp"
                      : "Chưa có câu hỏi thường gặp nào"
                  }
                />
              </div>
            ) : (
              <div>
                {groupedFAQs.map((group) => (
                  <div key={group.topicName} id={`topic-${group.topicName}`} className="mb-6">
                    {/* Topic Header */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border-l-4 border-[#028850]">
                      <TagsOutlined style={{ color: "#028850" }} />
                      <Title level={5} className="!mb-0" style={{ color: "#028850" }}>
                        {group.topicName}
                      </Title>
                      <Tag
                        style={{
                          backgroundColor: "#f6ffed",
                          borderColor: "#028850",
                          color: "#028850",
                          fontSize: "11px",
                        }}
                      >
                        {group.faqs.length} câu hỏi
                      </Tag>
                    </div>

                    <Collapse
                      className="space-y-2"
                      ghost
                      items={group.faqs.map((faq: FAQItem) => ({
                        key: faq.id,
                        label: (
                          <div className="flex items-start gap-2">
                            <QuestionCircleOutlined
                              className="text-base mt-1 flex-shrink-0"
                              style={{ color: "#028850" }}
                            />
                            <Text className="text-base font-semibold text-gray-900">
                              {faq.question || "Câu hỏi không có tiêu đề"}
                            </Text>
                          </div>
                        ),
                        children: (
                          <div className="ml-6 pl-3 border-l-2" style={{ borderColor: "#028850" }}>
                            <Paragraph
                              className="!mb-0 text-gray-700 leading-relaxed"
                              style={{ fontSize: "14px" }}
                            >
                              {faq.answer || "Chưa có câu trả lời cho câu hỏi này"}
                            </Paragraph>
                          </div>
                        ),
                        style: {
                          marginBottom: "8px",
                          backgroundColor: "#fff",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        },
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <ChatLayout showSiderChat={false}>{page}</ChatLayout>
}

export default Page
