import { EditOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DefaultLayout from '@layouts/default-layout'
import { useFindManyPrompt } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { TRO_LY_AO_PERMISSION } from '@workspace/router'
import { Input, Tag, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { PutPromptChucNang } from '@/components/modal'
import type { PutPromptChucNangInput } from '@/components/modal/put-prompt-chuc-nang'

const SYSTEM_PROMPTS = [
    {
        type: 'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE',
        name: 'Dịch từ các ngôn ngữ khác sang tiếng Việt',
    },
    {
        type: 'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS',
        name: 'Phát hiện và sửa lỗi văn bản',
    },
    {
        type: 'EXTRACTIVE_TEXT_SUMMARIZATION',
        name: 'Tóm tắt văn bản trích xuất',
    },
    {
        type: 'ABSTRACTIVE_TEXT_SUMMARIZATION',
        name: 'Tóm tắt văn bản trừu tượng',
    },
] as const

type PromptRecord = {
    id: string
    topicType: string
    topicName: string
    topicId?: string
    hasPrompt: boolean
    prompt?: string
    description?: string
}

function Page() {
    const { can } = useAbility()
    const [searchText, setSearchText] = useState('')
    const [tableParams, setTableParams] = useState({
        pagination: { current: 1, pageSize: 10, total: 4 },
    })

    const { onOpen: openPutPromptModal } = useDisclosure<PutPromptChucNangInput>({
        tag: 'PutPromptChucNangModal',
    })

    const { data: allPrompts = [] } = useFindManyPrompt({
        where: {
            code: {
                in: SYSTEM_PROMPTS.map((p) => p.type),
            },
        },
    })

    const tableData = useMemo<PromptRecord[]>(() => {
        return SYSTEM_PROMPTS.map((systemPrompt) => {
            const prompt = allPrompts.find((p) => (p as any).code === systemPrompt.type)

            return {
                id: systemPrompt.type,
                topicType: systemPrompt.type,
                topicName: systemPrompt.name,
                topicId: undefined,
                hasPrompt: !!prompt,
                prompt: prompt?.prompt ?? undefined,
                description: (prompt as any)?.description ?? undefined,
            }
        })
    }, [allPrompts])

    const filteredTableData = useMemo(() => {
        if (!searchText) return tableData
        return tableData.filter(
            (item) =>
                item.topicName?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase())
        )
    }, [tableData, searchText])

    const handleEdit = (record: PromptRecord) => {
        openPutPromptModal({
            topicId: undefined,
            topicType: record.topicType,
            topicName: record.topicName,
        })
    }

    return (
        <div className="h-full">
            <PutPromptChucNang />
            <div className="flex gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-semibold text-gray-700">
                            Prompt Chức năng
                        </span>
                    </div>

                    <div className="mb-4">
                        <Input
                            placeholder="Tìm kiếm theo tên chức năng hoặc mô tả..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 400 }}
                            allowClear
                        />
                    </div>

                    <Table
                        rowKey="id"
                        dataSource={filteredTableData}
                        scroll={{ x: 900 }}
                        pagination={{
                            ...tableParams.pagination,
                            onChange: (page, pageSize) => {
                                setTableParams({
                                    pagination: {
                                        ...tableParams.pagination,
                                        current: page,
                                        pageSize,
                                    },
                                })
                            },
                        }}
                        columns={[
                            {
                                title: 'STT',
                                dataIndex: 'index',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Tên chức năng',
                                dataIndex: 'topicName',
                                width: 350,
                                fixed: 'left',
                                render: (value) => (
                                    <span className="text-gray-900 text-sm">{value}</span>
                                ),
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                width: 400,
                                render: (value) => (
                                    <span className="text-sm">{value || 'Chưa có mô tả'}</span>
                                ),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'hasPrompt',
                                width: 130,
                                align: 'center',
                                render: (hasPrompt: boolean) => (
                                    <Tag
                                        style={{
                                            backgroundColor: hasPrompt ? '#f6ffed' : '#fff2f0',
                                            color: hasPrompt ? '#52c41a' : '#ff4d4f',
                                            border: hasPrompt
                                                ? '1px solid #b7eb8f'
                                                : '1px solid #ffb3b3',
                                        }}
                                        className="px-3 py-1 text-sm rounded-md"
                                    >
                                        {hasPrompt ? 'Đã thiết lập' : 'Chưa thiết lập'}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Thao tác',
                                key: 'action',
                                width: 80,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => (
                                    can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMPT_CHUC_NANG, 'SUA') ? (
                                        <Tooltip title="Chỉnh sửa" placement="top">
                                            <EditOutlined
                                                className="text-blue-700 cursor-pointer text-lg hover:text-blue-500"
                                                onClick={() => handleEdit(record)}
                                            />
                                        </Tooltip>
                                    ) : null
                                ),
                            },
                        ]}
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
