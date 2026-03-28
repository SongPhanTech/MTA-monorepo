import { CloseOutlined, CopyOutlined, FileSyncOutlined, StopOutlined } from "@ant-design/icons"
import AutoResizeTextArea from "@components/commons/text-area-auto-resize"
import ChatLayout from "@layouts/chat-layout"
import { Button, message, Select } from "antd"
import type { ReactElement } from "react"
import { useCallback, useEffect, useState } from "react"
import { fetchXuLyVanBan } from "@/api/xu-ly-van-ban"
import { readStreamToText } from "@/utils"

const { Option } = Select

type Mode = "translate" | "summarize" | "extraction" | "fix"

const cleanOutputText = (text: string): string => {
  return text.replace(/^Kết quả (dịch|tóm tắt|sửa lỗi):\s*/i, "")
}

function Page() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [mode, setMode] = useState<Mode>("translate")
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  useEffect(() => {
    if (!inputText.trim() && outputText) {
      setOutputText("")
    }
  }, [inputText, outputText])

  const handleProcess = useCallback(async () => {
    if (!inputText.trim()) {
      message.warning("Vui lòng nhập nội dung cần xử lý")
      return
    }
    if (mode === "translate" && inputText.length >= 2000) {
      message.warning("Văn bản cần dịch không được vượt quá 1000 ký tự")
      return
    }

    const controller = new AbortController()
    setAbortController(controller)

    const handleTranslate = async (signal: AbortSignal) => {
      const response = await fetchXuLyVanBan({
        text: inputText,
        topic_type: "TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE",
        conversationId: "None",
        signal,
      } as any)
      if (!response?.body) throw new Error("Không có nội dung phản hồi")
      return cleanOutputText(await readStreamToText(response.body))
    }

    const handleSummarize = async (signal: AbortSignal) => {
      const response = await fetchXuLyVanBan({
        text: inputText,
        topic_type: "EXTRACTIVE_TEXT_SUMMARIZATION",
        conversationId: "None",
        signal,
      } as any)
      if (!response?.body) throw new Error("Không có nội dung phản hồi")
      return cleanOutputText(await readStreamToText(response.body))
    }

    const handleExtraction = async (signal: AbortSignal) => {
      const response = await fetchXuLyVanBan({
        text: inputText,
        topic_type: "ABSTRACTIVE_TEXT_SUMMARIZATION",
        conversationId: "None",
        signal,
      } as any)
      if (!response?.body) throw new Error("Không có nội dung phản hồi")
      return cleanOutputText(await readStreamToText(response.body))
    }

    const handleFixSpelling = async (signal: AbortSignal) => {
      const response = await fetchXuLyVanBan({
        text: inputText,
        topic_type: "DETECTION_AND_CORRECTION_OF_TEXT_ERRORS",
        conversationId: "None",
        signal,
      } as any)
      if (!response?.body) throw new Error("Không có nội dung phản hồi")
      return cleanOutputText(await readStreamToText(response.body))
    }

    try {
      setLoading(true)
      let result = ""
      if (mode === "translate") result = await handleTranslate(controller.signal)
      else if (mode === "summarize") result = await handleSummarize(controller.signal)
      else if (mode === "extraction") result = await handleExtraction(controller.signal)
      else if (mode === "fix") result = await handleFixSpelling(controller.signal)

      setOutputText(result)
      message.success("Xử lý thành công")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        message.warning("Đã hủy xử lý văn bản")
      } else {
        console.error("Lỗi khi xử lý văn bản:", error)
        setOutputText("Có lỗi xảy ra trong quá trình xử lý văn bản")
        message.error("Xử lý thất bại")
      }
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }, [inputText, mode])

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("Đã sao chép nội dung!")
      })
      .catch((err) => {
        console.error("Lỗi khi sao chép:", err)
        message.error("Không thể sao chép vào clipboard")
      })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleProcess()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden text-gray-900">
      <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Select
                value={mode}
                onChange={(value: Mode) => setMode(value)}
                className="w-full sm:w-auto sm:min-w-[200px] [&_.ant-select-selector]:!border-gray-300"
                size="large"
                disabled={loading}
              >
                <Option value="translate">Dịch văn bản</Option>
                <Option value="fix">Sửa lỗi chính tả</Option>
                <Option value="summarize">Tóm lược</Option>
                <Option value="extraction">Trích lược</Option>
              </Select>
              <Button
                icon={loading ? <StopOutlined /> : <FileSyncOutlined />}
                type="primary"
                onClick={loading ? () => abortController?.abort() : handleProcess}
                loading={false}
                size="large"
                danger={loading}
                className="w-full sm:w-auto min-w-[120px] shadow-sm"
                style={{
                  backgroundColor: loading ? "#ff4d4f" : "#028850",
                  borderColor: loading ? "#ff4d4f" : "#028850",
                }}
              >
                {loading ? "Dừng lại" : "Xử lý"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-6 pb-4">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-700">Văn bản gốc</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 mr-3">
                    Số ký tự: {inputText.length}
                    {mode === "translate" && " / 2000"}
                  </span>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    type="text"
                    onClick={() => {
                      setInputText("")
                      setOutputText("")
                    }}
                    disabled={!inputText || loading}
                    className="text-red-500 hover:text-red-600"
                    title="Xóa văn bản"
                  />
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    type="text"
                    onClick={() => handleCopy(inputText)}
                    disabled={!inputText}
                    className="text-gray-500 hover:text-[#028850]"
                    title="Sao chép"
                  />
                </div>
              </div>
            </div>
            <div className="p-3 flex-1">
              <AutoResizeTextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập văn bản cần xử lý tại đây..."
                disabled={loading}
                minHeight={120}
                maxHeight={9999}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 output-panel flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-700">Kết quả xử lý</h3>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  type="text"
                  onClick={() => handleCopy(outputText)}
                  disabled={!outputText}
                  className="text-gray-500 hover:text-[#028850]"
                />
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center py-16 flex-1">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#028850] mb-4" />
                    <p className="text-sm text-gray-600">Đang xử lý văn bản...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <AutoResizeTextArea
                    value={outputText}
                    onChange={() => {}}
                    placeholder="Kết quả sẽ hiển thị tại đây sau khi xử lý"
                    readOnly
                    minHeight={120}
                    maxHeight={9999}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <ChatLayout showSiderChat={false}>{page}</ChatLayout>
}

export default Page
