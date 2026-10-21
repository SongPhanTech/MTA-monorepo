import { useEffect } from "react"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from "@ant-design/icons"
import { Button, Card, Flex, Progress, Typography } from "antd"
import {
  downloadExportedFile,
  resetExportJob,
  startPolling,
  useExportTrainingStore,
} from "@/stores/export-training-store"

const { Text } = Typography

export default function ExportTaskFloatingWidget() {
  const task = useExportTrainingStore()

  // Tự động khôi phục Polling nếu người dùng F5 hoặc chuyển trang quay lại
  useEffect(() => {
    if (
      task.jobId &&
      (task.status === "PENDING" || task.status === "PROCESSING")
    ) {
      startPolling(task.jobId)
    }
  }, [task.jobId, task.status])

  if (task.status === "IDLE") {
    return null
  }

  const isRunning = task.status === "PENDING" || task.status === "PROCESSING"
  const isSuccess = task.status === "SUCCESS"
  const isFailed = task.status === "FAILED"

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 340,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: 8,
      }}
    >
      <Card
        size="small"
        bordered
        style={{
          borderColor: isSuccess ? "#b7eb8f" : isFailed ? "#ffa39e" : "#91caff",
          background: isSuccess ? "#f6ffed" : isFailed ? "#fff1f0" : "#ffffff",
        }}
        title={
          <Flex align="center" gap={8}>
            {isRunning ? (
              <LoadingOutlined spin style={{ color: "#1890ff" }} />
            ) : isSuccess ? (
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
            ) : (
              <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            )}
            <Text strong style={{ fontSize: 13 }}>
              {isRunning
                ? "Đang xuất dữ liệu đăng ký học"
                : isSuccess
                  ? "Đã xuất xong dữ liệu"
                  : "Lỗi xuất dữ liệu"}
            </Text>
          </Flex>
        }
        extra={
          <Button
            type="text"
            size="small"
            style={{ fontSize: 12 }}
            onClick={() => resetExportJob()}
          >
            Đóng
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Progress
            percent={task.progress}
            status={isFailed ? "exception" : isSuccess ? "success" : "active"}
            size="small"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {task.message || "Đang xử lý..."}
          </Text>

          {isSuccess && task.downloadUrl && (
            <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                File: {((task.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB
              </Text>
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadExportedFile(task.downloadUrl!, task.fileName)}
              >
                Tải lại file
              </Button>
            </Flex>
          )}
        </div>
      </Card>
    </div>
  )
}
