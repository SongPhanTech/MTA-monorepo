import {
  type AcademicActionCondition,
  type AcademicActionConfig,
  type AcademicActionRuleSet,
  AcademicRankingBaseType,
  type AcademicRankingConvert,
  type AcademicWarningRule,
  CriteriaField,
  CriteriaOperator,
  DecisionStatus,
  OfficerPosition,
  type Prisma,
  RankingContext,
  type Scholarship,
  type ScholarshipCriteria,
  SemesterType,
  type StudentSemesterResult,
  StudentStatus,
  type StudentYearResult,
  SubjectRequirementType,
  type TrainingBlockSubject,
} from "@workspace/db"
import { criteriaFieldLabels, criteriaOperatorLabels } from "@workspace/libs/constants"
import Decimal from "decimal.js"
import pMap from "p-map"
import { prisma } from ".."
import {
  type CourseStudentAcademicActionResult,
  type CourseStudentAcademicWarningResult,
  type CourseStudentDecreaseAcademicWarningResult,
  type CourseStudentScholarshipResult,
  type ListAcademicAction,
  StudentAcademicActionResult,
  StudentAcademicWarningResult,
  StudentDecreaseAcademicWarningResult,
  type StudentInfoCheck,
  type StudentRepeatGrade,
  StudentScholarshipResult,
} from "../dto/student-info.dto"
import type { StudentCondition, StudentDataContext } from "../types/student-context"

const checkScorePassed = ({
  subjectId,
  finalScore,
  curriculumSubjects,
  scoreToPass,
  scoreToPassConditional,
  scoreToPassGraduation,
  scoreConverts,
}: {
  subjectId: string
  finalScore: number
  curriculumSubjects: Pick<TrainingBlockSubject, "subjectId" | "graduation" | "useForFinalScore">[]
  scoreToPass: number
  scoreToPassConditional: number
  scoreToPassGraduation: number
  scoreConverts: ScoreConvertItem[]
}): boolean => {
  const graduation = curriculumSubjects.find((item) => item.subjectId === subjectId)?.graduation
  const useForFinalScore = curriculumSubjects.find(
    (item) => item.subjectId === subjectId
  )?.useForFinalScore
  if (graduation && finalScore < scoreToPassGraduation) {
    return false
  }
  if (useForFinalScore && finalScore < scoreToPass) {
    return false
  }
  if (!graduation && !useForFinalScore && finalScore < scoreToPassConditional) {
    return false
  }

  const diemHe10Obj = scoreConverts.find(
    (item) => item.base10Min <= finalScore && item.base10Max >= finalScore
  )

  if (!diemHe10Obj?.pass) {
    return false
  }

  return true
}

// #region ThongTinTichLuy
const ThongTinTichLuy = async (
  studentId: string,
  curriculumVersionId: string,
  trainingCourseId: string,
  semesterStartDate: Date,
  semesterEndDate?: Date,
  currentSemesterId?: string
) => {
  try {
    // Học kỳ bắt đầu của sinh viên (căn cứ theo khoá)
    const trainingCourse = await prisma.trainingCourse.findFirst({
      where: {
        id: trainingCourseId,
        deletedAt: null,
        active: true,
      },
      select: {
        semesterStart: {
          select: { id: true, startDate: true, semesterType: true },
        },
        scoreToPass: true,
        scoreToPassConditional: true,
        scoreToPassGraduation: true,
        baseScore: true,
        academicRankingConvert: {
          where: {
            context: RankingContext.STUDYING,
            deletedAt: null,
            active: true,
          },
          orderBy: { rankOrder: "asc" },
        },
        trainingObjectType: {
          select: { type: true },
        },
      },
    })

    if (!trainingCourse?.semesterStart) {
      console.error("Không tìm thấy học kỳ bắt đầu cho khoá học:", trainingCourseId)
      throw new Error("Không tìm thấy học kỳ bắt đầu cho khoá học.")
    }

    if (trainingCourse.semesterStart.startDate > semesterStartDate) {
      throw new Error("Start semester is after end semester.")
    }

    const DsHocKy = await prisma.semester.findMany({
      where: {
        startDate: {
          gte: trainingCourse.semesterStart.startDate,
          lte: semesterStartDate,
        },
        semesterType: { in: [SemesterType.FIRST, SemesterType.SECOND] }, // Chỉ lấy học kỳ chính
        deletedAt: null,
        active: true,
      },
      select: {
        id: true,
        startDate: true,
        semesterType: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    if (DsHocKy.length === 0) {
      console.error("Không tìm thấy học kỳ nào giữa học kỳ bắt đầu và học kỳ đầu vào.")
      throw new Error("Không tìm thấy học kỳ nào giữa học kỳ bắt đầu và học kỳ đầu vào.")
    }
    const kyDangHoc = DsHocKy.length

    // Danh sách các môn học trong chương trình đào tạo
    const curriculumSubjects = await prisma.trainingBlockSubject.findMany({
      where: {
        trainingBlockOnCurriculumVersion: { curriculumVersionId },
        deletedAt: null,
        active: true,
      },
      select: {
        graduation: true,
        subjectId: true,
        useForFinalScore: true,
      },
    })

    const isCivilian = trainingCourse.trainingObjectType?.type === "CIVILIAN"
    const shouldFilterByCurrentSemester = currentSemesterId && isCivilian

    // Kiểm tra tổng tích lũy tín chỉ của sinh viên đến kỳ xác định
    // Lấy tất cả điểm (kể cả lớp học lại), sau đó tự nhóm + lấy điểm cao nhất theo môn
    const allSubjectScores = await prisma.studentSubjectScore.findMany({
      where: {
        OR: [
          {
            subjectClass: null,
            createdAt:
              shouldFilterByCurrentSemester && semesterEndDate
                ? {
                    gte: semesterStartDate,
                    lte: semesterEndDate,
                  }
                : {
                    lte: semesterStartDate, // lấy điểm nhập tay đến thời điểm kỳ đang xét
                  },
          },
          {
            subjectClass: {
              ...(shouldFilterByCurrentSemester
                ? { semesterId: currentSemesterId }
                : {
                    semester: {
                      startDate: {
                        lte: semesterStartDate, // lấy tất cả các kỳ trước kỳ đang xét
                      },
                    },
                  }),
              cancelled: false,
            },
          },
        ],
        studentId,
        subjectVersionId: {
          // Chỉ lấy các môn trong chương trình đào tạo
          in: curriculumSubjects.map((item) => item.subjectId),
        },
        deletedAt: null,
        active: true,
        examPostponed: false,
        withdrew: false,
      },
      select: {
        subjectVersionId: true,
        subjectVersion: {
          select: {
            credit: true, // Số tín chỉ của môn học
            trainingBlocks: {
              select: {
                useForFinalScore: true, // Có tính điểm
              },
            },
          },
        },
        subjectClass: {
          select: { type: true }, // Xác định lớp học lại (RETAKE)
        },
        manualFinalScore: true, // Lấy điểm thủ công nếu có
        finalScore: true, // Lấy điểm cuối
        examBanned: true, // Có cấm thi không
        suspended: true, // Có đình chỉ học không
        exempted: true, // Có miễn thi không
      },
    })

    // Nhóm theo môn học và lấy điểm cao nhất (ưu tiên lớp học lại có điểm cao hơn)
    type ScoreRecord = (typeof allSubjectScores)[number]
    const bestScoreMap = new Map<string, ScoreRecord>()
    for (const record of allSubjectScores) {
      const existing = bestScoreMap.get(record.subjectVersionId)
      if (!existing) {
        bestScoreMap.set(record.subjectVersionId, record)
        continue
      }
      const newScore = record.manualFinalScore ?? record.finalScore?.toNumber() ?? null
      const existingScore = existing.manualFinalScore ?? existing.finalScore?.toNumber() ?? null
      // Ưu tiên lớp học lại hoặc điểm cao hơn
      const isRetake =
        record.subjectClass?.type === "RETAKE" || record.subjectClass?.type === "REEXAM"
      if (newScore !== null && (existingScore === null || newScore > existingScore || isRetake)) {
        bestScoreMap.set(record.subjectVersionId, record)
      }
    }
    const highestSubjectScores = Array.from(bestScoreMap.values())

    // Danh sách chuyển đổi điểm
    const scoreConverts = await prisma.scoreConvert.findMany({
      where: {
        trainingCourseId,
        deletedAt: null,
        active: true,
      },
      orderBy: { base10Min: "desc" },
      select: {
        trainingCourseId: true,
        letter: true,
        base10Min: true,
        base10Max: true,
        base4: true,
        classification: true,
        pass: true,
      },
    })
    const DSDiemHe4: number[] = []
    const DSDiemHe10: number[] = []
    const DSDiemChungHe4: number[] = []
    const DSDiemChungHe10: number[] = []
    let TongTinChiTichLuy = 0
    let TongTinChiDangKy = 0
    let TongTinChiChungTichLuy = 0
    let failedCredits = 0
    scoreLoop: for (const item of highestSubjectScores) {
      for (const s of curriculumSubjects) {
        if (s.subjectId === item.subjectVersionId) {
          if (!s.useForFinalScore) {
            continue scoreLoop
          }

          let diemHe10 = item.manualFinalScore ?? item.finalScore?.toNumber() // Lấy điểm thủ công nếu có, nếu không thì lấy điểm cuối

          // cấm thi hoặc đình chỉ
          if (item.examBanned || item.suspended) {
            diemHe10 = 0 // Cấm thi thì điểm là 0
            continue // Bỏ qua nếu có lý do không tính điểm
          }
          if (diemHe10 === null || diemHe10 === undefined) {
            continue // Bỏ qua nếu chưa có điểm hoặc điểm không hợp lệ
          }
          const soTinChi = item.subjectVersion?.credit || 0 // Số tín chỉ của môn học
          TongTinChiDangKy += soTinChi // Cộng dồn số tín chỉ đăng ký
          if (
            checkScorePassed({
              subjectId: s.subjectId,
              finalScore: diemHe10,
              curriculumSubjects,
              scoreToPassConditional: trainingCourse.scoreToPassConditional,
              scoreToPass: trainingCourse.scoreToPass,
              scoreToPassGraduation: trainingCourse.scoreToPassGraduation,
              scoreConverts,
            })
          ) {
            TongTinChiTichLuy += soTinChi // chỉ tính môn đã qua
            const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, scoreConverts)
            DSDiemHe4.push(new Decimal(diemHe4).mul(soTinChi).toNumber()) // Nhân điểm hệ 4 với số tín chỉ (chỉ môn đạt)
            DSDiemHe10.push(new Decimal(diemHe10).mul(soTinChi).toNumber()) // Nhân điểm hệ 10 với số tín chỉ (chỉ môn đạt)
          } else {
            failedCredits += soTinChi
          }
        }
      }
    }

    // GPA hệ 4
    // GPA hệ 4
    // Làm tròn đến 2 số thập phân (chỉ tính môn đạt, không tính môn trượt)
    const sumGPA4 = DSDiemHe4.reduce((sum, val) => new Decimal(sum).plus(val).toNumber(), 0)
    const diemTrungBinh4 =
      TongTinChiTichLuy > 0
        ? new Decimal(sumGPA4)
            .dividedBy(TongTinChiTichLuy)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber()
        : 0
    const sumGPA10 = DSDiemHe10.reduce((sum, val) => new Decimal(sum).plus(val).toNumber(), 0)
    const diemTrungBinh10 =
      TongTinChiTichLuy > 0
        ? new Decimal(sumGPA10)
            .dividedBy(TongTinChiTichLuy)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber()
        : 0

    const diemTrungBinhChung4 = diemTrungBinh4
    const diemTrungBinhChung10 = diemTrungBinh10

    const MonHocYeuCau = await prisma.trainingBlockOnCurriculumVersion.findMany({
      where: {
        curriculumVersionId,
        subjects: {
          some: {
            // useForFinalScore: true, // Chỉ lấy các môn có tính điểm
            type: SubjectRequirementType.Mandatory,
          },
        },
        deletedAt: null,
        active: true,
      },
      select: {
        subjects: {
          // TrainingBlockSubject
          select: {
            semester: true, // Kỳ dự kiến
            subject: {
              select: {
                credit: true, // Số tín chỉ của môn học
              },
            },
          },
        },
      },
    })
    // Tính tổng số tín chỉ yêu cầu đến thời điểm hiện tại (chỉ tính các môn có kỳ dự kiến <= kỳ đang học)
    const TongTinChiYeuCau = MonHocYeuCau.reduce((tong, item) => {
      const filteredSubjects = item.subjects.filter(
        (subject) => (subject.semester ?? 0) <= kyDangHoc
      )
      return (
        tong +
        filteredSubjects.reduce((tongMon, mon) => {
          return tongMon + (mon.subject?.credit || 0)
        }, 0)
      )
    }, 0)

    // Tìm số tín chỉ mở trong kỳ hiện tại
    const TongTinChiMoTrongKy = MonHocYeuCau.reduce((tong, item) => {
      return (
        tong +
        item.subjects.reduce((tongMon, mon) => {
          if ((mon.semester ?? 0) === kyDangHoc) {
            return tongMon + (mon.subject?.credit || 0)
          }
          return tongMon
        }, 0)
      )
    }, 0)

    // Kỳ lớn nhất của CTDT
    // Tìm kỳ dự kiến lớn nhất trong CTDT
    const maxSemester = Math.max(
      0,
      ...MonHocYeuCau.flatMap((item) => item.subjects.map((mon) => mon.semester ?? 0))
    )

    const rank =
      trainingCourse.baseScore === AcademicRankingBaseType.Base10
        ? await phanLoaiDiemHe10(
            diemTrungBinh10,
            trainingCourseId,
            trainingCourse.academicRankingConvert
          )
        : await phanLoaiDiemHe4(
            diemTrungBinh4,
            trainingCourseId,
            trainingCourse.academicRankingConvert
          )

    return {
      kyDangHoc: kyDangHoc,
      kyCuoi: kyDangHoc === maxSemester,
      diemTrungBinh4TichLuy: diemTrungBinh4,
      diemTrungBinh10TichLuy: diemTrungBinh10,
      diemTrungBinhChung4,
      diemTrungBinhChung10,
      TongTinChiTichLuy,
      rank,
      tongTinChiDaTichLuy: TongTinChiTichLuy, // Số tín chỉ đã tích lũy
      tongTinChiYeuCauDenThoiDiemHienTai: TongTinChiYeuCau,
      tongTinChiMoTrongKy: TongTinChiMoTrongKy,
      tongTinChiNoTichLuy: failedCredits, // Số tín chỉ nợ tích lũy
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin học kỳ:", error)
    return {
      kyDangHoc: 0,
      kyCuoi: false,
      diemTrungBinh4TichLuy: 0,
      diemTrungBinh10TichLuy: 0,
      diemTrungBinhChung4: 0,
      diemTrungBinhChung10: 0,
      TongTinChiTichLuy: 0,
      rank: null,
      tongTinChiDaTichLuy: 0,
      tongTinChiYeuCauDenThoiDiemHienTai: 0,
      tongTinChiMoTrongKy: 0,
      tongTinChiNoTichLuy: 0, // Số tín chỉ nợ tích lũy
    }
  }
}

interface ScoreConvertItem {
  trainingCourseId: string
  classification: string
  letter: string
  base10Min: number
  base10Max: number
  base4: number
  pass: boolean
}
const layGiaTriDiem4 = (
  diemHe10: number,
  trainingCourseId: string,
  scoreConvert: ScoreConvertItem[]
): number => {
  if (!scoreConvert?.length || typeof diemHe10 !== "number" || Number.isNaN(diemHe10)) {
    console.error("Lỗi logic: Dữ liệu tính toán điểm không hợp lệ hoặc bảng quy đổi trống")
    return 0
  }

  const diemHe4 = scoreConvert.find(
    (item) =>
      item.trainingCourseId === trainingCourseId &&
      diemHe10 >= item.base10Min &&
      diemHe10 <= item.base10Max
  )

  return diemHe4?.base4 ?? 0
}

const phanLoaiDiemHe4 = async (
  diemHe4: number,
  trainingCourseId: string,
  rankingConvert: AcademicRankingConvert[] = []
) => {
  const rank = rankingConvert.find(
    (item) =>
      item.trainingCourseId === trainingCourseId &&
      item.base4Max !== null &&
      item.base4Min !== null &&
      diemHe4 <= item.base4Max &&
      diemHe4 >= item.base4Min
  )

  return rank
}

const phanLoaiDiemHe10 = async (
  diemHe10: number,
  trainingCourseId: string,
  rankingConvert: AcademicRankingConvert[] = []
) => {
  const rank = rankingConvert.find(
    (item) =>
      item.trainingCourseId === trainingCourseId &&
      item.base10Max !== null &&
      item.base10Min !== null &&
      diemHe10 <= item.base10Max &&
      diemHe10 >= item.base10Min
  )

  return rank
}
const ThongTinDiemHocKy = async (
  studentId: string,
  curriculumVersionId: string,
  trainingCourseId: string,
  semesterId: string,
  baseType: AcademicRankingBaseType,
  scoreToPass: number,
  scoreToPassConditional: number,
  scoreToPassGraduation: number
) => {
  try {
    const semester = await prisma.semester.findUniqueOrThrow({
      where: { id: semesterId },
      select: {
        startDate: true,
        endDate: true,
      },
    })

    // Danh sách các môn học trong chương trình đào tạo
    const curriculumSubjects = await prisma.trainingBlockSubject.findMany({
      where: {
        trainingBlockOnCurriculumVersion: {
          curriculumVersionId,
        },
        deletedAt: null,
        active: true,
      },
      select: {
        subjectId: true,
        useForFinalScore: true,
        graduation: true,
      },
    })
    const DsDiem = await prisma.studentSubjectScore.findMany({
      where: {
        OR: [
          {
            subjectClass: null,
            createdAt: {
              gte: semester.startDate,
              lte: semester.endDate,
            },
          },
          { subjectClass: { semesterId, cancelled: false } },
        ],
        studentId,
        subjectVersionId: {
          // Chỉ lấy các môn trong chương trình đào tạo
          in: curriculumSubjects.map((item) => item.subjectId),
        },
        deletedAt: null,
        active: true,
        withdrew: false, // Có rút môn không
      },
      select: {
        id: true,
        finalScore: true,
        manualFinalScore: true, // Lấy điểm thủ công nếu có
        studentId: true,
        subjectVersionId: true,
        subjectClass: { select: { type: true } },
        subjectVersion: {
          select: {
            credit: true, // lấy số tín chỉ của môn học
            trainingBlocks: {
              select: {
                graduation: true, // môn tốt nghiệp
                useForFinalScore: true, // có tính điểm hay không
              },
            },
          },
        },
        examPostponed: true, // Có hoãn thi không
        examBanned: true, // Có cấm thi không
        suspended: true, // Có đình chỉ học không
        exempted: false, // Có miễn thi không
      },
      orderBy: { finalScore: "desc" },
      distinct: ["subjectVersionId"],
    })

    // Danh sách chuyển đổi
    const scoreConverts = await prisma.scoreConvert.findMany({
      where: {
        trainingCourseId,
        deletedAt: null,
        active: true,
      },
      orderBy: { base10Min: "desc" },
      select: {
        trainingCourseId: true,
        letter: true,
        base10Min: true,
        base10Max: true,
        base4: true,
        classification: true,
        pass: true,
      },
    })

    // Tính điểm trung bình của sinh viên
    // console.log('Điểm của sinh viên:', studentId, DsDiem)

    const DsDiemHe4: number[] = []
    const DSDiemHe10: number[] = []
    let TongTinChiDangKy = 0
    let TongTinChiGpa = 0
    let diemThapNhat = 0
    let soTinChiDat = 0
    let soTinChiKhongDat = 0
    let retakingCredits = 0
    let reExamCredits = 0

    DsDiem.forEach((item) => {
      for (const s of curriculumSubjects) {
        if (s.subjectId === item.subjectVersionId) {
          if (!s.useForFinalScore || item.examPostponed) {
            return
          }

          if (item.subjectClass?.type === "RETAKE") {
            retakingCredits += item.subjectVersion.credit
          }

          if (item.subjectClass?.type === "REEXAM") {
            reExamCredits += item.subjectVersion.credit
          }

          const soTinChi = item.subjectVersion.credit // Số tín chỉ của môn học
          TongTinChiDangKy += soTinChi // Cộng dồn TẤT CẢ tín chỉ đăng ký (bất kể có điểm hay chưa)

          if (!item.finalScore && !item.manualFinalScore) {
            return
          }

          let diemHe10 = item.manualFinalScore ?? item.finalScore?.toNumber() // Lấy điểm thủ công nếu có, nếu không thì lấy điểm cuối

          // Kiểm tra xem có lý do cấm thi không
          if (item.examBanned || item.suspended) {
            diemHe10 = 0 // Cấm thi thì điểm là 0
          }
          if (diemHe10 === null || diemHe10 === undefined) {
            return // Bỏ qua nếu chưa có điểm hoặc điểm không hợp lệ
          }
          if (diemHe10 < diemThapNhat || diemThapNhat === 0) {
            diemThapNhat = diemHe10 // Cập nhật điểm thấp nhất
          }

          TongTinChiGpa += soTinChi // Chỉ cộng dồn vào tín chỉ tính GPA nếu có điểm
          if (
            !checkScorePassed({
              subjectId: item.subjectVersionId,
              finalScore: diemHe10,
              curriculumSubjects,
              scoreToPass,
              scoreToPassConditional,
              scoreToPassGraduation,
              scoreConverts,
            })
          ) {
            soTinChiKhongDat += soTinChi // Cộng dồn số tín chỉ không đạt
          } else {
            soTinChiDat += soTinChi // Cộng dồn số tín chỉ đạt
          }
          const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, scoreConverts)
          DsDiemHe4.push(new Decimal(diemHe4).mul(soTinChi).toNumber()) // Nhân điểm hệ 4 với số tín chỉ (tất cả môn)
          DSDiemHe10.push(new Decimal(diemHe10).mul(soTinChi).toNumber()) // Nhân điểm hệ 10 với số tín chỉ (tất cả môn)
        }
      }
    })

    if (TongTinChiDangKy === 0) {
      return {
        diemTrungBinh4TrongKy: 0,
        diemTrungBinh10TrongKy: 0,
        xepLoaiHocTap: "Không",
        tongTinChiDangKy: 0,
        diemThapNhat,
        soTinChiDat,
        soTinChiKhongDat,
        retakingCredits,
        reExamCredits,
      }
    }

    // Tính điểm trung bình hệ 4 trong kỳ (tính chung tất cả)
    const sumGPA4 = DsDiemHe4.reduce((sum, val) => new Decimal(sum).plus(val).toNumber(), 0)
    const diemTrungBinh4 =
      TongTinChiGpa > 0
        ? new Decimal(sumGPA4)
            .dividedBy(TongTinChiGpa)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber()
        : 0
    // Tính điểm trung bình hệ 10 trong kỳ (tính chung tất cả)
    const sumGPA10 = DSDiemHe10.reduce((sum, val) => new Decimal(sum).plus(val).toNumber(), 0)
    const diemTrungBinh10 =
      TongTinChiGpa > 0
        ? new Decimal(sumGPA10)
            .dividedBy(TongTinChiGpa)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber()
        : 0
    // Điểm thấp nhất
    return {
      diemTrungBinh4TrongKy: diemTrungBinh4,
      diemTrungBinh10TrongKy: diemTrungBinh10,
      tongTinChiDangKy: TongTinChiDangKy,
      xepLoaiHocTap: phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId),
      diemThapNhat: diemThapNhat,
      soTinChiDat: soTinChiDat, // Số tín chỉ đạt trong kỳ
      soTinChiKhongDat: soTinChiKhongDat, // Số tín chỉ không đạt trong kỳ
      reExamCredits,
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin điểm:", error)
    return {
      diemTrungBinh4TrongKy: 0,
      diemTrungBinh10TrongKy: 0,
      xepLoaiHocTap: "Lỗi khi tính điểm",
      tongTinChiDangKy: 0,
      diemThapNhat: 0,
      soTinChiDat: 0, // Số tín chỉ đạt trong kỳ
      soTinChiKhongDat: 0, // Số tín chỉ không đạt trong kỳ
    }
  }
}

//#region ThongTinDiemHocKy
// Main function
export const calculateStudentSemesterResult = async (
  semesterId: string,
  trainingCourseId: string
): Promise<string> => {
  const startedAt = Date.now()
  const stats = {
    totalStudents: 0,
    upserted: 0,
    skippedNoTrainingCourse: 0,
    skippedNoSemesterInfo: 0,
    skippedNoSemesterScore: 0,
    gpaZero: 0,
    failed: 0,
  }

  try {
    console.log(
      `[tong-ket-hoc-ky] Bắt đầu tính toán — semesterId=${semesterId}, trainingCourseId=${trainingCourseId}`
    )

    // Thông tin học kỳ
    const hocKyDauVao = await prisma.semester.findUnique({
      where: {
        id: semesterId,
        deletedAt: null,
        active: true,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    })

    if (!hocKyDauVao) {
      console.warn(
        `[tong-ket-hoc-ky] Không tìm thấy học kỳ active — semesterId=${semesterId} (vẫn tiếp tục với ngày hiện tại)`
      )
    } else {
      console.log(
        `[tong-ket-hoc-ky] Học kỳ đầu vào: ${hocKyDauVao.name ?? hocKyDauVao.id} | startDate=${hocKyDauVao.startDate.toISOString()}`
      )
    }

    // Lấy danh sách ID sinh viên chưa tốt nghiệp
    const studentsIDs = await prisma.student.findMany({
      where: {
        status: {
          notIn: [
            StudentStatus.GRADUATED,
            StudentStatus.DEFERRED_STUDY,
            StudentStatus.WITHDRAWN,
            StudentStatus.TRANSFERRED,
          ],
        }, // Chỉ lấy sinh viên đang học
        // fixedClassId: 'K25_CĐT',
        // id: {endsWith: '4'}
        deletedAt: null,
        active: true,
        fixedClass: {
          trainingCourseId,
        },
      },
      include: {
        fixedClass: {
          select: {
            id: true,
            curriculumVersionId: true, // Lấy ID phiên bản chương trình đào tạo
            trainingCourseId: true, // Lấy ID khoá học
            classMonitorId: true, // Lấy ID lớp trưởng
            unionLeaderId: true, // Lấy ID bí thư
            unionSecretaryId: true, // Lấy ID bí thư đoàn
            deputyUnionSecretaryId: true, // Lấy ID phó bí thư liên chi đoàn
            trainingCourse: {
              select: {
                baseScore: true, // Lấy điểm chuẩn của đối tượng đào tạo
                scoreToPass: true,
                scoreToPassConditional: true,
                scoreToPassGraduation: true,
                trainingObjectType: {
                  select: {
                    id: true,
                    name: true, // Lấy tên đối tượng đào tạo
                    code: true, // Lấy mã đối tượng đào tạo
                  },
                },
              },
            },
          },
        },

        subjectClassStudent: {
          select: {
            id: true,
            subjectClass: {
              select: {
                id: true,
                startDate: true, // Lấy ngày bắt đầu lớp
                semesterId: true, // Lấy ID học kỳ của lớp môn học
              },
            },
          },
        },
      },
    })

    stats.totalStudents = studentsIDs.length
    console.log(
      `[tong-ket-hoc-ky] Tìm thấy ${studentsIDs.length} sinh viên đang học thuộc khoá ${trainingCourseId}`
    )

    if (studentsIDs.length === 0) {
      console.warn(
        `[tong-ket-hoc-ky] Không có sinh viên nào để tổng kết — kiểm tra trainingCourseId hoặc trạng thái SV`
      )
    }

    // Chẩn đoán nhanh: có điểm môn trong học kỳ này không?
    const [subjectClassCount, scoreWithFinalCount, scoreInSemesterCount] = await Promise.all([
      prisma.subjectClass.count({
        where: { semesterId, deletedAt: null, cancelled: false },
      }),
      prisma.studentSubjectScore.count({
        where: {
          deletedAt: null,
          active: true,
          finalScore: { not: null },
          student: { fixedClass: { trainingCourseId }, deletedAt: null },
        },
      }),
      prisma.studentSubjectScore.count({
        where: {
          deletedAt: null,
          active: true,
          finalScore: { not: null },
          withdrew: false,
          subjectClass: { semesterId, cancelled: false },
          student: { fixedClass: { trainingCourseId }, deletedAt: null },
        },
      }),
    ])
    console.log(
      `[tong-ket-hoc-ky] Chẩn đoán dữ liệu — lớp môn trong kỳ=${subjectClassCount}, điểm có finalScore (khoá)=${scoreWithFinalCount}, điểm gắn lớp kỳ này=${scoreInSemesterCount}`
    )
    if (scoreInSemesterCount === 0) {
      console.warn(
        `[tong-ket-hoc-ky] Không có điểm finalScore nào gắn lớp môn học kỳ ${semesterId} — GPA/TC sẽ = 0 cho mọi SV`
      )
    }

    // Cấu hình điểm cộng cán bộ lớp và bảng quy đổi điểm
    const officerBonusScores = await prisma.officerBonusScore.findMany({
      where: { deletedAt: null, active: true },
    })
    const officerBonusMap = new Map<OfficerPosition, number>(
      officerBonusScores.map((o) => [o.position, o.bonusScore])
    )
    const scoreConverts = await prisma.scoreConvert.findMany({
      where: {
        trainingCourseId,
        deletedAt: null,
        active: true,
      },
      orderBy: { base10Min: "desc" },
      select: {
        trainingCourseId: true,
        letter: true,
        base10Min: true,
        base10Max: true,
        base4: true,
        classification: true,
        pass: true,
      },
    })

    const rankingConvert = await prisma.academicRankingConvert.findMany({
      where: {
        trainingCourseId,
        context: RankingContext.STUDYING,
        deletedAt: null,
        active: true,
      },
    })

    await pMap(
      studentsIDs,
      async (student) => {
        const studentLabel = student.code ?? student.id
        try {
          // lấy khoá học
          const trainingCourseId = student.fixedClass?.trainingCourseId
          if (!trainingCourseId) {
            stats.skippedNoTrainingCourse++
            console.warn(`[tong-ket-hoc-ky] Bỏ qua SV ${studentLabel}: không có khoá học`)
            return
          }
          // Lấy thông tin tích lũy của sinh viên
          const thongTinTichLuy = await ThongTinTichLuy(
            student.id,
            student.curriculumVersionId || student.fixedClass?.curriculumVersionId || "",
            trainingCourseId,
            hocKyDauVao?.startDate || new Date(),
            hocKyDauVao?.endDate || new Date(),
            semesterId
          )

          if (!thongTinTichLuy) {
            stats.skippedNoSemesterInfo++
            console.warn(
              `[tong-ket-hoc-ky] Bỏ qua SV ${studentLabel}: không có thông tin học kỳ/tích lũy`
            )
            return
          }

          // Lấy thông tin điểm học viên
          const baseType =
            student.fixedClass?.trainingCourse?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là Base10 nếu không có thông tin

          // Lấy thông tin điểm học kỳ
          const thongTinDiemHocKy = await ThongTinDiemHocKy(
            student.id,
            student.curriculumVersionId || student.fixedClass?.curriculumVersionId || "",
            trainingCourseId,
            semesterId,
            baseType,
            student.fixedClass?.trainingCourse?.scoreToPass || 0,
            student.fixedClass?.trainingCourse?.scoreToPassConditional || 0,
            student.fixedClass?.trainingCourse?.scoreToPassGraduation || 0
          )
          if (!thongTinDiemHocKy) {
            stats.skippedNoSemesterScore++
            console.warn(
              `[tong-ket-hoc-ky] Bỏ qua SV ${studentLabel}: không có thông tin điểm học kỳ`
            )
            return
          }

          const academicWarningForSemester = await prisma.academicWarning.findFirst({
            where: {
              studentId: student.id,
              semesterId,
              deletedAt: null,
              active: true,
            },
            orderBy: { createdAt: "desc" },
          })
          const disciplinaryWarning = await prisma.disciplinaryWarning.findFirst({
            where: { studentId: student.id, semesterId, deletedAt: null, active: true },
            orderBy: { createdAt: "desc" },
          })

          const conductScore = await prisma.semesterTrainingScore.findFirst({
            where: {
              studentId: student.id,
              semesterId,
              deletedAt: null,
              active: true,
              status: "APPROVED",
            },
            orderBy: { createdAt: "desc" },
          })

          // Tính điểm cộng cán bộ và snapshot GPA đã cộng thưởng
          const fixedClass = student.fixedClass
          const heldPositions: OfficerPosition[] = []
          if (fixedClass?.classMonitorId === student.id)
            heldPositions.push(OfficerPosition.CLASS_MONITOR)
          if (fixedClass?.unionSecretaryId === student.id)
            heldPositions.push(OfficerPosition.UNION_SECRETARY)
          if (fixedClass?.unionLeaderId === student.id)
            heldPositions.push(OfficerPosition.UNION_LEADER)
          if (fixedClass?.deputyUnionSecretaryId === student.id)
            heldPositions.push(OfficerPosition.DEPUTY_UNION_SECRETARY)
          const diemThuongCanBo = heldPositions.reduce(
            (max, p) => Math.max(max, officerBonusMap.get(p) ?? 0),
            0
          )
          const gpaBase10Goc = thongTinDiemHocKy.diemTrungBinh10TrongKy
          const gpaBase4Goc = thongTinDiemHocKy.diemTrungBinh4TrongKy
          const gpaBase10WithBonus = gpaBase10Goc + diemThuongCanBo
          const gpaBase4WithBonus =
            diemThuongCanBo > 0
              ? layGiaTriDiem4(gpaBase10WithBonus, trainingCourseId, scoreConverts) || gpaBase4Goc
              : gpaBase4Goc

          const semesterRank =
            baseType === AcademicRankingBaseType.Base10
              ? await phanLoaiDiemHe10(gpaBase10WithBonus, trainingCourseId, rankingConvert)
              : await phanLoaiDiemHe4(gpaBase4WithBonus, trainingCourseId, rankingConvert)

          const result: Prisma.StudentSemesterResultUncheckedCreateInput = {
            studentId: student.id,
            conductScore: conductScore?.score || 10,
            semesterId,
            studyYear: Math.floor((thongTinTichLuy.kyDangHoc + 1) / 2), // năm học thứ mấy
            semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
            isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

            baseScore: baseType, // Lấy baseScore từ đối tượng đào tạo, nếu không có thì mặc định là Base10
            gpaBase4: new Decimal(thongTinDiemHocKy.diemTrungBinh4TrongKy),
            gpaBase10: new Decimal(thongTinDiemHocKy.diemTrungBinh10TrongKy),
            cumulativeGpaBase4: new Decimal(thongTinTichLuy.diemTrungBinh4TichLuy),
            cumulativeGpaBase10: new Decimal(thongTinTichLuy.diemTrungBinh10TichLuy),
            cgpaBase4: new Decimal(thongTinTichLuy.diemTrungBinhChung4),
            cgpaBase10: new Decimal(thongTinTichLuy.diemTrungBinhChung10),
            lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
            lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
            totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ
            registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ
            passedCredits: thongTinDiemHocKy.soTinChiDat,
            failedCredits: thongTinDiemHocKy.soTinChiKhongDat,
            accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
            totalCreditsByCurriculum: thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
            totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ nợ tích lũy
            rankId: semesterRank?.id ?? null,
            foreignLangPass: student.foreignLangPass, // Đạt trình độ ngoại nsgữ theo quy định
            isClassMonitor: student.id === student.fixedClass?.classMonitorId,
            isUnionLeader: student.id === student.fixedClass?.unionLeaderId,
            gpaBase10WithBonus: new Decimal(gpaBase10WithBonus),
            gpaBase4WithBonus: new Decimal(gpaBase4WithBonus),
            entryScore: student.entryScore, // Điểm đầu vào
            academicWarningLevel:
              student.academicWarningLevel ?? academicWarningForSemester?.level ?? 0, // mức cảnh báo học tập
            disciplinaryWarningLevel: disciplinaryWarning?.level ?? 0, // mức cảnh cáo học đường
            suspended: student.suspended, // đình chỉ học
            expelled: student.expelled, // đuổi học
            retakingCredits: thongTinDiemHocKy.retakingCredits, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
            reExamCredits: thongTinDiemHocKy.reExamCredits,
            isImproving: !!thongTinDiemHocKy.reExamCredits, // TODO: update this
            postponeWithReason: false, // tạm ngưng có lý do
            active: true,
            description: null,
            deletedAt: null,
            // createdBy: '',
          }

          await prisma.studentSemesterResult.upsert({
            where: { studentId_semesterId: { studentId: student.id, semesterId } },
            update: result,
            create: result,
          })

          stats.upserted++
          if (
            thongTinDiemHocKy.diemTrungBinh4TrongKy === 0 ||
            thongTinDiemHocKy.diemTrungBinh10TrongKy === 0
          ) {
            stats.gpaZero++
          }

          if (stats.upserted <= 3 || stats.upserted % 50 === 0) {
            console.log(
              `[tong-ket-hoc-ky] Mẫu SV #${stats.upserted} ${studentLabel}: gpa10=${thongTinDiemHocKy.diemTrungBinh10TrongKy}, gpa4=${thongTinDiemHocKy.diemTrungBinh4TrongKy}, TC ĐK=${thongTinDiemHocKy.tongTinChiDangKy}, TC đạt=${thongTinDiemHocKy.soTinChiDat}, TC không đạt=${thongTinDiemHocKy.soTinChiKhongDat}`
            )
          }
        } catch (error) {
          stats.failed++
          console.error(`[tong-ket-hoc-ky] Lỗi khi xử lý SV ${studentLabel}:`, error)
        }
      },
      {
        concurrency: 10,
        stopOnError: false,
      }
    )
    // Kiểm tra xem có kết quả sinh viên trong học kỳ này không
    // await Promise.allSettled(
    //     studentsIDs.map(async (student) => {
    //         const existingResult = await checkStudentSemesterResult(semesterId, student.id)
    //         // lấy khoá học
    //         const trainingCourseId = student.fixedClass?.trainingCourseId
    //         if (!trainingCourseId) {
    //             console.log(`Không tìm thấy khoá học cho sinh viên ${student.id}`)
    //             return
    //         }
    //         // Lấy thông tin tích lũy của sinh viên
    //         const thongTinTichLuy = await ThongTinTichLuy(
    //             student.id,
    //             student.curriculumVersionId || student.fixedClass?.curriculumVersionId || '',
    //             trainingCourseId,
    //             hocKyDauVao?.startDate || new Date() // Sử dụng ngày bắt đầu của học kỳ check
    //         )

    //         if (!thongTinTichLuy) {
    //             console.log(`Không tìm thấy thông tin học kỳ cho sinh viên ${student.id}`)
    //             return
    //         }

    //         // Lấy thông tin điểm học viên
    //         const baseType =
    //             student.fixedClass?.trainingCourse?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là Base10 nếu không có thông tin

    //         // Lấy thông tin điểm học kỳ
    //         const thongTinDiemHocKy = await ThongTinDiemHocKy(
    //             student.id,
    //             student.curriculumVersionId || student.fixedClass?.curriculumVersionId || '',
    //             trainingCourseId,
    //             semesterId,
    //             baseType
    //         )
    //         if (!thongTinDiemHocKy) {
    //             console.error(
    //                 `Không tìm thấy thông tin điểm học kỳ cho sinh viên ${student.id}`
    //             )
    //             return
    //         }

    //         const conductScore = await prisma.studentTrainingScore.findFirst({
    //             where: {
    //                 studentId: student.id,
    //                 trainingScoreSession: { semesterId },
    //                 deletedAt: null,
    //                 active: true,
    //             },
    //             orderBy: { createdAt: 'desc' },
    //         })

    //         if (!existingResult) {
    //             console.log(
    //                 `Không tìm thấy kết quả học kỳ cho sinh viên ${student.id}, tạo mới...`
    //             )
    //             // Nếu không có kết quả, tạo mới
    //             const newResult: StudentSemesterResult = {
    //                 id: crypto.randomUUID(), // Tạo ID ngẫu nhiên
    //                 conductScore: conductScore?.score || 10,
    //                 studentId: student.id,
    //                 semesterId,
    //                 createdAt: new Date(),
    //                 updatedAt: new Date(),
    //                 studyYear: Math.floor(thongTinTichLuy.kyDangHoc / 2), // năm học thứ mấy
    //                 semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
    //                 isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

    //                 baseScore:
    //                     student.fixedClass?.trainingCourse?.baseScore ||
    //                     AcademicRankingBaseType.Base10, // Lấy baseScore từ đối tượng đào tạo, nếu không có thì mặc định là Base10
    //                 gpaBase4: new Decimal(thongTinDiemHocKy.diemTrungBinh4TrongKy),
    //                 gpaBase10: new Decimal(thongTinDiemHocKy.diemTrungBinh10TrongKy),
    //                 cumulativeGpaBase4: new Decimal(thongTinTichLuy.diemTrungBinh4TichLuy),
    //                 cumulativeGpaBase10: new Decimal(thongTinTichLuy.diemTrungBinh10TichLuy),

    //                 lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
    //                 lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
    //                 totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ
    //                 registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ
    //                 passedCredits: thongTinDiemHocKy.soTinChiDat,
    //                 failedCredits: thongTinDiemHocKy.soTinChiKhongDat,
    //                 accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
    //                 totalCreditsByCurriculum:
    //                     thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
    //                 totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ nợ tích lũy
    //                 studentTrainingType:
    //                     conductScore?.studentTrainingType ?? StudentTrainingType.GOOD,
    //                 rankId: thongTinTichLuy.rank?.id ?? null,
    //                 foreignLangPass: student.foreignLangPass, // Đạt trình độ ngoại nsgữ theo quy định
    //                 isClassMonitor: student.id === student.fixedClass?.classMonitorId, // là lớp trưởng nếu id trùng classMonitorId)
    //                 isUnionLeader: student.id === student.fixedClass?.unionLeaderId, // là bí thư nếu id trùng unionLeaderId)
    //                 entryScore: student.entryScore, // Điểm đầu vào
    //                 academicWarningLevel: student.academicWarningLevel, // mức cảnh báo học tập
    //                 disciplinaryWarningLevel: student.disciplinaryWarningLevel, // mức cảnh cáo học đường
    //                 suspended: student.suspended, // đình chỉ học
    //                 expelled: student.expelled, // đuổi học
    //                 //TODO: Chưa có thông tin này
    //                 retakingCredits: 0, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
    //                 isImproving: false, // Đang cải thiện (hiện tại chưa có thông tin này)
    //                 postponeWithReason: false, // tạm ngưng có lý do
    //                 code: student.code || '', // Mã sinh viên
    //                 active: true,
    //                 description: null,
    //                 deletedAt: null,
    //                 createdBy: '',
    //             }
    //             // Lưu kết quả học kỳ mới
    //             results.push(newResult)
    //             console.log(`Tạo mới kết quả học kỳ cho sinh viên ${student.id}`)
    //             await prisma.studentSemesterResult.create({
    //                 data: newResult,
    //             })
    //         } else {
    //             // Cập nhật kết quả học kỳ nếu đã tồn tại

    //             if (!existingResult) {
    //                 console.error(
    //                     `Không tìm thấy kết quả học kỳ để cập nhật cho sinh viên ${student.id}`
    //                 )
    //                 return
    //             }
    //             const updatedResult: StudentSemesterResult = {
    //                 id: existingResult.id, // Giữ nguyên ID để cập nhật
    //                 studentId: student.id,
    //                 conductScore: conductScore?.score || 10,
    //                 semesterId,
    //                 createdAt: new Date(),
    //                 updatedAt: new Date(),
    //                 studyYear: Math.floor((thongTinTichLuy.kyDangHoc + 1) / 2), // năm học thứ mấy: kỳ 1,2 -> năm 1; kỳ 3,4 -> năm 2
    //                 semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
    //                 isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

    //                 baseScore:
    //                     student.fixedClass?.trainingCourse?.baseScore ||
    //                     AcademicRankingBaseType.Base10,
    //                 gpaBase4: new Decimal(thongTinDiemHocKy.diemTrungBinh4TrongKy),
    //                 gpaBase10: new Decimal(thongTinDiemHocKy.diemTrungBinh10TrongKy),
    //                 cumulativeGpaBase4: new Decimal(thongTinTichLuy.diemTrungBinh4TichLuy),
    //                 cumulativeGpaBase10: new Decimal(thongTinTichLuy.diemTrungBinh10TichLuy),

    //                 lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
    //                 lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
    //                 totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ

    //                 registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ

    //                 //TODO: Chưa biết xác định thi lại ntn
    //                 retakingCredits: 0, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
    //                 passedCredits: thongTinDiemHocKy.soTinChiDat,
    //                 failedCredits: thongTinDiemHocKy.soTinChiKhongDat,

    //                 accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
    //                 totalCreditsByCurriculum:
    //                     thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
    //                 totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ
    //                 studentTrainingType:
    //                     conductScore?.studentTrainingType ?? StudentTrainingType.GOOD,
    //                 rankId: thongTinTichLuy.rank?.id ?? null,
    //                 //NOTE: Chưa có thông tin này nên lấy thông tin cũ gán lại
    //                 foreignLangPass: existingResult?.foreignLangPass || true, // Đạt trình độ ngoại ngữ theo quy định
    //                 isClassMonitor: existingResult?.isClassMonitor || false, // Chức vụ học viên (hiện tại chưa có thông tin này)
    //                 isUnionLeader: existingResult?.isUnionLeader || false, // Chức vụ đoàn viên (hiện tại chưa có thông tin này)
    //                 entryScore: existingResult?.entryScore || null, // Điểm đầu vào (hiện tại chưa có thông tin này)
    //                 isImproving: existingResult?.isImproving || false, // Đang cải thiện (hiện tại chưa có thông tin này)
    //                 postponeWithReason: existingResult?.postponeWithReason || false, // tạm ngưng có lý do
    //                 academicWarningLevel: existingResult?.academicWarningLevel || 0, // mức cảnh báo học tập
    //                 disciplinaryWarningLevel: existingResult?.disciplinaryWarningLevel || 0, // mức cảnh cáo học đường
    //                 suspended: existingResult?.suspended || false, // đình chỉ học
    //                 expelled: existingResult?.expelled || false, // đuổi học.
    //                 code: existingResult?.code || '',
    //                 active: existingResult?.active || true, // Trạng thái hoạt động
    //                 description: existingResult?.description || null,
    //                 deletedAt: existingResult?.deletedAt || null,
    //                 createdBy: existingResult?.createdBy,
    //             }
    //             // Cập nhật kết quả học kỳ
    //             results.push(updatedResult)
    //             console.log(`Cập nhật kết quả học kỳ cho sinh viên ${student.id}`)
    //             await prisma.studentSemesterResult.update({
    //                 where: {
    //                     id: existingResult.id,
    //                     deletedAt: null,
    //                     active: true,
    //                 },
    //                 data: updatedResult,
    //             })
    //         }
    //     })
    // )

    const savedInDb = await prisma.studentSemesterResult.count({
      where: {
        semesterId,
        deletedAt: null,
        student: {
          deletedAt: null,
          fixedClass: { trainingCourseId },
        },
      },
    })

    console.log(
      `[tong-ket-hoc-ky] Hoàn tất trong ${Date.now() - startedAt}ms — ${JSON.stringify({
        ...stats,
        savedInDb,
        semesterId,
        trainingCourseId,
      })}`
    )

    return "Successfully calculated semester results for all students."
  } catch (error) {
    console.error("Lỗi khi tính toán kết quả học kỳ:", error)
    throw error // Ném lỗi để xử lý ở nơi gọi hàm
  }
}

/**
 * Hàm tính toán kết quả năm học cho một sinh viên cụ thể
 * @param studentId ID sinh viên
 * @param schoolYearId ID năm học cần tính
 */
export async function calculateStudentYearResult({
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
      classMonitor: { select: { id: true } },
      unionLeaderOf: { select: { id: true } },
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              scoreConverts: true,
              semesterStart: true,
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
  // Điểm dùng = manualFinalScore (phiên điểm / chuyển trường) ?? finalScore (học/thi)
  const allScores = await prisma.studentSubjectScore.findMany({
    where: {
      studentId: studentId,
      subjectClass: {
        cancelled: false,
        // Lọc điểm của các kỳ học kết thúc trước/trong năm học, HOẶC nằm trong chính năm học này
        semester: {
          OR: [{ id: { in: semesterIds } }, { endDate: { lte: schoolYear.endDate || new Date() } }],
        },
      },
      // Chỉ lấy các môn được dùng để tính điểm tổng kết (loại bỏ GDQP, GDTC nếu cần)
    },
    include: {
      subjectClass: { include: { semester: true } },
      subjectVersion: true,
    },
  })

  // 3.1 Lấy thông tin môn học trong CTĐT của sinh viên
  const curriculumVersionId = student.curriculumVersionId || student.fixedClass?.curriculumVersionId
  if (!curriculumVersionId) throw new Error("Sinh viên chưa được gán CTĐT")

  const trainingBlockSubjects = await prisma.trainingBlockSubject.findMany({
    where: {
      trainingBlockOnCurriculumVersion: {
        curriculumVersionId: curriculumVersionId,
      },
      active: true,
      deletedAt: null,
    },
    select: {
      subjectId: true,
      useForFinalScore: true,
      graduation: true,
    },
  })

  const subjectConfigMap = new Map<string, { useForFinalScore: boolean; graduation: boolean }>()
  trainingBlockSubjects.forEach((tbs) => {
    subjectConfigMap.set(tbs.subjectId, {
      useForFinalScore: tbs.useForFinalScore,
      graduation: tbs.graduation,
    })
  })

  // --- TÍNH TOÁN ---
  function convertScore10to4(score10: number): number {
    const scoreConverts = [...(student?.fixedClass?.trainingCourse?.scoreConverts || [])].sort(
      (a, b) => (b.base10Min || 0) - (a.base10Min || 0)
    )
    const scoreConvert = scoreConverts.find((c) => c.base10Min <= score10 && c.base10Max >= score10)
    if (!scoreConvert) return 0
    return scoreConvert.base4
  }

  const roundGpa = (totalWeightedScore: Decimal, credits: number) =>
    credits > 0
      ? totalWeightedScore
          .dividedBy(credits)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          .toNumber()
      : 0

  // A. Phân loại điểm
  // Điểm trong năm học hiện tại
  const scoresInYear = allScores.filter(
    (s) => s.subjectClass && semesterIds.includes(s.subjectClass.semesterId)
  )

  const scoreToPassConditional = student.fixedClass.trainingCourse.scoreToPassConditional || 0

  // B. Tính YEARLY (Trung bình năm)
  let yearTotalScore10 = new Decimal(0)
  let yearTotalScore4 = new Decimal(0)
  let yearTotalCredits = 0
  let yearFailedCredits = 0
  let yearCreditsForGpa = 0
  let retakingCredits = 0
  let reExamCredits = 0

  // Biến tìm điểm thấp nhất trong năm (COURSE_GRADE_LOWEST)
  let courseGradeLowest: number | null = null
  let lowestGraduationScore: number | null = null

  for (const record of scoresInYear) {
    // Check if subject is in curriculum and useForFinalScore
    const config = subjectConfigMap.get(record.subjectVersionId)
    if (!config || !config.useForFinalScore) continue

    const credit = record.subjectVersion.credit
    yearTotalCredits += credit

    if (record.subjectClass?.type === "RETAKE") {
      retakingCredits += credit
    }

    if (record.subjectClass?.type === "REEXAM") {
      reExamCredits += credit
    }

    // Ưu tiên điểm phiên / điểm chuyển trường
    const score10 =
      record.manualFinalScore ?? (record.finalScore != null ? Number(record.finalScore) : null)
    if (score10 == null) continue

    // Chuyển đổi sang hệ 4
    const score4 = convertScore10to4(score10)

    yearTotalScore10 = yearTotalScore10.plus(new Decimal(score10).mul(credit))
    yearTotalScore4 = yearTotalScore4.plus(new Decimal(score4).mul(credit))
    yearCreditsForGpa += credit

    if (score10 < scoreToPass) {
      yearFailedCredits += credit
    }

    if (courseGradeLowest === null || score10 < courseGradeLowest) {
      courseGradeLowest = score10
    }

    // Kiểm tra môn tốt nghiệp
    if (config.graduation) {
      if (lowestGraduationScore === null || score10 < lowestGraduationScore) {
        lowestGraduationScore = score10
      }
    }
  }

  const yearlyGpa10 = roundGpa(yearTotalScore10, yearCreditsForGpa)
  const yearlyGpa4 = roundGpa(yearTotalScore4, yearCreditsForGpa)

  // C. Tính CUMULATIVE (Trung bình tích lũy)
  // Logic: Với tích lũy, nếu sinh viên học lại môn đó, chỉ lấy điểm cao nhất của môn đó (dựa trên Subject Code)
  const uniqueSubjectsMap = new Map<
    string,
    { score10: number; score4: number; credit: number; passed: boolean }
  >()

  for (const record of allScores) {
    const config = subjectConfigMap.get(record.subjectVersionId)
    if (!config || !config.useForFinalScore) continue

    // Ưu tiên điểm phiên / điểm chuyển trường
    const score10 =
      record.manualFinalScore ?? (record.finalScore != null ? Number(record.finalScore) : null)
    if (score10 == null) continue

    // Dùng subjectId (môn học gốc) làm key để gộp các lần học lại/thi lại cùng môn
    const subjectKey = record.subjectVersion.subjectId
    const score4 = convertScore10to4(score10)
    const credit = record.subjectVersion.credit
    const passed = score10 >= scoreToPass

    const existing = uniqueSubjectsMap.get(subjectKey)
    if (existing) {
      // Nếu đã có, kiểm tra xem điểm mới có cao hơn không
      if (score10 > existing.score10) {
        uniqueSubjectsMap.set(subjectKey, { score10, score4, credit, passed })
      }
    } else {
      uniqueSubjectsMap.set(subjectKey, { score10, score4, credit, passed })
    }
  }

  let cumulativeTotalScore10 = new Decimal(0)
  let cumulativeTotalScore4 = new Decimal(0)
  let cumulativePassedCredits = 0
  let cumulativeDebtCredits = 0
  uniqueSubjectsMap.forEach((val) => {
    if (val.passed) {
      // Trung bình tích luỹ (chỉ tính môn đạt)
      cumulativeTotalScore10 = cumulativeTotalScore10.plus(new Decimal(val.score10).mul(val.credit))
      cumulativeTotalScore4 = cumulativeTotalScore4.plus(new Decimal(val.score4).mul(val.credit))
      cumulativePassedCredits += val.credit
    } else {
      cumulativeDebtCredits += val.credit
    }
  })

  const cumulativeGpa10 = roundGpa(cumulativeTotalScore10, cumulativePassedCredits)
  const cumulativeGpa4 = roundGpa(cumulativeTotalScore4, cumulativePassedCredits)

  const cgpa10 = cumulativeGpa10
  const cgpa4 = cumulativeGpa4

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

  const trainingScore = await prisma.schoolYearTrainingScore.findFirst({
    where: {
      studentId,
      schoolYearId,
      deletedAt: null,
      active: true,
      status: "APPROVED",
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

  const data: Prisma.StudentYearResultUncheckedCreateInput = {
    isClassMonitor: (student.classMonitor?.length ?? 0) > 0,
    isUnionLeader: (student.unionLeaderOf?.length ?? 0) > 0,
    studentId: studentId,
    schoolYearId: schoolYearId,
    studyYear: new Date().getFullYear(),
    gpaBase10: yearlyGpa10,
    gpaBase4: yearlyGpa4,
    cumulativeGpaBase10: cumulativeGpa10,
    cumulativeGpaBase4: cumulativeGpa4,
    cgpaBase10: cgpa10,
    cgpaBase4: cgpa4,
    totalCredits: cumulativePassedCredits,
    failedCredits: yearFailedCredits,
    conductScore: trainingScore?.score || 8,
    rankId: rank?.id,
    academicWarningLevel: student.academicWarningLevel ?? academicWarning?.level ?? 0,
    disciplinaryWarningLevel: disciplinaryWarning?.level ?? 0,
    isLastStudyYear: false,
    baseScore: student.fixedClass.trainingCourse.baseScore,
    lowestFinalScore: courseGradeLowest,
    lowestGraduationScore,
    retakingCredits,
    reExamCredits,
    registeredCredits: yearTotalCredits,
    passedCredits: yearCreditsForGpa - yearFailedCredits,
    accumulatedCredits: cumulativePassedCredits,
    totalCreditsByCurriculum: 0,
    totalFailedCredits: cumulativeDebtCredits,
  }

  // 4. Lưu kết quả vào bảng StudentYearResult
  // Sử dụng upsert để tạo mới hoặc cập nhật
  const result = await prisma.studentYearResult.upsert({
    where: {
      studentId_schoolYearId: { studentId: studentId, schoolYearId: schoolYearId },
    },
    update: data,
    create: data,
  })

  return result
}

export const listStudentResultInfo = async (
  semesterId: string,
  trainingObjectTypeId: string,
  type: "SEMESTER" | "YEAR" = "SEMESTER"
) => {
  try {
    const currentSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: { schoolYearId: true },
    })

    const students = await prisma.student.findMany({
      where: {
        status: StudentStatus.ENROLLED, // Chỉ lấy sinh viên đang học
        fixedClassId: { not: null },
        fixedClass: {
          trainingCourse: {
            trainingObjectTypeId,
          },
        },
      },
      include: {
        userProfile: true,
        studentSemesterResult: { where: { semesterId } },
        studentYearResult: currentSemester?.schoolYearId
          ? { where: { schoolYearId: currentSemester.schoolYearId } }
          : { where: { schoolYear: { semesters: { some: { id: semesterId } } } } },
        fixedClass: {
          include: {
            managementOrganization: true,
            trainingCourse: {
              include: {
                trainingObjectType: true,
              },
            },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: {
                        trainingField: true, // Bao gồm thông tin ngành
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    // const DsHocVien = await prisma.studentSemesterResult.findMany({
    //   where: {
    //     semesterId,
    //     // studentId: 'cmff4ikj90085nx015zo24hue',
    //     student: {
    //       status: StudentStatus.ENROLLED, // Chỉ lấy sinh viên đang học
    //       fixedClassId: {
    //         not: null, // Chỉ lấy sinh viên có lớp học cố định
    //       },
    //       fixedClass: {
    //         trainingCourse: {
    //           trainingObjectTypeId,
    //         },
    //       },
    //     },
    //     deletedAt: null,
    //     active: true,
    //   },
    //   include: {
    //     student: {
    //       include: {
    //         userProfile: true,
    //         fixedClass: {
    //           include: {
    //             trainingCourse: {
    //               include: {
    //                 trainingObjectType: true,
    //               },
    //             },
    //             curriculumVersion: {
    //               include: {
    //                 curriculum: {
    //                   include: {
    //                     trainingMajor: {
    //                       include: {
    //                         trainingField: true, // Bao gồm thông tin ngành
    //                       },
    //                     },
    //                   },
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // })

    const listTrainingCourseId = students.map(
      (student) => student.fixedClass?.trainingCourse?.id || ""
    )
    const rankingConvert = await prisma.academicRankingConvert.findMany({
      where: {
        trainingCourseId: {
          in: listTrainingCourseId,
        },
        context: RankingContext.STUDYING,
        deletedAt: null,
        active: true,
      },
    })

    // Cấu hình điểm cộng cán bộ lớp (hệ 10) theo từng chức vụ
    const officerBonusScores = await prisma.officerBonusScore.findMany({
      where: { deletedAt: null, active: true },
    })
    const officerBonusMap = new Map<OfficerPosition, number>(
      officerBonusScores.map((o) => [o.position, o.bonusScore])
    )
    // Bảng quy đổi điểm để suy hệ 4 từ hệ 10 sau khi cộng điểm cán bộ
    const scoreConverts = await prisma.scoreConvert.findMany({
      where: {
        trainingCourseId: { in: listTrainingCourseId },
        deletedAt: null,
        active: true,
      },
      select: {
        trainingCourseId: true,
        letter: true,
        base10Min: true,
        base10Max: true,
        base4: true,
        classification: true,
        pass: true,
      },
    })

    const studentsInfo: StudentInfoCheck[] = await Promise.all(
      students.map(async (student) => {
        const userProfile = student.userProfile
        const trainingCourseId = student.fixedClass?.trainingCourse?.id || ""
        const semesterResult = student.studentSemesterResult[0]
        const yearResult = student.studentYearResult[0]
        // Danh sách chuyển đổi

        const baseScore =
          student.fixedClass?.trainingCourse?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là 10 nếu không có thông tin
        const rank =
          baseScore === AcademicRankingBaseType.Base10
            ? await phanLoaiDiemHe10(
                semesterResult?.gpaBase10.toNumber() ?? 0,
                trainingCourseId,
                rankingConvert
              )
            : await phanLoaiDiemHe4(
                semesterResult?.gpaBase4.toNumber() ?? 0,
                trainingCourseId,
                rankingConvert
              )

        // Điểm cộng cán bộ lớp: xác định (các) chức vụ SV đang giữ trên lớp,
        // lấy điểm cộng (hệ 10) cao nhất nếu kiêm nhiệm.
        const fixedClass = student.fixedClass
        const heldPositions: { position: OfficerPosition; label: string }[] = []
        if (fixedClass?.classMonitorId === student.id)
          heldPositions.push({ position: OfficerPosition.CLASS_MONITOR, label: "Lớp trưởng" })
        if (fixedClass?.unionSecretaryId === student.id)
          heldPositions.push({ position: OfficerPosition.UNION_SECRETARY, label: "Bí thư" })
        if (fixedClass?.unionLeaderId === student.id)
          heldPositions.push({
            position: OfficerPosition.UNION_LEADER,
            label: "Bí thư liên chi đoàn",
          })
        if (fixedClass?.deputyUnionSecretaryId === student.id)
          heldPositions.push({
            position: OfficerPosition.DEPUTY_UNION_SECRETARY,
            label: "Phó bí thư liên chi đoàn",
          })
        const diemThuongCanBo = heldPositions.reduce(
          (max, p) => Math.max(max, officerBonusMap.get(p.position) ?? 0),
          0
        )

        // Ưu tiên dùng snapshot đã lưu khi chạy tổng kết; fallback về real-time cho data cũ
        const gpaBase10Goc = semesterResult?.gpaBase10.toNumber() || 0
        const gpaBase4Goc = semesterResult?.gpaBase4.toNumber() || 0
        const gpaBase10CongThuong =
          semesterResult?.gpaBase10WithBonus?.toNumber() ?? gpaBase10Goc + diemThuongCanBo
        const gpaBase4CongThuong =
          semesterResult?.gpaBase4WithBonus?.toNumber() ??
          (diemThuongCanBo > 0
            ? layGiaTriDiem4(gpaBase10Goc + diemThuongCanBo, trainingCourseId, scoreConverts) ||
              gpaBase4Goc
            : gpaBase4Goc)

        return {
          stt: 0,
          id: student.id ?? "",
          hoTen: userProfile.fullname || "Không rõ",
          maSinhVien: userProfile?.code || "",
          doiTuong: student.fixedClass?.trainingCourse?.trainingObjectType.name || "",
          khoa: student.fixedClass?.trainingCourse?.name || "",
          khoaId: student.fixedClass?.trainingCourse?.id || "",
          chuyenNganh: student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
          chuyenNganhId: student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.id || "",
          nganh:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
            "",
          nganhId:
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.id ||
            "",
          ngaySinh: userProfile?.dateOfBirth
            ? new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN")
            : "",
          heSoDiem: baseScore === AcademicRankingBaseType.Base10 ? 10 : 4, // Loại hệ số điểm, mặc định là 10
          fullDiemC: true,
          fullDiemD: true,
          diemMonThuongNhoNhat: semesterResult?.lowestFinalScore ?? 0,
          diemMonTotNghiepNhoNhat: semesterResult?.lowestGraduationScore ?? 0,
          diemTrungBinh4: gpaBase4CongThuong,
          diemTrungBinh10: gpaBase10CongThuong,
          diemTrungBinhNam4: yearResult?.gpaBase4.toNumber() || 0,
          diemTrungBinhNam10: yearResult?.gpaBase10.toNumber() || 0,
          noTinChiTrongNam: yearResult?.failedCredits || 0,

          soTinChiTichLuy: semesterResult?.accumulatedCredits || 0,
          soTinChiYeuCau: semesterResult?.totalCreditsByCurriculum || 0,
          soTinChiMoTrongKy: semesterResult?.totalCredits || 0,
          soTinChiNo: semesterResult?.failedCredits || 0,
          soTinChiDangKy: semesterResult?.registeredCredits || 0,
          xepLoaiRenLuyen: semesterResult?.studentTrainingType || "",
          diemDauVao: semesterResult?.entryScore ?? 0, // Điểm đầu vào (default to 0 if null)
          soLanViPham: 0,
          biKyLuat: false,
          queQuan: userProfile?.homeTown || "",
          diemRenLuyen: semesterResult?.conductScore || 0,
          trinhDoNgoaiNgu: false,
          trinhDoTinHoc: false,
          kyDangHoc: semesterResult?.semesterIndexInCourse || 0,
          kyCuoi: semesterResult?.isLastSemester || false,
          chucVuHocVien: heldPositions.map((p) => p.label).join(", "), // Chức vụ học viên
          quocTich: userProfile.nationalityId ?? "", // Quốc tịch
          // duDieuKienHocBong: true, // Điều kiện học bổng
          ghiChu: "", // Ghi chú,
          diemThuong: diemThuongCanBo, // Điểm thưởng chức vụ cán bộ (hệ 10)
          userProfile: userProfile, // Thông tin người dùng
          rank,
          // Add missing properties with default values or calculated from item if possible
          noTinChiTrongKy: semesterResult?.failedCredits || 0,
          tongSoTinChiNo: semesterResult?.totalFailedCredits || 0,
          diemHe10TichLuy: semesterResult?.cumulativeGpaBase10.toNumber() || 0,
          diemHe4TichLuy: semesterResult?.cumulativeGpaBase4.toNumber() || 0,
          soTinChiDatTichLuy: semesterResult?.accumulatedCredits,
          soTinChiKhongDatTichLuy: semesterResult?.totalFailedCredits,
          xepLoaiHocTapTichLuy: "",
          // Add missing required properties for StudentInfoCheck
          namDangHoc: semesterResult?.studyYear || 0,
          mucCanhCaoHocTap: semesterResult?.academicWarningLevel || 0,
          mucCanhCaoHocDuong: semesterResult?.disciplinaryWarningLevel || 0,
          xepLoaiRenLuyenKy: "", // or item.xepLoaiRenLuyenKy if available
          lyDoXepLoai: "", // tính sau
        }
      })
    )

    return studentsInfo
  } catch (error) {
    console.error("Error fetching student info:", error)
    throw new Error("Failed to fetch student information")
  }
}

const checkEligible = <T extends number | string>(
  student: StudentInfoCheck,
  fieldValue: CriteriaField,
  studentValue: T,
  criteriaValue: T | T[],
  operator: CriteriaOperator,
  invert: boolean
): boolean => {
  const criteria = (() => {
    switch (operator) {
      case CriteriaOperator.GT:
        return studentValue > criteriaValue
      case CriteriaOperator.GTE:
        return studentValue >= criteriaValue
      case CriteriaOperator.LT:
        return studentValue < criteriaValue
      case CriteriaOperator.LTE:
        return studentValue <= criteriaValue
      case CriteriaOperator.EQ:
        return studentValue === criteriaValue
      case CriteriaOperator.IN:
        if (Array.isArray(criteriaValue)) {
          return criteriaValue.includes(studentValue)
        }
        return false
      default:
        console.warn(`Unknown operator: ${operator}`)
        return false
    }
  })()
  if ((criteria === true && !invert) || (criteria === false && invert)) {
    const newReason = ` ${criteriaFieldLabels[fieldValue]}(${studentValue}) ${invert ? "*không* " : ""}${criteriaOperatorLabels[operator]} ${criteriaValue}`
    if (!student.lyDoXepLoai.includes(newReason)) {
      student.lyDoXepLoai = `${student.lyDoXepLoai}\n${newReason}`
    }
  }
  return invert ? !criteria : criteria
}

export function evaluateCondition(
  studentData: StudentDataContext,
  condition: StudentCondition
): boolean {
  const actualValue = studentData[condition.field]

  // Nếu không có dữ liệu cho tiêu chí này, coi như không thoả mãn
  if (actualValue === null || actualValue === undefined) {
    return false
  }

  const value = Number(actualValue)

  let result: boolean
  switch (condition.operator) {
    case "GTE": // Lớn hơn hoặc bằng (>=)
      result = value >= condition.value
      break
    case "GT": // Lớn hơn (>)
      result = value > condition.value
      break
    case "LTE": // Nhỏ hơn hoặc bằng (<=)
      result = value <= condition.value
      break
    case "LT": // Nhỏ hơn (<)
      result = value < condition.value
      break
    case "EQ": // Bằng (==)
      result = value === condition.value
      break
    // Toán tử 'IN' cần xử lý đặc biệt nếu giá trị là một mảng
    case "IN":
      result = condition.tuple?.includes(`${value}`) || false
      break
    default:
      // Nếu toán tử không hợp lệ, trả về false
      return false
  }

  return condition.invert ? !result : result
}

const getStudentDataContext = (
  semResult: StudentSemesterResult | null,
  yearResult: StudentYearResult | null
): StudentDataContext => {
  return {
    SEMESTER_GPA: semResult
      ? semResult.baseScore === "Base10"
        ? semResult.gpaBase10.toNumber()
        : semResult.gpaBase4.toNumber()
      : 0,
    YEARLY_GPA: yearResult
      ? yearResult.baseScore === "Base10"
        ? yearResult.gpaBase10.toNumber()
        : yearResult.gpaBase4.toNumber()
      : 0,
    CUMULATIVE_GPA: semResult
      ? semResult.baseScore === "Base10"
        ? semResult.cumulativeGpaBase10.toNumber()
        : semResult.cumulativeGpaBase4.toNumber()
      : 0,
    ENTRY_SCORE: semResult?.entryScore || 0,
    COURSE_GRADE_LOWEST: semResult?.lowestFinalScore || 0,
    GRADUATION_COURSE_GRADE_LOWEST: semResult?.lowestGraduationScore || 0,
    SEMESTER_REGISTERED_CREDITS: semResult?.registeredCredits || 0,
    SEMESTER_PASSED_CREDITS: semResult?.passedCredits || 0,
    SEMESTER_FAILED_CREDITS: semResult?.failedCredits || 0,
    FAILED_CREDITS_PERCENT: semResult?.registeredCredits
      ? (semResult.failedCredits / semResult.registeredCredits) * 100
      : 0,
    YEAR_FAILED_CREDITS: yearResult?.failedCredits || 0,
    CUMULATIVE_PASSED_CREDITS: semResult?.accumulatedCredits || 0,
    CUMULATIVE_DEBT_CREDITS: semResult?.totalFailedCredits || 0,
    CUMULATIVE_PROGRESS_PERCENT: semResult?.totalCreditsByCurriculum
      ? (semResult.accumulatedCredits / semResult.totalCreditsByCurriculum) * 100
      : 0,
    CUMULATIVE_RETAKE_PERCENT: semResult?.accumulatedCredits
      ? (semResult.totalFailedCredits / semResult.accumulatedCredits) * 100
      : 0,
    ACADEMIC_WARNING_LEVEL: semResult?.academicWarningLevel || 0,
    DISCIPLINARY_WARNING_LEVEL: semResult?.disciplinaryWarningLevel || 0,
    REPEAT_YEAR_COUNT: 0,
    SUSPENSION_COUNT: 0,
    CONDUCT_SCORE: semResult?.conductScore || 0,
    HAS_PASSED_FOREIGN_LANGUAGE: semResult?.foreignLangPass || false,
    HAS_REGISTERED_FOR_SEMESTER: !!semResult,
    IS_PRIORITY_STUDENT: false,
    IS_CLASS_MONITOR_OR_LEADER: !!(semResult?.isClassMonitor || semResult?.isUnionLeader),
    IS_STUDY_DURATION_EXCEEDED: false,
    IS_DEBT_SUBJECT_CONSECUTIVE: false,
    HAS_IMPROVEMENT_REGISTRATION: semResult?.isImproving || false,
  }
}

const checkAcademicActionRule = (
  student: StudentInfoCheck,
  ruleSetId: string,
  actionCriteriaList: AcademicActionCondition[] = []
) => {
  try {
    const actionCriteriaListFilter = actionCriteriaList.filter(
      (criteria) =>
        criteria.ruleSetId === ruleSetId &&
        (criteria.yearCondition === student.namDangHoc || criteria.yearCondition === null)
    )

    if (!actionCriteriaListFilter || actionCriteriaListFilter.length === 0) {
      console.warn("No action criteria found for training ruleSet:", ruleSetId)
      return false
    }

    const studentDataContext: StudentDataContext = {
      SEMESTER_GPA: student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
      YEARLY_GPA: student.heSoDiem === 10 ? student.diemTrungBinhNam10 : student.diemTrungBinhNam4,
      CUMULATIVE_GPA: student.heSoDiem === 10 ? student.diemHe10TichLuy : student.diemHe4TichLuy,
      ENTRY_SCORE: student.diemDauVao,
      COURSE_GRADE_LOWEST: student.diemMonThuongNhoNhat,
      GRADUATION_COURSE_GRADE_LOWEST: student.diemMonTotNghiepNhoNhat,
      SEMESTER_REGISTERED_CREDITS: student.soTinChiDangKy,
      SEMESTER_PASSED_CREDITS: student.soTinChiDangKy - student.noTinChiTrongKy,
      SEMESTER_FAILED_CREDITS: student.noTinChiTrongKy,
      YEAR_FAILED_CREDITS: student.noTinChiTrongNam,
      FAILED_CREDITS_PERCENT: student.soTinChiDangKy
        ? (student.noTinChiTrongKy / student.soTinChiDangKy) * 100
        : 0,
      CUMULATIVE_PASSED_CREDITS: student.soTinChiTichLuy,
      CUMULATIVE_DEBT_CREDITS: student.tongSoTinChiNo,
      CUMULATIVE_PROGRESS_PERCENT: student.soTinChiYeuCau
        ? (student.soTinChiTichLuy / student.soTinChiYeuCau) * 100
        : 0,
      CUMULATIVE_RETAKE_PERCENT: student.soTinChiTichLuy
        ? (student.tongSoTinChiNo / student.soTinChiTichLuy) * 100
        : 0,
      ACADEMIC_WARNING_LEVEL: student.mucCanhCaoHocTap,
      DISCIPLINARY_WARNING_LEVEL: student.mucCanhCaoHocDuong,
      REPEAT_YEAR_COUNT: 0,
      SUSPENSION_COUNT: 0,
      CONDUCT_SCORE: student.diemRenLuyen,
      HAS_PASSED_FOREIGN_LANGUAGE: student.trinhDoNgoaiNgu,
      HAS_REGISTERED_FOR_SEMESTER: true,
      IS_PRIORITY_STUDENT: false,
      IS_CLASS_MONITOR_OR_LEADER: !!student.chucVuHocVien,
      IS_STUDY_DURATION_EXCEEDED: false,
      IS_DEBT_SUBJECT_CONSECUTIVE: false,
      HAS_IMPROVEMENT_REGISTRATION: false,
    }

    // Kiểm tra từng điều kiện, tất cả điều kiện thỏa thì mới true
    for (const criteria of actionCriteriaListFilter) {
      const passed = evaluateCondition(studentDataContext, criteria)
      if (!passed) {
        return false
      }
      const studentValue = studentDataContext[criteria.field]
      student.lyDoXepLoai = `${student.lyDoXepLoai}\n ${criteriaFieldLabels[criteria.field]}(${studentValue}) ${criteria.invert ? "*không* " : ""}${criteriaOperatorLabels[criteria.operator]} ${criteria.value}`
    }
    console.log("All criteria passed for ruleSet:", ruleSetId)
    return true // All criteria passed
  } catch (error) {
    console.error("Error fetching action criteria:", error)
    throw new Error("Failed to fetch action checkStudentEligible")
  }
}
const checkAcademicActionConfig = (
  student: StudentInfoCheck,
  configId: string,
  academicActionRuleSet: AcademicActionRuleSet[] = [],
  actionCriteriaList: AcademicActionCondition[] = []
): boolean => {
  const academicActionRuleSetFilter = academicActionRuleSet.filter(
    (ruleSet) => ruleSet.configId === configId
  )
  if (academicActionRuleSetFilter.length === 0) {
    console.warn("No action criteria found for training configId:", configId)
    return false
  }

  // Kiểm tra từng bộ tiêu chí
  const eligible = academicActionRuleSetFilter.map((ruleSet) =>
    checkAcademicActionRule(student, ruleSet.id, actionCriteriaList)
  )
  return eligible.includes(true)
}
const getAcademicAction = (
  student: StudentInfoCheck,
  trainingCourseId: string,
  academicActionConfig: AcademicActionConfig[] = [],
  academicActionRuleSet: AcademicActionRuleSet[] = [],
  actionCriteriaList: AcademicActionCondition[] = []
): ListAcademicAction[] => {
  const academicActionConfigFilter = academicActionConfig.filter(
    (config) => config.trainingCourseId === trainingCourseId && config.active
  )

  // Lấy danh sách học bổng của sinh viên
  const academicAction: ListAcademicAction[] = []
  for (const config of academicActionConfigFilter) {
    const isEligible = checkAcademicActionConfig(
      student,
      config.id,
      academicActionRuleSet,
      actionCriteriaList
    )
    if (isEligible) {
      academicAction.push({
        id: config.id,
        name: config.name,
        actionType: config.actionType,
      })
    }
  }
  return academicAction
}
const checkAcademicWarning = (
  student: StudentInfoCheck,
  trainingCourseId: string,
  warningCriteriaList: AcademicWarningRule[] = []
): AcademicWarningRule[] => {
  const warningCriteriaListFilter = warningCriteriaList.filter(
    (criteria) =>
      criteria.trainingCourseId === trainingCourseId &&
      (criteria.semesterCondition === student.kyDangHoc || criteria.semesterCondition === null) &&
      (criteria.yearCondition === student.namDangHoc || criteria.yearCondition === null)
  )
  // Lấy thông tin tiêu chí cảnh cáo

  const ruleList = warningCriteriaListFilter.map((criteria) => {
    console.log("Checking criteria:", criteria.field, "with value:", criteria.threshold)

    switch (criteria.field) {
      case CriteriaField.FAILED_CREDITS_PERCENT: // Số tín chỉ không đạt trong kỳ
        return checkEligible(
          student,
          CriteriaField.FAILED_CREDITS_PERCENT,
          student.noTinChiTrongKy / student.soTinChiDangKy,
          criteria.threshold,
          criteria.operator,
          criteria.invert
        )
          ? criteria
          : null
      case CriteriaField.CUMULATIVE_DEBT_CREDITS: // Số tín chỉ không đạt tích lũy
        return checkEligible(
          student,
          CriteriaField.CUMULATIVE_DEBT_CREDITS,
          student.tongSoTinChiNo,
          criteria.threshold,
          criteria.operator,
          criteria.invert
        )
          ? criteria
          : null
      case CriteriaField.SEMESTER_GPA: // Điểm trung bình học kỳ
        return checkEligible(
          student,
          CriteriaField.SEMESTER_GPA,
          student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
          criteria.threshold,
          criteria.operator,
          criteria.invert
        )
          ? criteria
          : null
      case CriteriaField.CUMULATIVE_GPA: // Điểm trung bình tích lũy
        return checkEligible(
          student,
          CriteriaField.CUMULATIVE_GPA,
          student.heSoDiem === 10 ? student.diemHe10TichLuy : student.diemHe4TichLuy,
          criteria.threshold,
          criteria.operator,
          criteria.invert
        )
          ? criteria
          : null
      case CriteriaField.SEMESTER_REGISTERED_CREDITS: // Số tín chỉ đăng ký trong học kỳ
        return checkEligible(
          student,
          CriteriaField.SEMESTER_REGISTERED_CREDITS,
          student.soTinChiDangKy,
          criteria.threshold,
          criteria.operator,
          criteria.invert
        )
          ? criteria
          : null
      default:
        return null
    }
  })

  // const check = ruleList.every((item) => item === false)

  return ruleList.filter((item) => item !== null)
}
const checkScholarshipReceived = (
  studentId: string,
  semesterScholarship: Scholarship[] = [],
  studentAwards: { scholarshipId: string }[] = []
): Scholarship[] => {
  return semesterScholarship.filter((scholarship) =>
    studentAwards.some((award) => award.scholarshipId === scholarship.id)
  )
}
const checkScholarship = async (
  student: StudentInfoCheck,
  scholarshipId: string,
  scholarshipCriteria: ScholarshipCriteria[]
): Promise<boolean> => {
  try {
    const listCriteria = scholarshipCriteria.filter(
      (criteria) => criteria.scholarshipId === scholarshipId
    )
    const isEligible = listCriteria.every((criteria) => {
      switch (criteria.field) {
        case CriteriaField.SEMESTER_PASSED_CREDITS: // Tổng số tín chỉ học tập trong học kỳ
          console.log("Total Credits: ", student.soTinChiDangKy, criteria.value, criteria.operator)
          return checkEligible(
            student,
            CriteriaField.SEMESTER_PASSED_CREDITS,
            student.soTinChiDangKy,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.SEMESTER_REGISTERED_CREDITS: // Số tín chỉ đăng ký trong học kỳ
          console.log(
            "Registered Credits: ",
            student.soTinChiDangKy,
            criteria.value,
            criteria.operator
          )
          return checkEligible(
            student,
            CriteriaField.SEMESTER_REGISTERED_CREDITS,
            student.soTinChiDangKy,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.CUMULATIVE_PROGRESS_PERCENT: // % tín chỉ tích lũy so với kế hoạch
          console.log(
            "Accumulated Credits Percent: ",
            student.soTinChiTichLuy,
            student.soTinChiYeuCau,
            criteria.value,
            criteria.operator
          )
          return checkEligible(
            student,
            CriteriaField.CUMULATIVE_PROGRESS_PERCENT,
            student.soTinChiTichLuy / student.soTinChiYeuCau,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.COURSE_GRADE_LOWEST: // Điểm thấp nhất trong các học phần bình thường
          console.log(
            "Course Grade Min: ",
            student.diemMonThuongNhoNhat,
            criteria.value,
            criteria.operator
          )
          return checkEligible(
            student,
            CriteriaField.COURSE_GRADE_LOWEST,
            student.diemMonThuongNhoNhat,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.GRADUATION_COURSE_GRADE_LOWEST: // Điểm thấp nhất trong các học phần tốt nghiệp
          console.log(
            "Graduation Grade Min: ",
            student.diemMonTotNghiepNhoNhat,
            criteria.value,
            criteria.operator
          )
          if (student.diemMonTotNghiepNhoNhat === undefined) {
            return true
          }

          return checkEligible(
            student,
            CriteriaField.GRADUATION_COURSE_GRADE_LOWEST,
            student.diemMonThuongNhoNhat,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.SEMESTER_GPA: // Điểm trung bình học ksỳ
          console.log(
            "Semester GPA: ",
            student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
            criteria.value,
            criteria.operator
          )
          console.log(
            checkEligible(
              student,
              CriteriaField.SEMESTER_GPA,
              student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
              criteria.value,
              criteria.operator,
              criteria.invert
            )
          )
          return checkEligible(
            student,
            CriteriaField.SEMESTER_GPA,
            student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        case CriteriaField.ENTRY_SCORE: // Điểm thi đầu vào (cho học viên mới)
          console.log("Entry Score: ", student.diemDauVao, criteria.value, criteria.operator)
          return checkEligible(
            student,
            CriteriaField.ENTRY_SCORE,
            student.diemMonThuongNhoNhat,
            criteria.value,
            criteria.operator,
            criteria.invert
          )
        // case CriteriaField.CONDUCT_SCORE: // Mức rèn luyện
        //     console.log(
        //         'Conduct: ',
        //         student.xepLoaiRenLuyen,
        //         criteria.value,
        //         criteria.operator
        //     )
        //     return checkEligible(student.xepLoaiRenLuyen, criteria.value, criteria.operator)
        // case CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE: // Đạt chuẩn đầu ra ngoại ngữ (boolean)
        //     console.log(
        //         'Foreign Language: ',
        //         student.trinhDoNgoaiNgu,
        //         criteria.value,
        //         criteria.operator
        //     )
        //     return checkEligible(student.trinhDoNgoaiNgu, criteria.value, criteria.operator)
        default:
          return true // Mặc định là đủ điều kiện nếu không có tiêu chí
      }
    })
    return isEligible
  } catch (error) {
    console.error("Error checking student eligibility:", error)
    return false // Trả về false nếu có lỗi xảy ra
  }
}
const getScholarship = async (
  student: StudentInfoCheck,
  trainingCourseId: string,
  semesterScholarship: Scholarship[] = [],
  scholarshipCriteriaList: ScholarshipCriteria[] = []
): Promise<Scholarship[]> => {
  const semesterScholarshipFilter = semesterScholarship.filter(
    (scholarship) => scholarship.trainingCourseId === trainingCourseId
  )
  const scholarshipIds = semesterScholarshipFilter.map((s) => s.id)
  const scholarshipCriteriaFilter = scholarshipCriteriaList.filter((criteria) =>
    scholarshipIds.includes(criteria.scholarshipId)
  )
  // console.log('semesterScholarship', semesterScholarshipFilter)
  // Lấy danh sách học bổng của sinh viên
  const scholarships: Scholarship[] = []
  for (const scholarship of semesterScholarshipFilter) {
    const isEligible = await checkScholarship(student, scholarship.id, scholarshipCriteriaFilter)
    if (isEligible) {
      scholarships.push(scholarship)
    }
  }
  return scholarships
}

const CheckDecreaseAcademicWarning = (
  previousLevel: number,
  hasAcademicWarningThisTerm: boolean
): boolean => {
  if (previousLevel <= 0) return false

  return previousLevel >= 1 && !hasAcademicWarningThisTerm
}
const fetchBulkStudentSemesterResults = async (studentIds: string[], semesterId: string) => {
  const results = await prisma.studentSemesterResult.findMany({
    where: {
      studentId: { in: studentIds },
      semesterId,
    },
    include: {
      student: {
        include: {
          userProfile: true,
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  trainingObjectType: true,
                },
              },
              curriculumVersion: {
                include: {
                  curriculum: {
                    include: {
                      trainingMajor: {
                        include: {
                          trainingField: true, // Bao gồm thông tin ngành
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const map = new Map<string, (typeof results)[0]>()
  for (const r of results) {
    map.set(r.studentId, r)
  }
  return map
}

export const resultCourseStudentScholarship = async (
  students: StudentInfoCheck[],
  semesterId: string
): Promise<CourseStudentScholarshipResult[]> => {
  const courseMap: Record<string, CourseStudentScholarshipResult> = {}
  const courseIds = new Set(students.map((student) => student.khoaId))
  const semesterScholarship = await prisma.scholarship.findMany({
    where: {
      trainingCourseId: { in: Array.from(courseIds) },
      deletedAt: null,
      active: true,
    },
    orderBy: { rankOrder: "asc" },
  })
  const scholarshipCriteriaList = await prisma.scholarshipCriteria.findMany({
    where: {
      scholarshipId: { in: semesterScholarship.map((s) => s.id) },
      deletedAt: null,
      active: true,
    },
    orderBy: { scholarship: { rankOrder: "asc" } },
  })

  const studentIds = students.map((s) => s.id)
  const semesterResultMap = await fetchBulkStudentSemesterResults(studentIds, semesterId)

  // Lấy tất cả danh sách học bổng đã nhận của các sinh viên trong học kỳ
  const allScholarshipAwards = await prisma.scholarshipAward.findMany({
    where: {
      studentId: { in: studentIds },
      semesterId,
      deletedAt: null,
      active: true,
    },
  })
  const scholarshipAwardMap = new Map<string, typeof allScholarshipAwards>()
  for (const award of allScholarshipAwards) {
    if (!scholarshipAwardMap.has(award.studentId)) scholarshipAwardMap.set(award.studentId, [])
    scholarshipAwardMap.get(award.studentId)!.push(award)
  }

  await Promise.all(
    students.map(async (student) => {
      const courseId = student.khoaId
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          courseName: student.khoa,
          students: [],
        }
      }
      const trainingCourseId = student.khoaId
      const studentSemesterResult = semesterResultMap.get(student.id)

      if (!studentSemesterResult) return

      // Bước 1: Kiểm tra với GPA gốc (chưa cộng điểm thưởng cán bộ)
      // Sinh viên phải đạt ít nhất 1 học bổng với GPA gốc thì mới được áp dụng điểm thưởng
      const studentWithRawGpa = {
        ...student,
        diemTrungBinh10: studentSemesterResult.gpaBase10.toNumber(),
        diemTrungBinh4: studentSemesterResult.gpaBase4.toNumber(),
      }
      const scholarshipInfoWithoutBonus = await getScholarship(
        studentWithRawGpa,
        trainingCourseId,
        semesterScholarship,
        scholarshipCriteriaList
      )

      if (scholarshipInfoWithoutBonus.length === 0) return

      // Bước 2: Đã đủ điều kiện → kiểm tra lại với GPA đã cộng điểm thưởng
      // để xem có đạt học bổng tốt hơn không
      const scholarshipInfo = await getScholarship(
        student,
        trainingCourseId,
        semesterScholarship,
        scholarshipCriteriaList
      )
      const studentAwards = scholarshipAwardMap.get(student.id) || []
      const scholarshipReceive = checkScholarshipReceived(
        student.id,
        semesterScholarship,
        studentAwards
      )

      if (scholarshipInfo.length === 0 || scholarshipReceive.length > 0) return

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        student: _student,
        studentId: _studentId,
        semesterId: _semesterId,
        rankId: _rankId,
        ...filteredResult
      } = studentSemesterResult as any

      // Hiển thị điểm đã cộng điểm cán bộ (student.diemTrungBinh* đã được cộng ở listStudentResultInfo)
      // Chỉ override WithBonus để frontend phân biệt raw vs bonus (hasBonus = gpaBase10WithBonus > gpaBase10)
      if ((student.diemThuong ?? 0) > 0) {
        filteredResult.gpaBase10WithBonus = new Decimal(student.diemTrungBinh10)
        filteredResult.gpaBase4WithBonus = new Decimal(student.diemTrungBinh4)
      }

      const result = StudentScholarshipResult.parse({
        id: studentSemesterResult.studentId,
        code: studentSemesterResult.student?.code,
        studentSemesterResult: filteredResult,
        userProfile: studentSemesterResult.student.userProfile,
        trainingMajor:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.name || "",
        trainingMajorId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.id || "",
        trainingField:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.name || "",
        trainingFieldId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.id || "",
        reason: student.lyDoXepLoai || "",
        hasScholarship: true,
        scholarship: scholarshipInfo.map(({ trainingCourseId: _t, ...rest }) => rest),
        scholarshipRecived: scholarshipReceive.map(({ trainingCourseId: _t, ...rest }) => rest),
        highestScholarship: scholarshipInfo[0]
          ? (({ trainingCourseId: _t, ...rest }) => rest)(scholarshipInfo[0])
          : null,
        fixedClass: {
          code: studentSemesterResult.student.fixedClass?.code || null,
          name: studentSemesterResult.student.fixedClass?.name || "",
        },
      })
      courseMap[courseId].students.push(result)
    })
  )

  for (const courseId in courseMap) {
    if (courseMap[courseId] && courseMap[courseId].students.length === 0) {
      delete courseMap[courseId]
    }
  }

  return Object.values(courseMap).map((course) => ({
    ...course,
    students: course.students.sort((a, b) => {
      const rankA = a.highestScholarship?.rankOrder || 0
      const rankB = b.highestScholarship?.rankOrder || 0
      if (rankA !== rankB) return rankA - rankB

      const gpaA = a.studentSemesterResult.gpaBase10?.toNumber() || 0
      const gpaB = b.studentSemesterResult.gpaBase10?.toNumber() || 0
      return gpaB - gpaA
    }),
  }))
}

export const resultCourseStudentAcademicWarning = async (
  students: StudentInfoCheck[],
  semesterId: string
): Promise<CourseStudentAcademicWarningResult[]> => {
  const courseMap: Record<string, CourseStudentAcademicWarningResult> = {}
  const courseIds = new Set(students.map((student) => student.khoaId))
  const warningCriteriaList = await prisma.academicWarningRule.findMany({
    where: {
      trainingCourseId: { in: Array.from(courseIds) },
      deletedAt: null,
      active: true,
    },
  })

  const studentIds = students.map((s) => s.id)
  const semesterResultMap = await fetchBulkStudentSemesterResults(studentIds, semesterId)

  await Promise.all(
    students.map(async (student) => {
      const courseId = student.khoaId
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          courseName: student.khoa,
          students: [],
        }
      }
      const trainingCourseId = student.khoaId
      const studentSemesterResult = semesterResultMap.get(student.id)

      if (!studentSemesterResult) return

      const checkAcademicWarningResult = await checkAcademicWarning(
        student,
        trainingCourseId,
        warningCriteriaList
      )

      if (checkAcademicWarningResult.length === 0) return

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        student: _student,
        studentId: _studentId,
        semesterId: _semesterId,
        rankId: _rankId,
        ...filteredResult
      } = studentSemesterResult as any

      const result = StudentAcademicWarningResult.parse({
        id: studentSemesterResult.studentId,
        code: studentSemesterResult.student.userProfile?.code,
        studentSemesterResult: filteredResult,
        userProfile: studentSemesterResult.student.userProfile,
        trainingMajor:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.name || "",
        trainingMajorId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.id || "",
        trainingField:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.name || "",
        trainingFieldId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.id || "",
        reason: student.lyDoXepLoai || "",
        hasAcademicWarning: true,
        academicWarningRule: checkAcademicWarningResult.map(
          ({ trainingCourseId: _t, ...rest }) => rest
        ),
        fixedClass: {
          code: studentSemesterResult.student.fixedClass?.code || null,
          name: studentSemesterResult.student.fixedClass?.name || "",
        },
      })
      courseMap[courseId].students.push(result)
    })
  )

  for (const courseId in courseMap) {
    if (courseMap[courseId] && courseMap[courseId].students.length === 0) {
      delete courseMap[courseId]
    }
  }
  return Object.values(courseMap).map((course) => ({
    ...course,
    students: course.students.sort((a, b) => {
      const gpaA = a.studentSemesterResult.gpaBase10?.toNumber() || 0
      const gpaB = b.studentSemesterResult.gpaBase10?.toNumber() || 0
      return gpaB - gpaA
    }),
  }))
}

export const resultCourseStudentAcademicAction = async (
  students: StudentInfoCheck[],
  semesterId: string,
  academicActionType?: "REPEAT_YEAR" | "SUSPENSION" | "EXPULSION"
): Promise<CourseStudentAcademicActionResult[]> => {
  const courseMap: Record<string, CourseStudentAcademicActionResult> = {}
  const courseIds = new Set(students.map((student) => student.khoaId))
  const academicActionConfig = await prisma.academicActionConfig.findMany({
    where: {
      trainingCourseId: { in: Array.from(courseIds) },
      actionType: academicActionType || undefined,
      deletedAt: null,
      active: true,
    },
  })

  const actionRuleSet = await prisma.academicActionRuleSet.findMany({
    where: {
      configId: { in: academicActionConfig.map((c) => c.id) },
      deletedAt: null,
      active: true,
    },
  })

  const actionCriteriaList = await prisma.academicActionCondition.findMany({
    where: {
      ruleSetId: { in: actionRuleSet.map((r) => r.id) },
      deletedAt: null,
      active: true,
    },
    include: {
      ruleSet: {
        include: {
          config: true,
        },
      },
    },
  })

  const approvedDecisions = await prisma.studentAcademicDecision.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      semesterId: semesterId,
      status: DecisionStatus.APPROVED,
      actionTaken: academicActionType ? academicActionType : undefined,
      deletedAt: null,
      active: true,
    },
  })

  const studentIds = students.map((s) => s.id)
  const semesterResultMap = await fetchBulkStudentSemesterResults(studentIds, semesterId)

  await Promise.all(
    students.map(async (student) => {
      const courseId = student.khoaId
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          courseName: student.khoa,
          students: [],
        }
      }
      const trainingCourseId = student.khoaId
      const studentSemesterResult = semesterResultMap.get(student.id)

      if (!studentSemesterResult) return

      const alreadyApproved = approvedDecisions.some((d) => d.studentId === student.id)
      if (alreadyApproved) return

      const academicActionInfo = getAcademicAction(
        student,
        trainingCourseId,
        academicActionConfig,
        actionRuleSet,
        actionCriteriaList
      )

      if (academicActionInfo.length === 0) return

      const {
        student: _student,
        studentId: _studentId,
        semesterId: _semesterId,
        rankId: _rankId,
        ...filteredResult
      } = studentSemesterResult as any

      const result = StudentAcademicActionResult.parse({
        id: studentSemesterResult.studentId,
        code: studentSemesterResult.student.userProfile?.code,
        studentSemesterResult: filteredResult,
        userProfile: studentSemesterResult.student.userProfile,
        trainingMajor:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.name || "",
        trainingMajorId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.id || "",
        trainingField:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.name || "",
        trainingFieldId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.id || "",
        reason: student.lyDoXepLoai || "",
        hasAcademicAction: true,
        academicAction: academicActionInfo,
        fixedClass: {
          code: studentSemesterResult.student.fixedClass?.code || null,
          name: studentSemesterResult.student.fixedClass?.name || "",
        },
      })
      courseMap[courseId].students.push(result)
    })
  )

  for (const courseId in courseMap) {
    if (courseMap[courseId] && courseMap[courseId].students.length === 0) {
      delete courseMap[courseId]
    }
  }
  return Object.values(courseMap).map((course) => ({
    ...course,
    students: course.students.sort((a, b) => {
      const gpaA = a.studentSemesterResult.gpaBase10?.toNumber() || 0
      const gpaB = b.studentSemesterResult.gpaBase10?.toNumber() || 0
      return gpaB - gpaA
    }),
  }))
}

export const resultCourseStudentDecreaseAcademicWarning = async (
  students: StudentInfoCheck[],
  semesterId: string,
  trainingObjectTypeId?: string
): Promise<CourseStudentDecreaseAcademicWarningResult[]> => {
  const courseMap: Record<string, CourseStudentDecreaseAcademicWarningResult> = {}
  const currentSemester = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { id: true, startDate: true },
  })

  if (!currentSemester) {
    return []
  }

  const previousSemester = await prisma.semester.findFirst({
    where: {
      startDate: { lt: currentSemester.startDate },
      semesterType: { in: [SemesterType.FIRST, SemesterType.SECOND] },
      deletedAt: null,
      active: true,
    },
    orderBy: { startDate: "desc" },
    select: { id: true },
  })

  if (!previousSemester) {
    return []
  }

  const courseIds = new Set(students.map((student) => student.khoaId))
  const studentIds = students.map((student) => student.id)

  const allWarningsInPreviousSemester = await prisma.academicWarning.findMany({
    where: {
      semesterId: previousSemester.id,
      deletedAt: null,
      active: true,
    },
    select: {
      studentId: true,
      level: true,
    },
  })

  const warningStudentIds = allWarningsInPreviousSemester.map((w) => w.studentId)
  const enrolledWarningStudents = await prisma.student.findMany({
    where: {
      id: { in: warningStudentIds },
      status: "ENROLLED",
    },
    select: { id: true },
  })
  const enrolledWarningStudentIds = enrolledWarningStudents.map((s) => s.id)

  const previousWarningMap = new Map<string, number>(
    allWarningsInPreviousSemester
      .filter((w) => enrolledWarningStudentIds.includes(w.studentId))
      .map((w) => [w.studentId, w.level])
  )

  const warningCriteriaList = await prisma.academicWarningRule.findMany({
    where: {
      trainingCourseId: { in: Array.from(courseIds) },
      deletedAt: null,
      active: true,
    },
  })

  const inputWarningStudents = students.filter((student) => previousWarningMap.has(student.id))
  const additionalWarningStudentIds = enrolledWarningStudentIds.filter(
    (id) => !studentIds.includes(id)
  )

  const additionalWarningStudents = await prisma.student.findMany({
    where: {
      id: { in: additionalWarningStudentIds },
      ...(trainingObjectTypeId ? { fixedClass: { trainingCourse: { trainingObjectTypeId } } } : {}),
    },
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              trainingObjectType: true,
            },
          },
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const studentsToProcess = [...inputWarningStudents, ...additionalWarningStudents]

  const studentsToProcessIds = studentsToProcess.map((s: any) => s.id)
  const semesterResultMap = await fetchBulkStudentSemesterResults(studentsToProcessIds, semesterId)

  await Promise.all(
    studentsToProcess.map(async (student: any) => {
      const courseId = student.fixedClass?.trainingCourse?.id || student.khoaId
      if (!courseId) {
        return
      }

      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          courseName: student.fixedClass?.trainingCourse?.name || student.khoa || "",
          students: [],
        }
      }
      const trainingCourseId = courseId
      const studentSemesterResult = semesterResultMap.get(student.id)

      if (!studentSemesterResult) return

      const checkAcademicWarningResult = checkAcademicWarning(
        student,
        trainingCourseId,
        warningCriteriaList
      )

      const previousLevel = previousWarningMap.get(student.id) ?? 0
      const hasWarningThisTerm = checkAcademicWarningResult.length > 0

      const decreaseAcademicWarning = CheckDecreaseAcademicWarning(
        previousLevel,
        hasWarningThisTerm
      )

      if (!decreaseAcademicWarning) return

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        student: _student,
        studentId: _studentId,
        semesterId: _semesterId,
        rankId: _rankId,
        ...filteredResult
      } = studentSemesterResult as any

      const result = StudentDecreaseAcademicWarningResult.parse({
        id: studentSemesterResult.studentId,
        code: studentSemesterResult.student.userProfile?.code,
        studentSemesterResult: filteredResult,
        userProfile: studentSemesterResult.student.userProfile,
        trainingMajor:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.name || "",
        trainingMajorId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.id || "",
        trainingField:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.name || "",
        trainingFieldId:
          studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.id || "",
        reason: student.lyDoXepLoai || "",
        decreaseAcademicWarning: true,
        previousAcademicWarningLevel: previousLevel,
        fixedClass: {
          code: studentSemesterResult.student.fixedClass?.code || null,
          name: studentSemesterResult.student.fixedClass?.name || "",
        },
      })
      courseMap[courseId].students.push(result)
    })
  )

  for (const courseId in courseMap) {
    if (courseMap[courseId] && courseMap[courseId].students.length === 0) {
      delete courseMap[courseId]
    }
  }
  return Object.values(courseMap).map((course) => ({
    ...course,
    students: course.students.sort((a, b) => {
      const gpaA = a.studentSemesterResult.gpaBase10?.toNumber() || 0
      const gpaB = b.studentSemesterResult.gpaBase10?.toNumber() || 0
      return gpaB - gpaA
    }),
  }))
}

const SaveStudentRepeatGrade = async (
  studentIds: string[],
  semesterId: string
): Promise<StudentRepeatGrade[]> => {
  try {
    const studentSemesterResult = await prisma.studentSemesterResult.findMany({
      where: {
        studentId: { in: studentIds },
        semesterId,
        deletedAt: null,
        active: true,
      },
      include: {
        student: {
          include: {
            userProfile: true,
            studentYearResult: {
              where: {
                deletedAt: null,
                active: true,
              },
            },
            fixedClass: {
              include: {
                trainingCourse: {
                  include: {
                    trainingObjectType: true,
                  },
                },
                curriculumVersion: {
                  include: {
                    curriculum: {
                      include: {
                        trainingMajor: {
                          include: {
                            trainingField: true, // Bao gồm thông tin ngành
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          userProfile: {
            firstName: "asc",
          },
        },
      },
    })

    if (!studentSemesterResult) {
      throw new Error(`Không tìm thấy kết quả học kỳ cho sinh viên trong học kỳ ${semesterId}`)
    }

    const scoreToRetainList = await prisma.trainingCourse.findMany({
      where: {
        id: {
          in: studentSemesterResult.map((s) => s.student.fixedClass?.trainingCourseId || ""),
        },
        deletedAt: null,
        active: true,
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    })

    if (!scoreToRetainList) {
      throw new Error(
        `Không tìm thấy khoá học nào để xét điểm lưu ban cho sinh viên trong học kỳ ${semesterId}`
      )
    }

    const listStudentRepeatGrade: string[] = studentSemesterResult
      .map((result) => {
        const scoreToRetain = scoreToRetainList.find(
          (course) => course.id === result.student.fixedClass?.trainingCourseId
        )

        if (
          scoreToRetain &&
          result.baseScore === "Base10" &&
          result.gpaBase10.toNumber() <= scoreToRetain.scoreToRetain
        ) {
          return result.studentId
        }
        if (
          scoreToRetain &&
          result.baseScore === "Base4" &&
          result.gpaBase4.toNumber() <= scoreToRetain.scoreToRetain
        ) {
          return result.studentId
        }
        return null // Ensure a value is always returned
      })
      .filter((id): id is string => id !== null)

    console.log("listStudentRepeatGrade", listStudentRepeatGrade)

    if (listStudentRepeatGrade.length === 0) {
      console.log("No students to mark for repeat grade.")
      return []
    }

    const existingDecisions = await prisma.studentAcademicDecision.findMany({
      where: {
        studentId: { in: listStudentRepeatGrade },
        semesterId,
        actionTaken: "REPEAT_YEAR",
        status: { not: DecisionStatus.PENDING },
        deletedAt: null,
        active: true,
      },
    })

    const existingStudentIds = new Set(existingDecisions.map((decision) => decision.studentId))
    const newDecisions = listStudentRepeatGrade
      .filter((studentId) => !existingStudentIds.has(studentId))
      .map((studentId) => ({
        studentId,
        semesterId,
        actionTaken: "REPEAT_YEAR" as const,
        status: DecisionStatus.PENDING,
        reason: "Tạo quyết định lưu ban theo yêu cầu",
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      }))
    if (newDecisions.length > 0) {
      await prisma.studentAcademicDecision.createMany({
        data: newDecisions,
      })
      console.log(`Created ${newDecisions.length} new repeat grade decisions.`)
    } else {
      console.log("All students already have repeat grade decisions.")
    }
    const ListResult: StudentRepeatGrade[] = []
    for (const studentId of studentIds) {
      const semResult = studentSemesterResult.find((result) => result.studentId === studentId)
      const yearResult = semResult?.student.studentYearResult.find(
        (yr) => yr.studyYear === semResult.studyYear
      )

      const studentDataContext: StudentDataContext = {
        SEMESTER_GPA: semResult
          ? semResult.baseScore === "Base10"
            ? semResult.gpaBase10.toNumber()
            : semResult.gpaBase4.toNumber()
          : 0,
        YEARLY_GPA: yearResult
          ? yearResult.baseScore === "Base10"
            ? yearResult.gpaBase10.toNumber()
            : yearResult.gpaBase4.toNumber()
          : 0,
        CUMULATIVE_GPA: semResult
          ? semResult.baseScore === "Base10"
            ? semResult.cumulativeGpaBase10.toNumber()
            : semResult.cumulativeGpaBase4.toNumber()
          : 0,
        ENTRY_SCORE: semResult?.entryScore || 0,
        COURSE_GRADE_LOWEST: semResult?.lowestFinalScore || 0,
        GRADUATION_COURSE_GRADE_LOWEST: semResult?.lowestGraduationScore || 0,
        SEMESTER_REGISTERED_CREDITS: semResult?.registeredCredits || 0,
        SEMESTER_PASSED_CREDITS: semResult?.passedCredits || 0,
        SEMESTER_FAILED_CREDITS: semResult?.failedCredits || 0,
        FAILED_CREDITS_PERCENT: semResult?.registeredCredits
          ? (semResult.failedCredits / semResult.registeredCredits) * 100
          : 0,
        YEAR_FAILED_CREDITS: yearResult?.failedCredits || 0,
        CUMULATIVE_PASSED_CREDITS: semResult?.accumulatedCredits || 0,
        CUMULATIVE_DEBT_CREDITS: semResult?.totalFailedCredits || 0,
        CUMULATIVE_PROGRESS_PERCENT: semResult?.totalCreditsByCurriculum
          ? (semResult.accumulatedCredits / semResult.totalCreditsByCurriculum) * 100
          : 0,
        CUMULATIVE_RETAKE_PERCENT: semResult?.accumulatedCredits
          ? (semResult.totalFailedCredits / semResult.accumulatedCredits) * 100
          : 0,
        ACADEMIC_WARNING_LEVEL: semResult?.academicWarningLevel || 0,
        DISCIPLINARY_WARNING_LEVEL: semResult?.disciplinaryWarningLevel || 0,
        REPEAT_YEAR_COUNT: existingDecisions.filter((decision) => decision.studentId === studentId)
          .length,
        SUSPENSION_COUNT: 0,
        CONDUCT_SCORE: semResult?.conductScore || 0,
        HAS_PASSED_FOREIGN_LANGUAGE: semResult?.foreignLangPass || false,
        HAS_REGISTERED_FOR_SEMESTER: !!semResult,
        IS_PRIORITY_STUDENT: false,
        IS_CLASS_MONITOR_OR_LEADER: !!(semResult?.isClassMonitor || semResult?.isUnionLeader),
        IS_STUDY_DURATION_EXCEEDED: false,
        IS_DEBT_SUBJECT_CONSECUTIVE: false,
        HAS_IMPROVEMENT_REGISTRATION: semResult?.isImproving || false,
      }

      const newResult: StudentRepeatGrade = {
        id: studentId,
        studentName: semResult?.student.userProfile.fullname || "",
        studentCode: semResult?.student.userProfile.code || "",
        gpa_semester: studentDataContext.SEMESTER_GPA,
        gpa_academic: studentDataContext.CUMULATIVE_GPA,
        total_credit: semResult?.totalCreditsByCurriculum || 0,
        repeatGradeTimes:
          studentDataContext.REPEAT_YEAR_COUNT +
          (newDecisions.some((decision) => decision.studentId === studentId) ? 1 : 0),
        statusRepeatGrade: existingStudentIds.has(studentId)
          ? "Đã có quyết định lưu ban"
          : newDecisions.some((decision) => decision.studentId === studentId)
            ? "Chờ phê duyệt"
            : "Không lưu ban",
      }
      ListResult.push(newResult)
    }
    return ListResult
  } catch (error) {
    console.error("Error in SaveStudentRepeatGrade function:", error)
    throw new Error(`${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export const StudentRepeatGradeService = async (
  studentIds: string[],
  semesterId: string
): Promise<any[]> => {
  try {
    const listStudentRepeatGrade = await SaveStudentRepeatGrade(studentIds, semesterId)
    return listStudentRepeatGrade
  } catch (error) {
    console.error("Error in RepeatGrade function:", error)
    throw new Error(`${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
export type { StudentRepeatGrade }
