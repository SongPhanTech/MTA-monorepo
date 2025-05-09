import ChatInput from '@components/commons/input-chat-bot'
import TimKiemVanBanLayout from '@layouts/tim-kiem-van-ban-layout'
import { Typography, Input, Spin, List, Empty } from 'antd'
import type React from 'react'
import { useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { TimKiemTheoTuKhoa } from '@/api/tim-kiem-van-ban'
const { Title } = Typography

export default function Page() {
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [results, setResults] = useState<[]>([])

    const handleSearch = async () => {
        if (!input.trim()) return
        setLoading(true)
        try {
            const response = await TimKiemTheoTuKhoa(input)
            setResults(response?.success_detail)
        } catch (error) {
            console.error('Lỗi khi tìm kiếm:', error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 20,
            }}
        >
            <Title level={2}>Tìm kiếm văn bản</Title>
            <Input.Search
                placeholder="Nhập từ khóa cần tìm..."
                enterButton={<SearchOutlined />}
                size="large"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 600, width: '100%', marginBottom: 30 }}
                loading={loading}
            />
            {loading ? (
                <Spin />
            ) : results.length > 0 ? (
                <List
                    bordered
                    dataSource={results}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                    style={{ width: '100%', maxWidth: 600 }}
                />
            ) : (
                <Empty description="Không có kết quả" />
            )}
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <TimKiemVanBanLayout>{page}</TimKiemVanBanLayout>
}
