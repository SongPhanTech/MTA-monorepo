import DefaultLayout from "@layouts/default-layout"
import useSpinner from "@hooks/spinner"
import {
  useCreateGuestTeachingRate,
  useCreateGuestTeachingRateConfig,
  useDeleteGuestTeachingRate,
  useDeleteGuestTeachingRateConfig,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyGuestTeachingRate,
  useFindManyGuestTeachingRateConfig,
  useFindManySchoolYear,
  useUpdateGuestTeachingRate,
} from "@workspace/db/hooks"
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
} from "antd"
import { useEffect, useMemo, useRef, useState } from "react"

interface RateRow {
  key: string
  id?: string
  academicRankTypeId: string | null
  academicDegreeTypeId: string | null
  isForeign: boolean
  ratePerPeriod: number
}

function toNum(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (
    typeof value === "object" &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber()
  }
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function comboKey(rank: string | null, degree: string | null, isForeign: boolean) {
  return `${rank ?? "-"}__${degree ?? "-"}__${isForeign ? "1" : "0"}`
}

export default function CauHinhThanhToanGiangVienNgoai() {
  const { showSpinner, hideSpinner } = useSpinner()

  const [selectedConfigId, setSelectedConfigId] = useState<string>()
  const [isEditing, setIsEditing] = useState(false)
  const [dataSource, setDataSource] = useState<RateRow[]>([])
  const [initialDataSource, setInitialDataSource] = useState<RateRow[]>([])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newSchoolYearId, setNewSchoolYearId] = useState<string>()
  const [newConfigName, setNewConfigName] = useState("")

  const rowSeq = useRef(0)
  const nextKey = () => `row-${rowSeq.current++}`

  const { data: configs = [], refetch: refetchConfigs } = useFindManyGuestTeachingRateConfig({
    orderBy: { createdAt: "desc" },
    include: { schoolYear: { select: { id: true, name: true } } },
  })

  const { data: schoolYears = [] } = useFindManySchoolYear({
    where: { active: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  })

  const { data: rankTypes = [] } = useFindManyDM_HocHam({
    where: { bActive: true, bDeleted: false },
    orderBy: { iSTT: "asc" },
    select: { Id: true, sTen: true },
  })

  const { data: degreeTypes = [] } = useFindManyDM_HocVi({
    where: { bActive: true, bDeleted: false },
    orderBy: { iSTT: "asc" },
    select: { Id: true, sTen: true },
  })

  const { data: rates = [], refetch: refetchRates } = useFindManyGuestTeachingRate(
    { where: { configId: selectedConfigId } },
    { enabled: !!selectedConfigId }
  )

  const { mutateAsync: createConfig } = useCreateGuestTeachingRateConfig()
  const { mutateAsync: deleteConfig } = useDeleteGuestTeachingRateConfig()
  const { mutateAsync: createRate } = useCreateGuestTeachingRate()
  const { mutateAsync: updateRate } = useUpdateGuestTeachingRate()
  const { mutateAsync: deleteRate } = useDeleteGuestTeachingRate()

  const selectedConfig = useMemo(
    () => configs.find((c) => c.id === selectedConfigId),
    [configs, selectedConfigId]
  )

  const rankNameById = useMemo(
    () => new Map(rankTypes.map((r) => [r.Id, r.sTen ?? ""])),
    [rankTypes]
  )
  const degreeNameById = useMemo(
    () => new Map(degreeTypes.map((d) => [d.Id, d.sTen ?? ""])),
    [degreeTypes]
  )
  const availableSchoolYears = useMemo(() => {
    const used = new Set(configs.map((c) => c.schoolYearId))
    return schoolYears.filter((y) => !used.has(y.id))
  }, [configs, schoolYears])

  useEffect(() => {
    if (!selectedConfigId && configs.length > 0) {
      setSelectedConfigId(configs[0].id)
    }
  }, [configs, selectedConfigId])

  useEffect(() => {
    if (!selectedConfigId) {
      setDataSource([])
      setInitialDataSource([])
      return
    }
    const rows: RateRow[] = rates.map((r) => ({
      key: nextKey(),
      id: r.id,
      academicRankTypeId: r.academicRankTypeId ?? null,
      academicDegreeTypeId: r.academicDegreeTypeId ?? null,
      isForeign: r.isForeign,
      ratePerPeriod: toNum(r.ratePerPeriod),
    }))
    setDataSource(rows)
    setInitialDataSource(JSON.parse(JSON.stringify(rows)))
    setIsEditing(false)
  }, [rates, selectedConfigId])

  const updateRow = (key: string, patch: Partial<RateRow>) => {
    setDataSource((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const handleAddRow = () => {
    setDataSource((prev) => [
      ...prev,
      {
        key: nextKey(),
        academicRankTypeId: null,
        academicDegreeTypeId: null,
        isForeign: false,
        ratePerPeriod: 0,
      },
    ])
  }

  const handleRemoveRow = (key: string) => {
    setDataSource((prev) => prev.filter((row) => row.key !== key))
  }

  const handleCreateConfig = async () => {
    if (!newSchoolYearId) {
      message.warning("Vui lòng chọn năm học")
      return
    }
    const year = schoolYears.find((y) => y.id === newSchoolYearId)
    const name = newConfigName.trim() || `Đơn giá mời giảng ${year?.name ?? ""}`.trim()
    showSpinner()
    try {
      const created = await createConfig({
        data: {
          name,
          schoolYear: { connect: { id: newSchoolYearId } },
        },
      })
      message.success("Đã tạo bộ đơn giá mời giảng")
      setCreateModalOpen(false)
      setNewSchoolYearId(undefined)
      setNewConfigName("")
      await refetchConfigs()
      if (created?.id) setSelectedConfigId(created.id)
    } catch {
      message.error("Tạo bộ đơn giá thất bại")
    } finally {
      hideSpinner()
    }
  }

  const handleDeleteConfig = () => {
    if (!selectedConfigId) return
    Modal.confirm({
      title: "Xóa bộ đơn giá mời giảng",
      content: "Toàn bộ đơn giá trong năm học này sẽ bị xóa. Bạn có chắc chắn?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        showSpinner()
        try {
          await deleteConfig({ where: { id: selectedConfigId } })
          message.success("Đã xóa bộ đơn giá")
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

  const restoreInitial = () => {
    setDataSource(JSON.parse(JSON.stringify(initialDataSource)))
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedConfigId) return

    if (dataSource.some((row) => !row.ratePerPeriod || row.ratePerPeriod <= 0)) {
      message.warning("Đơn giá/tiết phải lớn hơn 0 ở tất cả các dòng")
      return
    }

    const seen = new Set<string>()
    for (const row of dataSource) {
      const k = comboKey(row.academicRankTypeId, row.academicDegreeTypeId, row.isForeign)
      if (seen.has(k)) {
        message.warning("Có dòng bị trùng tổ hợp Học hàm / Học vị / Trong-Ngoài nước")
        return
      }
      seen.add(k)
    }

    showSpinner()
    try {
      const initialById = new Map(initialDataSource.filter((r) => r.id).map((r) => [r.id!, r]))
      const currentIds = new Set(dataSource.filter((r) => r.id).map((r) => r.id!))

      const promises: Promise<unknown>[] = []

      for (const init of initialDataSource) {
        if (init.id && !currentIds.has(init.id)) {
          promises.push(deleteRate({ where: { id: init.id } }))
        }
      }

      for (const row of dataSource) {
        const data = {
          academicRankTypeId: row.academicRankTypeId,
          academicDegreeTypeId: row.academicDegreeTypeId,
          isForeign: row.isForeign,
          ratePerPeriod: row.ratePerPeriod,
        }
        if (!row.id) {
          promises.push(
            createRate({
              data: { ...data, configId: selectedConfigId },
            })
          )
          continue
        }
        const init = initialById.get(row.id)
        const changed =
          !init ||
          init.academicRankTypeId !== row.academicRankTypeId ||
          init.academicDegreeTypeId !== row.academicDegreeTypeId ||
          init.isForeign !== row.isForeign ||
          init.ratePerPeriod !== row.ratePerPeriod
        if (changed) {
          promises.push(updateRate({ where: { id: row.id }, data }))
        }
      }

      if (promises.length === 0) {
        message.info("Không có thay đổi nào được thực hiện.")
        setIsEditing(false)
        return
      }

      await Promise.all(promises)
      message.success("Đã lưu đơn giá mời giảng")
      setIsEditing(false)
      await refetchRates()
    } catch {
      message.error("Lưu thất bại. Vui lòng kiểm tra lại.")
    } finally {
      hideSpinner()
    }
  }

  const rankOptions = rankTypes.map((r) => ({ value: r.Id, label: r.sTen }))
  const degreeOptions = degreeTypes.map((d) => ({ value: d.Id, label: d.sTen }))

  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center" as const,
      render: (_: unknown, __: RateRow, index: number) => index + 1,
    },
    {
      title: "Học hàm",
      dataIndex: "academicRankTypeId",
      width: 220,
      render: (_: unknown, row: RateRow) =>
        isEditing ? (
          <Select
            allowClear
            className="w-full"
            placeholder="(Không yêu cầu)"
            value={row.academicRankTypeId ?? undefined}
            options={rankOptions}
            onChange={(v) => updateRow(row.key, { academicRankTypeId: v ?? null })}
          />
        ) : (
          rankNameById.get(row.academicRankTypeId ?? "") || "(Không yêu cầu)"
        ),
    },
    {
      title: "Học vị",
      dataIndex: "academicDegreeTypeId",
      width: 220,
      render: (_: unknown, row: RateRow) =>
        isEditing ? (
          <Select
            allowClear
            className="w-full"
            placeholder="(Không yêu cầu)"
            value={row.academicDegreeTypeId ?? undefined}
            options={degreeOptions}
            onChange={(v) => updateRow(row.key, { academicDegreeTypeId: v ?? null })}
          />
        ) : (
          degreeNameById.get(row.academicDegreeTypeId ?? "") || "(Không yêu cầu)"
        ),
    },
    {
      title: "Phạm vi",
      dataIndex: "isForeign",
      width: 160,
      align: "center" as const,
      render: (_: unknown, row: RateRow) =>
        isEditing ? (
          <Select
            className="w-full"
            value={row.isForeign}
            options={[
              { value: false, label: "Trong nước" },
              { value: true, label: "Nước ngoài" },
            ]}
            onChange={(v) => updateRow(row.key, { isForeign: v })}
          />
        ) : row.isForeign ? (
          "Nước ngoài"
        ) : (
          "Trong nước"
        ),
    },
    {
      title: "Đơn giá / tiết (VNĐ)",
      dataIndex: "ratePerPeriod",
      width: 220,
      align: "right" as const,
      render: (_: unknown, row: RateRow) =>
        isEditing ? (
          <InputNumber
            className="w-full"
            min={0}
            value={row.ratePerPeriod}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number((v ?? "").replace(/[^\d]/g, ""))}
            onChange={(v) => updateRow(row.key, { ratePerPeriod: typeof v === "number" ? v : 0 })}
          />
        ) : row.ratePerPeriod ? (
          `${new Intl.NumberFormat("vi-VN").format(row.ratePerPeriod)} VNĐ`
        ) : (
          "-"
        ),
    },
    ...(isEditing
      ? [
          {
            title: "Thao tác",
            width: 100,
            align: "center" as const,
            render: (_: unknown, row: RateRow) => (
              <Button danger type="link" onClick={() => handleRemoveRow(row.key)}>
                Xóa
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card size="small" title="Đơn giá mời giảng theo năm học (Điều 7)">
          <Flex gap={12} wrap align="center">
            <span className="font-medium">Chọn năm học:</span>
            <Select
              className="min-w-[280px]"
              placeholder="Chọn bộ đơn giá theo năm học"
              value={selectedConfigId}
              options={configs.map((c) => ({
                value: c.id,
                label: c.schoolYear?.name ?? c.name,
              }))}
              onChange={(id) => {
                setSelectedConfigId(id)
                setIsEditing(false)
              }}
            />
            <Button
              type="primary"
              onClick={() => setCreateModalOpen(true)}
              disabled={availableSchoolYears.length === 0}
            >
              Thêm bộ đơn giá
            </Button>
            <Button danger disabled={!selectedConfigId} onClick={handleDeleteConfig}>
              Xóa bộ đơn giá
            </Button>
          </Flex>
        </Card>
      </Col>

      {selectedConfigId ? (
        <Col span={24}>
          <Card
            size="small"
            title={`Đơn giá/tiết — ${selectedConfig?.schoolYear?.name ?? selectedConfig?.name ?? ""}`}
            extra={
              !isEditing ? (
                <Button type="primary" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
              ) : (
                <Space>
                  <Button onClick={restoreInitial}>Hủy</Button>
                  <Button type="primary" onClick={handleSave}>
                    Lưu thay đổi
                  </Button>
                </Space>
              )
            }
          >
            {isEditing && (
              <Flex justify="end" className="mb-3">
                <Button onClick={handleAddRow}>+ Thêm dòng đơn giá</Button>
              </Flex>
            )}
            <Table
              rowKey="key"
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              bordered
              locale={{ emptyText: <Empty description="Chưa có dòng đơn giá nào" /> }}
            />
            <p className="mt-3 mb-0 text-neutral-500">
              Để trống Học hàm/Học vị nghĩa là đơn giá áp dụng chung (không yêu cầu chức danh đó).
              Khi tính, hệ thống chọn mức khớp cụ thể nhất.
            </p>
          </Card>
        </Col>
      ) : (
        <Col span={24}>
          <Card>
            <p className="mb-0 text-neutral-600">
              Chưa có bộ đơn giá mời giảng. Nhấn &quot;Thêm bộ đơn giá&quot; để tạo cho một năm học.
            </p>
          </Card>
        </Col>
      )}

      <Modal
        title="Thêm bộ đơn giá mời giảng"
        open={createModalOpen}
        onOk={handleCreateConfig}
        onCancel={() => {
          setCreateModalOpen(false)
          setNewSchoolYearId(undefined)
          setNewConfigName("")
        }}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Flex vertical gap={12}>
          <div>
            <div className="mb-1">Năm học</div>
            <Select
              className="w-full"
              placeholder="Chọn năm học"
              value={newSchoolYearId}
              options={availableSchoolYears.map((y) => ({ value: y.id, label: y.name }))}
              onChange={setNewSchoolYearId}
            />
          </div>
          <div>
            <div className="mb-1">Tên bộ đơn giá (tùy chọn)</div>
            <Input
              placeholder="Mặc định: Đơn giá mời giảng <năm học>"
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
            />
          </div>
        </Flex>
      </Modal>
    </Row>
  )
}

CauHinhThanhToanGiangVienNgoai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
