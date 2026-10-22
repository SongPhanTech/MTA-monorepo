/**
 * Background Worker xuất dữ liệu đào tạo sang JSON.
 * Tiến độ + payload thành phẩm đều lưu Redis (không ghi disk, không Map in-process).
 */
import dayjs from "dayjs"
import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"
import { packSyncPayload, SYNC_FILE_EXT } from "./data-sync-pack"
import { setExportPayloadBinary } from "./export-payload-store"
import {
  markExportJobFailed,
  markExportJobSuccess,
  updateExportJobProgress,
} from "./export-redis-store"
import {
  loadSessionScopedEntities,
  notDeleted,
  queryJoinTable,
  uniqueIds,
} from "./export-session-scope"
import { loadWarningAndScholarshipData } from "./export-warning-scholarship"
import { EXPORT_TRAINING_DATA_VERSION } from "./export-training-data"

export async function processExportJob(jobId: string, classRegisterSessionId?: string): Promise<void> {
  try {
    await updateExportJobProgress(jobId, 5, "Bắt đầu khởi tạo tiến trình trích xuất dữ liệu...")

    // Lấy thông tin đợt đăng ký nếu chỉ định xuất 1 đợt
    const targetSession = classRegisterSessionId
      ? await prisma.classRegisterSession.findFirst({
          where: { id: classRegisterSessionId, deletedAt: null },
          include: {
            trainingCourses: { where: notDeleted },
            creditLimit: { where: notDeleted },
            semester: { include: { schoolYear: true } },
          },
        })
      : null

    if (classRegisterSessionId && !targetSession) {
      throw new Error(`Không tìm thấy đợt đăng ký học với ID: ${classRegisterSessionId}`)
    }

    // 1. Tải danh mục hệ thống (Catalogs)
    await updateExportJobProgress(jobId, 15, "Đang tải danh mục hệ thống (DM_*)...")
    const catalogs = await loadAllCatalogs()

    // 2. Tải cấu trúc đào tạo (CTĐT, Khoa, Bộ môn, Môn học, Học kỳ, Khóa học)
    await updateExportJobProgress(jobId, 30, "Đang tải chương trình đào tạo và môn học...")
    const [
      trainingObjectTypes,
      trainingLocations,
      buildings,
      rooms,
      trainingMajors,
      curriculums,
      curriculumVersions,
      trainingBlocks,
      trainingBlockOnCvs,
      trainingBlockSubjects,
      subjects,
      subjectVersions,
      equivalencyGroups,
      subjectInGroups,
      prerequisiteJoins,
      coRequisiteJoins,
    ] = await Promise.all([
      prisma.trainingObjectType.findMany({ where: notDeleted }),
      prisma.trainingLocation.findMany({ where: notDeleted }),
      prisma.building.findMany({ where: notDeleted }),
      prisma.room.findMany({ where: notDeleted }),
      prisma.trainingMajor.findMany({ where: notDeleted }),
      prisma.curriculum.findMany({ where: notDeleted }),
      prisma.curriculumVersion.findMany({ where: notDeleted }),
      prisma.trainingBlock.findMany({ where: notDeleted }),
      prisma.trainingBlockOnCurriculumVersion.findMany({ where: notDeleted }),
      prisma.trainingBlockSubject.findMany({ where: notDeleted }),
      prisma.subject.findMany({ where: notDeleted }),
      prisma.subjectVersion.findMany({ where: notDeleted }),
      prisma.equivalencyGroup.findMany({ where: notDeleted }),
      prisma.subjectInGroup.findMany({ where: notDeleted }),
      queryJoinTable("_PrerequisiteSubject"),
      queryJoinTable("_CoRequisiteSubject"),
    ])

    // 3–5. Đợt ĐK + SV/LHP/điểm
    // Theo đợt: chỉ SV/lớp niên chế thuộc khóa gắn đợt (không kéo SV khóa khác qua LHP cả kỳ)
    await updateExportJobProgress(
      jobId,
      50,
      targetSession
        ? "Đang tải dữ liệu theo khóa của đợt đăng ký..."
        : "Đang tải đợt đăng ký và lớp học phần..."
    )

    const cleanSession = targetSession
      ? (() => {
          const { trainingCourses: _tc, creditLimit: _cl, semester: _sem, ...rest } = targetSession
          return rest
        })()
      : null

    const classRegisterSessions = cleanSession
      ? [cleanSession]
      : await prisma.classRegisterSession.findMany({ where: notDeleted })

    const classRegisterSessionCredits = targetSession
      ? targetSession.creditLimit
      : await prisma.classRegisterSessionCredit.findMany({ where: notDeleted })

    const allSessionToCourses = await queryJoinTable("_ClassRegisterSessionToTrainingCourse")
    const sessionToTrainingCourse = classRegisterSessionId
      ? allSessionToCourses.filter((r) => r.A === classRegisterSessionId)
      : allSessionToCourses

    const [semesters, schoolYears] = await Promise.all([
      prisma.semester.findMany({ where: notDeleted }),
      prisma.schoolYear.findMany({ where: notDeleted }),
    ])

    let trainingCourses: Array<Record<string, unknown> & { id: string }>
    let trainingCourseRegulations: Awaited<ReturnType<typeof prisma.trainingCourseRegulation.findMany>>
    let subjectClasses: Awaited<ReturnType<typeof prisma.subjectClass.findMany>>
    let subjectClassTimes: Awaited<ReturnType<typeof prisma.subjectClassTime.findMany>>
    let classSchedules: Awaited<ReturnType<typeof prisma.classSchedule.findMany>>
    let exams: Awaited<ReturnType<typeof prisma.exam.findMany>>
    let fixedClassToSubjectClass: Awaited<ReturnType<typeof queryJoinTable>>
    let fixedClasses: Awaited<ReturnType<typeof prisma.fixedClass.findMany>>
    let students: Awaited<ReturnType<typeof prisma.student.findMany>>
    let lecturers: Awaited<ReturnType<typeof prisma.lecturer.findMany>>
    let staff: Awaited<ReturnType<typeof prisma.staff.findMany>>
    let userProfiles: Awaited<ReturnType<typeof prisma.userProfile.findMany>>
    let studentSubjectScores: Awaited<ReturnType<typeof prisma.studentSubjectScore.findMany>>
    let studentSemesterResults: Awaited<ReturnType<typeof prisma.studentSemesterResult.findMany>>
    let studentIds: string[]
    let exportedCourseIds: string[]

    if (targetSession) {
      await updateExportJobProgress(jobId, 70, "Đang lọc SV/LHP/điểm theo khóa của đợt...")
      const scoped = await loadSessionScopedEntities(targetSession)
      trainingCourses = scoped.trainingCourses
      trainingCourseRegulations = scoped.trainingCourseRegulations
      fixedClasses = scoped.fixedClasses
      students = scoped.students
      subjectClasses = scoped.subjectClasses
      subjectClassTimes = scoped.subjectClassTimes
      classSchedules = scoped.classSchedules
      exams = scoped.exams
      fixedClassToSubjectClass = scoped.fixedClassToSubjectClass
      lecturers = scoped.lecturers
      staff = scoped.staff
      userProfiles = scoped.userProfiles
      studentSubjectScores = scoped.studentSubjectScores
      studentSemesterResults = scoped.studentSemesterResults
      studentIds = scoped.studentIds
      exportedCourseIds = scoped.targetCourseIds
    } else {
      trainingCourses = await prisma.trainingCourse.findMany({ where: notDeleted })
      trainingCourseRegulations = await prisma.trainingCourseRegulation.findMany({
        where: notDeleted,
      })

      subjectClasses = await prisma.subjectClass.findMany({ where: notDeleted })
      const [times, schedules, allFixedClassToSubjectClass, examRows] = await Promise.all([
        prisma.subjectClassTime.findMany({ where: notDeleted }),
        prisma.classSchedule.findMany({ where: notDeleted }),
        queryJoinTable("_FixedClassToSubjectClass"),
        prisma.exam.findMany({ where: notDeleted }),
      ])
      subjectClassTimes = times
      classSchedules = schedules
      fixedClassToSubjectClass = allFixedClassToSubjectClass
      exams = examRows

      await updateExportJobProgress(jobId, 70, "Đang tải hồ sơ sinh viên, giảng viên và lớp niên chế...")
      fixedClasses = await prisma.fixedClass.findMany({ where: notDeleted })
      students = await prisma.student.findMany({ where: notDeleted })
      lecturers = await prisma.lecturer.findMany({ where: notDeleted })
      staff = await prisma.staff.findMany({ where: notDeleted })

      const userProfileIds = uniqueIds([
        ...lecturers.map((l) => l.userProfileId),
        ...students.map((s) => s.userProfileId),
        ...staff.map((s) => s.userProfileId),
      ])
      userProfiles = []
      const PROFILE_CHUNK = 5000
      for (let i = 0; i < userProfileIds.length; i += PROFILE_CHUNK) {
        const chunk = userProfileIds.slice(i, i + PROFILE_CHUNK)
        const rows = await prisma.userProfile.findMany({
          where: { id: { in: chunk }, deletedAt: null },
        })
        userProfiles.push(...rows)
      }

      await updateExportJobProgress(jobId, 85, "Đang tải điểm môn học và kết quả học kỳ...")
      studentIds = uniqueIds(students.map((s) => s.id))
      exportedCourseIds = trainingCourses.map((tc) => tc.id)
      ;[studentSubjectScores, studentSemesterResults] = await Promise.all([
        prisma.studentSubjectScore.findMany({ where: notDeleted }),
        prisma.studentSemesterResult.findMany({ where: notDeleted }),
      ])
    }

    await updateExportJobProgress(jobId, 88, "Đang tải cảnh báo học tập / học đường / học bổng...")
    const warningScholarship = await loadWarningAndScholarshipData({
      studentIds,
      trainingCourseIds: exportedCourseIds,
      scoped: Boolean(targetSession),
    })

    // 6. Đóng gói JSON → Gzip → AES-256-GCM (.dat) → Redis
    await updateExportJobProgress(jobId, 92, "Đang đóng gói, nén và mã hóa...")

    // SubjectVersion được import trước SubjectClass — giữ scoreLinkSubjectVersionId
    const data: Record<string, unknown[]> = {
      ...catalogs,
      ClassRegisterSession: classRegisterSessions,
      ClassRegisterSessionCredit: classRegisterSessionCredits,
      _ClassRegisterSessionToTrainingCourse: sessionToTrainingCourse,
      UserProfile: userProfiles,
      Student: students,
      Lecturer: lecturers,
      Staff: staff,
      TrainingObjectType: trainingObjectTypes,
      SchoolYear: schoolYears,
      Semester: semesters,
      TrainingCourse: trainingCourses,
      TrainingCourseRegulation: trainingCourseRegulations,
      Subject: subjects,
      SubjectVersion: subjectVersions,
      _PrerequisiteSubject: prerequisiteJoins,
      _CoRequisiteSubject: coRequisiteJoins,
      EquivalencyGroup: equivalencyGroups,
      SubjectInGroup: subjectInGroups,
      TrainingBlock: trainingBlocks,
      TrainingBlockOnCurriculumVersion: trainingBlockOnCvs,
      TrainingBlockSubject: trainingBlockSubjects,
      SubjectClass: subjectClasses,
      SubjectClassTime: subjectClassTimes,
      FixedClass: fixedClasses,
      _FixedClassToSubjectClass: fixedClassToSubjectClass,
      Room: rooms,
      Building: buildings,
      TrainingLocation: trainingLocations,
      TrainingMajor: trainingMajors,
      Curriculum: curriculums,
      CurriculumVersion: curriculumVersions,
      StudentSubjectScore: studentSubjectScores,
      StudentSemesterResult: studentSemesterResults,
      Exam: exams,
      ClassSchedule: classSchedules,
      ...warningScholarship,
    }

    const counts = Object.fromEntries(
      Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
    )

    const finalSession = targetSession || classRegisterSessions[0]
    // Toàn vẹn + bảo mật: AES-GCM (không xuất JSON plaintext). HMAC trong JSON không còn cần.
    const payload = {
      version: EXPORT_TRAINING_DATA_VERSION,
      exportedAt: new Date().toISOString(),
      filters: {
        scope: classRegisterSessionId ? ("session" as const) : ("full" as const),
        classRegisterSessionIds: classRegisterSessions.map((s) => s.id),
        semesterIds: classRegisterSessionId && finalSession
          ? [finalSession.semesterId]
          : semesters.map((s) => s.id),
        trainingCourseIds: classRegisterSessionId
          ? sessionToTrainingCourse.map((tc) => tc.B)
          : trainingCourses.map((tc) => tc.id),
      },
      counts,
      data,
    }

    const stamp = dayjs().format("YYYYMMDD-HHmm")
    let fileName: string
    if (classRegisterSessionId && finalSession?.name) {
      const safeName = finalSession.name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "dot"
      fileName = `export-dot-dang-ky-${safeName}-${stamp}-${jobId.slice(0, 8)}${SYNC_FILE_EXT}`
    } else {
      fileName = `export-toan-bo-du-lieu-${stamp}-${jobId.slice(0, 8)}${SYNC_FILE_EXT}`
    }

    await updateExportJobProgress(jobId, 96, "Đang nén/mã hóa và lưu Redis...")
    const json = JSON.stringify(payload)
    const packed = packSyncPayload(json)
    const fileSize = await setExportPayloadBinary(jobId, packed, fileName)

    await markExportJobSuccess(jobId, fileName, fileSize, counts)
    console.log(
      `[export-worker] Đã hoàn tất job ${jobId} -> ${fileName} ` +
        `(packed ${(fileSize / (1024 * 1024)).toFixed(2)} MB từ JSON ~${(Buffer.byteLength(json) / (1024 * 1024)).toFixed(1)} MB, redis)`
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[export-worker] Lỗi xuất dữ liệu job ${jobId}:`, error)
    await markExportJobFailed(jobId, errorMsg)
  }
}

