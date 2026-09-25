import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindManyUserProfile } from "@workspace/db/hooks"
import {
  useUserPermissions,
  type SystemPermission,
  type SystemRole,
} from "@workspace/libs/api/user-permissions"
import { PERMISSIONS, useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Input,
  Modal,
  Row,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { InfoIcon, ShieldCheck, UserPlus } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useState } from "react"

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

const getRoleKey = (role: SystemRole, index = 0) =>
  role.sRoleId || role.sCodeName || role.sRoleName || `role-${index}`

const formatPermissionTags = (permission: SystemPermission) => {
  const names = permission.PermissionNames?.filter(Boolean) ?? []
  if (names.length) {
    return (
      <Flex wrap="wrap" gap={4}>
        {names.map((name) => (
          <Tag key={name} color="blue">
            {name}
          </Tag>
        ))}
      </Flex>
    )
  }

  const mask = Number(permission.lPermission ?? 0)
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

const getRecipientKind = (user: {
  lecturer?: { id: string } | null
  staffs?: { id: string } | null
  bLaGiangVien?: boolean | null
  bLaCanBoNhanVien?: boolean | null
}) => {
  const kinds: string[] = []
  if (user.lecturer || user.bLaGiangVien) kinds.push("Giảng viên")
  if (user.staffs || user.bLaCanBoNhanVien) kinds.push("Cán bộ")
  return kinds.join(" · ") || "—"
}

export default function UyQuyenTruyCapPage() {
  const { can } = useAbility()
  const { data: session } = useSession()
  const currentUserId = session?.sDM_NhanVienId || ""
  const [search, setSearch] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([])
  const [detailRole, setDetailRole] = useState<SystemRole | null>(null)

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
  const currentRoles = currentUser?.Roles ?? []

  useEffect(() => {
    setSelectedRoleKeys((currentUser?.Roles ?? []).map((role, index) => getRoleKey(role, index)))
  }, [currentUser])

  const recipientWhere = useMemo(
    () => ({
      ...(currentUserId ? { id: { not: currentUserId } } : {}),
      bLaHocVien: { not: true },
      OR: [
        { lecturer: { isNot: null } },
        { staffs: { isNot: null } },
        { bLaGiangVien: true },
        { bLaCanBoNhanVien: true },
      ],
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { fullname: { contains: search, mode: "insensitive" as const } },
                  { officerNumber: { contains: search, mode: "insensitive" as const } },
                  { idCardNumber: { contains: search, mode: "insensitive" as const } },
                  { code: { contains: search, mode: "insensitive" as const } },
                ],
              },
            ],
          }
        : {}),
    }),
    [currentUserId, search]
  )

  const { data: users = [], isFetching: loadingUsers } = useFindManyUserProfile({
    where: recipientWhere,
    select: {
      id: true,
      fullname: true,
      code: true,
      officerNumber: true,
      idCardNumber: true,
      bLaGiangVien: true,
      bLaCanBoNhanVien: true,
      lecturer: { select: { id: true } },
      staffs: { select: { id: true } },
    },
    take: 50,
    orderBy: { fullname: "asc" },
  })

  const roleColumns: ColumnsType<SystemRole> = [
    {
      title: "Tên vai trò",
      dataIndex: "sRoleName",
      key: "sRoleName",
      render: (value: string | null | undefined, row) => value || row.sCodeName || "—",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      align: "center",
      render: (_, row) => (
        <Tooltip title="Xem quyền trong vai trò">
          <Button
            type="link"
            icon={<InfoIcon size={16} strokeWidth={1.5} />}
            onClick={() => setDetailRole(row)}
          >
            Xem chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ]

  const recipientColumns: ColumnsType<(typeof users)[number]> = [
    {
      title: "Họ tên",
      dataIndex: "fullname",
      key: "fullname",
      render: (value: string | null | undefined, row) => value || row.code || row.id,
    },
    {
      title: "Mã / số hiệu",
      key: "code",
      width: 160,
      render: (_, row) => row.code || row.officerNumber || "—",
    },
    {
      title: "Loại",
      key: "kind",
      width: 150,
      render: (_, row) => getRecipientKind(row),
    },
  ]

  const permissionColumns: ColumnsType<SystemPermission> = [
    {
      title: "Chức năng",
      key: "sTen",
      width: 320,
      render: (_, row) => row.sTen || row.sFormName || "—",
    },
    {
      title: "Quyền",
      key: "permissions",
      render: (_, row) => formatPermissionTags(row),
    },
  ]

  const handleAssign = () => {
    if (!selectedUserIds.length) {
      message.warning("Chọn ít nhất một người nhận ủy quyền")
      return
    }
    if (!selectedRoleKeys.length) {
      message.warning("Chọn ít nhất một vai trò để ủy quyền")
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
          message="Giao vai trò hiện có của bạn cho cán bộ hoặc giảng viên."
          description="Tick vai trò cần ủy quyền, xem chi tiết quyền trong modal. Cột phải chỉ chọn cán bộ/giảng viên, không gồm học viên."
        />
      </Card>

      {currentError ? (
        <Alert type="error" showIcon message={currentError} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={11}>
            <Card title="Quyền — vai trò hiện tại của tôi" loading={loadingCurrent}>
              <Table
                rowKey={(row, index) => getRoleKey(row, index)}
                size="small"
                columns={roleColumns}
                dataSource={currentRoles}
                pagination={false}
                locale={{ emptyText: "Chưa có vai trò" }}
                scroll={{ y: 420 }}
                rowSelection={{
                  selectedRowKeys: selectedRoleKeys,
                  onChange: (keys) => setSelectedRoleKeys(keys.map(String)),
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={13}>
            <Card title="Chọn người được ủy quyền">
              <Flex vertical gap={12}>
                <Input.Search
                  allowClear
                  placeholder="Tìm cán bộ/giảng viên theo họ tên, mã, số hiệu hoặc CCCD"
                  onSearch={setSearch}
                  onChange={(event) => {
                    if (!event.target.value) setSearch("")
                  }}
                />
                <Table
                  rowKey="id"
                  size="small"
                  loading={loadingUsers}
                  columns={recipientColumns}
                  dataSource={users}
                  pagination={false}
                  locale={{ emptyText: "Không có cán bộ/giảng viên phù hợp" }}
                  scroll={{ y: 360 }}
                  rowSelection={{
                    selectedRowKeys: selectedUserIds,
                    onChange: (keys) => setSelectedUserIds(keys.map(String)),
                  }}
                />
                <Flex justify="end">
                  <Button
                    type="primary"
                    icon={<UserPlus size={16} />}
                    disabled={!canAssign || !selectedUserIds.length || !selectedRoleKeys.length}
                    onClick={handleAssign}
                  >
                    Gán quyền hiện tại
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title={`Quyền trong vai trò: ${detailRole?.sRoleName || detailRole?.sCodeName || ""}`}
        open={!!detailRole}
        onCancel={() => setDetailRole(null)}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Table
          rowKey={(row, index) => row.sFormName || row.sTen || `permission-${index}`}
          size="small"
          columns={permissionColumns}
          dataSource={detailRole?.Permissions ?? []}
          pagination={false}
          locale={{ emptyText: "Vai trò này chưa có quyền" }}
          scroll={{ y: 420 }}
        />
      </Modal>
    </Flex>
  )
}

UyQuyenTruyCapPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
