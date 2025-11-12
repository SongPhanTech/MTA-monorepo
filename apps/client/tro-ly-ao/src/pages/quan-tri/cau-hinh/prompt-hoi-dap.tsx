import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DefaultLayout from '@layouts/default-layout'
import { Tag, Tooltip, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useFindManyPrompt } from '@/../../../../packages/database/generated/hooks/prompt'
import { useState } from 'react'

type PromptType = {
    id: string
    code: string
    prompt: string
    active: boolean
    description: string
    status: string
    reason: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

type PromptFormType = { prompt: string }

function Page() {
    const [searchText, setSearchText] = useState('')

    const { onOpen: openPutPromptHoiDap } = useDisclosure<any>({
        tag: 'PutPromptHoiDap',
    })

    const { data: prompts, isLoading } = useFindManyPrompt({
        where: {
            code: { in: ['rag', 'no-rag'] },
        },
        orderBy: { createdAt: 'desc' },
    })

    const filteredPrompts =
        prompts?.filter(
            (prompt) =>
                prompt.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                prompt.prompt?.toLowerCase().includes(searchText.toLowerCase())
        ) || []

    const handleEdit = (record: PromptType) => {
        openPutPromptHoiDap(record)
    }

    return (
        <div className="h-full">
            <div className="flex gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-semibold text-gray-700">
                                Prompt Hỏi đáp
                            </span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <Input
                            placeholder="Tìm kiếm theo mô tả hoặc nội dung..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 400 }}
                            allowClear
                        />
                    </div>
                    <Table
                        rowKey="id"
                        scroll={{ x: 800 }}
                        columns={[
                            {
                                title: 'STT',
                                dataIndex: 'index',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Loại Prompt',
                                dataIndex: 'code',
                                width: 200,
                                align: 'center',
                                fixed: 'right',
                                render: (code: string) => {
                                    const tagMap = {
                                        'no-rag': {
                                            label: 'Hỏi đáp thông thường',
                                            color: '#1890ff',
                                        },
                                        rag: { label: 'Hỏi đáp dựa trên RAG', color: '#52c41a' },
                                    }
                                    const tag = tagMap[code as keyof typeof tagMap] || {
                                        label: code,
                                        color: '#666',
                                    }
                                    return (
                                        <Tag
                                            style={{
                                                backgroundColor: `${tag.color}15`,
                                                color: tag.color,
                                                border: `1px solid ${tag.color}30`,
                                            }}
                                            className="px-3 py-1 text-sm rounded-md"
                                        >
                                            {tag.label}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                width: 300,
                                render: (value: string) =>
                                    value?.length > 80
                                        ? `${value.slice(0, 80)}...`
                                        : value || 'Chưa có mô tả',
                            },
                            {
                                title: 'Nội dung Prompt',
                                dataIndex: 'prompt',
                                width: 400,
                                render: (value: string) =>
                                    value?.length > 100
                                        ? `${value.slice(0, 100)}...`
                                        : value || 'Chưa có nội dung',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                width: 160,
                                align: 'center',
                                render: (active: boolean) => (
                                    <Tag
                                        style={{
                                            backgroundColor: active ? '#f6ffed' : '#fff2f0',
                                            color: active ? '#52c41a' : '#ff4d4f',
                                            border: active
                                                ? '1px solid #b7eb8f'
                                                : '1px solid #ffb3b3',
                                        }}
                                        className="px-3 py-1 text-sm rounded-md"
                                    >
                                        {active ? 'Đang hoạt động' : 'Không hoạt động'}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                width: 100,
                                align: 'center',
                                render: (date: string) =>
                                    date ? new Date(date).toLocaleDateString('vi-VN') : '-',
                            },
                            {
                                title: 'Thao tác',
                                key: 'action',
                                align: 'center',
                                width: 80,
                                fixed: 'right',
                                render: (_, record: any) => (
                                    <Tooltip title="Chỉnh sửa" placement="top">
                                        <EditOutlined
                                            onClick={() => handleEdit(record)}
                                            className="text-blue-700 cursor-pointer text-lg hover:text-blue-500"
                                        />
                                    </Tooltip>
                                ),
                            },
                        ]}
                        data={filteredPrompts}
                        loading={isLoading}
                        pagination={false}
                    />
                </div>
            </div>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout breadcrumbList={[{ title: 'Quản trị' }, { title: 'Cấu hình Prompt' }]}>
            {page}
        </DefaultLayout>
    )
}

export default Page
