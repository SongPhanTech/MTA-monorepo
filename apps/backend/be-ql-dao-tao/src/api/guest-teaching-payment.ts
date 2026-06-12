import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

type NationalityLite = { sMa?: string | null; sTen?: string | null } | null | undefined

// GV được coi là "nước ngoài" nếu có quốc tịch và không phải Việt Nam.
function isForeignNationality(nationality: NationalityLite): boolean {
  const ma = nationality?.sMa?.trim().toUpperCase()
  const ten = nationality?.sTen?.trim().toLowerCase()
  if (!ma && !ten) return false
  if (ma === "VN" || ma === "VNM" || ma === "704") return false
  if (ten && (ten.includes("việt nam") || ten.includes("viet nam"))) return false
  return Boolean(ma || ten)
}

type RateKeyed = {
  rankKey: string | null
  degreeKey: string | null
  isForeign: boolean
  ratePerPeriod: unknown
}

function normalizeName(name: string | null | undefined): string | null {
  const n = name?.trim().toLowerCase()
  return n ? n : null
}

function resolveRate(
  rates: RateKeyed[],
  rankKey: string | null,
  degreeKey: string | null,
  isForeign: boolean
): RateKeyed | null {
  let best: RateKeyed | null = null
  let bestScore = -1
  for (const r of rates) {
    if (r.rankKey && r.rankKey !== rankKey) continue
    if (r.degreeKey && r.degreeKey !== degreeKey) continue
    const score =
      (r.isForeign === isForeign ? 100 : 0) + (r.rankKey ? 2 : 0) + (r.degreeKey ? 1 : 0)
    if (score > bestScore) {
      bestScore = score
      best = r
    }
  }
  return best
}

const CalculateBodySchema = z.object({
  semesterId: z.string().openapi(fieldDesc("ID học kỳ cần kết toán (Semester).")),
  dryRun: z
    .boolean()
    .optional()
    .default(false)
    .openapi(fieldDesc("true = chỉ tính thử, không ghi dữ liệu.", false)),
})

const UnresolvedItemSchema = z.object({
  lecturerId: z.string(),
  lecturerName: z.string(),
  hiringOrgId: z.string().nullable(),
  reason: z.string(),
})

const PayableItemSchema = z.object({
  lecturerId: z.string(),
  lecturerName: z.string(),
  hiringOrgId: z.string(),
  hiringOrgName: z.string(),
  totalPeriods: z.number(),
  ratePerPeriod: z.number(),
  amount: z.number(),
  action: z.enum(["create", "update", "skippedPaid"]),
})

const CalculateResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Thông báo kết quả.")),
    dryRun: z.boolean(),
    totalGroups: z.number().openapi(fieldDesc("Số nhóm (GV × học kỳ × khoa) tính được.")),
    created: z.number().openapi(fieldDesc("Số bản ghi tạo mới.")),
    updated: z.number().openapi(fieldDesc("Số bản ghi cập nhật.")),
    skippedPaid: z.number().openapi(fieldDesc("Số bản ghi đã thanh toán nên bỏ qua.")),
    items: z
      .array(PayableItemSchema)
      .openapi(fieldDesc("Chi tiết từng nhóm tính được (GV, số tiết, đơn giá, thành tiền).")),
    unresolved: z
      .array(UnresolvedItemSchema)
      .openapi(fieldDesc("Nhóm không xác định được đơn giá / khoa chủ trì.")),
    time: z.number().openapi(fieldDesc("Thời gian xử lý (ms).")),
  })
  .openapi("GuestTeachingCalculateResult")

const calculateRoute = createRoute({
  operationId: "calculate-guest-teaching-payment",
  tags: ["Thanh toán mời giảng"],
  path: "/calculate",
  method: "post",
  summary: "Kết toán thanh toán mời giảng theo học kỳ",
  description: `Tính (kết toán) tiền mời giảng cho giảng viên ngoài học viện trong một học kỳ.

**Nguồn số tiết:** PCGV — SubjectClass có giảng viên chính là GV ngoài (LecturerType.isExternal = true), đã duyệt phân công (approveLecturerAssignmentAt khác null), cộng dồn SubjectVersion.period.

**Đơn giá:** giải theo chức danh (học hàm × học vị × trong/ngoài nước) từ bộ đơn giá (GuestTeachingRateConfig) của năm học chứa học kỳ.

**Gom nhóm & ghi:** theo (giảng viên × học kỳ × khoa chủ trì = SubjectVersion.managementOrganization), upsert vào GuestTeachingPayment. Bản ghi đã ở trạng thái PAID sẽ được giữ nguyên (bỏ qua).

**Tham số:** semesterId, dryRun (mặc định false).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalculateBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Kết toán thành công",
      content: { "application/json": { schema: CalculateResponseSchema } },
    },
    400: {
      description: "Dữ liệu không hợp lệ / chưa cấu hình đơn giá",
      content: { "application/json": { schema: ErrorMessageResponseSchema } },
    },
  },
})

app.openapi(calculateRoute, async (c) => {
  const { semesterId, dryRun } = c.req.valid("json")
  const start = Date.now()

  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { id: true, schoolYearId: true },
  })
  if (!semester) {
    return c.json({ message: "Học kỳ không tồn tại" }, 400)
  }

  const config = await prisma.guestTeachingRateConfig.findUnique({
    where: { schoolYearId: semester.schoolYearId },
    include: {
      rates: {
        where: { active: true },
        select: {
          academicRankTypeId: true,
          academicDegreeTypeId: true,
          isForeign: true,
          ratePerPeriod: true,
        },
      },
    },
  })
  if (!config) {
    return c.json({ message: "Chưa cấu hình bộ đơn giá mời giảng cho năm học của học kỳ này" }, 400)
  }
  if (config.rates.length === 0) {
    return c.json({ message: "Bộ đơn giá mời giảng của năm học chưa có dòng đơn giá nào" }, 400)
  }
  const [hocHams, hocVis] = await Promise.all([
    prisma.dM_HocHam.findMany({ select: { Id: true, sTen: true } }),
    prisma.dM_HocVi.findMany({ select: { Id: true, sTen: true } }),
  ])
  const rankNameById = new Map(hocHams.map((h) => [h.Id, normalizeName(h.sTen)]))
  const degreeNameById = new Map(hocVis.map((d) => [d.Id, normalizeName(d.sTen)]))

  const keyedRates: RateKeyed[] = config.rates.map((r) => ({
    rankKey: r.academicRankTypeId ? (rankNameById.get(r.academicRankTypeId) ?? null) : null,
    degreeKey: r.academicDegreeTypeId ? (degreeNameById.get(r.academicDegreeTypeId) ?? null) : null,
    isForeign: r.isForeign,
    ratePerPeriod: r.ratePerPeriod,
  }))
  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      semesterId,
      cancelled: false,
      approveLecturerAssignmentAt: { not: null },
      mainLecturer: { is: { lecturerType: { is: { isExternal: true } } } },
    },
    select: {
      id: true,
      lecturerId: true,
      subject: { select: { period: true, managementOrganizationId: true } },
      mainLecturer: {
        select: {
          id: true,
          userProfile: {
            select: {
              firstName: true,
              lastName: true,
              fullname: true,
              academicRankTypeId: true,
              academicDegreeTypeId: true,
              nationality: { select: { sMa: true, sTen: true } },
            },
          },
        },
      },
    },
  })

  interface Group {
    lecturerId: string
    lecturerName: string
    hiringOrgId: string | null
    rankKey: string | null
    degreeKey: string | null
    isForeign: boolean
    totalPeriods: number
  }
  const groups = new Map<string, Group>()

  for (const sc of subjectClasses) {
    const lecturerId = sc.lecturerId
    if (!lecturerId) continue
    const profile = sc.mainLecturer?.userProfile
    const hiringOrgId = sc.subject?.managementOrganizationId ?? null
    const key = `${lecturerId}__${hiringOrgId ?? "-"}`
    const name =
      `${profile?.lastName ?? ""} ${profile?.firstName ?? ""}`.trim() || profile?.fullname || ""

    const existing = groups.get(key)
    if (existing) {
      existing.totalPeriods += sc.subject?.period ?? 0
    } else {
      const rankId = profile?.academicRankTypeId
      const degreeId = profile?.academicDegreeTypeId
      groups.set(key, {
        lecturerId,
        lecturerName: name,
        hiringOrgId,
        rankKey: rankId ? (rankNameById.get(rankId) ?? null) : null,
        degreeKey: degreeId ? (degreeNameById.get(degreeId) ?? null) : null,
        isForeign: isForeignNationality(profile?.nationality),
        totalPeriods: sc.subject?.period ?? 0,
      })
    }
  }

  const unresolved: {
    lecturerId: string
    lecturerName: string
    hiringOrgId: string | null
    reason: string
  }[] = []

  interface Payable {
    lecturerId: string
    lecturerName: string
    hiringOrgId: string
    totalPeriods: number
    ratePerPeriod: number
    amount: number
  }
  const payables: Payable[] = []

  for (const g of groups.values()) {
    if (!g.hiringOrgId) {
      unresolved.push({
        lecturerId: g.lecturerId,
        lecturerName: g.lecturerName,
        hiringOrgId: null,
        reason: "Môn học không có khoa chủ trì (managementOrganization)",
      })
      continue
    }
    const rate = resolveRate(keyedRates, g.rankKey, g.degreeKey, g.isForeign)
    if (!rate) {
      unresolved.push({
        lecturerId: g.lecturerId,
        lecturerName: g.lecturerName,
        hiringOrgId: g.hiringOrgId,
        reason: "Không tìm thấy đơn giá phù hợp với chức danh",
      })
      continue
    }
    const ratePerPeriod = Number(rate.ratePerPeriod)
    payables.push({
      lecturerId: g.lecturerId,
      lecturerName: g.lecturerName,
      hiringOrgId: g.hiringOrgId,
      totalPeriods: g.totalPeriods,
      ratePerPeriod,
      amount: g.totalPeriods * ratePerPeriod,
    })
  }

  // Tên khoa chủ trì để hiển thị preview
  const hiringOrgIds = Array.from(new Set(payables.map((p) => p.hiringOrgId)))
  const hiringOrgs = hiringOrgIds.length
    ? await prisma.dM_DonVi.findMany({
        where: { Id: { in: hiringOrgIds } },
        select: { Id: true, sTen: true },
      })
    : []
  const hiringOrgNameById = new Map(hiringOrgs.map((o) => [o.Id, o.sTen ?? ""]))

  const existingPayments = await prisma.guestTeachingPayment.findMany({
    where: { semesterId },
    select: { lecturerId: true, hiringOrgId: true, status: true },
  })
  const existingMap = new Map(
    existingPayments.map((p) => [`${p.lecturerId}__${p.hiringOrgId}`, p.status])
  )
  const items = payables.map((p) => {
    const existingStatus = existingMap.get(`${p.lecturerId}__${p.hiringOrgId}`)
    const action: "create" | "update" | "skippedPaid" =
      existingStatus === "PAID" ? "skippedPaid" : existingStatus === undefined ? "create" : "update"
    return {
      lecturerId: p.lecturerId,
      lecturerName: p.lecturerName,
      hiringOrgId: p.hiringOrgId,
      hiringOrgName: hiringOrgNameById.get(p.hiringOrgId) ?? "",
      totalPeriods: p.totalPeriods,
      ratePerPeriod: p.ratePerPeriod,
      amount: p.amount,
      action,
    }
  })

  const created = items.filter((i) => i.action === "create").length
  const updated = items.filter((i) => i.action === "update").length
  const skippedPaid = items.filter((i) => i.action === "skippedPaid").length

  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.action === "skippedPaid") continue
        await tx.guestTeachingPayment.upsert({
          where: {
            lecturerId_semesterId_hiringOrgId: {
              lecturerId: item.lecturerId,
              semesterId,
              hiringOrgId: item.hiringOrgId,
            },
          },
          create: {
            lecturerId: item.lecturerId,
            semesterId,
            hiringOrgId: item.hiringOrgId,
            totalPeriods: item.totalPeriods,
            ratePerPeriod: item.ratePerPeriod,
            amount: item.amount,
          },
          update: {
            totalPeriods: item.totalPeriods,
            ratePerPeriod: item.ratePerPeriod,
            amount: item.amount,
          },
        })
      }
    })
  }

  return c.json(
    {
      message: dryRun
        ? `Tính thử xong: ${payables.length} nhóm, ${unresolved.length} chưa giải được`
        : `Kết toán xong: tạo ${created}, cập nhật ${updated}, bỏ qua (đã TT) ${skippedPaid}`,
      dryRun,
      totalGroups: groups.size,
      created,
      updated,
      skippedPaid,
      items,
      unresolved,
      time: Date.now() - start,
    },
    200
  )
})

export default app
