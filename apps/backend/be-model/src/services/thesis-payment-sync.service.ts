import { PaymentStatus, SupervisorRole } from "@workspace/db/client"
import Decimal from "decimal.js"
import { prisma } from ".."
import {
  getCouncilDefaultPayAmount,
  getSupervisorDefaultPayAmount,
  readDecimalAmount,
} from "./thesis-payment.helpers"
import { loadThesisProjectsForPayment } from "./thesis-payment-query"

const SYNC_CONCURRENCY = 8

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  if (!items.length) return
  let nextIndex = 0
  const poolSize = Math.min(limit, items.length)
  await Promise.all(
    Array.from({ length: poolSize }, async () => {
      while (nextIndex < items.length) {
        const current = items[nextIndex]
        nextIndex += 1
        await worker(current)
      }
    })
  )
}

function paymentAmount(p: { amount?: unknown } | null | undefined) {
  return readDecimalAmount(p?.amount)
}

function projectHasSupervisor(project: {
  supervisor?: unknown | null
  coSupervisor?: unknown | null
}) {
  return !!(project.supervisor || project.coSupervisor)
}

function projectNeedsSupervisorPaymentSync(project: {
  id: string
  supervisor?: { lecturer?: unknown; lecturerId?: string | null } | null
  coSupervisor?: { lecturer?: unknown; lecturerId?: string | null } | null
  supervisorPaymentId?: string | null
  coSupervisorPaymentId?: string | null
  singleSupervisorPaymentId?: string | null
  supervisorPayment?: { amount?: unknown } | null
  coSupervisorPayment?: { amount?: unknown } | null
  singleSupervisorPayment?: { amount?: unknown } | null
}) {
  const supExpert = project.supervisor
  const coExpert = project.coSupervisor
  if (!supExpert && !coExpert) return false

  const oldSinglePayId = project.singleSupervisorPaymentId
  const oldSupPayId = project.supervisorPaymentId
  const oldCoPayId = project.coSupervisorPaymentId

  if (supExpert && coExpert) {
    const supMissing = !project.supervisorPaymentId || paymentAmount(project.supervisorPayment) <= 0
    const coMissing =
      !project.coSupervisorPaymentId || paymentAmount(project.coSupervisorPayment) <= 0
    return supMissing || coMissing || !!oldSinglePayId
  }

  const singleMissing =
    !project.singleSupervisorPaymentId || paymentAmount(project.singleSupervisorPayment) <= 0
  return singleMissing || !!(oldSupPayId || oldCoPayId)
}

function resolveSupervisorDefaults(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number]
) {
  const embedded = project.thesisSession?.configPayment?.supervisorPayAmounts
  return embedded?.length ? embedded : []
}

async function createSupervisorPayment(
  amount: number,
  projectId: string,
  link: "supervisor" | "coSupervisor" | "single"
) {
  const base = {
    amount: new Decimal(amount),
    status: PaymentStatus.PENDING,
  }
  const data =
    link === "supervisor"
      ? { ...base, thesisProjects: { connect: { id: projectId } } }
      : link === "coSupervisor"
        ? { ...base, coThesisProjects: { connect: { id: projectId } } }
        : { ...base, singleSupervisorPayment: { connect: { id: projectId } } }
  return prisma.supervisorPaymentRecord.create({ data, select: { id: true } })
}

async function deleteSupervisorPayments(ids: string[]) {
  if (!ids.length) return
  await prisma.supervisorPaymentRecord.deleteMany({ where: { id: { in: ids } } })
}

async function recreateSupervisorPaymentsForProject(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number]
) {
  const defaults = resolveSupervisorDefaults(project)
  const pendingDeleteIds: string[] = []
  const queueDelete = (id?: string | null) => {
    if (id) pendingDeleteIds.push(id)
  }

  const supExpert = project.supervisor
  const coExpert = project.coSupervisor
  if (!supExpert && !coExpert) return

  const oldSupPayId = project.supervisorPaymentId
  const oldCoPayId = project.coSupervisorPaymentId
  const oldSinglePayId = project.singleSupervisorPaymentId

  if (supExpert && coExpert) {
    const inAcSup = !!(supExpert.lecturer || supExpert.lecturerId)
    const inAcCo = !!(coExpert.lecturer || coExpert.lecturerId)
    const amtSup = getSupervisorDefaultPayAmount(defaults, SupervisorRole.SUPERVISOR, inAcSup)
    const amtCo = getSupervisorDefaultPayAmount(defaults, SupervisorRole.CO_SUPERVISOR, inAcCo)

    queueDelete(oldSupPayId)
    queueDelete(oldCoPayId)
    queueDelete(oldSinglePayId)

    const [createdSup, createdCo] = await Promise.all([
      createSupervisorPayment(amtSup, project.id, "supervisor"),
      createSupervisorPayment(amtCo, project.id, "coSupervisor"),
    ])

    await prisma.thesisProject.update({
      where: { id: project.id },
      data: {
        singleSupervisorPayment: { disconnect: true },
        supervisorPayment: { connect: { id: createdSup.id } },
        coSupervisorPayment: { connect: { id: createdCo.id } },
      },
    })
    await deleteSupervisorPayments(pendingDeleteIds)
    return
  }

  const expert = supExpert || coExpert
  if (!expert) return

  const inAc = !!(expert.lecturer || expert.lecturerId)
  const amtSingle = getSupervisorDefaultPayAmount(defaults, SupervisorRole.SINGLE, inAc)

  queueDelete(oldSupPayId)
  queueDelete(oldCoPayId)
  queueDelete(oldSinglePayId)

  const created = await createSupervisorPayment(amtSingle, project.id, "single")
  await prisma.thesisProject.update({
    where: { id: project.id },
    data: {
      supervisorPayment: { disconnect: true },
      coSupervisorPayment: { disconnect: true },
      singleSupervisorPayment: { connect: { id: created.id } },
    },
  })
  await deleteSupervisorPayments(pendingDeleteIds)
}

async function ensureSupervisorPaymentForProject(
  project: Awaited<ReturnType<typeof loadThesisProjectsForPayment>>[number],
  recreateAll: boolean
) {
  if (recreateAll) {
    if (!projectHasSupervisor(project)) return
    await recreateSupervisorPaymentsForProject(project)
    return
  }
  if (!projectNeedsSupervisorPaymentSync(project)) return

  const defaults = resolveSupervisorDefaults(project)
  const pendingDeleteIds: string[] = []
  const queueDelete = (id?: string | null) => {
    if (id) pendingDeleteIds.push(id)
  }

  const supExpert = project.supervisor
  const coExpert = project.coSupervisor
  if (!supExpert && !coExpert) return

  const oldSupPayId = project.supervisorPaymentId
  const oldCoPayId = project.coSupervisorPaymentId
  const oldSinglePayId = project.singleSupervisorPaymentId

  if (supExpert && coExpert) {
    const inAcSup = !!(supExpert.lecturer || supExpert.lecturerId)
    const inAcCo = !!(coExpert.lecturer || coExpert.lecturerId)
    const amtSup = getSupervisorDefaultPayAmount(defaults, SupervisorRole.SUPERVISOR, inAcSup)
    const amtCo = getSupervisorDefaultPayAmount(defaults, SupervisorRole.CO_SUPERVISOR, inAcCo)

    const supMissing = !project.supervisorPaymentId || paymentAmount(project.supervisorPayment) <= 0
    const coMissing =
      !project.coSupervisorPaymentId || paymentAmount(project.coSupervisorPayment) <= 0
    const mustClearSingle = !!oldSinglePayId

    if (!supMissing && !coMissing && mustClearSingle) {
      await prisma.thesisProject.update({
        where: { id: project.id },
        data: { singleSupervisorPayment: { disconnect: true } },
      })
      queueDelete(oldSinglePayId)
      await deleteSupervisorPayments(pendingDeleteIds)
      return
    }

    let newSupId = oldSupPayId
    let newCoId = oldCoPayId

    if (supMissing) {
      const created = await createSupervisorPayment(amtSup, project.id, "supervisor")
      newSupId = created.id
    }
    if (coMissing) {
      const created = await createSupervisorPayment(amtCo, project.id, "coSupervisor")
      newCoId = created.id
    }

    await prisma.thesisProject.update({
      where: { id: project.id },
      data: {
        singleSupervisorPayment: { disconnect: true },
        supervisorPayment: newSupId ? { connect: { id: newSupId } } : { disconnect: true },
        coSupervisorPayment: newCoId ? { connect: { id: newCoId } } : { disconnect: true },
      },
    })

    if (mustClearSingle) queueDelete(oldSinglePayId)
    if (supMissing && oldSupPayId && newSupId && oldSupPayId !== newSupId) queueDelete(oldSupPayId)
    if (coMissing && oldCoPayId && newCoId && oldCoPayId !== newCoPayId) queueDelete(oldCoPayId)
    await deleteSupervisorPayments(pendingDeleteIds)
    return
  }

  const expert = supExpert || coExpert
  if (!expert) return

  const inAc = !!(expert.lecturer || expert.lecturerId)
  const amtSingle = getSupervisorDefaultPayAmount(defaults, SupervisorRole.SINGLE, inAc)
  const singleMissing =
    !project.singleSupervisorPaymentId || paymentAmount(project.singleSupervisorPayment) <= 0
  const mustClearDual = !!(oldSupPayId || oldCoPayId)

  if (!singleMissing && mustClearDual) {
    await prisma.thesisProject.update({
      where: { id: project.id },
      data: {
        supervisorPayment: { disconnect: true },
        coSupervisorPayment: { disconnect: true },
      },
    })
    queueDelete(oldSupPayId)
    queueDelete(oldCoPayId)
    await deleteSupervisorPayments(pendingDeleteIds)
    return
  }

  let newSingleId = oldSinglePayId
  if (singleMissing) {
    const created = await createSupervisorPayment(amtSingle, project.id, "single")
    newSingleId = created.id
  }

  await prisma.thesisProject.update({
    where: { id: project.id },
    data: {
      supervisorPayment: { disconnect: true },
      coSupervisorPayment: { disconnect: true },
      singleSupervisorPayment: newSingleId
        ? { connect: { id: newSingleId } }
        : { disconnect: true },
    },
  })

  queueDelete(oldSupPayId)
  queueDelete(oldCoPayId)
  if (singleMissing && oldSinglePayId && newSingleId && oldSinglePayId !== newSingleId) {
    queueDelete(oldSinglePayId)
  }
  await deleteSupervisorPayments(pendingDeleteIds)
}

export async function syncCouncilPaymentsForThesisSession(params: {
  thesisSessionId: string
  studentIds?: string[]
  recreateAll: boolean
}) {
  const session = await prisma.thesisSession.findUnique({
    where: { id: params.thesisSessionId },
    include: {
      configPayment: {
        include: { councilPayAmounts: true },
      },
    },
  })
  if (!session?.configPaymentSessionId) {
    throw new Error("Đợt xét chưa gán định mức thanh toán.")
  }

  const projects = await loadThesisProjectsForPayment(params.thesisSessionId, params.studentIds)
  const fallbackDefaults = session.configPayment?.councilPayAmounts ?? []
  const processedMemberIds = new Set<string>()
  let syncedCount = 0

  for (const project of projects) {
    const members = project.council?.members ?? []
    if (!members.length) continue

    const councilDefaults = project.thesisSession?.configPayment?.councilPayAmounts?.length
      ? project.thesisSession.configPayment.councilPayAmounts
      : fallbackDefaults

    for (const member of members) {
      if (!member.id || processedMemberIds.has(member.id)) continue
      processedMemberIds.add(member.id)

      const expert = member.expert
      const inAcademy = !!(expert?.lecturerId || expert?.lecturer)
      const defaultAmount = getCouncilDefaultPayAmount(councilDefaults, member.role, inAcademy)

      if (params.recreateAll) {
        if (member.payment?.id) {
          await prisma.paymentRecord.update({
            where: { id: member.payment.id },
            data: { amount: new Decimal(defaultAmount) },
          })
          syncedCount += 1
        } else if (defaultAmount > 0) {
          await prisma.paymentRecord.create({
            data: {
              amount: new Decimal(defaultAmount),
              status: PaymentStatus.PENDING,
              councilMember: { connect: { id: member.id } },
            },
          })
          syncedCount += 1
        }
        continue
      }

      const recorded = readDecimalAmount(member.payment?.amount)
      if (recorded <= 0 && defaultAmount > 0) {
        await prisma.paymentRecord.create({
          data: {
            amount: new Decimal(defaultAmount),
            status: PaymentStatus.PENDING,
            councilMember: { connect: { id: member.id } },
          },
        })
        syncedCount += 1
      }
    }
  }

  return { syncedCount, projectCount: projects.length }
}

export async function syncSupervisorPaymentsForThesisSession(params: {
  thesisSessionId: string
  studentIds?: string[]
  recreateAll: boolean
}) {
  const session = await prisma.thesisSession.findUnique({
    where: { id: params.thesisSessionId },
    select: { configPaymentSessionId: true },
  })
  if (!session?.configPaymentSessionId) {
    throw new Error("Đợt xét chưa gán định mức thanh toán.")
  }

  const projects = await loadThesisProjectsForPayment(params.thesisSessionId, params.studentIds)
  const toSync = params.recreateAll
    ? projects.filter(projectHasSupervisor)
    : projects.filter(projectNeedsSupervisorPaymentSync)

  await runWithConcurrency(toSync, SYNC_CONCURRENCY, (project) =>
    ensureSupervisorPaymentForProject(project, params.recreateAll)
  )

  return { syncedCount: toSync.length, projectCount: projects.length }
}
