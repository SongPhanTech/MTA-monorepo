import { useState } from 'react'
import type { ReactElement } from 'react'
import { Row, Col, Select, Input, Button, Typography, Space } from 'antd'
import XuLyVanBanLayout from '@layouts/xu-ly-van-ban-layout'
import { FileSyncOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Title } = Typography
const { Option } = Select

type Mode = 'translate' | 'summarize' | 'fix'

function Page() {
    const [inputText, setInputText] = useState('')
    const [outputText, setOutputText] = useState('')
    const [mode, setMode] = useState<Mode>('translate')

    const handleProcess = async () => {
        console.log('231')
    }

    return (
        <div style={{ padding: 20 }}>
            <Row justify="center" style={{ marginBottom: 16 }}>
                <Col>
                    <Title
                        level={2}
                        style={{ marginBottom: 16, textAlign: 'center' }}
                    >
                        Xử lý văn bản
                    </Title>
                    <Space>
                        <Select
                            value={mode}
                            onChange={(value) => setMode(value)}
                            style={{ width: 200 }}
                            size="large"
                        >
                            <Option value="translate">Dịch văn bản</Option>
                            <Option value="summarize">Tóm tắt văn bản</Option>
                            <Option value="fix">Sửa lỗi chính tả</Option>
                        </Select>
                        <Button
                            icon={<FileSyncOutlined />}
                            type="primary"
                            onClick={handleProcess}
                            size="large"
                        >
                            Xử lý
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <TextArea
                        size="large"
                        rows={15}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Nhập văn bản tại đây"
                    />
                </Col>
                <Col span={12}>
                    <TextArea
                        size="large"
                        rows={15}
                        value={outputText}
                        readOnly
                        placeholder="Kết quả sẽ hiển thị tại đây"
                    />
                </Col>
            </Row>
        </div>
    )
}

// dùng layout tổng thể như bình thường
Page.getLayout = function getLayout(page: ReactElement) {
    return <XuLyVanBanLayout>{page}</XuLyVanBanLayout>
}

export default Page
