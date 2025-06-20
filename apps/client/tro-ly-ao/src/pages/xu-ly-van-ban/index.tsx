import { fetchXuLyVanBan } from '@/api/xu-ly-van-ban'
import { readStreamToText } from '@/utils'
import { CopyOutlined, FileSyncOutlined, StopOutlined } from '@ant-design/icons'
import XuLyVanBanLayout from '@layouts/xu-ly-van-ban-layout'
import {
    Button,
    Col,
    Input,
    Row,
    Select,
    Space,
    Typography,
    message,
} from 'antd'
import type { ReactElement } from 'react'
import { useState } from 'react'

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
    const [abortController, setAbortController] =
        useState<AbortController | null>(null)

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

    const handleProcess = async () => {
        const controller = new AbortController()
        setAbortController(controller)
        try {
            setLoading(true)
            let result = ''
            if (mode === 'translate')
                result = await handleTranslate(controller.signal)
            else if (mode === 'summarize')
                result = await handleSummarize(controller.signal)
            else if (mode === 'extraction')
                result = await handleExtraction(controller.signal)
            else if (mode === 'fix')
                result = await handleFixSpelling(controller.signal)

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
    }

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

    return (
        <div style={{ padding: 20 }}>
            <Row justify="center" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={2} style={{ textAlign: 'center' }}>
                        Xử lý văn bản
                    </Title>
                    <Space>
                        <Select
                            value={mode}
                            onChange={(value: Mode) => setMode(value)}
                            style={{ width: 200 }}
                            size="large"
                            disabled={loading}
                        >
                            <Option value="translate">Dịch văn bản</Option>
                            <Option value="fix">Sửa lỗi chính tả</Option>
                            <Option value="summarize">Tóm lược</Option>
                            <Option value="extraction">Trích lược</Option>
                        </Select>
                        <Button
                            icon={<FileSyncOutlined />}
                            type="primary"
                            onClick={handleProcess}
                            loading={loading}
                            size="large"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Xử lý'}
                        </Button>
                        {loading && (
                            <Button
                                icon={<div className="w-3 h-3 bg-white" />}
                                type="primary"
                                shape="circle"
                                danger
                                size="large"
                                onClick={() => {
                                    abortController?.abort()
                                }}
                            />
                        )}
                    </Space>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <div className="relative group">
                        <TextArea
                            size="large"
                            rows={15}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Nhập văn bản tại đây"
                            disabled={loading}
                        />
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-white"
                            onClick={() => handleCopy(inputText)}
                            type="text"
                        />
                    </div>
                </Col>

                <Col span={12}>
                    <div className="relative group">
                        <TextArea
                            size="large"
                            rows={15}
                            value={outputText}
                            readOnly
                            placeholder="Kết quả sẽ hiển thị tại đây"
                        />
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-white"
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
    return <XuLyVanBanLayout>{page}</XuLyVanBanLayout>
}

export default Page
