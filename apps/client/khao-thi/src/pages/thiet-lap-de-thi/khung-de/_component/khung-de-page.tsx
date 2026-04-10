import { ClockCircleOutlined, DownloadOutlined, PaperClipOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { cn } from "@lib/utils"
import { useStore } from "@tanstack/react-store"
import {
  useCountExamFramework,
  useFindManyExamFramework,
  useUpdateExamFramework,
} from "@workspace/db/hooks"
import { Button, Col, Flex, Input, message, Row, Space, Tooltip, Typography } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { store } from "../index"
import type { UploadedFileItem } from "@components/commons/documentPaths"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getMinioUrl } from "@workspace/libs/utils"
import type { Prisma } from "@workspace/db/client"
import { queryClient } from "@api/index"
import { useTrainingObjectTypeStore } from "@workspace/ui"

type ExamFrameworkType = Prisma.ExamFrameworkGetPayload<{
  include: {
    subjectVersion: true
    examMatrixs: {
      include: {
        knowledgeBlocks: true
      }
    }
    documentFiles: true
    _count: {
      select: {
        documentFiles: true
      }
    }
  }
}>

export default function KhungDeList() {
  const examFrameworkId = useStore(store, (s) => s.examFrameworkId)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    evidenceName: "",
    name: "",
    subjectVersionIdString: "",
  })
  const semesterId = useStore(store, (s) => s.semesterId)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { onOpen: onOpenExamFramework } = useDisclosure<{ id: string }>({
    tag: "ModalTaoKhungDe",
  })

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const queryWhere: Prisma.ExamFrameworkWhereInput = {
    active: true,
    ...(semesterId ? { semesterId } : {}),
    ...(filters.name
      ? {
          name: {
            contains: filters.name,
          },
        }
      : {}),
    ...(filters.subjectVersionIdString
      ? { subjectVersionIdString: filters.subjectVersionIdString }
      : {}),
    ...(trainingObjectTypeId ? { subjectVersion: { trainingObjectTypeId } } : {}),
  }

  const { data: examFrameworkList = [] } = useFindManyExamFramework({
    where: queryWhere,
    include: {
      subjectVersion: true,
      examMatrixs: {
        include: { knowledgeBlocks: true },
      },
      documentFiles: true,
      _count: {
        select: {
          documentFiles: true,
        },
      },
    },
    take: numberOfPages, //phân trang
    skip: (currentPage - 1) * numberOfPages, //phân trang
    orderBy: { createdAt: "desc" },
  })

  const { data: totalExamFramework } = useCountExamFramework({
    where: queryWhere,
  })

  const deleteExamFramework = useUpdateExamFramework({
    onSuccess: () => message.success("Đã xóa khung đề"),
    onError: () => message.error("Không thể xóa khung đề"),
  })

  const filteredList = examFrameworkList.filter((item) => {
    const keyword = filters.name?.trim().toLowerCase()

    if (!keyword) return true

    return (
      item.name.toLowerCase().includes(keyword) ||
      item.subjectVersion?.name.toLowerCase().includes(keyword)
    )
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteExamFramework.mutateAsync({
        where: { id },
        data: {
          active: false,
          deletedAt: new Date(),
        },
      })

      message.success("Xóa khung đề thành công")

      queryClient.invalidateQueries({ queryKey: ["examFramework"] })
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
    }
  }

  const handlePreviewFile = async (file: UploadedFileItem) => {
    try {
      return onOpenPreview({
        uri: getMinioUrl(file.path),
        name: file.name,
        mimeType: file.name.split(".").pop() || file.mimeType,
      })
    } catch (error) {
      message.error("Không thể mở file")
    }
  }

  return (
    <div>
      <Col className="mb-2">
        <Flex justify="space-between">
          <Typography.Title level={4}>Danh sách khung đề</Typography.Title>

          <div className="flex gap-2">
            <Input
              placeholder="Tìm theo tên khung đề"
              value={filters.name}
              onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
              className="w-96 h-8"
              allowClear
            />

            <Button type="primary" icon={<CreateIcon />} onClick={() => onOpenExamFramework()}>
              Tạo khung đề
            </Button>
          </div>
        </Flex>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          data={filteredList}
          filters={filters}
          setFilters={setFilters}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: totalExamFramework,
            onChange: (page, pageSize) => {
              if (numberOfPages === pageSize) {
                setCurrentPage(page)
              } else {
                setCurrentPage(1)
                setNumberOfPages(pageSize)
              }
            },
            showTotal: (total, range) =>
              `${range[0]} - ${range[1]} trong tổng số ${totalExamFramework} bản ghi`,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="bg-gray-50">
                <p className="mb-3 font-semibold">Tài liệu đính kèm:</p>
                {record.documentFiles && record.documentFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {record.documentFiles.map((file: UploadedFileItem) => (
                      <div
                        key={file.id}
                        className="flex items-center border border-solid border-[#D1D5DB] rounded p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePreviewFile(file)}
                      >
                        <PaperClipOutlined
                          style={{
                            marginRight: 8,
                            color: "#595959",
                            fontSize: 16,
                          }}
                        />
                        <Tooltip title={file.name}>
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                          >
                            {file.name}
                          </span>
                        </Tooltip>
                        <Tooltip title="Tải xuống">
                          <DownloadOutlined
                            style={{
                              marginLeft: 12,
                              cursor: "pointer",
                              color: "#595959",
                              fontSize: 14,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              const link = document.createElement("a")
                              link.href = file.path
                              link.download = file.name
                              link.click()
                            }}
                          />
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Không có tài liệu</p>
                )}
              </div>
            ),
            expandIcon: ({ expanded, onExpand, record }) => (
              <span
                className="flex justify-center"
                onClick={(e) => onExpand(record as ExamFrameworkType, e)}
              >
                {expanded ? <ChevronDown /> : <ChevronUp />}
              </span>
            ),
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                store.setState((s) => ({
                  ...s,
                  examFrameworkId: record.id,
                }))
              },
              className: cn(
                examFrameworkId === record.id
                  ? "!bg-orange-200 hover:!bg-orange-200 [&>td]:!bg-orange-200 [&>td]:hover:!bg-orange-200"
                  : ""
              ),
            }
          }}
          columns={[
            {
              title: "STT",
              width: "40px",
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Tên khung đề",
              dataIndex: "name",
              width: "300px",
              type: "input",
              render: (name) => (
                <span className="text-left">
                  {examFrameworkList.length > 50 ? `${name.slice(0, 50)}...` : name}
                </span>
              ),
            },
            {
              title: "Thời gian thi",
              dataIndex: "time",
              type: "input",
              width: "120px",
              align: "center",
              render: (time) => (
                <Space>
                  <ClockCircleOutlined />
                  {time} phút
                </Space>
              ),
            },
            {
              title: "Môn học",
              dataIndex: "subjectVersion",
              type: "input",
              width: "250px",
              render: (_, record) => record?.subjectVersion?.name || "",
            },
            {
              title: "Tài liệu đính kèm",
              align: "center",
              width: 100,
              render: (_, record) => record?._count?.documentFiles || 0,
            },
            {
              title: "Thao tác",
              align: "center",
              width: "70px",
              fixed: "right",
              render: (record) => (
                <Row className="justify-center gap-2">
                  <EditIcon
                    type="text"
                    className="text-sm text-blue-700 cursor-pointer"
                    onClick={() => onOpenExamFramework({ id: record.id })}
                  />
                  <DeleteIcon
                    type="text"
                    popConfirm={{
                      onConfirm: (e) => {
                        handleDelete(record.id)
                        e?.stopPropagation()
                      },
                      onCancel: (e) => {
                        e?.stopPropagation()
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  />
                </Row>
              ),
            },
          ]}
        />
      </Col>
    </div>
  )
}
