/**
 * Kiểm tra trùng lịch học (server-side) trước khi ghi danh.
 * Trùng lịch = cùng dayOfWeek và khoảng tiết [startPeriod, endPeriod] giao nhau.
 */
import type { PrismaClient } from "@workspace/db"
import { ScheduleConflictError } from "./errors"

type ClassTime = {
  dayOfWeek: number | null
  startPeriod: number | null
  endPeriod: number | null
}

type TimedClass = {
  id: string
  subjectName: string
  times: ClassTime[]
}

function timesOverlap(a: ClassTime, b: ClassTime): boolean {
  if (a.dayOfWeek == null || b.dayOfWeek == null) return false
  if (a.dayOfWeek !== b.dayOfWeek) return false
  if (a.startPeriod == null || a.endPeriod == null) return false
  if (b.startPeriod == null || b.endPeriod == null) return false
  return a.startPeriod <= b.endPeriod && a.endPeriod >= b.startPeriod
}

function classesOverlap(a: TimedClass, b: TimedClass): boolean {
  return a.times.some((ta) => b.times.some((tb) => timesOverlap(ta, tb)))
}

/**
 * Ném ScheduleConflictError nếu các lớp sắp đăng ký trùng lịch với nhau
 * hoặc trùng với lớp đã ghi danh trong cùng kỳ học.
 */
export async function assertNoScheduleConflict(
  prisma: PrismaClient,
  params: {
    studentId: string
    semesterId: string
    newClassIds: string[]
  }
): Promise<void> {
  const { studentId, semesterId, newClassIds } = params

  const newClassRows = await prisma.subjectClass.findMany({
    where: { id: { in: newClassIds } },
    select: {
      id: true,
      subject: { select: { name: true } },
      subjectClassTimes: {
        select: { dayOfWeek: true, startPeriod: true, endPeriod: true },
      },
    },
  })

  const newClasses: TimedClass[] = newClassRows.map((row) => ({
    id: row.id,
    subjectName: row.subject.name,
    times: row.subjectClassTimes,
  }))

  // 1) Trùng lịch giữa chính các lớp trong cùng lượt đăng ký
  for (let i = 0; i < newClasses.length; i++) {
    for (let j = i + 1; j < newClasses.length; j++) {
      if (classesOverlap(newClasses[i]!, newClasses[j]!)) {
        throw new ScheduleConflictError(newClasses[i]!.subjectName, newClasses[j]!.subjectName)
      }
    }
  }

  // 2) Trùng lịch với các lớp đã ghi danh trong cùng kỳ
  const registeredRows = await prisma.studentSubjectScore.findMany({
    where: {
      studentId,
      subjectClassId: { not: null, notIn: newClassIds },
      subjectClass: { semesterId, cancelled: false, deletedAt: null },
    },
    select: {
      subjectClass: {
        select: {
          id: true,
          subject: { select: { name: true } },
          subjectClassTimes: {
            select: { dayOfWeek: true, startPeriod: true, endPeriod: true },
          },
        },
      },
    },
  })

  const registeredClasses: TimedClass[] = registeredRows
    .map((row) => row.subjectClass)
    .filter((sc): sc is NonNullable<typeof sc> => sc != null)
    .map((sc) => ({
      id: sc.id,
      subjectName: sc.subject.name,
      times: sc.subjectClassTimes,
    }))

  for (const newClass of newClasses) {
    for (const registered of registeredClasses) {
      if (classesOverlap(newClass, registered)) {
        throw new ScheduleConflictError(newClass.subjectName, registered.subjectName)
      }
    }
  }
}
