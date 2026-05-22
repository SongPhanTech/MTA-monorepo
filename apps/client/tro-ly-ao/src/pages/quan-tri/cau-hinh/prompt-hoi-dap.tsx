import { EditOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DefaultLayout from "@layouts/default-layout"
import { useAbility } from "@workspace/permissions/hooks"
import { TRO_LY_AO_PERMISSION } from "@workspace/router"
import { Input, Tag, Tooltip } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { getPromptContent, useAiPromptList } from "@/api/ai-prompt"
import { PutPromptHoiDap } from "@/components/modal"
import type { PutPromptHoiDapInput } from "@/components/modal/put-prompt-hoi-dap"

const SYSTEM_PROMPTS = [
  { code: "rag", name: "Hỏi đáp dựa trên RAG" },
  { code: "no-rag", name: "Hỏi đáp thông thường" },
] as const

type PromptRecord = {
  id: string
  code: string
  name: string
  hasPrompt: boolean
  prompt?: string
  description?: string
}

function Page() {
  const { can } = useAbility()
  const [searchText, setSearchText] = useState("")

  const { onOpen: openPutPromptHoiDap } = useDisclosure<PutPromptHoiDapInput>({
    tag: "PutPromptHoiDapModal",
  })

  const { data: allPrompts = [], isLoading } = useAiPromptList()

  const tableData = useMemo<PromptRecord[]>(() => {
    return SYSTEM_PROMPTS.map((systemPrompt) => {
      const prompt = allPrompts.find((p) => p.code === systemPrompt.code)
      const content = prompt ? getPromptContent(prompt) : undefined
      return {
        id: systemPrompt.code,
        code: systemPrompt.code,
        name: systemPrompt.name,
        hasPrompt: !!content,
        prompt: content,
        description: (prompt?.description as string | undefined) ?? undefined,
      }
    })
  }, [allPrompts])

  const filteredPrompts = useMemo(() => {
    if (!searchText) return tableData
    return tableData.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText, tableData])

  const handleEdit = (record: PromptRecord) => {
    openPutPromptHoiDap({
      code: record.code,
      name: record.name,
    })
  }

  return (
    <div className="h-full">
      <div className="flex gap-4 h-full overflow-hidden">
        <div className="flex-1 overflow-auto pr-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-xl font-semibold text-gray-700">Prompt Hỏi đáp</span>
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
            dataSource={filteredPrompts}
            scroll={{ x: 800 }}
            pagination={false}
            columns={[
              {
                title: "STT",
                dataIndex: "index",
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Loại Prompt",
                dataIndex: "name",
                width: 250,
                fixed: "left",
                render: (name: string) => <span className="text-sm">{name}</span>,
              },
              {
                title: "Mô tả",
                dataIndex: "description",
                width: 400,
                render: (value: string) => (
                  <span className="text-sm">
                    {value?.length > 80 ? `${value.slice(0, 80)}...` : value || "Chưa có mô tả"}
                  </span>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "hasPrompt",
                width: 130,
                align: "center",
                render: (hasPrompt: boolean) => {
                  return (
                    <Tag
                      style={{
                        backgroundColor: hasPrompt ? "#f6ffed" : "#fff2f0",
                        color: hasPrompt ? "#52c41a" : "#ff4d4f",
                        border: hasPrompt ? "1px solid #b7eb8f" : "1px solid #ffb3b3",
                      }}
                      className="px-3 py-1 text-sm rounded-md"
                    >
                      {hasPrompt ? "Đã thiết lập" : "Chưa thiết lập"}
                    </Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                key: "action",
                align: "center",
                width: 80,
                fixed: "right",
                render: (_, record: any) =>
                  can(TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMPT_HOI_DAP, "SUA") ? (
                    <Tooltip title="Chỉnh sửa" placement="top">
                      <EditOutlined
                        onClick={() => handleEdit(record)}
                        className="text-blue-700 cursor-pointer text-lg hover:text-blue-500"
                      />
                    </Tooltip>
                  ) : null,
              },
            ]}
            loading={isLoading}
          />
        </div>
      </div>
      <PutPromptHoiDap />
    </div>
  )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      permission={TRO_LY_AO_PERMISSION.TRO_LY_AO_QUAN_TRI_CAU_HINH_PROMPT_HOI_DAP}
      breadcrumbList={[{ title: "Quản trị" }, { title: "Cấu hình Prompt" }]}
    >
      {page}
    </DefaultLayout>
  )
}

export default Page
