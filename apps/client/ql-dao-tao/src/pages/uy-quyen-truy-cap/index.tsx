import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindManyUserProfile } from "@workspace/db/hooks"
import { useUserPermissions } from "@workspace/libs/api/user-permissions"
import { PERMISSIONS, useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Alert, Button, Card, Col, Empty, Flex, Row, Select, Table, Tag, Typography, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { ShieldCheck, UserPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"

const PERMISSION_LABELS: { key: keyof typeof PERMISSIONS; bit: number; label: string }[] = [
  { key: "XEM", bit: PERMISSIONS.XEM, label: "Xem" },
  { key: "XEM_TAT_CA", bit: PERMISSIONS.XEM_TAT_CA, label: "Xem tất cả" },
  { key: "XEM_CHI_TIET", bit: PERMISSIONS.XEM_CHI_TIET, label: "Xem chi tiết" },
  { key: "THEM", bit: PERMISSIONS.THEM, label: "Thêm" },
  { key: "SUA", bit: PERMISSIONS.SUA, label: "Sửa" },
  { key: "IN", bit: PERMISSIONS.IN, label: "In" },
  { key: "NHAP_EXCEL", bit: PERMISSIONS.NHAP_EXCEL, label: "Nhập Excel" },
  { key: "XUAT_EXCEL", bit: PERMISSIONS.XUAT_EXCEL, label: "Xuất Excel" },
  { key: "TAI_TEP", bit: PERMISSIONS.TAI_TEP, label: "Tải tệp" },
  { key: "NHAP_DIEM", bit: PERMISSIONS.NHAP_DIEM, label: "Nhập điểm" },
  { key: "DUYET", bit: PERMISSIONS.DUYET, label: "Duyệt" },
  { key: "IN_PHIEU_DIEM", bit: PERMISSIONS.IN_PHIEU_DIEM, label: "In phiếu điểm" },
  { key: "IN_DS_THI", bit: PERMISSIONS.IN_DS_THI, label: "In DS thi" },
  { key: "XOA", bit: PERMISSIONS.XOA, label: "Xóa" },
]

const formatPermissionTags = (value?: number | null) => {
  const mask = Number(value ?? 0)
  const matched = PERMISSION_LABELS.filter((item) => (mask & item.bit) === item.bit)
  if (!matched.length) {
    return <Tag>Không có quyền</Tag>
  }
  return (
    <Flex wrap="wrap" gap={4}>
      {matched.map((item) => (
        <Tag key={item.key} color="blue">
          {item.label}
        </Tag>
      ))}
    </Flex>
  )
}

export default function UyQuyenTruyCapPage() {
  const { can } = useAbility()
  const { data: session } = useSession()
  const currentUserId = session?.sDM_NhanVienId || ""
  const [search, setSearch] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const canAssign = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_UY_QUYEN_TRUY_CAP, "SUA")

  const { data: currentRes, isFetching: loadingCurrent } = useUserPermissions(
    currentUserId ? [currentUserId] : [],
    { enabled: !!currentUserId }
  )
  const currentUser =
    currentRes?.status === 200
      ? currentRes.data.find((item) => item.UserId === currentUserId) ?? currentRes.data[0]
      : undefined
  const currentError = currentRes && currentRes.status !== 200 ? currentRes.data.message : undefined

  const { data: users = [], isFetching: loadingUsers } = useFindManyUserProfile({
    where: {
      ...(currentUserId ? { id: { not: currentUserId } } : {}),
      ...(search
        ? {
            OR: [
              { fullname: { contains: search, mode: "insensitive" } },
              { officerNumber: { contains: search, mode: "insensitive" } },
              { idCardNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullname: true,
      officerNumber: true,
      idCardNumber: true,
    },
    take: 50,
    orderBy: { fullname: "asc" },
  })

  const { data: selectedRes, isFetching: loadingSelected } = useUserPermissions(selectedUserIds, {
    enabled: selectedUserIds.length > 0,
  })
  const selectedPermissions = selectedRes?.status === 200 ? selectedRes.data : []

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const user of users) {
      const extra = [user.officerNumber, user.idCardNumber].filter(Boolean).join(" · ")
      map.set(user.id, extra ? `${user.fullname || user.id} (${extra})` : user.fullname || user.id)
    }
    return map
  }, [users])

  const roleColumns: ColumnsType<NonNullable<typeof currentUser>["Roles"][number]> = [
    { title: "Mã vai trò", dataIndex: "sCodeName", key: "sCodeName", width: 180 },
    { title: "Tên vai trò", dataIndex: "sRoleName", key: "sRoleName" },
    { title: "Phiên bản", dataIndex: "sVersion", key: "sVersion", width: 120 },
  ]

  const permissionColumns: ColumnsType<NonNullable<typeof currentUser>["Permissions"][number]> = [
    { title: "Chức năng", dataIndex: "sFormName", key: "sFormName", width: 360 },
    {
      title: "Quyền",
      dataIndex: "lPermission",
      key: "lPermission",
      render: (value: number) => formatPermissionTags(value),
    },
  ]

  const handleAssign = () => {
    if (!selectedUserIds.length) {
      message.warning("Chọn ít nhất một người nhận ủy quyền")
      return
    }
    message.info("API gán quyền chưa được cung cấp. Màn hình đã sẵn sàng để gắn khi có API.")
  }

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex align="center" gap={12} className="mb-3">
          <ShieldCheck size={22} />
          <Typography.Title level={4} className="!m-0">
            Ủy quyền truy cập chức năng
          </Typography.Title>
        </Flex>
        <Alert
          type="info"
          showIcon
          message="Giao vai trò và quyền hiện có của bạn cho một hoặc nhiều người dùng khác."
          description="Bước hiện tại chỉ lấy quyền qua BE. Nút gán quyền sẽ kích hoạt khi có API ủy quyền."
        />
      </Card>

      <Card title="Quyền — vai trò hiện tại của tôi" loading={loadingCurrent}>
        {currentError ? (
          <Alert type="error" showIcon message={currentError} />
        ) : !currentUser ? (
          <Empty description="Không có dữ liệu quyền của tài khoản hiện tại" />
        ) : (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Typography.Text type="secondary">
                User ID: <Typography.Text copyable>{currentUser.UserId}</Typography.Text>
              </Typography.Text>
            </Col>
            <Col xs={24} lg={10}>
              <Typography.Title level={5}>Vai trò</Typography.Title>
              <Table
                rowKey={(row) => row.sRoleId || row.sCodeName || row.sRoleName || ""}
                size="small"
                columns={roleColumns}
                dataSource={currentUser.Roles}
                pagination={false}
                locale={{ emptyText: "Chưa có vai trò" }}
                scroll={{ y: 280 }}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Typography.Title level={5}>Quyền chức năng</Typography.Title>
              <Table
                rowKey={(row) => row.sFormName || String(row.lPermission)}
                size="small"
                columns={permissionColumns}
                dataSource={currentUser.Permissions}
                pagination={false}
                locale={{ emptyText: "Chưa có quyền chức năng" }}
                scroll={{ y: 280 }}
              />
            </Col>
          </Row>
        )}
      </Card>

      <Card title="Chọn người nhận ủy quyền">
        <Flex vertical gap={16}>
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder="Tìm theo họ tên, số hiệu hoặc CCCD"
            value={selectedUserIds}
            onSearch={setSearch}
            onChange={setSelectedUserIds}
            filterOption={false}
            loading={loadingUsers}
            options={users.map((user) => ({
              value: user.id,
              label: userLabelById.get(user.id) || user.fullname || user.id,
            }))}
            style={{ width: "100%" }}
          />

          {selectedUserIds.length > 0 && (
            <Table
              rowKey="UserId"
              size="small"
              loading={loadingSelected}
              dataSource={selectedPermissions}
              pagination={false}
              locale={{ emptyText: "Chưa lấy được quyền của người được chọn" }}
              columns={[
                {
                  title: "Người dùng",
                  dataIndex: "UserId",
                  render: (id: string) => userLabelById.get(id) || id,
                },
                {
                  title: "Số vai trò",
                  render: (_, row) => row.Roles?.length || 0,
                  width: 120,
                },
                {
                  title: "Số quyền",
                  render: (_, row) => row.Permissions?.length || 0,
                  width: 120,
                },
              ]}
            />
          )}

          <Flex justify="end">
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              disabled={!canAssign || !selectedUserIds.length}
              onClick={handleAssign}
            >
              Gán quyền hiện tại
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}

UyQuyenTruyCapPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
