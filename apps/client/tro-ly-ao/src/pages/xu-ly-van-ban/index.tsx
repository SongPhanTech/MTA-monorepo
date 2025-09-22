import { CopyOutlined, FileSyncOutlined, StopOutlined } from '@ant-design/icons'
import ChatLayout from '@layouts/chat-layout'
import { Button, Col, Input, message, Row, Select, Typography } from 'antd'
import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { fetchXuLyVanBan } from '@/api/xu-ly-van-ban'
import { readStreamToText } from '@/utils'

const { TextArea } = Input
const { Title } = Typography
const { Option } = Select

type Mode = 'translate' | 'summarize' | 'extraction' | 'fix'

const cleanOutputText = (text: string): string => {
    return text.replace(/^Kết quả (dịch|tóm tắt|sửa lỗi):\s*/i, '')
}

function Page() {
    const [inputText, setInputText] = useState('')
    const [outputText, setOutputText] = useState('')
    const [mode, setMode] = useState<Mode>('translate')
    const [loading, setLoading] = useState(false)
    const [abortController, setAbortController] = useState<AbortController | null>(null)

    const handleTranslate = async (signal: AbortSignal) => {
        const response = await fetchXuLyVanBan({
            text: inputText,
            doc_type: 'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE',
            conversationId: 'None',
            signal,
        })
        if (!response?.body) throw new Error('Không có nội dung phản hồi')
        return cleanOutputText(await readStreamToText(response.body))
    }

    const handleSummarize = async (signal: AbortSignal) => {
        const response = await fetchXuLyVanBan({
            text: inputText,
            doc_type: 'EXTRACTIVE_TEXT_SUMMARIZATION',
            conversationId: 'None',
            signal,
        })
        if (!response?.body) throw new Error('Không có nội dung phản hồi')
        return cleanOutputText(await readStreamToText(response.body))
    }

    const handleExtraction = async (signal: AbortSignal) => {
        const response = await fetchXuLyVanBan({
            text: inputText,
            doc_type: 'ABSTRACTIVE_TEXT_SUMMARIZATION',
            conversationId: 'None',
            signal,
        })
        if (!response?.body) throw new Error('Không có nội dung phản hồi')
        return cleanOutputText(await readStreamToText(response.body))
    }

    const handleFixSpelling = async (signal: AbortSignal) => {
        const response = await fetchXuLyVanBan({
            text: inputText,
            doc_type: 'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS',
            conversationId: 'None',
            signal,
        })
        if (!response?.body) throw new Error('Không có nội dung phản hồi')
        return cleanOutputText(await readStreamToText(response.body))
    }

    const handleProcess = useCallback(async () => {
        if (!inputText.trim()) {
            message.warning('Vui lòng nhập nội dung cần xử lý')
            return
        }

        const controller = new AbortController()
        setAbortController(controller)
        try {
            setLoading(true)
            let result = ''
            if (mode === 'translate') result = await handleTranslate(controller.signal)
            else if (mode === 'summarize') result = await handleSummarize(controller.signal)
            else if (mode === 'extraction') result = await handleExtraction(controller.signal)
            else if (mode === 'fix') result = await handleFixSpelling(controller.signal)

            setOutputText(result)
            message.success('Xử lý thành công')
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                message.warning('Đã hủy xử lý văn bản')
            } else {
                console.error('Lỗi khi xử lý văn bản:', error)
                setOutputText('Có lỗi xảy ra trong quá trình xử lý văn bản')
                message.error('Xử lý thất bại')
            }
        } finally {
            setLoading(false)
            setAbortController(null)
        }
    }, [inputText, mode, handleExtraction, handleFixSpelling, handleSummarize, handleTranslate])

    const handleCopy = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                message.success('Đã sao chép nội dung!')
            })
            .catch((err) => {
                console.error('Lỗi khi sao chép:', err)
                message.error('Không thể sao chép vào clipboard')
            })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleProcess()
        }
    }

    return (
        <div className="h-full flex flex-col overflow-auto p-4 sm:p-6 lg:p-8 max-h-screen">
            <Row justify="center" className="mb-4 sm:mb-6">
                <Col xs={24} sm={20} md={16} lg={12} xl={10}>
                    <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
                        <Select
                            value={mode}
                            onChange={(value: Mode) => setMode(value)}
                            className="flex-1 sm:w-auto sm:min-w-48 max-w-xs"
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
                            className="flex-shrink-0"
                        >
                            {loading ? '' : 'Xử lý'}
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row gutter={[16, 12]} className="flex-1 lg:h-full">
                <Col xs={24} lg={12}>
                    <div className="relative group h-full">
                        <div className="text-sm font-medium text-gray-600 mb-2">Văn bản gốc</div>
                        <TextArea
                            size="large"
                            rows={6}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập văn bản tại đây (Ctrl+Enter để xử lý)"
                            disabled={loading}
                            className="resize-none lg:!h-80 pr-12"
                        />
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-200 bg-primary text-white shadow-md z-10"
                            onClick={() => handleCopy(inputText)}
                            type="text"
                        />
                    </div>
                </Col>

                <Col xs={24} lg={12}>
                    <div className="relative group h-full">
                        <div className="text-sm font-medium text-gray-600 mb-2">Kết quả xử lý</div>
                        <TextArea
                            size="large"
                            rows={6}
                            value={outputText}
                            readOnly
                            placeholder="Kết quả sẽ hiển thị tại đây"
                            onKeyDown={handleKeyDown}
                            className="resize-none lg:!h-80 pr-12"
                        />
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-200 bg-primary text-white shadow-md z-10"
                            onClick={() => handleCopy(outputText)}
                            type="text"
                        />
                    </div>
                </Col>
            </Row>
        </div>
    )
}

Page.getLayout = function getLayout(page: ReactElement) {
    return <ChatLayout showSiderChat={false}>{page}</ChatLayout>
}

export default Page
