import {
  dayOfWeekLabel,
  enumLabel,
  studentStatusLabel,
  type ImportJsonPreview,
} from "@/utils/parse-import-json"
import { Alert, Button, Descriptions, Modal, Table, Tabs, Tag, Typography } from "antd"
import dayjs from "dayjs"

const { Text } = Typography

type Props = {
  open: boolean
  preview: ImportJsonPreview | null
  fileName?: string
  importing?: boolean
  onClose: () => void
  onConfirmImport: () => void
}

function fmtDate(value?: string) {
  if (!value) return "—"
  const d = dayjs(value)
  return d.isValid() ? d.format("DD/MM/YYYY") : "—"
}

function fmtDateTime(value?: string) {
  if (!value) return "—"
  const d = dayjs(value)
  return d.isValid() ? d.format("HH:mm — DD/MM/YYYY") : "—"
}

export default function ModalPreviewImportJson({
  open,
  preview,
  fileName,
  importing,
  onClose,
  onConfirmImport,
}: Props) {
  if (!preview) return null

  const isEncrypted = Boolean(preview.encrypted)

  return (
    <Modal
      title={isEncrypted ? "Xác nhận nhập gói đồng bộ (.dat)" : "Kiểm tra dữ liệu trong file JSON"}
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ top: 24, maxWidth: 1280 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="import" type="primary" loading={importing} onClick={onConfirmImport}>
          Xác nhận nhập dữ liệu
        </Button>,
      ]}
    >
      {isEncrypted ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Gói .dat được mã hóa — trình duyệt không xem trước chi tiết"
          description={
            <>
              File hợp lệ (Gzip + AES). Nội dung chỉ giải mã trên server khi nhập. Các số 0 bên
              dưới <strong>không có nghĩa file trống</strong>. Bấm «Xác nhận nhập dữ liệu», rồi
              theo dõi tab <strong>Lịch sử đồng bộ</strong> đến khi SUCCESS — đợt đăng ký sẽ hiện
              trong danh sách.
            </>
          }
        />
      ) : null}
      <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 3 }} className="mb-4">
        <Descriptions.Item label="File">{fileName || "—"}</Descriptions.Item>
        <Descriptions.Item label="Phiên bản">{preview.version}</Descriptions.Item>
        <Descriptions.Item label="Thời điểm xuất">
          {isEncrypted ? "Xem sau khi nhập" : fmtDateTime(preview.exportedAt)}
        </Descriptions.Item>
        {!isEncrypted ? (
          <>
            <Descriptions.Item label="Lớp học phần">
              {preview.summary.subjectClassCount}
            </Descriptions.Item>
            <Descriptions.Item label="Thời khóa biểu">
              {preview.summary.scheduleCount}
            </Descriptions.Item>
            <Descriptions.Item label="Sinh viên">{preview.summary.studentCount}</Descriptions.Item>
            <Descriptions.Item label="CTĐT">{preview.summary.curriculumCount}</Descriptions.Item>
            <Descriptions.Item label="Môn học">{preview.summary.subjectCount}</Descriptions.Item>
            <Descriptions.Item label="Danh mục hệ thống">
              {preview.catalogs.length} loại
            </Descriptions.Item>
          </>
        ) : (
          <Descriptions.Item label="Trạng thái gói" span={3}>
            <Tag color="blue">Đã mã hóa — chờ nhập nền trên server</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      {isEncrypted ? null : (
      <Tabs
        items={[
          {
            key: "session",
            label: "Thông tin đợt đăng ký",
            children: (
              <>
                <Descriptions size="small" bordered column={1} className="mb-4">
                  <Descriptions.Item label="Tên đợt">
                    <Text strong>{preview.sessionName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Học kỳ">
                    {preview.semesterName || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Năm học">
                    {preview.schoolYearName || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian đăng ký">
                    {preview.startDate && preview.endDate
                      ? `${fmtDateTime(preview.startDate)} → ${fmtDateTime(preview.endDate)}`
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {preview.active == null ? (
                      "—"
                    ) : preview.active ? (
                      <Tag color="success">Đang mở</Tag>
                    ) : (
                      <Tag color="error">Đã đóng</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Học phí / tín chỉ">
                    {preview.tuitionPerCredit != null
                      ? `${preview.tuitionPerCredit.toLocaleString("vi-VN")} đ`
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Khóa đào tạo">
                    {preview.trainingCourses.length > 0
                      ? preview.trainingCourses
                          .map((c) => [c.code, c.name].filter(Boolean).join(" — "))
                          .join(", ")
                      : "—"}
                  </Descriptions.Item>
                </Descriptions>

                <Text strong className="block mb-2">
                  Giới hạn tín chỉ theo GPA
                </Text>
                <Table
                  size="small"
                  bordered
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  dataSource={preview.creditLimits}
                  locale={{ emptyText: "Không có cấu hình tín chỉ" }}
                  columns={[
                    { title: "Min TC", dataIndex: "minCredit", width: 90 },
                    { title: "Max TC", dataIndex: "maxCredit", width: 90 },
                    {
                      title: "Hệ điểm",
                      dataIndex: "baseScore",
                      width: 100,
                      render: (v: string) => enumLabel(v),
                    },
                    { title: "GPA 4 min", dataIndex: "base4Min", width: 100 },
                    { title: "GPA 4 max", dataIndex: "base4Max", width: 100 },
                    { title: "Hệ 10 min", dataIndex: "base10Min", width: 100 },
                    { title: "Hệ 10 max", dataIndex: "base10Max", width: 100 },
                  ]}
                />
              </>
            ),
          },
          {
            key: "classes",
            label: `Lớp học phần, TKB (${preview.summary.subjectClassCount})`,
            children: (
              <Tabs
                size="small"
                items={[
                  {
                    key: "subject-class",
                    label: `Lớp học phần (${preview.subjectClasses.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(r, i) => `${r.code}-${i}`}
                        dataSource={preview.subjectClasses}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ y: 360 }}
                        columns={[
                          { title: "Mã lớp", dataIndex: "code", width: 120 },
                          { title: "Tên lớp / môn", dataIndex: "name" },
                          {
                            title: "Loại",
                            dataIndex: "type",
                            width: 110,
                            render: (v: string) => enumLabel(v),
                          },
                          {
                            title: "Trạng thái",
                            dataIndex: "status",
                            width: 120,
                            render: (v: string) => enumLabel(v),
                          },
                          { title: "Sĩ số max", dataIndex: "maxStudent", width: 100 },
                          { title: "Phòng", dataIndex: "roomId", width: 100 },
                          {
                            title: "Buổi",
                            dataIndex: "schedule",
                            width: 90,
                            render: (v: string) => enumLabel(v),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "class-time",
                    label: `Lịch tuần (${preview.classTimes.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(_, i) => String(i)}
                        dataSource={preview.classTimes}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ y: 360 }}
                        columns={[
                          { title: "Mã lớp", dataIndex: "classCode", width: 120 },
                          { title: "Tên lớp", dataIndex: "className" },
                          {
                            title: "Thứ",
                            dataIndex: "dayOfWeek",
                            width: 90,
                            render: (v: number) => dayOfWeekLabel(v),
                          },
                          { title: "Tiết bắt đầu", dataIndex: "startPeriod", width: 110 },
                          { title: "Tiết kết thúc", dataIndex: "endPeriod", width: 110 },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "schedule",
                    label: `Thời khóa biểu (${preview.schedules.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(_, i) => String(i)}
                        dataSource={preview.schedules}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ y: 360 }}
                        columns={[
                          { title: "Mã lớp", dataIndex: "classCode", width: 120 },
                          { title: "Tên lớp", dataIndex: "className" },
                          {
                            title: "Ngày học",
                            dataIndex: "classDate",
                            width: 120,
                            render: (v: string) => fmtDate(v),
                          },
                          {
                            title: "Tiết",
                            width: 90,
                            render: (_, r) => `${r.startPeriod ?? "?"}–${r.endPeriod ?? "?"}`,
                          },
                          { title: "Phòng", dataIndex: "roomId", width: 100 },
                          {
                            title: "Loại tiết",
                            dataIndex: "periodType",
                            width: 120,
                            render: (v: string) => enumLabel(v),
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: "students",
            label: `Sinh viên, hồ sơ (${preview.summary.studentCount})`,
            children: (
              <>
                <Descriptions size="small" bordered column={{ xs: 1, sm: 3 }} className="mb-4">
                  <Descriptions.Item label="Sinh viên">
                    {preview.summary.studentCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hồ sơ liên quan">
                    {preview.summary.userProfileCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lớp quản lý">
                    {preview.fixedClasses.length}
                  </Descriptions.Item>
                </Descriptions>
                <Table
                  size="small"
                  bordered
                  rowKey={(r, i) => `${r.code}-${i}`}
                  dataSource={preview.students}
                  pagination={{ pageSize: 15, showSizeChanger: true }}
                  scroll={{ y: 380 }}
                  columns={[
                    { title: "Mã định danh", dataIndex: "code", width: 130 },
                    { title: "Họ tên", dataIndex: "fullName" },
                    { title: "Lớp quản lý", dataIndex: "fixedClass", width: 140 },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 160,
                      render: (v: string) => studentStatusLabel(v),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: "catalogs",
            label: `Danh mục hệ thống (${preview.catalogs.length})`,
            children: (
              <Table
                size="small"
                bordered
                rowKey="key"
                dataSource={preview.catalogs}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                scroll={{ y: 420 }}
                columns={[
                  { title: "Danh mục", dataIndex: "label" },
                  { title: "Mã bảng", dataIndex: "key", width: 280 },
                  { title: "Số bản ghi", dataIndex: "count", width: 130 },
                ]}
              />
            ),
          },
          {
            key: "curriculum",
            label: `CTĐT, môn học (${preview.summary.subjectCount})`,
            children: (
              <Tabs
                size="small"
                items={[
                  {
                    key: "course",
                    label: `Khóa đào tạo (${preview.trainingCourses.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(r, i) => `${r.id || r.code}-${i}`}
                        dataSource={preview.trainingCourses}
                        pagination={false}
                        columns={[
                          { title: "Mã khóa", dataIndex: "code", width: 140 },
                          { title: "Tên khóa", dataIndex: "name" },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "ctdt",
                    label: `Chương trình đào tạo (${preview.curricula.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(r, i) => `${r.code}-${i}`}
                        dataSource={preview.curricula}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ y: 360 }}
                        columns={[
                          { title: "Mã CTĐT", dataIndex: "code", width: 160 },
                          { title: "Tên chương trình", dataIndex: "name" },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "subjects",
                    label: `Môn học (${preview.subjects.length})`,
                    children: (
                      <Table
                        size="small"
                        bordered
                        rowKey={(r, i) => `${r.code}-${i}`}
                        dataSource={preview.subjects}
                        pagination={{ pageSize: 15, showSizeChanger: true }}
                        scroll={{ y: 360 }}
                        columns={[
                          { title: "Mã môn", dataIndex: "code", width: 120 },
                          { title: "Tên môn", dataIndex: "name" },
                          { title: "Tín chỉ", dataIndex: "credit", width: 90 },
                          {
                            title: "Loại",
                            dataIndex: "type",
                            width: 120,
                            render: (v: string) => enumLabel(v),
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
      )}
    </Modal>
  )
}
