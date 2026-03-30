import { EyeOutlined } from "@ant-design/icons"
import { useFindManyDocument, useFindManyDocumentClassification } from "@workspace/db/hooks"
import { Button, Input, Modal, Select, Table, Tag, Tooltip } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useTopics } from "@/hooks/useTopics"
import DocumentSidebar from "../commons/document-sidebar"
import { FileUploadIcon } from "../commons/upload"

interface Document {
  id: string
  title?: string | null
  fileType?: string | null
  classificationId?: string | null
  classification?: {
    id: string
    name: string
  } | null
  topics?: {
    topic: {
      id: string
      name: string
    }
  }[]
}

interface ChonTaiLieuInput {
  ids: string[]
  callback: (ids: string[]) => void
}

const ChonTaiLieu = () => {
  const { isOpen, onClose, input } = useDisclosure<ChonTaiLieuInput>({
    tag: "ChonTaiLieu",
  })

  const selectedDocumentIds = input?.ids || []
  const callback = input?.callback

  const [searchText, setSearchText] = useState("")
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedDocumentIds)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined)
  const [classificationFilter, setClassificationFilter] = useState<string | undefined>(undefined)

  const { selectableTopicOptions } = useTopics()
  const { data: classifications = [] } = useFindManyDocumentClassification({})

  const buildWhereClause = () => {
    const where: any = {
      status: "APPROVE",
      active: true,
    }

    if (searchText.trim()) {
      where.title = {
        contains: searchText,
        mode: "insensitive",
      }
    }

    if (topicFilter) {
      where.topics = {
        some: {
          topicId: topicFilter,
        },
      }
    }

    if (classificationFilter) {
      where.classificationId = classificationFilter
    }

    return where
  }

  const { data: documents = [], isLoading } = useFindManyDocument(
    {
      where: buildWhereClause(),
      include: {
        classification: true,
        topics: {
          include: {
            topic: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: isOpen,
    }
  )

  const columns: ColumnsType<Document> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <div className="flex items-center gap-2">
          <FileUploadIcon fileType={record.fileType} className="w-[24px] h-[24px]" />
          <span className="font-medium">{title || "Không có tiêu đề"}</span>
        </div>
      ),
    },
    {
      title: "Loại tài liệu",
      dataIndex: "topics",
      key: "topics",
      width: 200,
      render: (topics: Document["topics"]) => {
        if (!topics || topics.length === 0) {
          return <span className="text-gray-400">Chưa phân loại</span>
        }
        const maxDisplay = 1
        const displayTopics = topics.slice(0, maxDisplay)
        const remaining = topics.length - maxDisplay

        return (
          <div className="flex flex-wrap gap-1">
            {displayTopics.map((t, idx) => (
              <Tag key={idx} color="blue">
                {t.topic.name}
              </Tag>
            ))}
            {remaining > 0 && <Tag color="default">+{remaining}</Tag>}
          </div>
        )
      },
    },
    {
      title: "Phân loại",
      dataIndex: "classification",
      key: "classification",
      width: 150,
      render: (classification: Document["classification"]) =>
        classification ? (
          <Tag color="purple">{classification.name}</Tag>
        ) : (
          <span className="text-gray-400">Không có</span>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Xem tài liệu" placement="left">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDocumentId(record.id)
            }}
            className="text-blue-600 hover:text-blue-700 text-lg"
          />
        </Tooltip>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys: tempSelectedIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setTempSelectedIds(selectedRowKeys as string[])
    },
  }

  const handleOk = () => {
    callback?.(tempSelectedIds)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedIds(selectedDocumentIds)
    setSearchText("")
    setTopicFilter(undefined)
    setClassificationFilter(undefined)
    onClose()
  }

  // Reset temp selection when modal opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useMemo(() => {
    if (isOpen) {
      setTempSelectedIds(selectedDocumentIds)
    }
  }, [isOpen])

  return (
    <Modal
      title={"Chọn tài liệu tham khảo"}
      open={isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      width={900}
      okText="Xác nhận"
      cancelText="Hủy"
      styles={{ body: { padding: "16px" } }}
    >
      <div className="mb-4 space-y-2">
        <Input
          placeholder="Tìm theo tên tài liệu"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            placeholder="Loại tài liệu"
            allowClear
            className="flex-1 min-w-[150px]"
            value={topicFilter}
            onChange={(value) => setTopicFilter(value)}
            options={selectableTopicOptions.map((topic) => ({
              label: topic.name,
              value: topic.id,
            }))}
          />
          <Select
            placeholder="Phân loại"
            allowClear
            className="flex-1 min-w-[150px]"
            value={classificationFilter}
            onChange={(value) => setClassificationFilter(value)}
            options={classifications.map((classification) => ({
              label: classification.name,
              value: classification.id,
            }))}
          />
        </div>
      </div>

      <div className="mb-2">
        <span className="text-sm text-gray-600">
          Đã chọn: <strong>{tempSelectedIds.length}</strong> tài liệu
        </span>
      </div>

      <Table
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
        }}
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} tài liệu`,
        }}
        scroll={{ x: 800, y: 400 }}
        onRow={(record) => ({
          onClick: () => {
            const isSelected = tempSelectedIds.includes(record.id)
            if (isSelected) {
              setTempSelectedIds(tempSelectedIds.filter((id) => id !== record.id))
            } else {
              setTempSelectedIds([...tempSelectedIds, record.id])
            }
          },
          style: { cursor: "pointer" },
        })}
      />

      <DocumentSidebar
        documentId={selectedDocumentId}
        citationContent={null}
        onClose={() => setSelectedDocumentId(null)}
      />
    </Modal>
  )
}

export default ChonTaiLieu
