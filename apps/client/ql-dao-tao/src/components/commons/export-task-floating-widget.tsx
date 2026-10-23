import { useEffect } from "react"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons"
import { Button, Card, Flex, Progress, Typography } from "antd"
import { ExportInternetDownloadButton } from "@components/ui/export-internet-download-button"
import {
  resetExportJob,
  startPolling,
  useExportTrainingStore,
} from "@/stores/export-training-store"

const { Text } = Typography

export default function ExportTaskFloatingWidget() {
  const task = useExportTrainingStore()

  useEffect(() => {
    if (task.jobId && (task.status === "PENDING" || task.status === "PROCESSING")) {
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
                ? "Đang xuất dữ liệu"
                : isSuccess
                  ? "Xuất dữ liệu thành công"
                  : "Không xuất được dữ liệu"}
            </Text>
          </Flex>
        }
        extra={
          <Button type="text" size="small" style={{ fontSize: 12 }} onClick={() => resetExportJob()}>
            Đóng
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Progress
            percent={task.progress}
            status={isFailed ? "exception" : isSuccess ? "success" : "active"}
            size="small"
            showInfo={isRunning}
          />

          {isSuccess && task.downloadUrl ? (
            <Flex justify="end" align="center" style={{ marginTop: 4 }}>
              <ExportInternetDownloadButton
                label="Tải lại"
                externalStatus="SUCCESS"
                downloadUrl={task.downloadUrl}
                fileName={task.fileName}
                onStartExport={() => undefined}
              />
            </Flex>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
