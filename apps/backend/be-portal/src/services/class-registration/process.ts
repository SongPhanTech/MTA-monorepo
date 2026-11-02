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
              curriculumVersion: true,
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
      (item) =>
        curriculumVersionId &&
        (item.curriculumVersionId === curriculumVersionId ||
          item.fixedClass?.curriculumVersionId === curriculumVersionId)
    )?.id ?? (profile.educationAndTraining[0]?.id as string)

  const studentCourse =
    profile.educationAndTraining.find((item) => item.id === studentId) ??
    profile.educationAndTraining[0]
  const trainingCourse = studentCourse?.fixedClass?.trainingCourse
  const courseBaseScore = trainingCourse?.baseScore ?? AcademicRankingBaseType.Base10
  const scoreToPass =
    trainingCourse?.scoreToPass && trainingCourse.scoreToPass > 0
      ? trainingCourse.scoreToPass
      : courseBaseScore === AcademicRankingBaseType.Base4
        ? 2.0
        : 4.0

  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: registerSession.semesterId },
    select: { startDate: true },
  })

  let nearestSemesterResult = await prisma.studentSemesterResult.findFirst({
    select: {
      gpaBase10: true,
      gpaBase4: true,
      cumulativeGpaBase4: true,
      cumulativeGpaBase10: true,
    },
    where: {
      studentId,
      semester: { startDate: { lt: semester.startDate } },
    },
    orderBy: { semester: { startDate: "desc" } },
  })

  if (!nearestSemesterResult) {
    nearestSemesterResult = await prisma.studentSemesterResult.findFirst({
      select: {
        gpaBase10: true,
        gpaBase4: true,
        cumulativeGpaBase4: true,
        cumulativeGpaBase10: true,
      },
      where: { studentId },
      orderBy: { semesterIndexInCourse: "desc" },
    })
  }

  const subjectClasses = await prisma.subjectClass.findMany({
    // IDs from the browser are untrusted: only accept classes available in
    // this registration session's semester.
    where: {
      id: { in: subjectClassIds },
      semesterId: registerSession.semesterId,
      active: true,
      cancelled: false,
      deletedAt: null,
    },
    include: {
      subject: {
        include: {
          prerequisiteSubject: true,
          coRequisiteSubject: true,
        },
      },
    },
  })

  // ===== Chuẩn hóa và kiểm tra danh sách lớp =====
  const sortedClassIds = [...new Set(subjectClassIds)].sort()
  if (sortedClassIds.length === 0) {
    throw new RegistrationError("Danh sách lớp đăng ký trống", 400, "EMPTY_CLASS_LIST")
  }

  const subjectClassLookup = new Map(subjectClasses.map((sc) => [sc.id, sc]))
  for (const id of sortedClassIds) {
    if (!subjectClassLookup.has(id)) {
      throw new RegistrationError(
        "Lớp học phần không tồn tại hoặc không thuộc đợt đăng ký này",
        400,
        "CLASS_NOT_FOUND"
      )
    }
  }

  // ===== Kiểm tra môn tiên quyết / môn học trước =====
  const allPrerequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.prerequisiteSubject.map((p) => p.id))),
  ]
  const allCoRequisiteIds = [
    ...new Set(subjectClasses.flatMap((sc) => sc.subject.coRequisiteSubject.map((p) => p.id))),
  ]

  if (allPrerequisiteIds.length > 0 || allCoRequisiteIds.length > 0) {
    // Đạt tiên quyết theo scoreToPass của khóa: finalScore hoặc manualFinalScore (phiên chứng chỉ)
    const passedPrerequisites = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectVersionId: { in: allPrerequisiteIds },
        OR: [{ finalScore: { gte: scoreToPass } }, { manualFinalScore: { gte: scoreToPass } }],
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
  const creditLimits = await prisma.classRegisterSessionCredit.findMany({
    where: { classRegisterSessionId: sessionId, deletedAt: null },
    orderBy: [{ base10Min: "asc" }, { base4Min: "asc" }],
  })

  if (creditLimits.length > 0) {
    let creditLimit: (typeof creditLimits)[number] | null = null

    if (nearestSemesterResult) {
      const gpa4 =
        Number(nearestSemesterResult.gpaBase4 ?? nearestSemesterResult.cumulativeGpaBase4) || 0
      const gpa10 =
        Number(nearestSemesterResult.gpaBase10 ?? nearestSemesterResult.cumulativeGpaBase10) || 0

      creditLimit = matchCreditLimitByCourseBaseScore(
        creditLimits,
        courseBaseScore,
        gpa4,
        gpa10
      )
    } else {
      creditLimit =
        matchCreditLimitByCourseBaseScore(creditLimits, courseBaseScore, 2.5, 7.0) ??
        creditLimits.find((c) => (c.maxCredit || 0) >= 20) ??
        creditLimits[creditLimits.length - 1]
    }

    const effectiveMaxCredit =
      creditLimit?.maxCredit ??
      creditLimits.find((c) => (c.maxCredit || 0) >= 20)?.maxCredit ??
      20

    const registeredScores = await prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        deletedAt: null,
        withdrew: false,
        subjectClass: {
          semesterId: registerSession.semesterId,
          cancelled: false,
          deletedAt: null,
        },
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

    if (effectiveMaxCredit && newTotalCredit > effectiveMaxCredit) {
      throw new RegistrationError(
        `Số tín chỉ tối đa là ${effectiveMaxCredit}`,
        400,
        "CREDIT_LIMIT_EXCEEDED"
      )
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
