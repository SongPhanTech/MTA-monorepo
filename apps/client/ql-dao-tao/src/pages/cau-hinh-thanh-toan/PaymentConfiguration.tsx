import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { CouncilRole, SupervisorRole } from "@workspace/db"
import {
  useCreateConfigPaymentSession,
  useCreateDefaultCouncilRolePayAmount,
  useCreateDefaultSupervisorPayAmount,
  useDeleteConfigPaymentSession,
  useFindManyConfigPaymentSession,
  useFindManyDefaultCouncilRolePayAmount,
  useFindManyDefaultSupervisorPayAmount,
  useFindManyThesisSession,
  useUpdateConfigPaymentSession,
  useUpdateDefaultCouncilRolePayAmount,
  useUpdateDefaultSupervisorPayAmount,
  useUpdateManyThesisSession,
} from "@workspace/db/hooks"
import { Button, Card, Col, Flex, Input, message, Modal, Row, Select, Space } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"

const THESIS_PAY_DESCRIPTION = "THESIS"
const PROJECT_PAY_DESCRIPTION = "PROJECT"

const RoleType: Map<SupervisorRole | CouncilRole, string> = new Map([
  [CouncilRole.CHAIRMAN, "Chủ tịch"],
  [CouncilRole.SECRETARY, "Thư ký"],
  [CouncilRole.REVIEWER_1, "Phản biện 1"],
  [CouncilRole.REVIEWER_2, "Phản biện 2"],
  [CouncilRole.MEMBER, "Ủy viên"],
  [SupervisorRole.SUPERVISOR, "Chuyên gia hướng dẫn (GVHD1)"],
  [SupervisorRole.CO_SUPERVISOR, "Chuyên gia hướng dẫn phụ (GVHD2)"],
  [SupervisorRole.SINGLE, "Chuyên gia hướng dẫn độc lập"],
])

const COUNCIL_PLACEHOLDER_ROLES: { roleName: string; role: CouncilRole }[] = [
  { roleName: "Chủ tịch", role: CouncilRole.CHAIRMAN },
  { roleName: "Thư ký", role: CouncilRole.SECRETARY },
  { roleName: "Phản biện 1", role: CouncilRole.REVIEWER_1 },
  { roleName: "Phản biện 2", role: CouncilRole.REVIEWER_2 },
  { roleName: "Ủy viên", role: CouncilRole.MEMBER },
]

const SUPERVISOR_PLACEHOLDER_ROLES: { roleName: string; role: SupervisorRole }[] = [
  { roleName: "Chuyên gia hướng dẫn (GVHD1)", role: SupervisorRole.SUPERVISOR },
  { roleName: "Chuyên gia hướng dẫn phụ (GVHD2)", role: SupervisorRole.CO_SUPERVISOR },
  { roleName: "Chuyên gia hướng dẫn độc lập", role: SupervisorRole.SINGLE },
]

const ROLE_ORDER = [
  "Chủ tịch",
  "Thư ký",
  "Phản biện 1",
  "Phản biện 2",
  "Ủy viên",
  "Chuyên gia hướng dẫn (GVHD1)",
  "Chuyên gia hướng dẫn phụ (GVHD2)",
  "Chuyên gia hướng dẫn độc lập",
]

const PAY_AMOUNT_CELL_DEFS: Array<{
  idKey: "idProjectIn" | "idProjectOut" | "idThesisIn" | "idThesisOut"
  valueKey: "projectIn" | "projectOut" | "thesisIn" | "thesisOut"
  description: string
  inAcademy: boolean
}> = [
  {
    idKey: "idProjectIn",
    valueKey: "projectIn",
    description: PROJECT_PAY_DESCRIPTION,
    inAcademy: true,
  },
  {
    idKey: "idProjectOut",
    valueKey: "projectOut",
    description: PROJECT_PAY_DESCRIPTION,
    inAcademy: false,
  },
  {
    idKey: "idThesisIn",
    valueKey: "thesisIn",
    description: THESIS_PAY_DESCRIPTION,
    inAcademy: true,
  },
  {
    idKey: "idThesisOut",
    valueKey: "thesisOut",
    description: THESIS_PAY_DESCRIPTION,
    inAcademy: false,
  },
]

const THESIS_PAY_CELLS = [
  { idKey: "idIn" as const, valueKey: "amountIn" as const, inAcademy: true },
  { idKey: "idOut" as const, valueKey: "amountOut" as const, inAcademy: false },
] as const

function formatAmountInputDisplay(n: number) {
  if (n === 0 || Number.isNaN(n)) return ""
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function parseAmountInput(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits === "") return 0
  const n = Number.parseInt(digits, 10)
  return Number.isNaN(n) ? 0 : n
}

interface GroupedRecordData {
  roleName: string
  type: "COUNCIL" | "SUPERVISOR"
  idProjectIn: string
  idProjectOut: string
  idThesisIn: string
  idThesisOut: string
  projectIn: number
  projectOut: number
  thesisIn: number
  thesisOut: number
}

interface ThesisGroupedRow {
  roleName: string
  type: "COUNCIL" | "SUPERVISOR"
  idIn: string
  idOut: string
  amountIn: number
  amountOut: number
}

function buildProjectGroupedData(
  councilRolePayAmounts: Array<{
    id: string
    role: CouncilRole | SupervisorRole
    amount: { toNumber: () => number }
    inAcademy: boolean
    description: string | null
  }>,
  supervisorPayAmounts: Array<{
    id: string
    role: CouncilRole | SupervisorRole
    amount: { toNumber: () => number }
    inAcademy: boolean
    description: string | null
  }>
): GroupedRecordData[] {
  const map = new Map<string, GroupedRecordData>()
  const allRawData = [
    ...councilRolePayAmounts.map((item) => ({ ...item, type: "COUNCIL" as const })),
    ...supervisorPayAmounts.map((item) => ({ ...item, type: "SUPERVISOR" as const })),
  ]

  allRawData.forEach((item) => {
    const roleName = RoleType.get(item.role) ?? "N/A"
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: item.type,
        idProjectIn: "",
        idProjectOut: "",
        idThesisIn: "",
        idThesisOut: "",
        projectIn: 0,
        projectOut: 0,
        thesisIn: 0,
        thesisOut: 0,
      })
    }
    const current = map.get(roleName)!
    const amount = item.amount.toNumber()
    if (item.description === PROJECT_PAY_DESCRIPTION) {
      if (item.inAcademy) {
        current.projectIn = amount
        current.idProjectIn = item.id
      } else {
        current.projectOut = amount
        current.idProjectOut = item.id
      }
    } else if (item.description === THESIS_PAY_DESCRIPTION) {
      if (item.inAcademy) {
        current.thesisIn = amount
        current.idThesisIn = item.id
      } else {
        current.thesisOut = amount
        current.idThesisOut = item.id
      }
    }
  })

  for (const { roleName } of COUNCIL_PLACEHOLDER_ROLES) {
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: "COUNCIL",
        idProjectIn: "",
        idProjectOut: "",
        idThesisIn: "",
        idThesisOut: "",
        projectIn: 0,
        projectOut: 0,
        thesisIn: 0,
        thesisOut: 0,
      })
    }
  }
  for (const { roleName } of SUPERVISOR_PLACEHOLDER_ROLES) {
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: "SUPERVISOR",
        idProjectIn: "",
        idProjectOut: "",
        idThesisIn: "",
        idThesisOut: "",
        projectIn: 0,
        projectOut: 0,
        thesisIn: 0,
        thesisOut: 0,
      })
    }
  }

  return ROLE_ORDER.map((name) => map.get(name)).filter(
    (item): item is GroupedRecordData => item !== undefined
  )
}

function buildThesisGroupedData(
  councilRolePayAmounts: Array<{
    id: string
    role: CouncilRole | SupervisorRole
    amount: { toNumber: () => number }
    inAcademy: boolean
  }>,
  supervisorPayAmounts: Array<{
    id: string
    role: CouncilRole | SupervisorRole
    amount: { toNumber: () => number }
    inAcademy: boolean
  }>
): ThesisGroupedRow[] {
  const map = new Map<string, ThesisGroupedRow>()
  const allRawData = [
    ...councilRolePayAmounts.map((item) => ({ ...item, type: "COUNCIL" as const })),
    ...supervisorPayAmounts.map((item) => ({ ...item, type: "SUPERVISOR" as const })),
  ]

  allRawData.forEach((item) => {
    const roleName = RoleType.get(item.role) ?? "N/A"
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: item.type,
        idIn: "",
        idOut: "",
        amountIn: 0,
        amountOut: 0,
      })
    }
    const current = map.get(roleName)!
    const amount = item.amount.toNumber()
    if (item.inAcademy) {
      current.amountIn = amount
      current.idIn = item.id
    } else {
      current.amountOut = amount
      current.idOut = item.id
    }
  })

  for (const { roleName } of COUNCIL_PLACEHOLDER_ROLES) {
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: "COUNCIL",
        idIn: "",
        idOut: "",
        amountIn: 0,
        amountOut: 0,
      })
    }
  }
  for (const { roleName } of SUPERVISOR_PLACEHOLDER_ROLES) {
    if (!map.has(roleName)) {
      map.set(roleName, {
        roleName,
        type: "SUPERVISOR",
        idIn: "",
        idOut: "",
        amountIn: 0,
        amountOut: 0,
      })
    }
  }

  return ROLE_ORDER.map((name) => map.get(name)).filter(
    (item): item is ThesisGroupedRow => item !== undefined
  )
}

function ProjectPaymentConfiguration() {
  const [isEditing, setIsEditing] = useState(false)
  const [dataSource, setDataSource] = useState<GroupedRecordData[]>([])
  const [initialDataSource, setInitialDataSource] = useState<GroupedRecordData[]>([])

  const { data: councilRolePayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount({
    where: { configPaymentSessionId: null },
  })
  const { data: supervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount({
    where: { configPaymentSessionId: null },
  })

  const { mutateAsync: updateCouncilPay } = useUpdateDefaultCouncilRolePayAmount()
  const { mutateAsync: updateSupervisorPay } = useUpdateDefaultSupervisorPayAmount()
  const { mutateAsync: createSupervisorPay } = useCreateDefaultSupervisorPayAmount()
  const { mutateAsync: createCouncilPay } = useCreateDefaultCouncilRolePayAmount()
  const { showSpinner, hideSpinner } = useSpinner()

  useEffect(() => {
    const data = buildProjectGroupedData(councilRolePayAmounts, supervisorPayAmounts)
    setDataSource(data)
    setInitialDataSource(JSON.parse(JSON.stringify(data)))
  }, [councilRolePayAmounts, supervisorPayAmounts])

  const handleInputChange = (raw: string, roleName: string, field: keyof GroupedRecordData) => {
    const value = parseAmountInput(raw)
    setDataSource((prev) =>
      prev.map((item) => (item.roleName === roleName ? { ...item, [field]: value } : item))
    )
  }

  const renderCell = (value: number, record: GroupedRecordData, field: keyof GroupedRecordData) => {
    if (isEditing) {
      const num = record[field] as number
      return (
        <Input
          inputMode="numeric"
          value={formatAmountInputDisplay(num)}
          style={{ width: "100%" }}
          onChange={(e) => handleInputChange(e.target.value, record.roleName, field)}
        />
      )
    }
    if (!value) return "-"
    return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`
  }

  const handleSave = async () => {
    showSpinner()
    try {
      const updatePromises: Promise<unknown>[] = []
      dataSource.forEach((item, index) => {
        const originalItem = initialDataSource[index]
        if (!originalItem) return

        if (item.type === "COUNCIL") {
          const councilRole = COUNCIL_PLACEHOLDER_ROLES.find(
            (r) => r.roleName === item.roleName
          )?.role
          if (!councilRole) return
          for (const { idKey, valueKey, description, inAcademy } of PAY_AMOUNT_CELL_DEFS) {
            if (description !== PROJECT_PAY_DESCRIPTION) continue
            const id = item[idKey]
            const current = item[valueKey]
            const original = originalItem[valueKey]
            if (id) {
              if (current !== original) {
                updatePromises.push(updateCouncilPay({ where: { id }, data: { amount: current } }))
              }
            } else if (current !== original && current !== 0) {
              updatePromises.push(
                createCouncilPay({
                  data: {
                    role: councilRole,
                    amount: current,
                    inAcademy,
                    description,
                  },
                })
              )
            }
          }
          return
        }

        const supervisorRole = SUPERVISOR_PLACEHOLDER_ROLES.find(
          (r) => r.roleName === item.roleName
        )?.role
        if (!supervisorRole) return
        for (const { idKey, valueKey, description, inAcademy } of PAY_AMOUNT_CELL_DEFS) {
          if (description !== PROJECT_PAY_DESCRIPTION) continue
          const id = item[idKey]
          const current = item[valueKey]
          const original = originalItem[valueKey]
          if (id) {
            if (current !== original) {
              updatePromises.push(updateSupervisorPay({ where: { id }, data: { amount: current } }))
            }
          } else if (current !== original && current !== 0) {
            updatePromises.push(
              createSupervisorPay({
                data: {
                  role: supervisorRole,
                  amount: current,
                  inAcademy,
                  description,
                },
              })
            )
          }
        }
      })

      if (updatePromises.length === 0) {
        message.info("Không có thay đổi nào được thực hiện.")
        setIsEditing(false)
        return
      }
      await Promise.all(updatePromises)
      message.success(`Đã cập nhật thành công ${updatePromises.length} thay đổi!`)
      setIsEditing(false)
    } catch {
      message.error("Cập nhật thất bại. Vui lòng kiểm tra lại.")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PaymentAmountTableLayout
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDataSource(JSON.parse(JSON.stringify(initialDataSource)))
        setIsEditing(false)
      }}
      onSave={handleSave}
      dataSource={dataSource}
      columns={[
        { title: "STT", width: 50, align: "center", render: (_, __, i) => i + 1 },
        { title: "Tên vai trò", width: 250, render: (_, r) => r.roleName },
        {
          title: "Thanh toán Đồ án",
          children: [
            {
              title: "Trong học viện (VNĐ)",
              width: 150,
              align: "center",
              render: (_, r: GroupedRecordData) => renderCell(r.projectIn, r, "projectIn"),
            },
            {
              title: "Ngoài học viện (VNĐ)",
              width: 150,
              align: "center",
              render: (_, r: GroupedRecordData) => renderCell(r.projectOut, r, "projectOut"),
            },
          ],
        },
      ]}
    />
  )
}

function ThesisPaymentConfiguration() {
  const [selectedConfigId, setSelectedConfigId] = useState<string>()
  const [configName, setConfigName] = useState("")
  const [linkedSessionIds, setLinkedSessionIds] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [dataSource, setDataSource] = useState<ThesisGroupedRow[]>([])
  const [initialDataSource, setInitialDataSource] = useState<ThesisGroupedRow[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newConfigName, setNewConfigName] = useState("")

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: paymentConfigs = [], refetch: refetchConfigs } = useFindManyConfigPaymentSession({
    orderBy: { createdAt: "desc" },
    include: {
      thesisSessions: { select: { id: true, name: true } },
      _count: { select: { thesisSessions: true } },
    },
  })

  const { data: allThesisSessions = [] } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, configPaymentSessionId: true },
  })

  const { data: councilPayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount(
    {
      where: { configPaymentSessionId: selectedConfigId },
    },
    { enabled: !!selectedConfigId }
  )

  const { data: supervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount(
    {
      where: { configPaymentSessionId: selectedConfigId },
    },
    { enabled: !!selectedConfigId }
  )

  const { mutateAsync: createConfig } = useCreateConfigPaymentSession()
  const { mutateAsync: updateConfig } = useUpdateConfigPaymentSession()
  const { mutateAsync: deleteConfig } = useDeleteConfigPaymentSession()
  const { mutateAsync: updateManyThesisSession } = useUpdateManyThesisSession()
  const { mutateAsync: updateCouncilPay } = useUpdateDefaultCouncilRolePayAmount()
  const { mutateAsync: updateSupervisorPay } = useUpdateDefaultSupervisorPayAmount()
  const { mutateAsync: createCouncilPay } = useCreateDefaultCouncilRolePayAmount()
  const { mutateAsync: createSupervisorPay } = useCreateDefaultSupervisorPayAmount()

  const selectedConfig = useMemo(
    () => paymentConfigs.find((c) => c.id === selectedConfigId),
    [paymentConfigs, selectedConfigId]
  )

  const thesisSessionOptions = useMemo(() => {
    return allThesisSessions
      .filter((s) => !s.configPaymentSessionId || s.configPaymentSessionId === selectedConfigId)
      .map((s) => ({
        value: s.id,
        label: s.name,
      }))
  }, [allThesisSessions, selectedConfigId])

  const syncConfigMeta = useCallback(
    (configId: string) => {
      const config = paymentConfigs.find((c) => c.id === configId)
      if (!config) return
      setConfigName(config.name)
      setLinkedSessionIds(config.thesisSessions?.map((s) => s.id) ?? [])
    },
    [paymentConfigs]
  )

  useEffect(() => {
    if (!selectedConfigId && paymentConfigs.length > 0) {
      setSelectedConfigId(paymentConfigs[0].id)
    }
  }, [paymentConfigs, selectedConfigId])

  useEffect(() => {
    if (selectedConfigId) {
      syncConfigMeta(selectedConfigId)
    }
  }, [selectedConfigId, syncConfigMeta])

  useEffect(() => {
    if (!selectedConfigId) {
      setDataSource([])
      setInitialDataSource([])
      return
    }
    const data = buildThesisGroupedData(councilPayAmounts, supervisorPayAmounts)
    setDataSource(data)
    setInitialDataSource(JSON.parse(JSON.stringify(data)))
  }, [councilPayAmounts, supervisorPayAmounts, selectedConfigId])

  const handleCreateConfig = async () => {
    const name = newConfigName.trim()
    if (!name) {
      message.warning("Vui lòng nhập tên mức thanh toán")
      return
    }
    showSpinner()
    try {
      const created = await createConfig({
        data: {
          name,
          councilPayAmounts: {
            create: COUNCIL_PLACEHOLDER_ROLES.flatMap(({ role }) => [
              {
                role,
                amount: 0,
                inAcademy: true,
                description: THESIS_PAY_DESCRIPTION,
              },
              {
                role,
                amount: 0,
                inAcademy: false,
                description: THESIS_PAY_DESCRIPTION,
              },
            ]),
          },
          supervisorPayAmounts: {
            create: SUPERVISOR_PLACEHOLDER_ROLES.flatMap(({ role }) => [
              {
                role,
                amount: 0,
                inAcademy: true,
                description: THESIS_PAY_DESCRIPTION,
              },
              {
                role,
                amount: 0,
                inAcademy: false,
                description: THESIS_PAY_DESCRIPTION,
              },
            ]),
          },
        },
        include: { thesisSessions: true },
      })
      message.success("Đã tạo mức thanh toán")
      setCreateModalOpen(false)
      setNewConfigName("")
      await refetchConfigs()
      if (created?.id) {
        setSelectedConfigId(created.id)
      }
    } catch {
      message.error("Tạo mức thanh toán thất bại")
    } finally {
      hideSpinner()
    }
  }

  const handleDeleteConfig = async () => {
    if (!selectedConfigId) return
    Modal.confirm({
      title: "Xóa mức thanh toán",
      content: "Các đợt xét gắn mức này sẽ được gỡ. Bạn có chắc chắn?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        showSpinner()
        try {
          await updateManyThesisSession({
            where: { configPaymentSessionId: selectedConfigId },
            data: { configPaymentSessionId: null },
          })
          await deleteConfig({ where: { id: selectedConfigId } })
          message.success("Đã xóa mức thanh toán")
          setSelectedConfigId(undefined)
          setIsEditing(false)
          await refetchConfigs()
        } catch {
          message.error("Xóa thất bại")
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const handleInputChange = (raw: string, roleName: string, field: "amountIn" | "amountOut") => {
    const value = parseAmountInput(raw)
    setDataSource((prev) =>
      prev.map((item) => (item.roleName === roleName ? { ...item, [field]: value } : item))
    )
  }

  const renderThesisCell = (
    value: number,
    record: ThesisGroupedRow,
    field: "amountIn" | "amountOut"
  ) => {
    if (isEditing) {
      return (
        <Input
          inputMode="numeric"
          value={formatAmountInputDisplay(record[field])}
          style={{ width: "100%" }}
          onChange={(e) => handleInputChange(e.target.value, record.roleName, field)}
        />
      )
    }
    if (!value) return "-"
    return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`
  }

  const handleSave = async () => {
    if (!selectedConfigId) return
    showSpinner()
    try {
      const metaChanged =
        configName.trim() !== (selectedConfig?.name ?? "") ||
        JSON.stringify([...linkedSessionIds].sort()) !==
          JSON.stringify((selectedConfig?.thesisSessions?.map((s) => s.id) ?? []).sort())

      if (metaChanged) {
        await updateConfig({
          where: { id: selectedConfigId },
          data: { name: configName.trim() },
        })
        await updateManyThesisSession({
          where: { configPaymentSessionId: selectedConfigId },
          data: { configPaymentSessionId: null },
        })
        if (linkedSessionIds.length > 0) {
          await updateManyThesisSession({
            where: { id: { in: linkedSessionIds } },
            data: { configPaymentSessionId: selectedConfigId },
          })
        }
      }

      const amountPromises: Promise<unknown>[] = []
      dataSource.forEach((item, index) => {
        const originalItem = initialDataSource[index]
        if (!originalItem) return

        if (item.type === "COUNCIL") {
          const councilRole = COUNCIL_PLACEHOLDER_ROLES.find(
            (r) => r.roleName === item.roleName
          )?.role
          if (!councilRole) return
          for (const { idKey, valueKey, inAcademy } of THESIS_PAY_CELLS) {
            const id = item[idKey]
            const current = item[valueKey]
            const original = originalItem[valueKey]
            if (id) {
              if (current !== original) {
                amountPromises.push(updateCouncilPay({ where: { id }, data: { amount: current } }))
              }
            } else if (current !== original && current !== 0) {
              amountPromises.push(
                createCouncilPay({
                  data: {
                    role: councilRole,
                    amount: current,
                    inAcademy,
                    description: THESIS_PAY_DESCRIPTION,
                    configPaymentSessionId: selectedConfigId,
                  },
                })
              )
            }
          }
          return
        }

        const supervisorRole = SUPERVISOR_PLACEHOLDER_ROLES.find(
          (r) => r.roleName === item.roleName
        )?.role
        if (!supervisorRole) return
        for (const { idKey, valueKey, inAcademy } of THESIS_PAY_CELLS) {
          const id = item[idKey]
          const current = item[valueKey]
          const original = originalItem[valueKey]
          if (id) {
            if (current !== original) {
              amountPromises.push(updateSupervisorPay({ where: { id }, data: { amount: current } }))
            }
          } else if (current !== original && current !== 0) {
            amountPromises.push(
              createSupervisorPay({
                data: {
                  role: supervisorRole,
                  amount: current,
                  inAcademy,
                  description: THESIS_PAY_DESCRIPTION,
                  configPaymentSessionId: selectedConfigId,
                },
              })
            )
          }
        }
      })

      if (!metaChanged && amountPromises.length === 0) {
        message.info("Không có thay đổi nào được thực hiện.")
        setIsEditing(false)
        return
      }

      await Promise.all(amountPromises)
      message.success("Đã lưu cấu hình thanh toán")
      setIsEditing(false)
      await refetchConfigs()
    } catch {
      message.error("Lưu thất bại. Vui lòng kiểm tra lại.")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small" title="Mức thanh toán luận văn">
            <Flex gap={12} wrap align="center">
              <span className="font-medium">Chọn mức:</span>
              <Select
                className="min-w-[280px]"
                placeholder="Chọn mức thanh toán"
                value={selectedConfigId}
                options={paymentConfigs.map((c) => ({
                  value: c.id,
                  label: `${c.name}`,
                }))}
                onChange={(id) => {
                  setSelectedConfigId(id)
                  setIsEditing(false)
                }}
              />
              <Button type="primary" onClick={() => setCreateModalOpen(true)}>
                Thêm mức thanh toán
              </Button>
              <Button danger disabled={!selectedConfigId} onClick={handleDeleteConfig}>
                Xóa mức
              </Button>
            </Flex>
          </Card>
        </Col>

        {selectedConfigId ? (
          <>
            <Col span={24}>
              <Card size="small" title="Thông tin mức thanh toán">
                <Flex vertical gap={12}>
                  <Flex align="center" gap={12} wrap>
                    <span className="min-w-[120px]">Tên mức:</span>
                    <Input
                      className="max-w-md"
                      value={configName}
                      disabled={!isEditing}
                      onChange={(e) => setConfigName(e.target.value)}
                    />
                  </Flex>
                  <Flex align="start" gap={12} wrap>
                    <span className="min-w-[120px] pt-1">Đợt xét áp dụng:</span>
                    <Select
                      mode="multiple"
                      className="flex-1 min-w-[320px]"
                      placeholder="Chọn một hoặc nhiều đợt xét (mỗi đợt chỉ thuộc một mức)"
                      value={linkedSessionIds}
                      disabled={!isEditing}
                      options={thesisSessionOptions}
                      onChange={setLinkedSessionIds}
                    />
                  </Flex>
                </Flex>
              </Card>
            </Col>
            <Col span={24}>
              <PaymentAmountTableLayout
                isEditing={isEditing}
                onEdit={() => setIsEditing(true)}
                onCancel={() => {
                  if (selectedConfigId) syncConfigMeta(selectedConfigId)
                  const data = buildThesisGroupedData(councilPayAmounts, supervisorPayAmounts)
                  setDataSource(data)
                  setInitialDataSource(JSON.parse(JSON.stringify(data)))
                  setIsEditing(false)
                }}
                onSave={handleSave}
                dataSource={dataSource}
                columns={[
                  { title: "STT", width: 50, align: "center", render: (_, __, i) => i + 1 },
                  { title: "Tên vai trò", width: 250, render: (_, r) => r.roleName },
                  {
                    title: "Thanh toán Luận văn",
                    children: [
                      {
                        title: "Trong học viện (VNĐ)",
                        width: 150,
                        align: "center",
                        render: (_, r: ThesisGroupedRow) =>
                          renderThesisCell(r.amountIn, r, "amountIn"),
                      },
                      {
                        title: "Ngoài học viện (VNĐ)",
                        width: 150,
                        align: "center",
                        render: (_, r: ThesisGroupedRow) =>
                          renderThesisCell(r.amountOut, r, "amountOut"),
                      },
                    ],
                  },
                ]}
              />
            </Col>
          </>
        ) : (
          <Col span={24}>
            <Card>
              <p className="mb-0 text-neutral-600">
                Chưa có mức thanh toán. Nhấn &quot;Thêm mức thanh toán&quot; để tạo bộ định mức cho
                luận văn.
              </p>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title="Thêm mức thanh toán luận văn"
        open={createModalOpen}
        onOk={handleCreateConfig}
        onCancel={() => {
          setCreateModalOpen(false)
          setNewConfigName("")
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên mức thanh toán (vd: Đợt xét K40 — mức chuẩn)"
          value={newConfigName}
          onChange={(e) => setNewConfigName(e.target.value)}
        />
      </Modal>
    </div>
  )
}

function PaymentAmountTableLayout({
  isEditing,
  onEdit,
  onCancel,
  onSave,
  dataSource,
  columns,
}: {
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  dataSource: GroupedRecordData[] | ThesisGroupedRow[]
  columns: Parameters<typeof Table>[0]["columns"]
}) {
  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Flex justify="end" className="mb-4">
          {!isEditing ? (
            <Button type="primary" onClick={onEdit}>
              Chỉnh sửa
            </Button>
          ) : (
            <Space>
              <Button onClick={onCancel}>Hủy</Button>
              <Button type="primary" onClick={onSave}>
                Lưu thay đổi
              </Button>
            </Space>
          )}
        </Flex>
        <Table
          rowKey="roleName"
          data={dataSource as GroupedRecordData[]}
          pagination={false}
          columns={columns}
        />
      </Col>
    </Row>
  )
}

export default function PaymentConfigurationPage({ isThesis }: { isThesis: boolean }) {
  if (isThesis) {
    return <ThesisPaymentConfiguration />
  }
  return <ProjectPaymentConfiguration />
}
