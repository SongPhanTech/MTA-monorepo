/**
 * Self-test / benchmark xuất dữ liệu Nội bộ → Internet (mirror logic export-worker).
 * Chạy: cd apps/backend/be-ql-dao-tao && bun --env-file=.env run scripts/bench-export-training-data.ts
 * Optional: SESSION_ID=<id> để đo xuất theo đợt.
 */
import { PrismaClient } from "@workspace/db"

type JoinRow = { A: string; B: string }
type Stage = { name: string; ms: number; detail?: Record<string, number> }

const prisma = new PrismaClient()
const notDeleted = { deletedAt: null } as const
const stages: Stage[] = []
const sessionId = process.env.SESSION_ID?.trim() || undefined

function uniqueIds(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))]
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now()
  const result = await fn()
  const ms = performance.now() - t0
  const detail =
    result && typeof result === "object" && !Array.isArray(result) && "counts" in (result as object)
      ? ((result as { counts?: Record<string, number> }).counts)
      : Array.isArray(result)
        ? { rows: result.length }
        : undefined
  stages.push({ name, ms, detail })
  console.log(
    `  [${ms.toFixed(0).padStart(6)} ms] ${name}${detail ? ` ${JSON.stringify(detail)}` : ""}`
  )
  return result
}

async function queryJoinTable(table: string) {
  try {
    return await prisma.$queryRawUnsafe<JoinRow[]>(`SELECT "A", "B" FROM "ql-dao-tao"."${table}"`)
  } catch {
    return [] as JoinRow[]
  }
}

async function loadCatalogs(): Promise<Record<string, unknown[]>> {
  const dmLoaders: Array<[string, () => Promise<unknown[]>]> = [
    ["DM_CapBac", () => prisma.dM_CapBac.findMany()],
    ["DM_ChucDanh", () => prisma.dM_ChucDanh.findMany()],
    ["DM_ChucVu", () => prisma.dM_ChucVu.findMany()],
    ["DM_HocHam", () => prisma.dM_HocHam.findMany()],
    ["DM_HocVi", () => prisma.dM_HocVi.findMany()],
    ["DM_ChungChiTinHoc", () => prisma.dM_ChungChiTinHoc.findMany()],
    ["DM_DanToc", () => prisma.dM_DanToc.findMany()],
    ["DM_DonVi", () => prisma.dM_DonVi.findMany()],
    ["DM_DonViHanhChinh", () => prisma.dM_DonViHanhChinh.findMany()],
    ["DM_KhuVuc_DiaLy", () => prisma.dM_KhuVuc_DiaLy.findMany()],
    ["DM_NgoaiNgu", () => prisma.dM_NgoaiNgu.findMany()],
    ["DM_TonGiao", () => prisma.dM_TonGiao.findMany()],
    ["DM_TrinhDoNgoaiNgu", () => prisma.dM_TrinhDoNgoaiNgu.findMany()],
    ["DM_TrinhDoTinHoc", () => prisma.dM_TrinhDoTinHoc.findMany()],
    ["DM_GioiTinh", () => prisma.dM_GioiTinh.findMany()],
    ["DM_NhanVien", () => prisma.dM_NhanVien.findMany()],
    ["DM_PhanCap_ChatLuong_TrangThietBi", () => prisma.dM_PhanCap_ChatLuong_TrangThietBi.findMany()],
    ["DM_PhanLoai_CSKT", () => prisma.dM_PhanLoai_CSKT.findMany()],
    ["DM_NhomNguoiDung", () => prisma.dM_NhomNguoiDung.findMany()],
    ["DM_NhomUngDung", () => prisma.dM_NhomUngDung.findMany()],
    ["DM_QuocGia", () => prisma.dM_QuocGia.findMany()],
    ["DM_Tinh", () => prisma.dM_Tinh.findMany()],
    ["DM_Tinh_New", () => prisma.dM_Tinh_New.findMany()],
    ["DM_QuanHuyen", () => prisma.dM_QuanHuyen.findMany()],
    ["DM_XaPhuong", () => prisma.dM_XaPhuong.findMany()],
    ["DM_XaPhuong_New", () => prisma.dM_XaPhuong_New.findMany()],
    ["DM_ViTriCongViec", () => prisma.dM_ViTriCongViec.findMany()],
    ["DM_TrinhDoHocVan", () => prisma.dM_TrinhDoHocVan.findMany({ where: notDeleted })],
    ["DM_TrinhDoLyLuanChinhTri", () => prisma.dM_TrinhDoLyLuanChinhTri.findMany({ where: notDeleted })],
    ["DM_TrinhDoQuanLyNhaNuoc", () => prisma.dM_TrinhDoQuanLyNhaNuoc.findMany({ where: notDeleted })],
    ["DM_TinhTrangHonNhan", () => prisma.dM_TinhTrangHonNhan.findMany({ where: notDeleted })],
    ["DM_QuanHeThanNhan", () => prisma.dM_QuanHeThanNhan.findMany({ where: notDeleted })],
    ["DM_TrangThaiLamViec", () => prisma.dM_TrangThaiLamViec.findMany({ where: notDeleted })],
    [
      "DM_HinhThucKhenThuongChinhQuyen",
      () => prisma.dM_HinhThucKhenThuongChinhQuyen.findMany({ where: notDeleted }),
    ],
    [
      "DM_HinhThucKhenThuongDang",
      () => prisma.dM_HinhThucKhenThuongDang.findMany({ where: notDeleted }),
    ],
    ["DM_XepLoaiDanhGiaCanBo", () => prisma.dM_XepLoaiDanhGiaCanBo.findMany({ where: notDeleted })],
    [
      "DM_XepLoaiDanhGiaChatLuongDangVien",
      () => prisma.dM_XepLoaiDanhGiaChatLuongDangVien.findMany({ where: notDeleted }),
    ],
    ["DM_LoaiHinhCongTac", () => prisma.dM_LoaiHinhCongTac.findMany({ where: notDeleted })],
    ["DM_TinhTrangCongTac", () => prisma.dM_TinhTrangCongTac.findMany({ where: notDeleted })],
    ["DM_LoaiTinhTrangCongTac", () => prisma.dM_LoaiTinhTrangCongTac.findMany({ where: notDeleted })],
    ["DM_LoaiHinhDiHocTap", () => prisma.dM_LoaiHinhDiHocTap.findMany({ where: notDeleted })],
    ["DM_TinhTrangDiHocTap", () => prisma.dM_TinhTrangDiHocTap.findMany({ where: notDeleted })],
    ["DM_NuocCuDiHocTap", () => prisma.dM_NuocCuDiHocTap.findMany({ where: notDeleted })],
    [
      "DM_ChucDanhCMNVGiangVien",
      () => prisma.dM_ChucDanhCMNVGiangVien.findMany({ where: notDeleted }),
    ],
    [
      "DM_ChucDanhCMNVNghienCuuVien",
      () => prisma.dM_ChucDanhCMNVNghienCuuVien.findMany({ where: notDeleted }),
    ],
    ["DM_ChucDanhCMNVKySu", () => prisma.dM_ChucDanhCMNVKySu.findMany({ where: notDeleted })],
    ["DM_TruongDaoTaoBacDH", () => prisma.dM_TruongDaoTaoBacDH.findMany({ where: notDeleted })],
    [
      "DM_ChuyenNganhDaoTaoBacDH",
      () => prisma.dM_ChuyenNganhDaoTaoBacDH.findMany({ where: notDeleted }),
    ],
    ["DM_ChiHuyQuanLy", () => prisma.dM_ChiHuyQuanLy.findMany({ where: notDeleted })],
    ["DM_ChuyenMonKyThuat", () => prisma.dM_ChuyenMonKyThuat.findMany({ where: notDeleted })],
    ["DM_SucKhoe", () => prisma.dM_SucKhoe.findMany({ where: notDeleted })],
    ["DM_NhomMau", () => prisma.dM_NhomMau.findMany({ where: notDeleted })],
    ["DM_LoaiThuongTat", () => prisma.dM_LoaiThuongTat.findMany({ where: notDeleted })],
    ["DM_NganhHoc", () => prisma.dM_NganhHoc.findMany({ where: notDeleted })],
    ["DM_ToChucXaHoi", () => prisma.dM_ToChucXaHoi.findMany({ where: notDeleted })],
    ["DM_Ngach", () => prisma.dM_Ngach.findMany({ where: notDeleted })],
    ["DM_BacLuong", () => prisma.dM_BacLuong.findMany({ where: notDeleted })],
    ["LecturerType", () => prisma.lecturerType.findMany({ where: notDeleted })],
    ["StaffType", () => prisma.staffType.findMany({ where: notDeleted })],
    ["StaffPosition", () => prisma.staffPosition.findMany({ where: notDeleted })],
    ["TrainingLanguage", () => prisma.trainingLanguage.findMany({ where: notDeleted })],
    ["TrainingType", () => prisma.trainingType.findMany({ where: notDeleted })],
    ["TrainingLevel", () => prisma.trainingLevel.findMany({ where: notDeleted })],
    ["TrainingForm", () => prisma.trainingForm.findMany({ where: notDeleted })],
    ["TrainingTime", () => prisma.trainingTime.findMany({ where: notDeleted })],
    ["DiplomaType", () => prisma.diplomaType.findMany({ where: notDeleted })],
    ["PriorityObject", () => prisma.priorityObject.findMany({ where: notDeleted })],
    ["TrainingField", () => prisma.trainingField.findMany({ where: notDeleted })],
    ["AcademicRankingConvert", () => prisma.academicRankingConvert.findMany({ where: notDeleted })],
    ["SubjectVersionCategory", () => prisma.subjectVersionCategory.findMany({ where: notDeleted })],
    ["LoadCategory", () => prisma.loadCategory.findMany({ where: notDeleted })],
    ["TemplateFile", () => prisma.templateFile.findMany({ where: notDeleted })],
  ]

  // Giới hạn concurrency để tránh FATAL: too many clients (pool Postgres)
  const BATCH = 8
  const entries: Array<readonly [string, unknown[]]> = []
  for (let i = 0; i < dmLoaders.length; i += BATCH) {
    const batch = dmLoaders.slice(i, i + BATCH)
    const part = await Promise.all(
      batch.map(async ([key, load]) => {
        try {
          return [key, await load()] as const
        } catch (e) {
          console.warn(`    skip ${key}:`, e instanceof Error ? e.message : e)
          return [key, []] as const
        }
      })
    )
    entries.push(...part)
  }
  return Object.fromEntries(entries)
}

function memSnapshot() {
  const m = process.memoryUsage()
  return {
    rssMB: +(m.rss / 1024 / 1024).toFixed(1),
    heapUsedMB: +(m.heapUsed / 1024 / 1024).toFixed(1),
    heapTotalMB: +(m.heapTotal / 1024 / 1024).toFixed(1),
    externalMB: +(m.external / 1024 / 1024).toFixed(1),
  }
}

async function main() {
  const wall0 = performance.now()
  const memStart = memSnapshot()
  console.log("=== BENCH export training data ===")
  console.log("DB:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"))
  console.log("scope:", sessionId ? `session ${sessionId}` : "FULL")
  console.log("mem start:", memStart)

  const targetSession = sessionId
    ? await timed("load ClassRegisterSession", () =>
        prisma.classRegisterSession.findFirst({
          where: { id: sessionId, deletedAt: null },
          include: {
            trainingCourses: { where: notDeleted },
            creditLimit: { where: notDeleted },
            semester: { include: { schoolYear: true } },
          },
        })
      )
    : null

  if (sessionId && !targetSession) {
    throw new Error(`Không tìm thấy đợt ${sessionId}`)
  }

  const targetSemesterId = targetSession?.semesterId
  const targetCourseIds = targetSession?.trainingCourses?.map((tc) => tc.id) ?? []

  const catalogs = await timed("1. catalogs (DM_* + training)", loadCatalogs)
  const catalogCounts = Object.fromEntries(
    Object.entries(catalogs).map(([k, v]) => [k, v.length])
  )

  const structure = await timed("2. structure CTĐT/môn", async () => {
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
    return {
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
      counts: {
        Subject: subjects.length,
        SubjectVersion: subjectVersions.length,
        Curriculum: curriculums.length,
        Room: rooms.length,
      },
    }
  })

  const sessionsBlock = await timed("3. đợt ĐK + lớp HP + TKB", async () => {
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
    const sessionToTrainingCourse = sessionId
      ? allSessionToCourses.filter((r) => r.A === sessionId)
      : allSessionToCourses

    const subjectClasses = targetSemesterId
      ? await prisma.subjectClass.findMany({
          where: { semesterId: targetSemesterId, deletedAt: null },
        })
      : await prisma.subjectClass.findMany({ where: notDeleted })

    const subjectClassIds = subjectClasses.map((sc) => sc.id)
    const [subjectClassTimes, classSchedules, allFixedClassToSubjectClass, exams] =
      await Promise.all([
        targetSemesterId
          ? subjectClassIds.length > 0
            ? prisma.subjectClassTime.findMany({
                where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
              })
            : Promise.resolve([])
          : prisma.subjectClassTime.findMany({ where: notDeleted }),
        targetSemesterId
          ? subjectClassIds.length > 0
            ? prisma.classSchedule.findMany({
                where: { subjectClassId: { in: subjectClassIds }, deletedAt: null },
              })
            : Promise.resolve([])
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

    const [semesters, schoolYears] = await Promise.all([
      prisma.semester.findMany({ where: notDeleted }),
      prisma.schoolYear.findMany({ where: notDeleted }),
    ])

    const trainingCourses =
      targetCourseIds.length > 0 && targetSession
        ? targetSession.trainingCourses
        : await prisma.trainingCourse.findMany({ where: notDeleted })

    const trainingCourseRegulations =
      targetCourseIds.length > 0
        ? await prisma.trainingCourseRegulation.findMany({
            where: { trainingCourseId: { in: targetCourseIds }, deletedAt: null },
          })
        : await prisma.trainingCourseRegulation.findMany({ where: notDeleted })

    return {
      classRegisterSessions,
      classRegisterSessionCredits,
      sessionToTrainingCourse,
      subjectClasses,
      subjectClassTimes,
      classSchedules,
      fixedClassToSubjectClass,
      exams,
      semesters,
      schoolYears,
      trainingCourses,
      trainingCourseRegulations,
      counts: {
        ClassRegisterSession: classRegisterSessions.length,
        SubjectClass: subjectClasses.length,
        ClassSchedule: classSchedules.length,
        TrainingCourse: trainingCourses.length,
      },
    }
  })

  const people = await timed("4. SV / GV / CB / UserProfile", async () => {
    const linkedFixedClassIds = uniqueIds(
      sessionsBlock.fixedClassToSubjectClass.map((r) => r.A)
    )
    const fixedClassOrConditions = [
      ...(targetCourseIds.length > 0 ? [{ trainingCourseId: { in: targetCourseIds } }] : []),
      ...(linkedFixedClassIds.length > 0 ? [{ id: { in: linkedFixedClassIds } }] : []),
    ]
    const fixedClasses = targetSession
      ? fixedClassOrConditions.length > 0
        ? await prisma.fixedClass.findMany({
            where: { deletedAt: null, OR: fixedClassOrConditions },
          })
        : []
      : await prisma.fixedClass.findMany({ where: notDeleted })

    const fixedClassIds = fixedClasses.map((fc) => fc.id)
    const studentOrConditions = [
      ...(fixedClassIds.length > 0 ? [{ fixedClassId: { in: fixedClassIds } }] : []),
      ...(targetCourseIds.length > 0
        ? [{ fixedClass: { trainingCourseId: { in: targetCourseIds } } }]
        : []),
    ]
    const students = targetSession
      ? studentOrConditions.length > 0
        ? await prisma.student.findMany({
            where: { deletedAt: null, OR: studentOrConditions },
          })
        : []
      : await prisma.student.findMany({ where: notDeleted })

    const targetLecturerIds = targetSession
      ? uniqueIds([
          ...sessionsBlock.subjectClasses.map((sc) => sc.lecturerId),
          ...sessionsBlock.subjectClasses.map((sc) => sc.extraLecturerId),
          ...sessionsBlock.subjectClasses.map((sc) => sc.enterGradeLecturerId),
          ...fixedClasses.map((fc) => fc.lecturerManagementId),
        ])
      : []
    const targetStaffIds = targetSession
      ? uniqueIds(fixedClasses.map((fc) => fc.staffManagementId))
      : []

    const [lecturers, staff] = await Promise.all([
      targetSession
        ? targetLecturerIds.length > 0
          ? prisma.lecturer.findMany({
              where: { id: { in: targetLecturerIds }, deletedAt: null },
            })
          : Promise.resolve([])
        : prisma.lecturer.findMany({ where: notDeleted }),
      targetSession
        ? targetStaffIds.length > 0
          ? prisma.staff.findMany({ where: { id: { in: targetStaffIds }, deletedAt: null } })
          : Promise.resolve([])
        : prisma.staff.findMany({ where: notDeleted }),
    ])

    const userProfileIds = uniqueIds([
      ...lecturers.map((l) => l.userProfileId),
      ...students.map((s) => s.userProfileId),
      ...staff.map((s) => s.userProfileId),
    ])
    const userProfiles: unknown[] = []
    const PROFILE_CHUNK = 5000
    for (let i = 0; i < userProfileIds.length; i += PROFILE_CHUNK) {
      const chunk = userProfileIds.slice(i, i + PROFILE_CHUNK)
      const rows = await prisma.userProfile.findMany({
        where: { id: { in: chunk }, deletedAt: null },
      })
      userProfiles.push(...rows)
    }

    return {
      fixedClasses,
      students,
      lecturers,
      staff,
      userProfiles,
      counts: {
        FixedClass: fixedClasses.length,
        Student: students.length,
        Lecturer: lecturers.length,
        Staff: staff.length,
        UserProfile: userProfiles.length,
      },
    }
  })

  const scoresAndWarnings = await timed("5. điểm + cảnh báo + học bổng", async () => {
    const studentIds = uniqueIds(people.students.map((s) => s.id))
    const exportedCourseIds =
      targetCourseIds.length > 0
        ? targetCourseIds
        : sessionsBlock.trainingCourses.map((tc) => tc.id)
    const scoped = Boolean(targetSession)

    const [
      studentSubjectScores,
      studentSemesterResults,
      academicWarningRules,
      disciplinaryWarningReasons,
      scholarships,
      academicWarnings,
      disciplinaryWarnings,
      scholarshipAwards,
      academicWarningRuleJoins,
      disciplinaryWarningReasonJoins,
    ] = await Promise.all([
      targetSession
        ? studentIds.length > 0
          ? prisma.studentSubjectScore.findMany({
              where: { studentId: { in: studentIds }, deletedAt: null },
            })
          : Promise.resolve([])
        : prisma.studentSubjectScore.findMany({ where: notDeleted }),
      targetSession
        ? studentIds.length > 0
          ? prisma.studentSemesterResult.findMany({
              where: { studentId: { in: studentIds }, deletedAt: null },
            })
          : Promise.resolve([])
        : prisma.studentSemesterResult.findMany({ where: notDeleted }),
      scoped && exportedCourseIds.length === 0
        ? Promise.resolve([])
        : prisma.academicWarningRule.findMany({
            where: {
              ...notDeleted,
              ...(scoped ? { trainingCourseId: { in: exportedCourseIds } } : {}),
            },
          }),
      prisma.disciplinaryWarningReason.findMany({ where: notDeleted }),
      scoped && exportedCourseIds.length === 0
        ? Promise.resolve([])
        : prisma.scholarship.findMany({
            where: {
              ...notDeleted,
              ...(scoped ? { trainingCourseId: { in: exportedCourseIds } } : {}),
            },
          }),
      scoped && studentIds.length === 0
        ? Promise.resolve([])
        : prisma.academicWarning.findMany({
            where: {
              ...notDeleted,
              ...(scoped ? { studentId: { in: studentIds } } : {}),
            },
          }),
      scoped && studentIds.length === 0
        ? Promise.resolve([])
        : prisma.disciplinaryWarning.findMany({
            where: {
              ...notDeleted,
              ...(scoped ? { studentId: { in: studentIds } } : {}),
            },
          }),
      scoped && studentIds.length === 0
        ? Promise.resolve([])
        : prisma.scholarshipAward.findMany({
            where: {
              ...notDeleted,
              ...(scoped ? { studentId: { in: studentIds } } : {}),
            },
          }),
      queryJoinTable("_AcademicWarningToAcademicWarningRule"),
      queryJoinTable("_DisciplinaryWarningToDisciplinaryWarningReason"),
    ])

    const scholarshipIds = scholarships.map((s) => s.id)
    const scholarshipCriteria =
      scholarshipIds.length === 0
        ? []
        : await prisma.scholarshipCriteria.findMany({
            where: { scholarshipId: { in: scholarshipIds }, deletedAt: null },
          })

    const awIds = new Set(academicWarnings.map((w) => w.id))
    const arIds = new Set(academicWarningRules.map((r) => r.id))
    const dwIds = new Set(disciplinaryWarnings.map((w) => w.id))
    const drIds = new Set(disciplinaryWarningReasons.map((r) => r.id))

    return {
      studentSubjectScores,
      studentSemesterResults,
      AcademicWarningRule: academicWarningRules,
      AcademicWarning: academicWarnings,
      _AcademicWarningToAcademicWarningRule: academicWarningRuleJoins.filter(
        (r) => awIds.has(r.A) && arIds.has(r.B)
      ),
      DisciplinaryWarningReason: disciplinaryWarningReasons,
      DisciplinaryWarning: disciplinaryWarnings,
      _DisciplinaryWarningToDisciplinaryWarningReason: disciplinaryWarningReasonJoins.filter(
        (r) => dwIds.has(r.A) && drIds.has(r.B)
      ),
      Scholarship: scholarships,
      ScholarshipCriteria: scholarshipCriteria,
      ScholarshipAward: scholarshipAwards,
      counts: {
        StudentSubjectScore: studentSubjectScores.length,
        StudentSemesterResult: studentSemesterResults.length,
        AcademicWarning: academicWarnings.length,
        DisciplinaryWarning: disciplinaryWarnings.length,
        Scholarship: scholarships.length,
        ScholarshipAward: scholarshipAwards.length,
        AcademicWarningRule: academicWarningRules.length,
        ScholarshipCriteria: scholarshipCriteria.length,
      },
    }
  })

  const memBeforeJson = memSnapshot()

  const pack = await timed("6. đóng gói + JSON.stringify", async () => {
    const subjectClasses = sessionsBlock.subjectClasses.map((sc) => ({
      ...sc,
      scoreLinkSubjectVersionId: null,
    }))
    const data: Record<string, unknown[]> = {
      ...catalogs,
      ClassRegisterSession: sessionsBlock.classRegisterSessions,
      ClassRegisterSessionCredit: sessionsBlock.classRegisterSessionCredits,
      _ClassRegisterSessionToTrainingCourse: sessionsBlock.sessionToTrainingCourse,
      UserProfile: people.userProfiles,
      Student: people.students,
      Lecturer: people.lecturers,
      Staff: people.staff,
      TrainingObjectType: structure.trainingObjectTypes,
      SchoolYear: sessionsBlock.schoolYears,
      Semester: sessionsBlock.semesters,
      TrainingCourse: sessionsBlock.trainingCourses,
      TrainingCourseRegulation: sessionsBlock.trainingCourseRegulations,
      Subject: structure.subjects,
      SubjectVersion: structure.subjectVersions,
      _PrerequisiteSubject: structure.prerequisiteJoins,
      _CoRequisiteSubject: structure.coRequisiteJoins,
      EquivalencyGroup: structure.equivalencyGroups,
      SubjectInGroup: structure.subjectInGroups,
      TrainingBlock: structure.trainingBlocks,
      TrainingBlockOnCurriculumVersion: structure.trainingBlockOnCvs,
      TrainingBlockSubject: structure.trainingBlockSubjects,
      SubjectClass: subjectClasses,
      SubjectClassTime: sessionsBlock.subjectClassTimes,
      FixedClass: people.fixedClasses,
      _FixedClassToSubjectClass: sessionsBlock.fixedClassToSubjectClass,
      Room: structure.rooms,
      Building: structure.buildings,
      TrainingLocation: structure.trainingLocations,
      TrainingMajor: structure.trainingMajors,
      Curriculum: structure.curriculums,
      CurriculumVersion: structure.curriculumVersions,
      StudentSubjectScore: scoresAndWarnings.studentSubjectScores,
      StudentSemesterResult: scoresAndWarnings.studentSemesterResults,
      Exam: sessionsBlock.exams,
      ClassSchedule: sessionsBlock.classSchedules,
      AcademicWarningRule: scoresAndWarnings.AcademicWarningRule,
      AcademicWarning: scoresAndWarnings.AcademicWarning,
      _AcademicWarningToAcademicWarningRule:
        scoresAndWarnings._AcademicWarningToAcademicWarningRule,
      DisciplinaryWarningReason: scoresAndWarnings.DisciplinaryWarningReason,
      DisciplinaryWarning: scoresAndWarnings.DisciplinaryWarning,
      _DisciplinaryWarningToDisciplinaryWarningReason:
        scoresAndWarnings._DisciplinaryWarningToDisciplinaryWarningReason,
      Scholarship: scoresAndWarnings.Scholarship,
      ScholarshipCriteria: scoresAndWarnings.ScholarshipCriteria,
      ScholarshipAward: scoresAndWarnings.ScholarshipAward,
    }

    const counts = Object.fromEntries(
      Object.entries(data).map(([k, rows]) => [k, Array.isArray(rows) ? rows.length : 0])
    )
    const payload = {
      version: "1.5.0",
      exportedAt: new Date().toISOString(),
      filters: {
        scope: sessionId ? "session" : "full",
        classRegisterSessionIds: sessionsBlock.classRegisterSessions.map((s) => s.id),
        semesterIds: sessionsBlock.semesters.map((s) => s.id),
        trainingCourseIds: sessionsBlock.trainingCourses.map((tc) => tc.id),
      },
      counts,
      data,
    }
    const tStr0 = performance.now()
    const json = JSON.stringify(payload)
    const stringifyMs = performance.now() - tStr0
    const bytes = Buffer.byteLength(json, "utf-8")
    return {
      counts,
      stringifyMs,
      bytes,
      keys: Object.keys(data).length,
      totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    }
  })

  const memAfter = memSnapshot()
  const wallMs = performance.now() - wall0

  const topTables = Object.entries(pack.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const report = {
    scope: sessionId ? "session" : "full",
    sessionId: sessionId || null,
    wallClockSec: +(wallMs / 1000).toFixed(2),
    stagesMs: Object.fromEntries(stages.map((s) => [s.name, +s.ms.toFixed(1)])),
    stringifyMs: +pack.stringifyMs.toFixed(1),
    payload: {
      version: "1.5.0",
      keys: pack.keys,
      totalRows: pack.totalRows,
      bytes: pack.bytes,
      mb: +(pack.bytes / 1024 / 1024).toFixed(2),
    },
    memory: {
      start: memStart,
      beforeJson: memBeforeJson,
      after: memAfter,
      deltaHeapMB: +(memAfter.heapUsedMB - memStart.heapUsedMB).toFixed(1),
      deltaRssMB: +(memAfter.rssMB - memStart.rssMB).toFixed(1),
    },
    topTablesByRowCount: topTables,
    catalogTotalRows: Object.values(catalogCounts).reduce((a, b) => a + b, 0),
    warningScholarship: scoresAndWarnings.counts,
    throughput: {
      rowsPerSec: Math.round(pack.totalRows / (wallMs / 1000)),
      mbPerSec: +((pack.bytes / 1024 / 1024) / (wallMs / 1000)).toFixed(2),
    },
  }

  console.log("\n=== SUMMARY ===")
  console.log(JSON.stringify(report, null, 2))
}

main()
  .catch((e) => {
    console.error("BENCH FAILED:", e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
