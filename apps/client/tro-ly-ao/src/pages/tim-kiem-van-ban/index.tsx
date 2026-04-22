import DocumentSidebar from "@components/commons/document-sidebar"
import { FileUploadIcon } from "@components/commons/upload"
import ChatLayout from "@layouts/chat-layout"
import { formatDateReadable, formatNiceBytes } from "@lib/utils"
import { $Enums } from "@workspace/db"
import { useFindManyDocument } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Divider, Empty, Input, Modal, message, Radio, Spin, Tag, Typography } from "antd"
import { FileDown } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { TimKiemTheoNguNghia, TimKiemTheoTuKhoa } from "@/api/tim-kiem-van-ban"

const { Title } = Typography

type SearchType = "semantic" | "keyword"

const extractSearchResultIds = (response: unknown): string[] => {
  if (!response || typeof response !== "object") {
    return []
  }

  const payload = response as {
    document_ids?: unknown
    results?: unknown
    success_detail?: unknown
  }

  if (Array.isArray(payload.document_ids)) {
    return payload.document_ids.filter((id): id is string => typeof id === "string")
  }

  if (Array.isArray(payload.results)) {
    return payload.results.filter((id): id is string => typeof id === "string")
  }

  if (Array.isArray(payload.success_detail)) {
    return payload.success_detail.filter((id): id is string => typeof id === "string")
  }

  return []
}

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<SearchType>("semantic")

  // Clear results
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    if (!value.trim()) {
      setResults([])
    }
  }

  // Clear results
  const handleSearchTypeChange = (value: SearchType) => {
    setSearchType(value)
    setResults([])
  }

  const { data: documentsData = [], isLoading: isLoadingDocuments } = useFindManyDocument(
    {
      include: {
        uploadedBy: true,
        topics: {
          include: {
            topic: true,
          },
        },
        classification: true,
      },
      where: {
        status: $Enums.DocumentStatus.APPROVE,
        id: {
          in: results,
        },
      },
    },
    {
      enabled: results.length > 0,
    }
  )

  const documents = results
    .map((id) => documentsData.find((doc) => doc.id === id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))

  const [selectedDocument, setSelectedDocument] = useState<(typeof documents)[0] | undefined>()
  const onDownload = async (url: string, fileName: string) => {
    const buildFallbackUrl = (raw: string): string | null => {
      try {
        const u = new URL(raw)
        if (u.hostname !== "minio.mta.swantech.vn") return null
        u.protocol = "https:"
        u.hostname = "minio.swantech.vn"
        u.port = ""
        return u.toString()
      } catch {
        return null
      }
    }
    const fallbackUrl = buildFallbackUrl(url)
    const primaryUrl = fallbackUrl ?? url
    const secondaryUrl = fallbackUrl ? url : null
    let response: Response | null = null
    try {
      response = await fetch(primaryUrl)
    } catch {
      // network error → thử URL còn lại
    }
    if ((!response || !response.ok) && secondaryUrl) {
      try {
        response = await fetch(secondaryUrl)
      } catch {
        response = null
      }
    }
    if (!response || !response.ok) return message.error("Lỗi khi tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  const handleSearch = async () => {
    if (!input.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response =
        searchType === "semantic"
          ? await TimKiemTheoNguNghia(input)
          : await TimKiemTheoTuKhoa(input)

      setResults(extractSearchResultIds(response))
    } catch (_error: unknown) {
      message.warning("Không tìm thấy kết quả nào")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3">
              <Radio.Group
                value={searchType}
                onChange={(e) => handleSearchTypeChange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button
                  value="semantic"
                  className="[&.ant-radio-button-wrapper-checked]:!bg-[#028850] [&.ant-radio-button-wrapper-checked]:!border-[#028850]"
                >
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Ngữ nghĩa
                  </span>
                </Radio.Button>
                <Radio.Button
                  value="keyword"
                  className="[&.ant-radio-button-wrapper-checked]:!bg-[#028850] [&.ant-radio-button-wrapper-checked]:!border-[#028850]"
                >
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                    Từ khoá
                  </span>
                </Radio.Button>
              </Radio.Group>
            </div>
            <Input.Search
              placeholder={
                searchType === "semantic"
                  ? "Nhập nội dung cần tìm kiếm..."
                  : "Nhập từ khoá để tìm kiếm..."
              }
              size="large"
              value={input}
              onChange={handleInputChange}
              onSearch={handleSearch}
              loading={loading}
              allowClear
              style={
                {
                  "--ant-color-primary": "#028850",
                } as any
              }
              className="[&_.ant-input-search-button]:!bg-[#028850] [&_.ant-input-search-button]:!border-[#028850] [&_.ant-input-search-button_.anticon]:!text-white shadow-sm"
            />
          </div>
          {results.length > 0 && (
            <div className="text-center mt-4 py-2 bg-[#028850]/5 rounded-lg">
              <span className="text-sm font-medium text-[#028850]">
                Tìm thấy <span className="font-bold">{documents.length}</span> tài liệu cho "{input}
                "
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {loading || isLoadingDocuments ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Đang tìm kiếm tài liệu..." />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {documents.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-lg border border-gray-200 hover:border-[#028850] hover:bg-[#D9EDE4] hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDocumentId(item.id)
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <FileUploadIcon
                          className="w-12 h-12 sm:w-14 sm:h-14"
                          fileType={item.fileType}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {item.title || "Không có tiêu đề"}
                        </h3>
                        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                          {item.topics && item.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.topics.slice(0, 1).map((dt) => (
                                <Tag key={dt.id} color="#028850" className="border-0 m-0">
                                  {dt.topic?.name}
                                </Tag>
                              ))}
                              {item.topics.length > 1 && (
                                <Tag color="default" className="border-0 m-0">
                                  +{item.topics.length - 1}
                                </Tag>
                              )}
                            </div>
                          )}
                          {item.classification && (
                            <>
                              <span>•</span>
                              <Tag color="purple" className="border-0 m-0">
                                {item.classification.name}
                              </Tag>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-medium">{formatNiceBytes(item.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDateReadable(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : input.trim() ? (
              <div className="flex justify-center items-center h-64">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không tìm thấy tài liệu phù hợp"
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nhập từ khoá để tìm kiếm tài liệu"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedDocument}
        onCancel={() => setSelectedDocument(undefined)}
        footer={null}
        width={400}
        centered
        destroyOnClose
      >
        {selectedDocument && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4">
              <FileUploadIcon className="w-[80px] h-[80px]" fileType={selectedDocument.fileType} />
              <span className="font-semibold text-base text-center">{selectedDocument.title}</span>
            </div>
            <Divider style={{ margin: "2px 0" }} />
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Loại tài liệu</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedDocument.topics && selectedDocument.topics.length > 0 ? (
                    selectedDocument.topics.map((dt) => (
                      <Tag key={dt.id} color="blue">
                        {dt.topic?.name}
                      </Tag>
                    ))
                  ) : (
                    <span className="text-gray-400">Chưa phân loại</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Phân loại</p>
                {selectedDocument.classification ? (
                  <Tag color="purple" className="mt-1">
                    {selectedDocument.classification.name}
                  </Tag>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-700">Kích thước</p>
                <p>{formatNiceBytes(selectedDocument.fileSize)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Người đăng</p>
                <p>{selectedDocument.uploadedBy.code || "Chưa xác định"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Ngày đăng</p>
                <p>{formatDateReadable(selectedDocument.createdAt)}</p>
              </div>
            </div>
            <Button
              className="w-full h-9 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#028850",
                borderColor: "#028850",
                color: "white",
              }}
              onClick={(e) => {
                e.stopPropagation()
                onDownload(
                  getMinioUrl(selectedDocument.uri),
                  selectedDocument.title || selectedDocument.id
                )
              }}
            >
              <FileDown />
              Tải xuống
            </Button>
          </div>
        )}
      </Modal>

      <DocumentSidebar
        documentId={selectedDocumentId}
        citationContent={null}
        onClose={() => setSelectedDocumentId(null)}
      />
    </div>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <ChatLayout showSiderChat={false}>{page}</ChatLayout>
}
