import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindManyUserProfile } from "@workspace/db/hooks"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { GrantedRole, UserPermissionItem, UserPermissionRole } from "@workspace/libs/api/schemas"
import {
  getListGrantedRolesQueryKey,
  getUserPermissions,
  useAssignDelegation,
  useListGrantedRoles,
  useRevokeGrants,
} from "@workspace/libs/api/training"

type SystemPermission = UserPermissionItem
type SystemRole = UserPermissionRole
import { PERMISSIONS, useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Row,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { InfoIcon, ShieldCheck, Undo2, UserPlus } from "lucide-react"
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

const formatMaskTags = (mask: number) => {
  const matched = PERMISSION_LABELS.filter((item) => (mask & item.bit) === item.bit)
  if (!matched.length) return <Tag>Không có quyền</Tag>
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

  return formatMaskTags(Number(permission.lPermission ?? 0))
}

const ownedMask = (permission: SystemPermission) => Number(permission.lPermission ?? 0)

const withViewBit = (mask: number, owned: number) => {
  let stored = mask & owned
  if ((stored & ~PERMISSIONS.XEM) !== 0 && (owned & PERMISSIONS.XEM) === PERMISSIONS.XEM) {
    stored |= PERMISSIONS.XEM
  }
  return stored
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
  const [bitMasks, setBitMasks] = useState<Record<string, Record<string, number>>>({})
  const [detailRole, setDetailRole] = useState<SystemRole | null>(null)
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>([])
  const queryClient = useQueryClient()
  const assignDelegation = useAssignDelegation()
  const revokeGrants = useRevokeGrants()
  const { data: grantsRes, isFetching: loadingGrants } = useListGrantedRoles(
    { granterId: currentUserId },
    { query: { enabled: Boolean(currentUserId) } }
  )
  const grantedRoles = grantsRes?.status === 200 ? grantsRes.data.grants : []
  const grantsError =
    grantsRes && grantsRes.status !== 200
      ? typeof grantsRes.data === "string"
        ? grantsRes.data
        : grantsRes.data.message
      : undefined

  const canAssign = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_UY_QUYEN_TRUY_CAP, "SUA")

  const { data: currentRes, isFetching: loadingCurrent } = useQuery({
    queryKey: ["/api/user-permissions/permissions", currentUserId],
    queryFn: () => getUserPermissions({ UserIds: [currentUserId] }),
    enabled: Boolean(currentUserId),
  })
  const currentUser =
    currentRes?.status === 200
      ? currentRes.data.find((item) => item.UserId === currentUserId) ?? currentRes.data[0]
      : undefined
  const currentError = currentRes && currentRes.status !== 200 ? currentRes.data.message : undefined
  const currentRoles = currentUser?.Roles ?? []

  useEffect(() => {
    setSelectedRoleKeys([])
    setBitMasks({})
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

  const detailRoleKey = detailRole ? getRoleKey(detailRole) : ""

  const togglePermissionBit = (permission: SystemPermission, bit: number, checked: boolean) => {
    const formName = permission.sFormName
    if (!detailRoleKey || !formName) return
    const owned = ownedMask(permission)
    setBitMasks((current) => {
      const roleMasks = current[detailRoleKey] ?? {}
      const mask = roleMasks[formName] ?? 0
      return {
        ...current,
        [detailRoleKey]: {
          ...roleMasks,
          [formName]: withViewBit(checked ? mask | bit : mask & ~bit, owned),
        },
      }
    })
  }

  const permissionColumns: ColumnsType<SystemPermission> = [
    {
      title: "Chức năng",
      key: "sTen",
      width: 280,
      render: (_, row) => row.sTen || row.sFormName || "—",
    },
    {
      title: "Quyền được giao",
      key: "permissions",
      render: (_, row) => {
        const owned = ownedMask(row)
        const available = PERMISSION_LABELS.filter((item) => (owned & item.bit) === item.bit)
        if (!available.length || !row.sFormName) {
          return formatPermissionTags(row)
        }
        const selected = bitMasks[detailRoleKey]?.[row.sFormName] ?? 0
        return (
          <Flex wrap="wrap" gap={8}>
            {available.map((item) => (
              <Checkbox
                key={item.key}
                checked={(selected & item.bit) === item.bit}
                onChange={(event) => togglePermissionBit(row, item.bit, event.target.checked)}
              >
                {item.label}
              </Checkbox>
            ))}
          </Flex>
        )
      },
    },
  ]

  const handleAssign = async () => {
    if (!currentUserId) {
      message.warning("Chưa xác định được người giao")
      return
    }
    if (!selectedUserIds.length) {
      message.warning("Chọn ít nhất một người nhận ủy quyền")
      return
    }
    if (!selectedRoleKeys.length) {
      message.warning("Chọn ít nhất một vai trò để ủy quyền")
      return
    }

    const selectedKeys = new Set(selectedRoleKeys)
    const grants = currentRoles.flatMap((role, index) => {
      const roleKey = getRoleKey(role, index)
      if (!selectedKeys.has(roleKey) || !role.sRoleId) return []
      const roleMasks = bitMasks[roleKey] ?? {}
      return [
        {
          sRoleId: role.sRoleId,
          permissions: role.Permissions.flatMap((permission) => {
            if (!permission.sFormName) return []
            const owned = ownedMask(permission)
            const selected = withViewBit(roleMasks[permission.sFormName] ?? 0, owned)
            if (selected === 0) return []
            return [{ sFormName: permission.sFormName, lPermission: selected }]
          }),
        },
      ]
    })

    const grantsWithBits = grants.filter((grant) => grant.permissions.length > 0)
    if (!grantsWithBits.length) {
      message.warning("Chọn ít nhất một quyền trong vai trò để ủy quyền")
      return
    }

    let response: Awaited<ReturnType<typeof assignDelegation.mutateAsync>>
    try {
      response = await assignDelegation.mutateAsync({
        data: {
          recipientIds: selectedUserIds,
          grants: grantsWithBits,
          granterId: currentUserId,
        },
      })
    } catch {
      message.error("Không gán được quyền")
      return
    }
    if (response.status !== 200) {
      const errorMessage =
        typeof response.data === "string"
          ? response.data
          : response.data.message || "Không gán được quyền"
      message.error(errorMessage)
      return
    }

    const { assigned, skippedRecipientIds, skippedRoleIds } = response.data
    message.success(`Đã gán quyền cho ${assigned} người`)
    if (skippedRecipientIds.length || skippedRoleIds.length) {
      message.warning("Một số người nhận hoặc vai trò không hợp lệ nên đã được bỏ qua")
    }
    await queryClient.invalidateQueries({
      queryKey: getListGrantedRolesQueryKey({ granterId: currentUserId }),
    })
  }

  const handleRevoke = async (grantIds: string[]) => {
    if (!currentUserId) {
      message.warning("Chưa xác định được người giao")
      return
    }
    if (!grantIds.length) {
      message.warning("Chọn quyền cần thu hồi")
      return
    }

    let response: Awaited<ReturnType<typeof revokeGrants.mutateAsync>>
    try {
      response = await revokeGrants.mutateAsync({
        data: { grantIds, granterId: currentUserId },
      })
    } catch {
      message.error("Không thu hồi được quyền")
      return
    }
    if (response.status !== 200) {
      const errorMessage =
        typeof response.data === "string"
          ? response.data
          : response.data.message || "Không thu hồi được quyền"
      message.error(errorMessage)
      return
    }

    message.success(`Đã thu hồi ${response.data.revoked} quyền`)
    setSelectedGrantIds((current) => current.filter((id) => !grantIds.includes(id)))
    await queryClient.invalidateQueries({
      queryKey: getListGrantedRolesQueryKey({ granterId: currentUserId }),
    })
  }

  const grantColumns: ColumnsType<GrantedRole> = [
    {
      title: "Người nhận",
      key: "recipient",
      render: (_, row) => row.fullname || row.code || row.recipientId,
    },
    {
      title: "Mã / số hiệu",
      key: "code",
      width: 140,
      render: (_, row) => row.code || row.officerNumber || "—",
    },
    {
      title: "Vai trò",
      key: "role",
      width: 200,
      render: (_, row) => row.sRoleName || row.sCodeName || row.sRoleId,
    },
    {
      title: "Quyền đã giao",
      key: "permissions",
      render: (_, row) => (
        <Flex vertical gap={6}>
          {row.permissions.map((permission) => (
            <Flex key={permission.sFormName} vertical gap={4}>
              <Typography.Text>{permission.sTen || permission.sFormName}</Typography.Text>
              {formatMaskTags(permission.lPermission)}
            </Flex>
          ))}
        </Flex>
      ),
    },
    {
      title: "",
      key: "revoke",
      width: 120,
      align: "center",
      render: (_, row) => (
        <Popconfirm
          title="Thu hồi quyền này?"
          description="Người nhận sẽ mất các quyền của lần giao này."
          okText="Thu hồi"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleRevoke([row.id])}
        >
          <Button type="link" danger icon={<Undo2 size={16} />} disabled={!canAssign}>
            Thu hồi
          </Button>
        </Popconfirm>
      ),
    },
  ]

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
          description="Tick vai trò cần ủy quyền. Trong chi tiết, chọn từng quyền như Thêm hoặc Sửa. Bảng bên dưới liệt kê các lần đã giao; thu hồi sẽ tắt quyền đó của người nhận."
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
                    loading={assignDelegation.isPending}
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

      <Card
        title="Quyền đã ủy quyền"
        extra={
          <Popconfirm
            title={`Thu hồi ${selectedGrantIds.length} quyền đã chọn?`}
            description="Người nhận sẽ mất các quyền của những lần giao này."
            okText="Thu hồi"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={!selectedGrantIds.length}
            onConfirm={() => handleRevoke(selectedGrantIds)}
          >
            {/* <Button
              danger
              icon={<Undo2 size={16} />}
              disabled={!canAssign || !selectedGrantIds.length}
              loading={revokeGrants.isPending}
            >
              Thu hồi đã chọn
            </Button> */}
          </Popconfirm>
        }
      >
        {grantsError ? <Alert type="error" showIcon message={grantsError} className="mb-3" /> : null}
        <Table
          rowKey="id"
          size="small"
          loading={loadingGrants || revokeGrants.isPending}
          columns={grantColumns}
          dataSource={grantedRoles}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: "Chưa ủy quyền cho ai" }}
          rowSelection={{
            selectedRowKeys: selectedGrantIds,
            onChange: (keys) => setSelectedGrantIds(keys.map(String)),
          }}
        />
      </Card>

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
