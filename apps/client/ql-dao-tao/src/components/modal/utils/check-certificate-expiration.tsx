import { useFindManyClassSchedule } from "@workspace/db/hooks"
import { Modal } from "antd"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"

export type CertExpirationItem = {
  studentId: string
  studentName: string
  studentFixedClassId: string | null
  certificateId: string
  expiredDate: Date | null
}

export type CertificateForCheck = {
  id: string
  subjects: Array<{
    subjectId: string
    subject?: { id?: string; name?: string | null } | null
  }>
}

export type Violation = {
  studentId: string
  studentName: string
  subjectName: string
  classDate: Date
  expiredDate: Date
}

type ScheduleArgs = any | null

function buildScheduleArgs(
  items: CertExpirationItem[],
  certificates: CertificateForCheck[]
): ScheduleArgs {
  const orClauses: any[] = []

  for (const item of items) {
    if (!item.expiredDate) continue
    if (!item.studentFixedClassId) continue
    const cert = certificates.find((c) => c.id === item.certificateId)
    const subjectIds = (cert?.subjects ?? [])
      .map((s) => s.subjectId)
      .filter((id): id is string => !!id)
    if (subjectIds.length === 0) continue

    orClauses.push({
      classDate: { gt: item.expiredDate },
      subjectClass: {
        subject: { subjectId: { in: subjectIds } },
        fixedClasses: { some: { id: item.studentFixedClassId } },
      },
    })
  }

  if (orClauses.length === 0) return null

  return {
    where: { OR: orClauses },
    include: {
      subjectClass: {
        include: {
          subject: { include: { subject: true } },
        },
      },
    },
    orderBy: { classDate: "asc" as const },
  }
}

function findViolations(
  schedules: any[],
  items: CertExpirationItem[],
  certificates: CertificateForCheck[]
): Violation[] {
  // Per (studentId + subjectId) keep only earliest classDate.
  const seen = new Map<string, Violation>()

  for (const item of items) {
    if (!item.expiredDate) continue
    const cert = certificates.find((c) => c.id === item.certificateId)
    const certSubjectIds = new Set((cert?.subjects ?? []).map((s) => s.subjectId).filter(Boolean))
    if (certSubjectIds.size === 0) continue

    for (const sch of schedules) {
      const baseSubjectId = sch?.subjectClass?.subject?.subjectId
      if (!baseSubjectId || !certSubjectIds.has(baseSubjectId)) continue

      // Confirm this schedule belongs to a SubjectClass the student is enrolled in.
      // The Prisma where already filters this server-side; here we trust the result.
      const classDate = sch?.classDate ? new Date(sch.classDate) : null
      if (!classDate || classDate <= item.expiredDate) continue

      const key = `${item.studentId}::${baseSubjectId}`
      const existing = seen.get(key)
      if (existing && existing.classDate <= classDate) continue

      seen.set(key, {
        studentId: item.studentId,
        studentName: item.studentName,
        subjectName: sch?.subjectClass?.subject?.subject?.name ?? "(môn học)",
        classDate,
        expiredDate: item.expiredDate,
      })
    }
  }

  return Array.from(seen.values())
}

/**
 * Hook trả về hàm imperative `runCheck(items)` — gọi khi user bấm Lưu.
 * Trả về Promise<Violation[]>. Mảng rỗng khi không có vi phạm.
 */
export function useCertificateExpirationCheck(certificates: CertificateForCheck[]) {
  const [args, setArgs] = useState<ScheduleArgs>(null)
  const itemsRef = useRef<CertExpirationItem[]>([])
  const resolverRef = useRef<((violations: Violation[]) => void) | null>(null)

  const { data: scheduleData, isFetching } = useFindManyClassSchedule(args as any, {
    enabled: !!args,
  })

  useEffect(() => {
    if (!args || !resolverRef.current) return
    if (isFetching) return
    if (scheduleData === undefined) return

    const violations = findViolations((scheduleData as any[]) ?? [], itemsRef.current, certificates)
    const resolve = resolverRef.current
    resolverRef.current = null
    setArgs(null)
    resolve(violations)
  }, [args, scheduleData, isFetching, certificates])

  const runCheck = (items: CertExpirationItem[]): Promise<Violation[]> => {
    const builtArgs = buildScheduleArgs(items, certificates)
    if (!builtArgs) return Promise.resolve([])

    return new Promise<Violation[]>((resolve) => {
      itemsRef.current = items
      resolverRef.current = resolve
      setArgs(builtArgs)
    })
  }

  return { runCheck }
}

/**
 * Hiển thị Modal.confirm liệt kê vi phạm. Resolve `true` khi user vẫn muốn lưu.
 */
export function confirmViolations(violations: Violation[]): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: "Cảnh báo: chứng chỉ hết hạn trước ngày học môn liên quan",
      width: 600,
      content: (
        <div>
          <p className="mb-2">Các trường hợp sau có khả năng không hợp lệ:</p>
          <ul className="list-disc pl-5">
            {violations.map((v, idx) => (
              <li key={idx} className="mb-1">
                Học viên <b>{v.studentName}</b>: chứng chỉ hết hạn{" "}
                <b>{dayjs(v.expiredDate).format("DD/MM/YYYY")}</b> nhưng môn <b>{v.subjectName}</b>{" "}
                có lịch học ngày <b>{dayjs(v.classDate).format("DD/MM/YYYY")}</b>.
              </li>
            ))}
          </ul>
          <p className="mt-3">Vui lòng kiểm tra lại ngày hết hạn trước khi lưu.</p>
        </div>
      ),
      okButtonProps: { style: { display: "none" } },
      cancelText: "Huỷ",
      onCancel: () => resolve(false),
    })
  })
}
