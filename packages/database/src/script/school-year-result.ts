import { PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

/**
 * Hàm tính toán kết quả năm học cho một sinh viên cụ thể
 * @param studentId ID sinh viên
 * @param schoolYearId ID năm học cần tính
 */
async function calcStudentYearResult({
  studentId,
  schoolYearId,
}: {
  studentId: string
  schoolYearId: string
}) {
  // 1. Lấy thông tin Năm học và danh sách Học kỳ trong năm đó
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
    include: { semesters: true },
  })

  if (!schoolYear) throw new Error("Không tìm thấy năm học")

  // 2. Lấy thông tin Sinh viên và Khoá học (để lấy cấu hình điểm chuẩn)
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      userProfile: { select: { code: true } },
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              scoreConverts: true,
            },
          },
        },
      },
    },
  })

  if (!student || !student.fixedClass?.trainingCourse)
    throw new Error("Dữ liệu sinh viên hoặc khoá học không hợp lệ")

  const scoreToPass = student.fixedClass.trainingCourse.scoreToPass || 5.0 // Mặc định 4.0 hoặc 5.0 tùy quy chế
  const semesterIds = schoolYear.semesters.map((s) => s.id)

  // 3. Lấy bảng điểm của sinh viên
  // TODO: useForFinalScore lấy theo CTĐT
  // Lấy TOÀN BỘ điểm từ trước đến nay để tính tích lũy
  // Chỉ filter điểm đã có finalScore và môn tính điểm (useForFinalScore)
  const allScores = await prisma.studentSubjectScore.findMany({
    where: {
      studentId: studentId,
      deletedAt: null,
      finalScore: { not: null },
      subjectClass: {
        // Lọc để đảm bảo chỉ lấy điểm của các kỳ học kết thúc trước hoặc trong năm học này
        semester: {
          endDate: { lte: schoolYear.endDate || new Date() },
        },
      },
      // Chỉ lấy các môn được dùng để tính điểm tổng kết (loại bỏ GDQP, GDTC nếu cần)
      subjectVersion: {
        trainingBlocks: {
          some: {
            useForFinalScore: true,
          },
        },
      },
    },
    include: {
      subjectClass: { include: { semester: true } },
      subjectVersion: { include: { subject: true } },
    },
  })

  // --- TÍNH TOÁN ---
  function convertScore10to4(score10: number): number {
    const scoreConvert = student?.fixedClass?.trainingCourse.scoreConverts.find(
      (c) => c.base10Min <= score10 && c.base10Max >= score10
    )
    if (!scoreConvert) return 0
    return scoreConvert.base4
  }

  // A. Phân loại điểm
  // Điểm trong năm học hiện tại
  const scoresInYear = allScores.filter(
    (s) => s.subjectClass && semesterIds.includes(s.subjectClass.semesterId)
  )

  // B. Tính YEARLY (Trung bình năm)
  let yearTotalScore10 = 0
  let yearTotalScore4 = 0
  let yearTotalCredits = 0
  let yearFailedCredits = 0

  // Biến tìm điểm thấp nhất trong năm (COURSE_GRADE_LOWEST)
  let courseGradeLowest = 10

  for (const record of scoresInYear) {
    const credit = record.subjectVersion.credit
    const score10 = Number(record.finalScore)
    // Chuyển đổi sang hệ 4 (Giả sử có hàm convert hoặc dùng bảng ScoreConvert)
    // Ở đây tôi giả lập công thức đơn giản, thực tế cần query bảng ScoreConvert
    const score4 = convertScore10to4(score10)

    yearTotalScore10 += score10 * credit
    yearTotalScore4 += score4 * credit
    yearTotalCredits += credit

    if (score10 < scoreToPass) {
      yearFailedCredits += credit
    }

    if (score10 < courseGradeLowest) {
      courseGradeLowest = score10
    }
  }

  const yearlyGpa10 =
    yearTotalCredits > 0 ? Number.parseFloat((yearTotalScore10 / yearTotalCredits).toFixed(2)) : 0
  const yearlyGpa4 =
    yearTotalCredits > 0 ? Number.parseFloat((yearTotalScore4 / yearTotalCredits).toFixed(2)) : 0

  // C. Tính CUMULATIVE (Trung bình tích lũy)
  // Logic: Với tích lũy, nếu sinh viên học lại môn đó, chỉ lấy điểm cao nhất của môn đó (dựa trên Subject Code)
  const uniqueSubjectsMap = new Map<
    string,
    { score10: number; score4: number; credit: number; passed: boolean }
  >()

  for (const record of allScores) {
    const subjectCode = record.subjectVersion.subject.code || record.subjectVersion.id
    const score10 = Number(record.finalScore)
    const score4 = convertScore10to4(score10)
    const credit = record.subjectVersion.credit
    const passed = score10 >= scoreToPass

    const existing = uniqueSubjectsMap.get(subjectCode)
    if (existing) {
      // Nếu đã có, kiểm tra xem điểm mới có cao hơn không
      if (score10 > existing.score10) {
        uniqueSubjectsMap.set(subjectCode, { score10, score4, credit, passed })
      }
    } else {
      uniqueSubjectsMap.set(subjectCode, { score10, score4, credit, passed })
    }
  }

  let cumulativeTotalScore10 = 0
  let cumulativeTotalScore4 = 0
  let cumulativeTotalCredits = 0
  let cumulativePassedCredits = 0
  let cumulativeDebtCredits = 0

  uniqueSubjectsMap.forEach((val) => {
    cumulativeTotalScore10 += val.score10 * val.credit
    cumulativeTotalScore4 += val.score4 * val.credit
    cumulativeTotalCredits += val.credit

    if (val.passed) {
      cumulativePassedCredits += val.credit
    } else {
      cumulativeDebtCredits += val.credit
    }
  })

  const cumulativeGpa10 =
    cumulativeTotalCredits > 0
      ? Number.parseFloat((cumulativeTotalScore10 / cumulativeTotalCredits).toFixed(2))
      : 0
  const cumulativeGpa4 =
    cumulativeTotalCredits > 0
      ? Number.parseFloat((cumulativeTotalScore4 / cumulativeTotalCredits).toFixed(2))
      : 0

  // D. Lấy thông tin Cảnh báo & Rèn luyện (ACADEMIC_WARNING & CONDUCT)

  // Lấy cảnh báo học tập mới nhất
  const academicWarning = await prisma.academicWarning.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" }, // Hoặc theo logic semester gần nhất
  })

  // Lấy cảnh cáo học đường mới nhất
  const disciplinaryWarning = await prisma.disciplinaryWarning.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  })

  const trainingScore = await prisma.studentTrainingScore.findFirst({
    where: {
      studentId,
      trainingScoreSession: {
        semesterId: { in: semesterIds },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // E. Xác định Xếp loại (RANKING)
  // Cần query bảng AcademicRankingConvert để tìm rank phù hợp
  // Giả sử hệ 4 là mặc định cho xếp loại
  const targetGpa =
    student.fixedClass.trainingCourse.baseScore === "Base4" ? yearlyGpa4 : yearlyGpa10

  const rank = await prisma.academicRankingConvert.findFirst({
    where: {
      trainingCourseId: student.fixedClass.trainingCourse.id,
      context: "STUDYING", // Xếp loại học tập (không phải tốt nghiệp)
      baseScore: student.fixedClass.trainingCourse.baseScore,
      ...(student.fixedClass.trainingCourse.baseScore === "Base10"
        ? {
            base10Min: { lte: targetGpa },
            base10Max: { gte: targetGpa },
          }
        : {
            base4Min: { lte: targetGpa },
            base4Max: { gte: targetGpa },
          }),
    },
    orderBy: { rankOrder: "asc" },
  })

  // 4. Lưu kết quả vào bảng StudentYearResult
  // Sử dụng upsert để tạo mới hoặc cập nhật
  const result = await prisma.studentYearResult.upsert({
    where: {
      studentId_schoolYearId: {
        studentId: studentId,
        schoolYearId: schoolYearId,
      },
    },
    update: {
      studyYear: new Date().getFullYear(), // Cần logic xác định năm thứ mấy
      gpaBase10: yearlyGpa10,
      gpaBase4: yearlyGpa4,
      cumulativeGpaBase10: cumulativeGpa10,
      cumulativeGpaBase4: cumulativeGpa4,
      totalCredits: cumulativePassedCredits, // Tín chỉ tích lũy
      failedCredits: yearFailedCredits,
      conductScore: trainingScore?.score,
      rankId: rank?.id,
      academicWarningLevel: academicWarning?.level || 0,
      disciplinaryWarningLevel: disciplinaryWarning?.level || 0,
      isLastStudyYear: false, // Cần logic check
      baseScore: student.fixedClass.trainingCourse.baseScore,
      studentTrainingType: trainingScore?.studentTrainingType || "GOOD", // Hàm helper
    },
    create: {
      isClassMonitor: false,
      isUnionLeader: false,
      code: `${student.userProfile?.code ?? student.id}_${schoolYear.code}`,
      studentId: studentId,
      schoolYearId: schoolYearId,
      studyYear: new Date().getFullYear(),
      gpaBase10: yearlyGpa10,
      gpaBase4: yearlyGpa4,
      cumulativeGpaBase10: cumulativeGpa10,
      cumulativeGpaBase4: cumulativeGpa4,
      totalCredits: cumulativePassedCredits,
      failedCredits: yearFailedCredits,
      conductScore: trainingScore?.score,
      rankId: rank?.id,
      academicWarningLevel: academicWarning?.level || 0,
      disciplinaryWarningLevel: disciplinaryWarning?.level || 0,
      isLastStudyYear: false,
      baseScore: student.fixedClass.trainingCourse.baseScore,
      studentTrainingType: trainingScore?.studentTrainingType || "GOOD",
    },
  })

  return result
}

const result = await calcStudentYearResult({
  studentId: "cmhlhx381000ds301llwk7gu0",
  schoolYearId: "cmhldvbga0002p001o6c9u2t9",
})
