import { PlusOutlined, UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { QUESTION_TYPE_LABELS } from "@constants/constants"
import type { ConfigExam, DocumentFile } from "@workspace/db/client"
import {
  useCreateDocumentFile,
  useDeleteDocumentFile,
  useFindManyKnowledgeBlock,
  useUpdateKnowledgeBlock,
} from "@workspace/db/hooks"
import { Button, Flex, message, Tooltip, Upload } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface TableChuongMucProps {
  matrixId?: string
}

const TableChuongMuc = ({ matrixId }: TableChuongMucProps) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  const { onOpen: onOpenPutCDR } = useDisclosure<{
    id?: string
    matrixId?: string
  }>({
    tag: "PutChuongMucModal",
  })

  const { onOpen: onOpenImportCDR } = useDisclosure<{
    matrixId?: string
  }>({
    tag: "ModalImportCDR",
  })

  const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock(
    {
      where: {
        examMatrixId: matrixId,
        deletedAt: null,
      },
      include: {
        configExams: true,
        documentFiles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: !!matrixId,
    }
  )

  const { mutateAsync: updateKnowledgeBlock } = useUpdateKnowledgeBlock()

  const handleDeleteKnowledgeBlock = async (id: string) => {
    try {
      await updateKnowledgeBlock({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      queryClient.invalidateQueries({
        queryKey: ["KnowledgeBlock"],
      })
      message.success("Xóa chuẩn đầu ra thành công")
    } catch (error) {
      message.error("Xóa chuẩn đầu ra thất bại")
    }
  }

  const getConfigByDifficult = (
    configExams: ConfigExam[],
    difficult: string
  ): { quantity: number; type?: string | null } => {
    const config = configExams?.find((c) => c.difficult === difficult)
    return {
      quantity: config?.quantity || 0,
      type: config?.type,
    }
  }

  const getTotals = (configExams: ConfigExam[]): { quantity: number } => {
    return (
      configExams?.reduce(
        (acc, config) => ({
          quantity: acc.quantity + (config.quantity || 0),
        }),
        { quantity: 0 }
      ) || { quantity: 0 }
    )
  }

  const { mutateAsync: createDocumentFile } = useCreateDocumentFile()

  const handleUpload = async (file: File, knowledgeBlockId: string) => {
    try {
      await createDocumentFile({
        data: {
          name: file.name,
          path: `/uploads/${Date.now()}-${file.name}`,
          size: BigInt(file.size),
          mimeType: file.type || undefined,
          knowledgeBlockId: knowledgeBlockId,
        },
      })

      queryClient.invalidateQueries({
        queryKey: ["KnowledgeBlock"],
      })

      message.success("Tải file  thành công")
    } catch (error) {
      console.error("Upload error:", error)
      message.error("Tải lên file thất bại")
    }

    return false // Prevent auto upload
  }

  const { mutateAsync: deleteDocumentFile } = useDeleteDocumentFile()

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocumentFile({
        where: {
          id: documentId,
        },
      })

      queryClient.invalidateQueries({
        queryKey: ["KnowledgeBlock"],
      })

      message.success("Xóa file thành công")
    } catch (error) {
      console.error("Delete document error:", error)
      message.error("Xóa file thất bại")
    }
  }

  const renderExpandedRow = (record: any) => {
    const documentFiles: DocumentFile[] = record.documentFiles || []

    return (
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <h4 className="font-semibold text-sm">Tài liệu đính kèm</h4>
          <Upload
            multiple
            beforeUpload={(file) => handleUpload(file, record.id)}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} size="small" type="primary">
              Tải lên
            </Button>
          </Upload>
        </div>

        {documentFiles.length > 0 && (
          <div className="space-y-2">
            {documentFiles.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 hover:border-gray-300"
              >
                <span className="text-sm">{doc.name}</span>
                <Flex gap={4}>
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDeleteDocument(doc.id),
                    }}
                  />
                </Flex>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCell = (quantity: number, type?: string | null) => (
    <div className="flex flex-col items-center gap-0.5">
      <Tooltip title="Số câu hỏi">
        <div className="text-sm font-medium">{quantity}</div>
      </Tooltip>
      {quantity > 0 && (
        <div className="text-xs text-gray-500 leading-tight">
          {type
            ? (QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS] ?? type)
            : "Tất cả"}
        </div>
      )}
    </div>
  )

  const calculateTotalByDifficulty = (difficult: string) => {
    return knowledgeBlocks.reduce(
      (acc, kb) => {
        const config = kb.configExams?.find((c) => c.difficult === difficult)
        return {
          quantity: acc.quantity + (config?.quantity || 0),
        }
      },
      { quantity: 0 }
    )
  }

  const calculateGrandTotal = () => {
    return knowledgeBlocks.reduce(
      (acc, kb) => {
        const totals = getTotals(kb.configExams)
        return {
          quantity: acc.quantity + totals.quantity,
        }
      },
      { quantity: 0 }
    )
  }

  return (
    <div>
      <Table
        rowKey="id"
        bordered
        columns={[
          {
            title: "Chuẩn đầu ra",
            width: 180,
            render: (_, record) => record.name,
          },
          {
            title: "Biết",
            width: 80,
            align: "center",
            render: (_, record) => {
              const { quantity, type } = getConfigByDifficult(record.configExams, "D1")
              return renderCell(quantity, type)
            },
          },
          {
            title: "Hiểu",
            width: 80,
            align: "center",
            render: (_, record) => {
              const { quantity, type } = getConfigByDifficult(record.configExams, "D2")
              return renderCell(quantity, type)
            },
          },
          {
            title: "Vận dụng",
            width: 100,
            align: "center",
            render: (_, record) => {
              const { quantity, type } = getConfigByDifficult(record.configExams, "D3")
              return renderCell(quantity, type)
            },
          },
          {
            title: "Vận dụng cao",
            width: 120,
            align: "center",
            render: (_, record) => {
              const { quantity, type } = getConfigByDifficult(record.configExams, "D4")
              return renderCell(quantity, type)
            },
          },
          {
            title: "Tổng câu hỏi",
            width: 110,
            align: "center",
            render: (_, record) => {
              const { quantity } = getTotals(record.configExams)
              return <span className="font-medium">{quantity}</span>
            },
          },
          {
            title: "Thao tác",
            width: 100,
            align: "center",
            render: (_, record) => {
              return (
                <Flex justify="center" align="center" gap={4} onClick={(e) => e.stopPropagation()}>
                  <EditIcon
                    className="text-blue-700"
                    onClick={() =>
                      onOpenPutCDR({
                        id: record.id,
                      })
                    }
                  />
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDeleteKnowledgeBlock(record.id),
                    }}
                  />
                </Flex>
              )
            },
          },
        ]}
        data={knowledgeBlocks}
        pagination={false}
        summary={() => {
          const d1Total = calculateTotalByDifficulty("D1")
          const d2Total = calculateTotalByDifficulty("D2")
          const d3Total = calculateTotalByDifficulty("D3")
          const d4Total = calculateTotalByDifficulty("D4")
          const grandTotal = calculateGrandTotal()

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gray-50 font-semibold">
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1}>Tổng</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  {d1Total.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  {d2Total.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  {d3Total.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  {d4Total.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="center">
                  {grandTotal.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="center" />
              </Table.Summary.Row>
            </Table.Summary>
          )
        }}
        expandable={{
          expandedRowRender: renderExpandedRow,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
        }}
        onRow={(record) => ({
          onClick: () => {
            setExpandedRowKeys((prev) =>
              prev.includes(record.id)
                ? prev.filter((key) => key !== record.id)
                : [...prev, record.id]
            )
          },
          style: { cursor: "pointer" },
        })}
      />
      <div className="mt-2.5">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="mr-2"
          iconPosition="end"
          onClick={() =>
            onOpenPutCDR({
              matrixId,
            })
          }
        >
          Thêm mới chuẩn đầu ra
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          iconPosition="end"
          className="mr-2"
          onClick={() =>
            onOpenImportCDR({
              matrixId,
            })
          }
        >
          Import chuẩn đầu ra
        </Button>
      </div>
    </div>
  )
}

export default TableChuongMuc
