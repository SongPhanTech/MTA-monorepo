import { queryClient } from "@api/index"
import {
  CloseOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  PaperClipOutlined,
} from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import EvaluateLayout from "@layouts/evaluate-layout"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getRuntimeEnv } from "@workspace/libs/utils"
import {
  useCreateDocumentFile,
  useDeleteDocumentFile,
  useFindManyDocumentFile,
  useFindManyEvaluationPeriod,
} from "@workspace/db/hooks"
import { Button, message, Popconfirm, Select, Spin, Tooltip, Typography, Upload } from "antd"
import axios from "axios"
import React, { useMemo, useState } from "react"

const { Dragger } = Upload
const { Link } = Typography

const BaoCaoTuDanhGia = () => {
  const { showSpinner, hideSpinner } = useSpinner()
  const [uploading, setUploading] = useState(false)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined)

  const { data: evaluationPeriods = [] } = useFindManyEvaluationPeriod({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  })

  const periodOptions = useMemo(
    () => evaluationPeriods.map((p) => ({ value: p.id, label: p.name })),
    [evaluationPeriods]
  )

  const {
    data: documentFiles = [],
    isLoading,
    refetch,
  } = useFindManyDocumentFile(
    {
      where: { evaluationPeriodId: selectedPeriodId },
      orderBy: { createdAt: "asc" },
    },
    { enabled: !!selectedPeriodId }
  )

  const { mutateAsync: createDocumentFile } = useCreateDocumentFile()
  const { mutateAsync: deleteDocumentFile } = useDeleteDocumentFile()

  async function handleUpload(file: File) {
    try {
      setUploading(true)
      const extension = file.name.split(".").pop() || ""
      const res = await generatePresignedUrl({ path: "tai-lieu-ctdt", extension })

      await axios.put(res.data.url, file)

      await createDocumentFile({
        data: {
          name: file.name,
          path: res.data.fileName,
          size: BigInt(file.size),
          mimeType: file.type,
          evaluationPeriod: { connect: { id: selectedPeriodId! } },
        },
      })

      await refetch()
      queryClient.invalidateQueries({ queryKey: ["DocumentFile"] })
      queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      message.success(`Tải lên "${file.name}" thành công`)
    } catch {
      message.error(`Không thể tải lên "${file.name}"`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await deleteDocumentFile({ where: { id } })
      await refetch()
      queryClient.invalidateQueries({ queryKey: ["DocumentFile"] })
      queryClient.invalidateQueries({ queryKey: ["EvaluationPeriod"] })
      message.success("Xóa báo cáo thành công")
    } catch {
      message.error("Xóa báo cáo thất bại")
    } finally {
      hideSpinner()
    }
  }

  function handleDownload(path: string, name: string) {
    const fileUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${path}`
    const a = document.createElement("a")
    a.href = fileUrl
    a.download = name
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <Select
        className="w-72"
        placeholder="Chọn đợt đánh giá"
        allowClear
        options={periodOptions}
        value={selectedPeriodId}
        onChange={setSelectedPeriodId}
      />

      {!selectedPeriodId ? (
        <p className="text-center text-gray-400 py-8">Vui lòng chọn đợt đánh giá</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Dragger
            multiple
            accept=".doc,.docx"
            showUploadList={false}
            beforeUpload={(file) => {
              const isLt50M = file.size / 1024 / 1024 < 50
              if (!isLt50M) {
                message.error(`${file.name} vượt quá 50MB`)
                return Upload.LIST_IGNORE
              }
              handleUpload(file)
              return false
            }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: "#52c41a" }} />
            </p>
            <p className="ant-upload-text text-[#111827] text-base font-normal">
              <Link className="text-[#2563EB] font-medium">Chọn tệp</Link> hoặc kéo và thả tệp vào
              đây
            </p>
            <span className="text-[#4B5563] text-sm font-normal">
              Định dạng DOC, DOCX (tối đa 50MB)
            </span>
          </Dragger>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spin size="small" />
              <span>Đang tải lên...</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Spin />
              </div>
            ) : documentFiles.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Chưa có báo cáo nào</p>
            ) : (
              documentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center border border-solid border-[#D1D5DB] rounded p-2 hover:bg-gray-50"
                >
                  <PaperClipOutlined style={{ marginRight: 8, color: "#595959", fontSize: 16 }} />
                  <Tooltip title={file.name}>
                    <span
                      className="flex-1 text-sm"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 600,
                      }}
                    >
                      {file.name}
                    </span>
                  </Tooltip>
                  <Tooltip title="Tải xuống">
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(file.path, file.name)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Xác nhận xóa báo cáo này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(file.id)}
                  >
                    <Tooltip title="Xóa">
                      <Button type="text" size="small" danger icon={<CloseOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BaoCaoTuDanhGia

BaoCaoTuDanhGia.getLayout = function getLayout(page: React.ReactElement) {
  return <EvaluateLayout>{page}</EvaluateLayout>
}
