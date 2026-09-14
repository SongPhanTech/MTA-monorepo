import { PaymentStatus, SupervisorRole } from "@workspace/db/client"
import { versionInAcademy } from "./expert-select"

const THESIS_PAY_DESCRIPTION = "THESIS"

export type DefaultSupervisorPayAmountRow = {
  role: SupervisorRole
  amount: number | string | { toNumber?: () => number }
  inAcademy: boolean
  description?: string | null
}

function readDecimalAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || 0
  if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value) || 0
}

function getSupervisorDefaultPayAmount(
  amounts: DefaultSupervisorPayAmountRow[] | undefined,
  role: SupervisorRole,
  inAcademy: boolean
): number {
  if (!amounts?.length) return 0
  const row =
    amounts.find(
      (x) =>
        x.role === role &&
        x.inAcademy === inAcademy &&
        (x.description === THESIS_PAY_DESCRIPTION || !x.description)
    ) ?? amounts.find((x) => x.role === role && x.inAcademy === inAcademy)
  return row ? readDecimalAmount(row.amount) : 0
}

function resolveSupervisorPayAmountsForProject(
  project:
    | {
        thesisSession?: {
          configPayment?: { supervisorPayAmounts?: DefaultSupervisorPayAmountRow[] }
        }
      }
    | null
    | undefined,
  fallback: DefaultSupervisorPayAmountRow[] = []
): DefaultSupervisorPayAmountRow[] {
  const embedded = project?.thesisSession?.configPayment?.supervisorPayAmounts
  if (embedded?.length) return embedded
  return fallback
}

const DEFAULT_CONCURRENCY = 8

export type SupervisorPaymentEnsureDeps = {
  getDefaultPay: (project: any, role: SupervisorRole, inAcademy: boolean) => number
  createPayment: (payload: {
    amount: number
    projectId: string
    link: "supervisor" | "coSupervisor" | "single"
  }) => Promise<{ id: string } | undefined>
  updateProject: (projectId: string, data: Record<string, unknown>) => Promise<void>
  deletePayments: (ids: string[]) => Promise<void>
}

function paymentAmount(p: { amount?: unknown } | null | undefined) {
  return readDecimalAmount(p?.amount)
}

export function projectHasSupervisorForPayment(project: any): boolean {
  if (!project?.id) return false
  return !!(project.supervisor || project.coSupervisor)
}

/** Không cần gọi API nếu payment đã đủ và đúng kiểu liên kết. */
export function projectNeedsSupervisorPaymentSync(project: any): boolean {
  if (!project?.id) return false
  const supExpert = project.supervisor
  const coExpert = project.coSupervisor
  if (!supExpert && !coExpert) return false

  const oldSinglePayId = project.singleSupervisorPaymentId as string | undefined
  const oldSupPayId = project.supervisorPaymentId as string | undefined
  const oldCoPayId = project.coSupervisorPaymentId as string | undefined

  if (supExpert && coExpert) {
    const supMissing = !project.supervisorPaymentId || paymentAmount(project.supervisorPayment) <= 0
    const coMissing =
      !project.coSupervisorPaymentId || paymentAmount(project.coSupervisorPayment) <= 0
    const mustClearSingle = !!oldSinglePayId
    return supMissing || coMissing || mustClearSingle
  }

  const singleMissing =
    !project.singleSupervisorPaymentId || paymentAmount(project.singleSupervisorPayment) <= 0
  const mustClearDual = !!(oldSupPayId || oldCoPayId)
  return singleMissing || mustClearDual
}

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

async function recreateAllSupervisorPaymentsForProject(
  project: any,
  deps: SupervisorPaymentEnsureDeps
) {
  const { getDefaultPay, createPayment, updateProject, deletePayments } = deps
  const pendingDeleteIds: string[] = []
  const queueDelete = (id?: string | null) => {
    if (id) pendingDeleteIds.push(id)
  }

  const supExpert = project.supervisor || null
  const coExpert = project.coSupervisor || null
  if (!supExpert && !coExpert) return

  const oldSupPayId = project.supervisorPaymentId as string | undefined
  const oldCoPayId = project.coSupervisorPaymentId as string | undefined
  const oldSinglePayId = project.singleSupervisorPaymentId as string | undefined

  if (supExpert && coExpert) {
    const inAcSup = versionInAcademy(supExpert)
    const inAcCo = versionInAcademy(coExpert)
    const amtSup = getDefaultPay(project, SupervisorRole.SUPERVISOR, inAcSup)
    const amtCo = getDefaultPay(project, SupervisorRole.CO_SUPERVISOR, inAcCo)

    queueDelete(oldSupPayId)
    queueDelete(oldCoPayId)
    queueDelete(oldSinglePayId)

    const [createdSup, createdCo] = await Promise.all([
      createPayment({ amount: amtSup, projectId: project.id, link: "supervisor" }),
      createPayment({ amount: amtCo, projectId: project.id, link: "coSupervisor" }),
    ])
    if (!createdSup?.id || !createdCo?.id) return

    await updateProject(project.id, {
      singleSupervisorPayment: { disconnect: true },
      supervisorPayment: { connect: { id: createdSup.id } },
      coSupervisorPayment: { connect: { id: createdCo.id } },
    })

    project.singleSupervisorPaymentId = null
    project.singleSupervisorPayment = null
    project.supervisorPaymentId = createdSup.id
    project.coSupervisorPaymentId = createdCo.id
    project.supervisorPayment = { id: createdSup.id, amount: amtSup }
    project.coSupervisorPayment = { id: createdCo.id, amount: amtCo }

    await deletePayments(pendingDeleteIds)
    return
  }

  const expert = supExpert || coExpert
  if (!expert) return

  const inAc = versionInAcademy(expert)
  const amtSingle = getDefaultPay(project, SupervisorRole.SINGLE, inAc)

  queueDelete(oldSupPayId)
  queueDelete(oldCoPayId)
  queueDelete(oldSinglePayId)

  const created = await createPayment({
    amount: amtSingle,
    projectId: project.id,
    link: "single",
  })
  if (!created?.id) return

  await updateProject(project.id, {
    supervisorPayment: { disconnect: true },
    coSupervisorPayment: { disconnect: true },
    singleSupervisorPayment: { connect: { id: created.id } },
  })

  project.supervisorPaymentId = null
  project.coSupervisorPaymentId = null
  project.supervisorPayment = null
  project.coSupervisorPayment = null
  project.singleSupervisorPaymentId = created.id
  project.singleSupervisorPayment = { id: created.id, amount: amtSingle }

  await deletePayments(pendingDeleteIds)
}

export async function ensureSupervisorPaymentForProject(
  project: any,
  deps: SupervisorPaymentEnsureDeps,
  options?: { recreateAll?: boolean }
) {
  if (!project?.id) return
  if (options?.recreateAll) {
    if (!projectHasSupervisorForPayment(project)) return
    await recreateAllSupervisorPaymentsForProject(project, deps)
    return
  }
  if (!projectNeedsSupervisorPaymentSync(project)) return

  const { getDefaultPay, createPayment, updateProject, deletePayments } = deps
  const pendingDeleteIds: string[] = []
  const queueDelete = (id?: string | null) => {
    if (id) pendingDeleteIds.push(id)
  }

  const supExpert = project.supervisor || null
  const coExpert = project.coSupervisor || null
  if (!supExpert && !coExpert) return

  const oldSupPayId = project.supervisorPaymentId as string | undefined
  const oldCoPayId = project.coSupervisorPaymentId as string | undefined
  const oldSinglePayId = project.singleSupervisorPaymentId as string | undefined

  if (supExpert && coExpert) {
    const inAcSup = versionInAcademy(supExpert)
    const inAcCo = versionInAcademy(coExpert)
    const amtSup = getDefaultPay(project, SupervisorRole.SUPERVISOR, inAcSup)
    const amtCo = getDefaultPay(project, SupervisorRole.CO_SUPERVISOR, inAcCo)

    const supMissing = !project.supervisorPaymentId || paymentAmount(project.supervisorPayment) <= 0
    const coMissing =
      !project.coSupervisorPaymentId || paymentAmount(project.coSupervisorPayment) <= 0
    const mustClearSingle = !!oldSinglePayId

    if (!supMissing && !coMissing && mustClearSingle) {
      await updateProject(project.id, {
        singleSupervisorPayment: { disconnect: true },
      })
      queueDelete(oldSinglePayId)
      project.singleSupervisorPaymentId = null
      project.singleSupervisorPayment = null
      await deletePayments(pendingDeleteIds)
      return
    }

    let newSupId = oldSupPayId
    let newCoId = oldCoPayId

    const [createdSup, createdCo] = await Promise.all([
      supMissing
        ? createPayment({ amount: amtSup, projectId: project.id, link: "supervisor" })
        : Promise.resolve(undefined),
      coMissing
        ? createPayment({ amount: amtCo, projectId: project.id, link: "coSupervisor" })
        : Promise.resolve(undefined),
    ])

    if (supMissing) {
      if (!createdSup?.id) return
      newSupId = createdSup.id
    }
    if (coMissing) {
      if (!createdCo?.id) return
      newCoId = createdCo.id
    }

    await updateProject(project.id, {
      singleSupervisorPayment: { disconnect: true },
      supervisorPayment: newSupId ? { connect: { id: newSupId } } : { disconnect: true },
      coSupervisorPayment: newCoId ? { connect: { id: newCoId } } : { disconnect: true },
    })

    if (mustClearSingle) queueDelete(oldSinglePayId)
    if (supMissing && oldSupPayId && newSupId && oldSupPayId !== newSupId) {
      queueDelete(oldSupPayId)
    }
    if (coMissing && oldCoPayId && newCoId && oldCoPayId !== newCoId) {
      queueDelete(oldCoPayId)
    }

    project.singleSupervisorPaymentId = null
    project.singleSupervisorPayment = null
    project.supervisorPaymentId = newSupId
    project.coSupervisorPaymentId = newCoId
    project.supervisorPayment = newSupId
      ? { ...project.supervisorPayment, id: newSupId, amount: amtSup }
      : null
    project.coSupervisorPayment = newCoId
      ? { ...project.coSupervisorPayment, id: newCoId, amount: amtCo }
      : null

    await deletePayments(pendingDeleteIds)
    return
  }

  const expert = supExpert || coExpert
  if (!expert) return

  const inAc = versionInAcademy(expert)
  const amtSingle = getDefaultPay(project, SupervisorRole.SINGLE, inAc)

  const singleMissing =
    !project.singleSupervisorPaymentId || paymentAmount(project.singleSupervisorPayment) <= 0
  const mustClearDual = !!(oldSupPayId || oldCoPayId)

  if (!singleMissing && mustClearDual) {
    await updateProject(project.id, {
      supervisorPayment: { disconnect: true },
      coSupervisorPayment: { disconnect: true },
    })
    queueDelete(oldSupPayId)
    queueDelete(oldCoPayId)
    project.supervisorPaymentId = null
    project.coSupervisorPaymentId = null
    project.supervisorPayment = null
    project.coSupervisorPayment = null
    await deletePayments(pendingDeleteIds)
    return
  }

  let newSingleId = oldSinglePayId

  if (singleMissing) {
    const created = await createPayment({
      amount: amtSingle,
      projectId: project.id,
      link: "single",
    })
    if (!created?.id) return
    newSingleId = created.id
  }

  await updateProject(project.id, {
    supervisorPayment: { disconnect: true },
    coSupervisorPayment: { disconnect: true },
    singleSupervisorPayment: newSingleId ? { connect: { id: newSingleId } } : { disconnect: true },
  })

  queueDelete(oldSupPayId)
  queueDelete(oldCoPayId)
  if (singleMissing && oldSinglePayId && newSingleId && oldSinglePayId !== newSingleId) {
    queueDelete(oldSinglePayId)
  }

  project.supervisorPaymentId = null
  project.coSupervisorPaymentId = null
  project.supervisorPayment = null
  project.coSupervisorPayment = null
  project.singleSupervisorPaymentId = newSingleId
  project.singleSupervisorPayment = newSingleId
    ? { ...project.singleSupervisorPayment, id: newSingleId, amount: amtSingle }
    : null

  await deletePayments(pendingDeleteIds)
}

export async function ensureSupervisorPaymentsBatch(
  projects: any[],
  deps: SupervisorPaymentEnsureDeps,
  concurrency = DEFAULT_CONCURRENCY,
  options?: { recreateAll?: boolean }
) {
  const recreateAll = options?.recreateAll ?? false
  const toSync = recreateAll
    ? projects.filter(projectHasSupervisorForPayment)
    : projects.filter(projectNeedsSupervisorPaymentSync)
  if (!toSync.length) return

  await runWithConcurrency(toSync, concurrency, (project) =>
    ensureSupervisorPaymentForProject(project, deps, { recreateAll })
  )
}

export function buildSupervisorPaymentRows(
  project: any,
  defaultSupervisorPayAmounts: DefaultSupervisorPayAmountRow[] = []
) {
  const rows: Array<{
    expert: any
    amount: number
    bankAccountNumber: string
    bankName: string
  }> = []

  const defaults = resolveSupervisorPayAmountsForProject(project, defaultSupervisorPayAmounts)

  const resolveAmount = (
    recorded: unknown,
    role: SupervisorRole,
    expert: { lecturer?: unknown; lecturerId?: string | null } | null | undefined
  ) => {
    const amount = readDecimalAmount(recorded)
    if (amount > 0) return amount
    const inAcademy = versionInAcademy(expert)
    return getSupervisorDefaultPayAmount(defaults, role, inAcademy)
  }

  if (project.singleSupervisorPaymentId || project.singleSupervisorPayment) {
    const expert = project.supervisor || project.coSupervisor
    if (expert) {
      rows.push({
        expert,
        amount: resolveAmount(
          project.singleSupervisorPayment?.amount,
          SupervisorRole.SINGLE,
          expert
        ),
        bankAccountNumber: expert.bankAccountNumber || "",
        bankName: expert.bankName || "",
      })
    }
    return rows
  }

  if (project.supervisor) {
    rows.push({
      expert: project.supervisor,
      amount: resolveAmount(
        project.supervisorPayment?.amount,
        SupervisorRole.SUPERVISOR,
        project.supervisor
      ),
      bankAccountNumber: project.supervisor.bankAccountNumber || "",
      bankName: project.supervisor.bankName || "",
    })
  }
  if (project.coSupervisor) {
    rows.push({
      expert: project.coSupervisor,
      amount: resolveAmount(
        project.coSupervisorPayment?.amount,
        SupervisorRole.CO_SUPERVISOR,
        project.coSupervisor
      ),
      bankAccountNumber: project.coSupervisor.bankAccountNumber || "",
      bankName: project.coSupervisor.bankName || "",
    })
  }
  return rows
}
