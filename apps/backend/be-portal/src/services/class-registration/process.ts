/**
 * Pipeline đăng ký học hoàn chỉnh — dùng chung cho:
 * - Background worker (consumer Kafka) — luồng chính
 * - API xử lý đồng bộ (fallback khi Kafka không khả dụng)
 *
 * Mọi lỗi nghiệp vụ ném RegistrationError (mang sẵn HTTP status + code),
 * lỗi hạ tầng (deadlock/timeout) để nguyên cho caller phân loại retry.
 */
import { AcademicRankingBaseType, type PrismaClient } from "@workspace/db"
import { classRegisterCache, seatCache } from "../redis-cache"
import { matchCreditLimitByCourseBaseScore } from "./credit-limit"
import { RegistrationError } from "./errors"
import { registerClasses } from "./index"
import { assertNoScheduleConflict } from "./schedule-conflict"

export type RegistrationInput = {
  /** UserProfile id của sinh viên */
  userId: string
  sessionId: string
  subjectClassIds: string[]
  curriculumVersionId?: string
}

export async function processRegistration(
  prisma: PrismaClient,
  input: RegistrationInput
): Promise<void> {
  const { userId, sessionId, subjectClassIds, curriculumVersionId } = input

  const registerSession = await prisma.classRegisterSession.findUnique({
    where: { id: sessionId },
  })
  if (!registerSession) {
    throw new RegistrationError("Không tìm thấy đợt đăng ký", 404, "SESSION_NOT_FOUND")
  }

  if (
    !registerSession.active ||
    registerSession.startDate > new Date() ||
    registerSession.endDate < new Date()
  ) {
    throw new RegistrationError("Đợt đăng ký đã đóng", 404, "SESSION_CLOSED")
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!profile || profile.educationAndTraining.length === 0) {
    throw new RegistrationError("Bạn không có thông tin học vụ", 404, "NO_STUDENT_INFO")
  }

  const studentId =
    profile.educationAndTraining.find(
      (item) => curriculumVersionId && item.curriculumVersionId === curriculumVersionId
    )?.id ?? (profile.educationAndTraining[0]?.id as string)

  const studentCourse =
    profile.educationAndTraining.find((item) => item.id === studentId) ??
    profile.educationAndTraining[0]
  const courseBaseScore =
    studentCourse?.fixedClass?.trainingCourse?.baseScore ?? AcademicRankingBaseType.Base10

  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: registerSession.semesterId },
    select: { startDate: true },
  })

  const nearestSemesterResult = await prisma.studentSemesterResult.findFirst({
    select: {
      gpaBase10: true,
      gpaBase4: true,
    },
    where: {
      studentId,
      semester: { startDate: { lt: semester.startDate } },
    },
    orderBy: { semester: { startDate: "desc" } },
  })

  const subjectClasses = await prisma.subjectClass.findMany({
    where: { id: { in: subjectClassIds } },
    include: {
      subject: {
        include: {
          prerequisiteSubject: true,
          coRequisiteSubject: true,
        },
      },
    },
  })

  // ===== Kiểm tra môn tiên quyết / môn học trước =====
  const allPrerequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.prerequisiteSubject.map((p) => p.id))),
  ]
  const allCoRequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.coRequisiteSubject.map((p) => p.id))),
  ]

  if (allPrerequisiteIds.length > 0 || allCoRequisiteIds.length > 0) {
    const passedPrerequisites = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectVersionId: { in: allPrerequisiteIds },
        finalScore: { gt: 4.0 },
      },
      select: { subjectVersionId: true },
    })
    const passedPrerequisiteIds = new Set(passedPrerequisites.map((h) => h.subjectVersionId))

    const registeredCoRequisites = await prisma.classRegisterLogs.findMany({
      where: {
        studentId,
        subjectClass: {
          subjectId: { in: allCoRequisiteIds },
        },
      },
      select: { subjectClass: { select: { subjectId: true } } },
    })
    const enrolledCoRequisites = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectVersionId: { in: allCoRequisiteIds },
      },
      select: { subjectVersionId: true },
    })

    const registeredCoRequisiteSubjectIds = new Set([
      ...registeredCoRequisites.map((r) => r.subjectClass.subjectId).filter(Boolean),
      ...enrolledCoRequisites.map((r) => r.subjectVersionId),
      ...subjectClasses.map((sc) => sc.subjectId),
    ])

    for (const sc of subjectClasses) {
      const missingPrerequisites = sc.subject.prerequisiteSubject.filter(
        (p) => !passedPrerequisiteIds.has(p.id)
      )

      const missingCoRequisites = sc.subject.coRequisiteSubject.filter(
        (p) => !registeredCoRequisiteSubjectIds.has(p.id)
      )

      if (missingPrerequisites.length > 0) {
        throw new RegistrationError(
          `Bạn chưa hoàn thành môn tiên quyết của môn ${sc.subject.name}: ${missingPrerequisites.map((p) => p.name).join(", ")}`,
          400,
          "MISSING_PREREQUISITE"
        )
      }

      if (missingCoRequisites.length > 0) {
        throw new RegistrationError(
          `Bạn chưa đăng ký môn trước của môn ${sc.subject.name}: ${missingCoRequisites.map((p) => p.name).join(", ")}`,
          400,
          "MISSING_COREQUISITE"
        )
      }
    }
  }

  // ===== Kiểm tra giới hạn tín chỉ theo GPA kỳ gần nhất + hệ điểm của khóa =====
  if (nearestSemesterResult) {
    const creditLimits = await prisma.classRegisterSessionCredit.findMany({
      where: { classRegisterSessionId: sessionId, deletedAt: null },
    })

    if (creditLimits.length > 0) {
      const creditLimit = matchCreditLimitByCourseBaseScore(
        creditLimits,
        courseBaseScore,
        nearestSemesterResult.gpaBase4.toNumber(),
        nearestSemesterResult.gpaBase10.toNumber()
      )

      if (creditLimit) {
        const registeredScores = await prisma.studentSubjectScore.findMany({
          where: {
            studentId,
            subjectClass: { semesterId: registerSession.semesterId },
          },
          select: { subjectVersion: { select: { credit: true } } },
        })

        const registeredCredit = registeredScores.reduce(
          (acc, curr) => acc + (curr.subjectVersion?.credit ?? 0),
          0
        )

        const newTotalCredit =
          registeredCredit +
          subjectClasses.reduce((acc, curr) => acc + (curr.subject?.credit ?? 0), 0)

        if (creditLimit.maxCredit && newTotalCredit > creditLimit.maxCredit) {
          throw new RegistrationError(
            `Số tín chỉ tối đa là ${creditLimit.maxCredit}`,
            400,
            "CREDIT_LIMIT_EXCEEDED"
          )
        }
      }
    }
  }

  // ===== Chuẩn hóa danh sách lớp =====
  const subjectClassLookup = new Map(subjectClasses.map((sc) => [sc.id, sc]))
  const sortedClassIds = [...new Set(subjectClassIds)].sort()

  if (sortedClassIds.length === 0) {
    throw new RegistrationError("Danh sách lớp đăng ký trống", 400, "EMPTY_CLASS_LIST")
  }

  for (const id of sortedClassIds) {
    if (!subjectClassLookup.has(id)) {
      throw new RegistrationError("Không tìm thấy lớp học phần", 400, "CLASS_NOT_FOUND")
    }
  }

  // ===== Trùng lịch (dữ liệu của chính SV → không cần lock) =====
  await assertNoScheduleConflict(prisma, {
    studentId,
    semesterId: registerSession.semesterId,
    newClassIds: sortedClassIds,
  })

  // ===== Ghi danh với DB Locking (optimistic/pessimistic theo env) =====
  await registerClasses(prisma, {
    sessionId,
    studentId,
    classIds: sortedClassIds,
    classLookup: new Map(
      sortedClassIds.map((id) => {
        const sc = subjectClassLookup.get(id)!
        return [
          id,
          {
            subjectVersionId: sc.subjectId,
            subjectName: sc.subject.name,
            maxStudent: sc.maxStudent || 0,
          },
        ]
      })
    ),
  })

  // ===== Cập nhật cache sau khi DB ghi thành công =====
  await classRegisterCache.invalidateUser(userId, sessionId)
  await seatCache.adjust(
    sessionId,
    sortedClassIds.map((subjectClassId) => ({ subjectClassId, delta: 1 }))
  )
}
