/**
 * Background Worker xuất dữ liệu đào tạo sang JSON.
 * Cập nhật tiến độ realtime vào Redis và ghi file ra đĩa.
 */
import fs from "node:fs/promises"
import path from "node:path"
import dayjs from "dayjs"
import { prisma } from ".."
import { loadAllCatalogs } from "./export-all-catalogs"
import {
  markExportJobFailed,
  markExportJobSuccess,
  updateExportJobProgress,
} from "./export-redis-store"

export const EXPORT_OUTPUT_DIR =
  process.env.EXPORT_OUTPUT_DIR || path.join(process.cwd(), "tmp-exports")

const notDeleted = { deletedAt: null } as const

type JoinRow = { A: string; B: string }

function uniqueIds(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))]
}

async function queryJoinTable(table: string) {
  try {
    return await prisma.$queryRawUnsafe<JoinRow[]>(`SELECT "A", "B" FROM "ql-dao-tao"."${table}"`)
  } catch {
    return []
  }
}

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

    const targetSemesterId = targetSession?.semesterId
    const targetCourseIds = targetSession?.trainingCourses?.map((tc) => tc.id) ?? []

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

    // 3. Tải đợt đăng ký học & Lớp học phần của kỳ đang tải
    await updateExportJobProgress(jobId, 50, "Đang tải đợt đăng ký và lớp học phần của kỳ...")
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

    // Lớp học phần: Chỉ lấy theo kỳ học của đợt (nếu có targetSemesterId)
    const subjectClasses = targetSemesterId
      ? await prisma.subjectClass.findMany({
          where: { semesterId: targetSemesterId, deletedAt: null },
        })
      : await prisma.subjectClass.findMany({ where: notDeleted })

    const subjectClassIds = subjectClasses.map((sc) => sc.id)

    const [subjectClassTimes, classSchedules, allFixedClassToSubjectClass, exams] = await Promise.all([
      targetSemesterId
        ? (subjectClassIds.length > 0
            ? prisma.subjectClassTime.findMany({
                where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.subjectClassTime.findMany({ where: notDeleted }),
      targetSemesterId
        ? (subjectClassIds.length > 0
            ? prisma.classSchedule.findMany({
                where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.classSchedule.findMany({ where: notDeleted }),
      queryJoinTable("_FixedClassToSubjectClass"),
      (() => {
        if (!targetSemesterId) return prisma.exam.findMany({ where: notDeleted })
        const examIds = uniqueIds(subjectClasses.map((sc) => sc.examId))
        return examIds.length > 0
          ? prisma.exam.findMany({ where: { id: { in: examIds }, deletedAt: null } })
          : Promise.resolve([])
      })(),
    ])

    const fixedClassToSubjectClass = targetSemesterId
      ? allFixedClassToSubjectClass.filter((r) => subjectClassIds.includes(r.B))
      : allFixedClassToSubjectClass

    // Học kỳ và năm học (toàn bộ danh mục học kỳ/năm học để đảm bảo khóa ngoại cho bảng điểm và kết quả học tập)
    const [semesters, schoolYears] = await Promise.all([
      prisma.semester.findMany({ where: notDeleted }),
      prisma.schoolYear.findMany({ where: notDeleted }),
    ])

    const trainingCourses = targetCourseIds.length > 0
      ? targetSession.trainingCourses
      : await prisma.trainingCourse.findMany({ where: notDeleted })

    const trainingCourseRegulations = targetCourseIds.length > 0
      ? await prisma.trainingCourseRegulation.findMany({
          where: { trainingCourseId: { in: targetCourseIds }, deletedAt: null },
        })
      : await prisma.trainingCourseRegulation.findMany({ where: notDeleted })

    // 4. Tải Giảng viên, Sinh viên, Cán bộ, Hồ sơ
    await updateExportJobProgress(jobId, 70, "Đang tải hồ sơ sinh viên, giảng viên và lớp niên chế...")
    const linkedFixedClassIds = uniqueIds(fixedClassToSubjectClass.map((r) => r.A))
    const fixedClassOrConditions = [
      ...(targetCourseIds.length > 0 ? [{ trainingCourseId: { in: targetCourseIds } }] : []),
      ...(linkedFixedClassIds.length > 0 ? [{ id: { in: linkedFixedClassIds } }] : []),
    ]
    const fixedClasses = targetSession
      ? (fixedClassOrConditions.length > 0
          ? await prisma.fixedClass.findMany({
              where: {
                deletedAt: null,
                OR: fixedClassOrConditions,
              },
            })
          : [])
      : await prisma.fixedClass.findMany({ where: notDeleted })

    const fixedClassIds = fixedClasses.map((fc) => fc.id)
    const studentOrConditions = [
      ...(fixedClassIds.length > 0 ? [{ fixedClassId: { in: fixedClassIds } }] : []),
      ...(targetCourseIds.length > 0
        ? [{ fixedClass: { trainingCourseId: { in: targetCourseIds } } }]
        : []),
    ]
    const students = targetSession
      ? (studentOrConditions.length > 0
          ? await prisma.student.findMany({
              where: {
                deletedAt: null,
                OR: studentOrConditions,
              },
            })
          : [])
      : await prisma.student.findMany({ where: notDeleted })

    const targetLecturerIds = targetSession
      ? uniqueIds([
          ...subjectClasses.map((sc) => sc.lecturerId),
          ...subjectClasses.map((sc) => sc.extraLecturerId),
          ...subjectClasses.map((sc) => sc.enterGradeLecturerId),
          ...fixedClasses.map((fc) => fc.lecturerManagementId),
        ])
      : []

    const targetStaffIds = targetSession
      ? uniqueIds([...fixedClasses.map((fc) => fc.staffManagementId)])
      : []

    const [lecturers, staff] = await Promise.all([
      targetSession
        ? (targetLecturerIds.length > 0
            ? prisma.lecturer.findMany({
                where: { id: { in: targetLecturerIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.lecturer.findMany({ where: notDeleted }),
      targetSession
        ? (targetStaffIds.length > 0
            ? prisma.staff.findMany({
                where: { id: { in: targetStaffIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.staff.findMany({ where: notDeleted }),
    ])

    const userProfileIds = uniqueIds([
      ...lecturers.map((l) => l.userProfileId),
      ...students.map((s) => s.userProfileId),
      ...staff.map((s) => s.userProfileId),
    ])

    const userProfiles: any[] = []
    const PROFILE_CHUNK = 5000
    for (let i = 0; i < userProfileIds.length; i += PROFILE_CHUNK) {
      const chunk = userProfileIds.slice(i, i + PROFILE_CHUNK)
      const rows = await prisma.userProfile.findMany({
        where: { id: { in: chunk }, deletedAt: null },
      })
      userProfiles.push(...rows)
    }

    // 5. Tải Bảng điểm & Kết quả học tập
    await updateExportJobProgress(jobId, 85, "Đang tải điểm môn học và kết quả học kỳ...")
    const studentIds = uniqueIds(students.map((s) => s.id))
    const [studentSubjectScores, studentSemesterResults] = await Promise.all([
      targetSession
        ? (studentIds.length > 0
            ? prisma.studentSubjectScore.findMany({
                where: { studentId: { in: studentIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.studentSubjectScore.findMany({ where: notDeleted }),
      targetSession
        ? (studentIds.length > 0
            ? prisma.studentSemesterResult.findMany({
                where: { studentId: { in: studentIds }, deletedAt: null },
              })
            : Promise.resolve([]))
        : prisma.studentSemesterResult.findMany({ where: notDeleted }),
    ])

    // 6. Chuẩn bị đối tượng dữ liệu tổng hợp
    await updateExportJobProgress(jobId, 92, "Đang đóng gói và định dạng file JSON...")

    const subjectClassRecordsNormalized = subjectClasses.map((sc) => ({
      ...sc,
      scoreLinkSubjectVersionId: null,
    }))

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
      SubjectClass: subjectClassRecordsNormalized,
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
    }

    const counts = Object.fromEntries(
      Object.entries(data).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
    )

    const finalSession = targetSession || classRegisterSessions[0]
    const payload = {
      version: "1.4.0",
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

    // 7. Ghi file trực tiếp ra ổ đĩa
    await fs.mkdir(EXPORT_OUTPUT_DIR, { recursive: true })
    const stamp = dayjs().format("YYYYMMDD-HHmm")
    let fileName: string
    if (classRegisterSessionId && finalSession?.name) {
      const safeName = finalSession.name.replace(/[\\/:*?"<>|\s]+/g, "_")
      fileName = `export-dot-dang-ky-${safeName}-${stamp}-${jobId.slice(0, 8)}.json`
    } else {
      fileName = `export-toan-bo-du-lieu-${stamp}-${jobId.slice(0, 8)}.json`
    }
    const filePath = path.join(EXPORT_OUTPUT_DIR, fileName)

    await updateExportJobProgress(jobId, 96, "Đang ghi file ra ổ đĩa...")
    await fs.writeFile(filePath, JSON.stringify(payload), "utf-8")

    const stat = await fs.stat(filePath)
    const fileSize = stat.size

    // 8. Đánh dấu thành công
    await markExportJobSuccess(jobId, filePath, fileName, fileSize, counts)
    console.log(`[export-worker] Đã hoàn tất job ${jobId} -> File: ${filePath} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`)

    // 9. Tự động dọn dẹp các file xuất tạm cũ, chỉ giữ lại 5 file mới nhất
    await cleanupOldExports()
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[export-worker] Lỗi xuất dữ liệu job ${jobId}:`, error)
    await markExportJobFailed(jobId, errorMsg)
  }
}

async function cleanupOldExports() {
  try {
    const files = await fs.readdir(EXPORT_OUTPUT_DIR)
    const jsonFiles = files.filter(
      (f) =>
        (f.startsWith("export-toan-bo-du-lieu-") || f.startsWith("export-dot-dang-ky-")) &&
        f.endsWith(".json")
    )
    if (jsonFiles.length > 5) {
      const fileStats = await Promise.all(
        jsonFiles.map(async (file) => {
          const stat = await fs.stat(path.join(EXPORT_OUTPUT_DIR, file)).catch(() => null)
          return { file, mtime: stat?.mtimeMs || 0 }
        })
      )
      fileStats.sort((a, b) => a.mtime - b.mtime) // Cũ nhất đứng đầu
      const toDelete = fileStats.slice(0, fileStats.length - 5)
      for (const { file } of toDelete) {
        await fs.unlink(path.join(EXPORT_OUTPUT_DIR, file)).catch(() => {})
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

