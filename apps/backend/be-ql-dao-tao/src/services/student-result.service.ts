import {
    type AcademicActionCondition,
    type AcademicActionConfig,
    type AcademicActionRuleSet,
    AcademicRankingBaseType,
    type AcademicWarningRule,
    CriteriaField,
    CriteriaOperator,
    DecisionStatus,
    type Scholarship,
    type ScholarshipCriteria,
    SemesterType,
    type StudentAcademicDecision,
    type StudentSemesterResult,
    StudentStatus,
    StudentTrainingType,
} from '@workspace/db'
import { criteriaFieldLabels, criteriaOperatorLabels } from '@workspace/libs/constants'
import Decimal from 'decimal.js'
import { prisma } from '..'
import {
    CourseStudentResult,
    type ListAcademicAction,
    type StudentInfoCheck,
    type StudentRepeatGrade,
    StudentResult,
} from '../dto/student-info.dto'
import type { StudentCondition, StudentDataContext } from '../types/student-context'

const checkStudentSemesterResult = async (
    semesterId: string,
    studentId: string
): Promise<StudentSemesterResult | null> => {
    try {
        const result = await prisma.studentSemesterResult.findFirst({
            where: {
                semesterId,
                studentId,
                deletedAt: null,
                active: true,
            },
        })
        return result
    } catch (error) {
        console.error('Error checking student semester result:', error)
        return null
    }
}

const checkScorePassed = (
    baseType: AcademicRankingBaseType,
    score: number,
    scoreConvert: ScoreConvertItem[]
): boolean => {
    if (!scoreConvert?.length || typeof score !== 'number' || Number.isNaN(score)) {
        console.error('Invalid inputs:', { score, scoreConvert })
        return false
    }

    if (baseType === AcademicRankingBaseType.Base4) {
        // Kiểm tra điểm hệ 4
        if (score < 0 || score > 4) {
            console.error('Điểm hệ 4 không hợp lệ:', score)
            return false
        }
        // Tìm phân loại nhỏ hơn hoặc bằng gần nhất với điểm hệ 4
        const diemHe4Obj = scoreConvert.find((item) => item.base4 <= score)
        return diemHe4Obj ? diemHe4Obj.pass : true
    }
    if (baseType === AcademicRankingBaseType.Base10) {
        // Kiểm tra điểm hệ 10
        if (score < 0 || score > 10) {
            console.error('Điểm hệ 10 không hợp lệ:', score)
            return false
        }
        // Tìm phân loại nhỏ hơn hoặc bằng gần nhất với điểm hệ 10
        const diemHe10Obj = scoreConvert.find(
            (item) => item.base10Min <= score && item.base10Max >= score
        )
        return diemHe10Obj ? diemHe10Obj.pass : true
    }
    console.error('Base type không hợp lệ:', baseType)
    return false
}

// #region ThongTinTichLuy
const ThongTinTichLuy = async (
    studentId: string,
    curriculumVersionId: string,
    trainingCourseId: string,
    semesterStartDate: Date
) => {
    try {
        // Học kỳ bắt đầu của sinh viên (căn cứ theo khóa)
        const hocKyBatDau = await prisma.trainingCourse.findFirst({
            where: {
                id: trainingCourseId,
                deletedAt: null,
                active: true,
            },
            select: {
                semesterStartId: true,
            },
        })

        if (!hocKyBatDau?.semesterStartId) {
            console.error('Không tìm thấy học kỳ bắt đầu cho khóa học:', trainingCourseId)
            throw new Error('Không tìm thấy học kỳ bắt đầu cho khóa học.')
        }

        // Đếm xem giữa học kỳ bắt đầu và học kỳ đầu vào (semesterId) có bao nhiêu học kỳ
        const startSemester = await prisma.semester.findUnique({
            where: {
                id: hocKyBatDau?.semesterStartId,
                deletedAt: null,
                active: true,
            },
            select: { id: true, startDate: true, semesterType: true },
        })

        if (!startSemester) {
            throw new Error('semesters not found.')
        }
        if (startSemester.startDate > semesterStartDate) {
            throw new Error('Start semester is after end semester.')
        }

        const DsHocKy = await prisma.semester.findMany({
            where: {
                startDate: {
                    gte: startSemester.startDate,
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
                startDate: 'asc',
            },
        })

        if (DsHocKy.length === 0) {
            console.error('Không tìm thấy học kỳ nào giữa học kỳ bắt đầu và học kỳ đầu vào.')
            throw new Error('Không tìm thấy học kỳ nào giữa học kỳ bắt đầu và học kỳ đầu vào.')
        }
        const kyDangHoc = DsHocKy.length

        // Danh sách các môn học trong chương trình đào tạo
        const DsCacMonTrongCTDT = await prisma.trainingBlockSubject.findMany({
            where: {
                trainingBlockOnCurriculumVersion: {
                    curriculumVersionId,
                },
                deletedAt: null,
                active: true,
            },
            select: {
                subjectId: true,
            },
        })
        // Kiểm tra tổng tích lũy tín chỉ của sinh viên đến kỳ xác định
        const DsCacMonDaHocRaw = await prisma.studentSubjectScore.findMany({
            where: {
                studentId,
                subjectClass: {
                    semester: {
                        startDate: {
                            lte: semesterStartDate, // lấy tất cả các kỳ trước kỳ đang xét
                        },
                    },
                },
                subjectVersionId: {
                    // Chỉ lấy các môn trong chương trình đào tạo
                    in: DsCacMonTrongCTDT.map((item) => item.subjectId),
                },
                deletedAt: null,
                active: true,
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
                manualFinalScore: true, // Lấy điểm thủ công nếu có
                finalScore: true, // Lấy điểm cuối
                subjectClass: {
                    select: {
                        startDate: true, // Ngày bắt đầu lớp môn học
                    },
                },
                examPostponed: true, // Có hoãn thi không
                examBanned: true, // Có cấm thi không
                suspended: true, // Có đình chỉ học không
                exempted: true, // Có miễn thi không
                withdrew: true, // Có rút môn không
            },
            // TODO: lấy kết quả cao nhất của môn học
            // Chỉ lấy điểm ở lần thi gần nhất
            orderBy: [
                {
                    subjectVersionId: 'asc',
                },
                {
                    subjectClass: {
                        startDate: 'desc',
                    },
                },
            ],
            distinct: ['subjectVersionId'],
        })

        // Danh sách chuyển đổi điểm
        const DsDiemChuyenDoi = await prisma.scoreConvert.findMany({
            where: {
                trainingCourseId,
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
        const DSDiemHe4: number[] = []
        const DSDiemHe10: number[] = []
        let TongTinChiTichLuy = 0
        let TongTinChiDangKy = 0
        DsCacMonDaHocRaw.forEach((item) => {
            if (item.subjectVersion?.trainingBlocks.some((block) => !block.useForFinalScore)) {
                return // Bỏ qua nếu môn không tính điểm
            }

            // Kiểm tra xem có hủy môn không, không thi được do lý do khách quan
            if (item.examPostponed || item.withdrew) {
                return // Bỏ qua nếu có lý do không tính điểm
            }
            let diemHe10 = item.manualFinalScore ?? item.finalScore?.toNumber() // Lấy điểm thủ công nếu có, nếu không thì lấy điểm cuối
            // Kiểm tra xem có lý do cấm thi không
            if (item.examBanned || item.suspended) {
                diemHe10 = 0 // Cấm thi thì điểm là 0
                return // Bỏ qua nếu có lý do không tính điểm
            }
            if (diemHe10 === null || diemHe10 === undefined) {
                return // Bỏ qua nếu chưa có điểm hoặc điểm không hợp lệ
            }
            const soTinChi = item.subjectVersion?.credit || 0 // Số tín chỉ của môn học
            console.log(' môn học:', item.subjectVersionId, 'Số tín chỉ:', soTinChi)
            if (checkScorePassed(AcademicRankingBaseType.Base10, diemHe10, DsDiemChuyenDoi)) {
                TongTinChiTichLuy += soTinChi // chỉ tính môn đã qua
            }
            TongTinChiDangKy += soTinChi // Cộng dồn số tín chỉ đăng ký
            const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, DsDiemChuyenDoi)
            DSDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
            DSDiemHe10.push(diemHe10 * soTinChi) // Nhân điểm hệ 10 với số tín chỉ
        })

        // GPA hệ 4
        // Làm tròn đến 2 số thập phân
        const diemTrungBinh4 =
            Math.round(
                (DSDiemHe4.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100
        const diemTrungBinh10 =
            Math.round(
                (DSDiemHe10.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100

        // Số tín chỉ nợ tích lũy
        const TongTinChiNoTichLuy = DsCacMonDaHocRaw.reduce((tong, item) => {
            if (
                !checkScorePassed(
                    AcademicRankingBaseType.Base10,
                    item.manualFinalScore ?? item.finalScore?.toNumber() ?? 0,
                    DsDiemChuyenDoi
                )
            ) {
                return tong + (item.subjectVersion?.credit || 0)
            }
            return tong // Bỏ qua nếu môn đã qua
        }, 0)

        // Kiểm tra tổng số tích lũy yêu cầu đến kỳ hiện tại
        const phienBanCTDT = await prisma.student.findFirst({
            where: {
                id: studentId,
                deletedAt: null,
                active: true,
            },
            select: {
                curriculumVersionId: true, // Lấy phiên bản chương trình đào tạo
            },
        })

        if (!phienBanCTDT?.curriculumVersionId) {
            console.log('Không tìm thấy phiên bản chương trình đào tạo cho sinh viên:', studentId)
            throw new Error('Không tìm thấy phiên bản chương trình đào tạo cho sinh viên.')
        }

        const MonHocYeuCau = await prisma.trainingBlockOnCurriculumVersion.findMany({
            where: {
                curriculumVersionId: phienBanCTDT.curriculumVersionId,
                subjects: {
                    some: {
                        useForFinalScore: true, // Chỉ lấy các môn có tính điểm
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
        // console.log('Số môn học yêu cầu:', MonHocYeuCau, phienBanCTDT.curriculumVersionId)
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
        console.log('Tổng số tín chỉ yêu cầu đến thời điểm hiện tại:', TongTinChiYeuCau)
        console.log('Tổng số tín chỉ đã tích lũy:', TongTinChiTichLuy)
        console.log('Tổng số tín chỉ đã mở:', TongTinChiDangKy)
        // Tìm số tín chỉ mở trong kỳ hiện tại
        const TongTinChiMoTrongKy = MonHocYeuCau.reduce((tong, item) => {
            return (
                tong +
                item.subjects.reduce((tongMon, mon) => {
                    if ((mon.semester ?? 0) === kyDangHoc) {
                        return tongMon + (mon.subject?.credit || 0)
                    }
                    return tongMon // Bỏ qua nếu môn học không phải kỳ hiện tại
                }, 0)
            )
        }, 0)

        // Kỳ lớn nhất của CTDT
        // Tìm kỳ dự kiến lớn nhất trong CTDT
        const maxSemester = Math.max(
            0,
            ...MonHocYeuCau.flatMap((item) => item.subjects.map((mon) => mon.semester ?? 0))
        )
        return {
            kyDangHoc: kyDangHoc,
            kyCuoi: kyDangHoc === maxSemester,
            diemTrungBinh4TichLuy: diemTrungBinh4,
            diemTrungBinh10TichLuy: diemTrungBinh10,
            tongTinChiDaTichLuy: TongTinChiTichLuy, // Số tín chỉ đã tích lũy
            tongTinChiYeuCauDenThoiDiemHienTai: TongTinChiYeuCau,
            tongTinChiMoTrongKy: TongTinChiMoTrongKy,
            tongTinChiNoTichLuy: TongTinChiNoTichLuy, // Số tín chỉ nợ tích lũy
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin học kỳ:', error)
        return {
            kyDangHoc: 0,
            kyCuoi: false,
            diemTrungBinh4TichLuy: 0,
            diemTrungBinh10TichLuy: 0,
            tongTinChiDaTichLuy: 0,
            tongTinChiYeuCauDenThoiDiemHienTai: 0,
            tongTinChiMoTrongKy: 0,
            tongTinChiNoTichLuy: 0, // Số tín chỉ nợ tích lũy
        }
    } finally {
        await prisma.$disconnect()
        // console.log('Đã hoàn thành việc lấy thông tin tích lũy cho sinh viên:', studentId)
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
    if (!scoreConvert?.length || typeof diemHe10 !== 'number' || Number.isNaN(diemHe10)) {
        console.error('Invalid inputs:', { diemHe10, scoreConvert })
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
    scoreConvert: ScoreConvertItem[] = []
): Promise<string> => {
    try {
        if (!scoreConvert?.length || typeof diemHe4 !== 'number' || Number.isNaN(diemHe4)) {
            console.error('Invalid inputs:', { diemHe4, scoreConvert })
            return ''
        }

        // Tìm phân loại nhỏ hơn hoặc bằng gần nhất với diemHe4
        const sorted = scoreConvert
            .filter((item) => item.trainingCourseId === trainingCourseId && item.base4 <= diemHe4)
            .sort((a, b) => b.base4 - a.base4)
        const diemHe4Obj = sorted[0]

        return diemHe4Obj ? diemHe4Obj.classification : ''
    } catch (error) {
        console.error('Error in phanLoaiDiemHe4:', error)
        return ''
    }
}

const phanLoaiDiemHe10 = async (
    diemHe10: number,
    trainingCourseId: string,
    scoreConvert: ScoreConvertItem[] = []
): Promise<string> => {
    try {
        if (!scoreConvert?.length || typeof diemHe10 !== 'number' || Number.isNaN(diemHe10)) {
            console.error('Invalid inputs:', { diemHe10, scoreConvert })
            return ''
        }
        const phanLoai = scoreConvert.find(
            (item) =>
                item.trainingCourseId === trainingCourseId &&
                diemHe10 >= item.base10Min &&
                diemHe10 <= item.base10Max
        )
        return phanLoai ? phanLoai.classification : ''
    } catch (error) {
        console.error('Error in phanLoaiDiemHe10:', error)
        return ''
    }
}
const ThongTinDiemHocKy = async (
    studentId: string,
    curriculumVersionId: string,
    trainingCourseId: string,
    semesterId: string,
    baseType: AcademicRankingBaseType
) => {
    try {
        // Danh sách các môn học trong chương trình đào tạo
        const DsCacMonTrongCTDT = await prisma.trainingBlockSubject.findMany({
            where: {
                trainingBlockOnCurriculumVersion: {
                    curriculumVersionId,
                },
                deletedAt: null,
                active: true,
            },
            select: {
                subjectId: true,
            },
        })
        const DsDiem = await prisma.studentSubjectScore.findMany({
            where: {
                subjectClass: { semesterId },
                studentId,
                subjectVersionId: {
                    // Chỉ lấy các môn trong chương trình đào tạo
                    in: DsCacMonTrongCTDT.map((item) => item.subjectId),
                },
                deletedAt: null,
                active: true,
            },
            select: {
                id: true,
                finalScore: true,
                manualFinalScore: true, // Lấy điểm thủ công nếu có
                studentId: true,
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
                exempted: true, // Có miễn thi không
                withdrew: true, // Có rút môn không
            },
        })

        // Danh sách chuyển đổi
        const DsDiemChuyenDoi = await prisma.scoreConvert.findMany({
            where: {
                trainingCourseId,
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

        // Tính điểm trung bình của sinh viên
        // console.log('Điểm của sinh viên:', studentId, DsDiem)

        const DsDiemHe4: number[] = []
        const DSDiemHe10: number[] = []
        let TongTinChiDangKy = 0
        let diemHe10ThapNhat = 0
        let soTinChiDat = 0
        let soTinChiKhongDat = 0
        DsDiem.forEach((item) => {
            if (item.subjectVersion.trainingBlocks.some((block) => !block.useForFinalScore)) {
                return // Bỏ qua nếu môn không tính điểm
            }
            // Kiểm tra xem có hủy môn không, không thi được do lý do khách quan
            if (item.examPostponed || item.withdrew) {
                return // Bỏ qua nếu có lý do không tính điểm
            }
            let diemHe10 = item.manualFinalScore ?? item.finalScore?.toNumber() // Lấy điểm thủ công nếu có, nếu không thì lấy điểm cuối
            // Kiểm tra xem có lý do cấm thi không
            if (item.examBanned || item.suspended) {
                diemHe10 = 0 // Cấm thi thì điểm là 0
                return // Bỏ qua nếu có lý do không tính điểm
            }
            if (diemHe10 === null || diemHe10 === undefined) {
                return // Bỏ qua nếu chưa có điểm hoặc điểm không hợp lệ
            }
            if (diemHe10 < diemHe10ThapNhat || diemHe10ThapNhat === 0) {
                diemHe10ThapNhat = diemHe10 // Cập nhật điểm thấp nhất
            }

            const soTinChi = item.subjectVersion.credit // Số tín chỉ của môn học
            if (!checkScorePassed(AcademicRankingBaseType.Base10, diemHe10, DsDiemChuyenDoi)) {
                soTinChiKhongDat += soTinChi // Cộng dồn số tín chỉ không đạt
            } else {
                soTinChiDat += soTinChi // Cộng dồn số tín chỉ đạt
            }
            TongTinChiDangKy += soTinChi // Cộng dồn số tín chỉ
            const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, DsDiemChuyenDoi)
            DsDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
            DSDiemHe10.push(diemHe10 * soTinChi) // Nhân điểm hệ 10 với số tín chỉ
        })

        // TODO: maybe don't throw
        if (TongTinChiDangKy === 0) {
            throw new Error('Không có tín chỉ nào để tính điểm trung bình hệ 4')
        }

        // Tính điểm trung bình hệ 4 trong kỳ
        const diemTrungBinh4 =
            Math.round(
                (DsDiemHe4.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100
        // Tính điểm trung bình hệ 10 trong kỳ
        const diemTrungBinh10 =
            Math.round(
                (DSDiemHe10.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100
        console.log('Điểm trung bình hệ 4:', diemTrungBinh4)
        console.log('Điểm trung bình hệ 10:', diemTrungBinh10)
        // Điểm thấp nhất
        let diemThapNhat = Math.min(...DsDiemHe4) || 0
        if (baseType === AcademicRankingBaseType.Base10) {
            diemThapNhat = diemHe10ThapNhat // Nếu là hệ 10, lấy điểm thấp nhất hệ 10
        }
        return {
            diemTrungBinh4TrongKy: diemTrungBinh4,
            diemTrungBinh10TrongKy: diemTrungBinh10,
            tongTinChiDangKy: TongTinChiDangKy,
            xepLoaiHocTap: phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId),
            diemThapNhat: diemThapNhat,
            soTinChiDat: soTinChiDat, // Số tín chỉ đạt trong kỳ
            soTinChiKhongDat: soTinChiKhongDat, // Số tín chỉ không đạt trong kỳ
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin điểm:', error)
        return {
            diemTrungBinh4TrongKy: 0,
            diemTrungBinh10TrongKy: 0,
            xepLoaiHocTap: 'Lỗi khi tính điểm',
            tongTinChiDangKy: 0,
            diemThapNhat: 0,
            soTinChiDat: 0, // Số tín chỉ đạt trong kỳ
            soTinChiKhongDat: 0, // Số tín chỉ không đạt trong kỳ
        }
    } finally {
        await prisma.$disconnect()
        // console.log('Đã hoàn thành việc lấy thông tin điểm cho sinh viên:', studentId)
    }
}

//#region ThongTinDiemHocKy
// Main function
export const calculateStudentSemesterResult = async (semesterId: string): Promise<string> => {
    const results: StudentSemesterResult[] = []

    try {
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

        // Lấy danh sách ID sinh viên chưa tốt nghiệp
        const studentsIDs = await prisma.student.findMany({
            where: {
                status: StudentStatus.ENROLLED, // Chỉ lấy sinh viên đang học
                // fixedClassId: 'K25_CĐT',
                // id: {endsWith: '4'}
                // id: "cmcvrfn5k0002okmgkp2k2cwp"
                deletedAt: null,
                active: true,
            },
            include: {
                fixedClass: {
                    select: {
                        id: true,
                        curriculumVersionId: true, // Lấy ID phiên bản chương trình đào tạo
                        trainingCourseId: true, // Lấy ID khóa học
                        classMonitorId: true, // Lấy ID lớp trưởng
                        unionLeaderId: true, // Lấy ID bí thư
                        trainingCourse: {
                            select: {
                                baseScore: true, // Lấy điểm chuẩn của đối tượng đào tạo
                            },
                        },
                    },
                },
                trainingObjectType: {
                    select: {
                        id: true,
                        name: true, // Lấy tên đối tượng đào tạo
                        code: true, // Lấy mã đối tượng đào tạo
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

        console.log(
            'Danh sách sinh viên:',
            studentsIDs.map((student) => student.id)
        )

        // Kiểm tra xem có kết quả sinh viên trong học kỳ này không
        studentsIDs.forEach(async (student) => {
            const existingResult = await checkStudentSemesterResult(semesterId, student.id)
            // lấy khóa học
            const trainingCourseId = student.fixedClass?.trainingCourseId
            if (!trainingCourseId) {
                console.log(`Không tìm thấy khóa học cho sinh viên ${student.id}`)
                return
            }
            // Lấy thông tin tích lũy của sinh viên
            const thongTinTichLuy = await ThongTinTichLuy(
                student.id,
                student.curriculumVersionId || student.fixedClass?.curriculumVersionId || '',
                trainingCourseId,
                hocKyDauVao?.startDate || new Date() // Sử dụng ngày bắt đầu của học kỳ check
            )
            if (!thongTinTichLuy) {
                console.log(`Không tìm thấy thông tin học kỳ cho sinh viên ${student.id}`)
                return
            }

            // Lấy thông tin điểm học viên
            const baseType =
                student.fixedClass?.trainingCourse?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là Base10 nếu không có thông tin

            // Lấy thông tin điểm học kỳ
            const thongTinDiemHocKy = await ThongTinDiemHocKy(
                student.id,
                student.curriculumVersionId || student.fixedClass?.curriculumVersionId || '',
                trainingCourseId,
                semesterId,
                baseType
            )
            if (!thongTinDiemHocKy) {
                console.error(`Không tìm thấy thông tin điểm học kỳ cho sinh viên ${student.id}`)
                return
            }

            const conductScore = await prisma.studentTrainingScore.findFirst({
                where: {
                    studentId: student.id,
                    trainingScoreSession: { semesterId },
                    deletedAt: null,
                    active: true,
                },
                orderBy: { createdAt: 'desc' },
            })

            if (!existingResult) {
                console.log(`Không tìm thấy kết quả học kỳ cho sinh viên ${student.id}, tạo mới...`)
                // Nếu không có kết quả, tạo mới
                const newResult: StudentSemesterResult = {
                    id: crypto.randomUUID(), // Tạo ID ngẫu nhiên
                    conductScore: conductScore?.score || 10,
                    studentId: student.id,
                    semesterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    studyYear: Math.floor(thongTinTichLuy.kyDangHoc / 2), // năm học thứ mấy
                    semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
                    isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

                    baseScore:
                        student.fixedClass?.trainingCourse?.baseScore ||
                        AcademicRankingBaseType.Base10, // Lấy baseScore từ đối tượng đào tạo, nếu không có thì mặc định là Base10
                    gpaBase4: new Decimal(thongTinDiemHocKy.diemTrungBinh4TrongKy),
                    gpaBase10: new Decimal(thongTinDiemHocKy.diemTrungBinh10TrongKy),
                    cumulativeGpaBase4: new Decimal(thongTinTichLuy.diemTrungBinh4TichLuy),
                    cumulativeGpaBase10: new Decimal(thongTinTichLuy.diemTrungBinh10TichLuy),

                    lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
                    lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
                    totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ
                    registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ
                    passedCredits: thongTinDiemHocKy.soTinChiDat,
                    failedCredits: thongTinDiemHocKy.soTinChiKhongDat,
                    accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
                    totalCreditsByCurriculum: thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
                    totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ nợ tích lũy
                    studentTrainingType: StudentTrainingType.GOOD,
                    foreignLangPass: student.foreignLangPass, // Đạt trình độ ngoại nsgữ theo quy định
                    isClassMonitor: student.id === student.fixedClass?.classMonitorId, // là lớp trưởng nếu id trùng classMonitorId)
                    isUnionLeader: student.id === student.fixedClass?.unionLeaderId, // là bí thư nếu id trùng unionLeaderId)
                    entryScore: student.entryScore, // Điểm đầu vào
                    academicWarningLevel: student.academicWarningLevel, // mức cảnh cáo học tập
                    disciplinaryWarningLevel: student.disciplinaryWarningLevel, // mức cảnh cáo học đường
                    suspended: student.suspended, // đình chỉ học
                    expelled: student.expelled, // đuổi học
                    //TODO: Chưa có thông tin này
                    retakingCredits: 0, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
                    isImproving: false, // Đang cải thiện (hiện tại chưa có thông tin này)
                    postponeWithReason: false, // tạm ngưng có lý do
                    code: student.code || '', // Mã sinh viên
                    active: true,
                    description: null,
                    deletedAt: null,
                }
                // Lưu kết quả học kỳ mới
                results.push(newResult)
                console.log(`Tạo mới kết quả học kỳ cho sinh viên ${student.id}`)
                await prisma.studentSemesterResult.create({
                    data: newResult,
                })
            } else {
                // Cập nhật kết quả học kỳ nếu đã tồn tại

                if (!existingResult) {
                    console.error(
                        `Không tìm thấy kết quả học kỳ để cập nhật cho sinh viên ${student.id}`
                    )
                    return
                }
                const updatedResult: StudentSemesterResult = {
                    id: existingResult.id, // Giữ nguyên ID để cập nhật
                    studentId: student.id,
                    conductScore: conductScore?.score || 10,
                    semesterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    studyYear: Math.floor((thongTinTichLuy.kyDangHoc + 1) / 2), // năm học thứ mấy: kỳ 1,2 -> năm 1; kỳ 3,4 -> năm 2
                    semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
                    isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

                    baseScore:
                        student.fixedClass?.trainingCourse?.baseScore ||
                        AcademicRankingBaseType.Base10,
                    gpaBase4: new Decimal(thongTinDiemHocKy.diemTrungBinh4TrongKy),
                    gpaBase10: new Decimal(thongTinDiemHocKy.diemTrungBinh10TrongKy),
                    cumulativeGpaBase4: new Decimal(thongTinTichLuy.diemTrungBinh4TichLuy),
                    cumulativeGpaBase10: new Decimal(thongTinTichLuy.diemTrungBinh10TichLuy),

                    lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
                    lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
                    totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ

                    registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ
                    studentTrainingType: StudentTrainingType.GOOD, // xếp loại rèn luyện

                    //TODO: Chưa biết xác định thi lại ntn
                    retakingCredits: 0, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
                    passedCredits: thongTinDiemHocKy.soTinChiDat,
                    failedCredits: thongTinDiemHocKy.soTinChiKhongDat,

                    accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
                    totalCreditsByCurriculum: thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
                    totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ

                    //NOTE: Chưa có thông tin này nên lấy thông tin cũ gán lại
                    foreignLangPass: existingResult?.foreignLangPass || true, // Đạt trình độ ngoại ngữ theo quy định
                    isClassMonitor: existingResult?.isClassMonitor || false, // Chức vụ học viên (hiện tại chưa có thông tin này)
                    isUnionLeader: existingResult?.isUnionLeader || false, // Chức vụ đoàn viên (hiện tại chưa có thông tin này)
                    entryScore: existingResult?.entryScore || null, // Điểm đầu vào (hiện tại chưa có thông tin này)
                    isImproving: existingResult?.isImproving || false, // Đang cải thiện (hiện tại chưa có thông tin này)
                    postponeWithReason: existingResult?.postponeWithReason || false, // tạm ngưng có lý do
                    academicWarningLevel: existingResult?.academicWarningLevel || 0, // mức cảnh cáo học tập
                    disciplinaryWarningLevel: existingResult?.disciplinaryWarningLevel || 0, // mức cảnh cáo học đường
                    suspended: existingResult?.suspended || false, // đình chỉ học
                    expelled: existingResult?.expelled || false, // đuổi học.
                    code: existingResult?.code || '',
                    active: existingResult?.active || true, // Trạng thái hoạt động
                    description: existingResult?.description || null,
                    deletedAt: existingResult?.deletedAt || null,
                }
                // Cập nhật kết quả học kỳ
                results.push(updatedResult)
                console.log(`Cập nhật kết quả học kỳ cho sinh viên ${student.id}`)
                await prisma.studentSemesterResult.update({
                    where: {
                        id: existingResult.id,
                        deletedAt: null,
                        active: true,
                    },
                    data: updatedResult,
                })
            }
        })

        console.log('Tính toán kết quả học kỳ cho tất cả sinh viên đã hoàn thành.')

        return 'Successfully calculated semester results for all students.'
    } catch (error) {
        console.error('Lỗi khi tính toán kết quả học kỳ:', error)
        throw error // Ném lỗi để xử lý ở nơi gọi hàm
    } finally {
        await prisma.$disconnect()
        console.log('Đã hoàn thành việc tính toán kết quả học kỳ cho tất cả sinh viên.')
    }
}

export const listStudentResultInfo = async (semesterId: string) => {
    try {
        const DsHocVien = await prisma.studentSemesterResult.findMany({
            where: {
                semesterId,
                // studentId: 'cmff4ikj90085nx015zo24hue',
                student: {
                    status: StudentStatus.ENROLLED, // Chỉ lấy sinh viên đang học
                    fixedClassId: {
                        not: null, // Chỉ lấy sinh viên có lớp học cố định
                    },
                },
                deletedAt: null,
                active: true,
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
                                trainingCourse: true,
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
                        trainingObjectType: true,
                    },
                },
            },
        })

        const listTrainingCourseId = DsHocVien.map(
            (item) => item.student.fixedClass?.trainingCourse?.id || ''
        )
        const scoreConvert = await prisma.scoreConvert.findMany({
            where: {
                trainingCourseId: {
                    in: listTrainingCourseId,
                },
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
            DsHocVien.map(async (item) => {
                const userProfile = item.student.userProfile
                const trainingCourseId = item.student.fixedClass?.trainingCourse?.id || ''
                // Danh sách chuyển đổi

                const baseScore =
                    item.student.fixedClass?.trainingCourse?.baseScore ||
                    AcademicRankingBaseType.Base10 // Mặc định là 10 nếu không có thông tin
                const xepLoaiHocTap =
                    baseScore === AcademicRankingBaseType.Base10
                        ? await phanLoaiDiemHe10(
                              item.gpaBase10.toNumber(),
                              trainingCourseId,
                              scoreConvert
                          )
                        : await phanLoaiDiemHe4(
                              item.gpaBase4.toNumber(),
                              trainingCourseId,
                              scoreConvert
                          )
                return {
                    stt: 0,
                    id: item.student.id ?? '',
                    hoTen: `${userProfile?.lastName ?? ''} ${userProfile?.firstName ?? ''}`.trim(),
                    maSinhVien: userProfile?.code || '',
                    doiTuong: item.student.trainingObjectType?.name || '',
                    khoa: item.student.fixedClass?.trainingCourse?.name || '',
                    khoaId: item.student.fixedClass?.trainingCourse?.id || '',
                    chuyenNganh:
                        item.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                            ?.name || '',
                    chuyenNganhId:
                        item.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.id ||
                        '',
                    nganh:
                        item.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                            ?.trainingField?.name || '',
                    nganhId:
                        item.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                            ?.trainingField?.id || '',
                    ngaySinh: userProfile?.dateOfBirth
                        ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                        : '',
                    heSoDiem: baseScore === AcademicRankingBaseType.Base10 ? 10 : 4, // Loại hệ số điểm, mặc định là 10
                    fullDiemC: true,
                    fullDiemD: true,
                    diemMonThuongNhoNhat: item.lowestFinalScore,
                    diemMonTotNghiepNhoNhat: item.lowestGraduationScore ?? 0,
                    diemTrungBinh4: item.gpaBase4.toNumber() || 0,
                    diemTrungBinh10: item.gpaBase10.toNumber() || 0,
                    xepLoaiHocTap: xepLoaiHocTap || 'Chưa có dữ liệu',
                    soTinChiTichLuy: item.accumulatedCredits || 0,
                    soTinChiYeuCau: item.totalCreditsByCurriculum || 0,
                    soTinChiMoTrongKy: item.totalCredits || 0,
                    soTinChiNo: item.failedCredits || 0,
                    soTinChiDangKy: item.registeredCredits || 0,
                    xepLoaiRenLuyen: item.studentTrainingType,
                    diemDauVao: item.student.entryScore ?? 0, // Điểm đầu vào (default to 0 if null)
                    soLanViPham: 0,
                    biKyLuat: false,
                    queQuan: userProfile?.homeTown || '',

                    trinhDoNgoaiNgu: false,
                    trinhDoTinHoc: false,
                    kyDangHoc: item.semesterIndexInCourse || 0,
                    kyCuoi: item.isLastSemester || false,
                    chucVuHocVien: item.isClassMonitor
                        ? 'Lớp trưởng'
                        : item.isUnionLeader
                          ? 'Bí thư'
                          : '', // Chức vụ học viên
                    quocTich: userProfile.nationalityId ?? '', // Quốc tịch
                    // duDieuKienHocBong: true, // Điều kiện học bổng
                    ghiChu: '', // Ghi chú,
                    diemThuong: item.isClassMonitor || item.isUnionLeader ? 0.1 : 0, // Điểm thưởng
                    userProfile: userProfile, // Thông tin người dùng

                    // Add missing properties with default values or calculated from item if possible
                    noTinChiTrongKy: 0,
                    tongSoTinChiNo: 0,
                    diemHe10TichLuy: item.cumulativeGpaBase10.toNumber() || 0,
                    diemHe4TichLuy: item.cumulativeGpaBase4.toNumber() || 0,
                    soTinChiDatTichLuy: 0,
                    soTinChiKhongDatTichLuy: 0,
                    xepLoaiHocTapTichLuy: '',
                    xepLoaiRenLuyenTichLuy: '',
                    // Add missing required properties for StudentInfoCheck
                    namDangHoc: item.studyYear || 0,
                    mucCanhCaoHocTap: item.student.academicWarningLevel || 0,
                    mucCanhCaoHocDuong: item.student.disciplinaryWarningLevel || 0,
                    xepLoaiRenLuyenKy: '', // or item.xepLoaiRenLuyenKy if available
                    lyDoXepLoai: '', // tính sau
                }
            })
        )

        return studentsInfo
    } catch (error) {
        console.error('Error fetching student info:', error)
        throw new Error('Failed to fetch student information')
    } finally {
        // Đóng kết nối Prisma nếu cần thiết
        await prisma.$disconnect()
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
        student.lyDoXepLoai = `${student.lyDoXepLoai}\n ${criteriaFieldLabels[fieldValue]}(${studentValue}) ${invert ? '*không* ' : ''}${criteriaOperatorLabels[operator]} ${criteriaValue}`
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

    switch (condition.operator) {
        case 'GTE': // Lớn hơn hoặc bằng (>=)
            return value >= condition.value

        case 'GT': // Lớn hơn (>)
            return value > condition.value

        case 'LTE': // Nhỏ hơn hoặc bằng (<=)
            return value <= condition.value

        case 'LT': // Nhỏ hơn (<)
            return value < condition.value

        case 'EQ': // Bằng (==)
            return value === condition.value

        // Toán tử 'IN' cần xử lý đặc biệt nếu giá trị là một mảng
        case 'IN':
            return condition.tuple?.includes(`${value}`) || false

        default:
            // Nếu toán tử không hợp lệ, trả về false
            return false
    }
}

const checkAcademicActionRule = async (
    student: StudentInfoCheck,
    ruleSetId: string,
    actionCriteriaList: AcademicActionCondition[] = []
): Promise<boolean> => {
    try {
        const actionCriteriaListFilter = actionCriteriaList.filter(
            (criteria) =>
                criteria.ruleSetId === ruleSetId &&
                (criteria.yearCondition === student.namDangHoc || criteria.yearCondition === null)
        )

        // const actionCriteriaList = await prisma.academicActionCondition.findMany({
        //     where: {
        //         ruleSetId: ruleSetId,
        //         OR: [{ yearCondition: student.namDangHoc }, { yearCondition: null }],
        //     },
        //     include: {
        //         ruleSet: {
        //             // AcademicActionRuleSet
        //             include: {
        //                 config: true, // AcademicActionConditionConfig
        //             },
        //         },
        //     },
        // })
        if (!actionCriteriaListFilter || actionCriteriaListFilter.length === 0) {
            console.warn('No action criteria found for training ruleSet:', ruleSetId)
            return false
        }
        // console.log('Student Info:', student)
        // console.log('Checking action criteria for ruleSet:', actionCriteriaListFilter)
        // Kiểm tra từng điều kiện, tất cả điều kiện thỏa thì mới true
        for (const criteria of actionCriteriaListFilter) {
            // Cảnh cáo học tập
            if (criteria.field === CriteriaField.ACADEMIC_WARNING_LEVEL) {
                if (
                    !checkEligible(
                        student,
                        CriteriaField.ACADEMIC_WARNING_LEVEL,
                        student.mucCanhCaoHocTap,
                        criteria.value,
                        criteria.operator,
                        criteria.invert
                    )
                ) {
                    return false
                }
            } else if (criteria.field === CriteriaField.DISCIPLINARY_WARNING_LEVEL) {
                if (
                    !checkEligible(
                        student,
                        CriteriaField.DISCIPLINARY_WARNING_LEVEL,
                        student.mucCanhCaoHocDuong,
                        criteria.value,
                        criteria.operator,
                        criteria.invert
                    )
                ) {
                    return false
                }
            } else {
                return false // Unrecognized criterion
            }
        }
        console.log('All criteria passed for ruleSet:', ruleSetId)
        return true // All criteria passed
    } catch (error) {
        console.error('Error fetching action criteria:', error)
        throw new Error('Failed to fetch action checkStudentEligible')
    }
}
const checkAcademicActionConfig = async (
    student: StudentInfoCheck,
    configId: string,
    academicActionRuleSet: AcademicActionRuleSet[] = [],
    actionCriteriaList: AcademicActionCondition[] = []
): Promise<boolean> => {
    try {
        const academicActionRuleSetFilter = academicActionRuleSet.filter(
            (ruleSet) => ruleSet.configId === configId
        )
        if (academicActionRuleSetFilter.length === 0) {
            console.warn('No action criteria found for training configId:', configId)
            return false
        }
        // const actionRuleSet = await prisma.academicActionRuleSet.findMany({
        //     where: {
        //         configId: configId,
        //     },
        // })
        // if (!actionRuleSet || actionRuleSet.length === 0) {
        //     console.warn('No action criteria found for training configId:', configId)
        //     return false
        // }
        // Kiểm tra từng bộ tiêu chí
        const Eligible = await Promise.all(
            academicActionRuleSetFilter.map((ruleSet) =>
                checkAcademicActionRule(student, ruleSet.id, actionCriteriaList)
            )
        )
        return Eligible.includes(true)
    } catch (error) {
        console.error('Error fetching action criteria:', error)
        throw new Error('Failed to fetch action checkStudentEligible')
    }
}
const getAcademicAction = async (
    student: StudentInfoCheck,
    trainingCourseId: string,
    academicActionConfig: AcademicActionConfig[] = [],
    academicActionRuleSet: AcademicActionRuleSet[] = [],
    actionCriteriaList: AcademicActionCondition[] = []
): Promise<ListAcademicAction[]> => {
    const academicActionConfigFilter = academicActionConfig.filter(
        (config) => config.trainingCourseId === trainingCourseId && config.active
    )

    // Lấy danh sách học bổng của sinh viên
    const academicAction: ListAcademicAction[] = []
    for (const config of academicActionConfigFilter) {
        const isEligible = await checkAcademicActionConfig(
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
const checkAcademicWarning = async (
    student: StudentInfoCheck,
    trainingCourseId: string,
    warningCriteriaList: AcademicWarningRule[] = []
): Promise<AcademicWarningRule[]> => {
    try {
        const warningCriteriaListFilter = warningCriteriaList.filter(
            (criteria) =>
                criteria.trainingCourseId === trainingCourseId &&
                (criteria.semesterCondition === student.kyDangHoc ||
                    criteria.semesterCondition === null) &&
                (criteria.yearCondition === student.namDangHoc || criteria.yearCondition === null)
        )
        // Lấy thông tin tiêu chí cảnh cáo

        const ruleList = warningCriteriaListFilter.map((criteria) => {
            console.log('Checking criteria:', criteria.field, 'with value:', criteria.threshold)

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
    } catch (error) {
        console.error('Error checking student eligibility:', error)
        return [] // Trả về false nếu có lỗi xảy ra
    }
}
const checkScholarshipRecived = async (
    student: StudentInfoCheck,
    semesterId: string,
    semesterScholarship: Scholarship[] = []
): Promise<Scholarship[]> => {
    // Lấy danh sách học bổng đã nhận của sinh viên trong học kỳ này
    const scholarshipAward = await prisma.scholarshipAward.findMany({
        where: {
            studentId: student.id,
            semesterId: semesterId,
            deletedAt: null,
            active: true,
        },
    })
    return semesterScholarship.filter((scholarship) =>
        scholarshipAward.some((award) => award.scholarshipId === scholarship.id)
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
                    console.log(
                        'Total Credits: ',
                        student.soTinChiDangKy,
                        criteria.value,
                        criteria.operator
                    )
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
                        'Registered Credits: ',
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
                        'Accumulated Credits Percent: ',
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
                        'Course Grade Min: ',
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
                        'Graduation Grade Min: ',
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
                        'Semester GPA: ',
                        student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
                        criteria.value,
                        criteria.operator
                    )
                    console.log(
                        checkEligible(
                            student,
                            CriteriaField.SEMESTER_GPA,
                            student.heSoDiem === 10
                                ? student.diemTrungBinh10
                                : student.diemTrungBinh4,
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
                    console.log(
                        'Entry Score: ',
                        student.diemDauVao,
                        criteria.value,
                        criteria.operator
                    )
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
        console.error('Error checking student eligibility:', error)
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
        console.log('Checking scholarship:', scholarship.id, scholarship.name)
        const isEligible = await checkScholarship(
            student,
            scholarship.id,
            scholarshipCriteriaFilter
        )
        if (isEligible) {
            scholarships.push(scholarship)
        }
    }
    console.log('Eligible scholarships for student', student.id, scholarships)
    return scholarships
}

const CheckDecreaseAcademicWarning = (
    student: StudentInfoCheck,
    hasAcademicWarning: boolean
): boolean => {
    console.log('Checking if academic warning can be decreased for student:', student.id)
    console.log(
        'Academic warning level:',
        student.mucCanhCaoHocTap,
        'Has academic warning:',
        hasAcademicWarning
    )
    const academicWarningLevel = student.mucCanhCaoHocTap || 0
    if (academicWarningLevel <= 0) {
        return false // Không có cảnh cáo học tập
    }
    if (academicWarningLevel >= 1 && !hasAcademicWarning) {
        return true // Giảm cảnh cáo học tập nếu không có cảnh cáo học tập
    }
    return false
}

const getStudentResult = async (
    student: StudentInfoCheck,
    semesterId: string,
    type: 'scholarship' | 'academicWarning' | 'academicAction' | 'decreaseAcademicWarning',
    semesterScholarship: Scholarship[] = [],
    scholarshipCriteriaList: ScholarshipCriteria[] = [],
    warningCriteriaList: AcademicWarningRule[] = [],
    academicActionConfig: AcademicActionConfig[] = [],
    academicActionRuleSet: AcademicActionRuleSet[] = [],
    actionCriteriaList: AcademicActionCondition[] = [],
    studentAcademicDecision: StudentAcademicDecision[] = []
): Promise<StudentResult> => {
    try {
        console.log('Fetching result for student:', student.id, 'in semester:', semesterId)
        const studentSemesterResult = await prisma.studentSemesterResult.findFirst({
            where: {
                studentId: student.id,
                semesterId,
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
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
                        trainingObjectType: true,
                    },
                },
            },
            orderBy: {
                student: {
                    userProfile: {
                        firstName: 'asc',
                    },
                },
            },
        })

        if (!studentSemesterResult)
            throw new Error(
                `Không tìm thấy kết quả học kỳ cho sinh viên ${student.id} trong học kỳ ${semesterId}`
            )
        // Lấy khóa học của sinh viên
        const trainingCourseId = studentSemesterResult.student.fixedClass?.trainingCourseId
        if (!trainingCourseId)
            throw new Error(`Không tìm thấy khóa học cho sinh viên ${student.id}`)
        // Kiểm tra loại kết quả cần lấy
        const scholarshipInfo =
            type === 'scholarship'
                ? await getScholarship(
                      student,
                      trainingCourseId,
                      semesterScholarship,
                      scholarshipCriteriaList
                  )
                : []
        const scholarshipRecive =
            type === 'scholarship'
                ? await checkScholarshipRecived(student, semesterId, semesterScholarship)
                : []
        const checkAcademicWarningResult =
            type === 'academicWarning'
                ? await checkAcademicWarning(student, trainingCourseId, warningCriteriaList)
                : []

        const checkAcademicActionExists = studentAcademicDecision.find(
            (decision) => decision.studentId === student.id && decision.semesterId === semesterId
        )
        console.log('checkAcademicActionExists', checkAcademicActionExists, student.id, semesterId)
        const academicActionInfo =
            type === 'academicAction' && checkAcademicActionExists !== undefined
                ? await getAcademicAction(
                      student,
                      trainingCourseId,
                      academicActionConfig,
                      academicActionRuleSet,
                      actionCriteriaList
                  )
                : []

        const checkDecreaseAcademicWarning =
            type === 'decreaseAcademicWarning'
                ? CheckDecreaseAcademicWarning(student, checkAcademicWarningResult.length > 0)
                : false
        const filteredResult = (({ student, ...rest }) => rest)(studentSemesterResult)
        return StudentResult.parse({
            id: studentSemesterResult.studentId,
            studentSemesterResult: filteredResult,
            userProfile: await prisma.userProfile.findUnique({
                where: {
                    id: studentSemesterResult.student.userProfileId,
                    deletedAt: null,
                    active: true,
                },
            }),
            hasScholarship: !!scholarshipInfo.length,
            hasAcademicAction: !!academicActionInfo.length,
            hasAcademicWarning: checkAcademicWarningResult.length > 0,
            academicWarningRule: checkAcademicWarningResult,
            scholarship: scholarshipInfo,
            academicAction: academicActionInfo,
            trainingMajor:
                studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum
                    ?.trainingMajor?.name || '',
            trainingMajorId:
                studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum
                    ?.trainingMajor?.id || '',
            trainingField:
                studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum
                    ?.trainingMajor?.trainingField?.name || '',
            trainingFieldId:
                studentSemesterResult.student.fixedClass?.curriculumVersion?.curriculum
                    ?.trainingMajor?.trainingField?.id || '',
            highestScholarship: scholarshipInfo.length > 0 ? scholarshipInfo[0] : null,
            scholarshipRecived: scholarshipRecive,
            decreaseAcademicWarning: checkDecreaseAcademicWarning,
            reason: student.lyDoXepLoai || '',
        })
    } catch (error) {
        console.error('Error fetching student result:', error)
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

export const sortStudentResultInfo = (
    courseStudentResult: CourseStudentResult[]
): CourseStudentResult[] => {
    return courseStudentResult.map((course) => {
        const sortedStudents = course.students.sort((a, b) => {
            // Sắp xếp theo học bổng
            const gpaA = a.highestScholarship?.rankOrder || 0
            const gpaB = b.highestScholarship?.rankOrder || 0
            if (gpaA !== gpaB) {
                return gpaA - gpaB // Sắp xếp tăng dần (order 1 cao nhất)
            }
            // Nếu điểm trung bình bằng nhau, sắp xếp GPA
            const studentGpaA = a.studentSemesterResult.gpaBase10 || 0
            const studentGpaB = b.studentSemesterResult.gpaBase10 || 0
            if (studentGpaA !== studentGpaB) {
                return studentGpaB - studentGpaA // Sắp xếp giảm dần
            }
            return 0
        })
        return {
            ...course,
            students: sortedStudents,
        }
    })
}

export const resultCourseStudentResult = async (
    students: StudentInfoCheck[],
    semesterId: string,
    type: 'scholarship' | 'academicWarning' | 'academicAction' | 'decreaseAcademicWarning',
    academicActionType?: 'REPEAT_YEAR' | 'SUSPENSION' | 'EXPULSION'
): Promise<CourseStudentResult[]> => {
    const courseMap: Record<string, CourseStudentResult> = {}

    // DS khóa học
    const courseIds = new Set(students.map((student) => student.khoaId))
    console.log('courseIds', courseIds)

    // Ds tiêu chí học bổng
    const semesterScholarship = await prisma.scholarship.findMany({
        where: {
            trainingCourseId: { in: Array.from(courseIds) }, // Lấy học bổng theo khóa học
            deletedAt: null,
            active: true,
        },
        orderBy: {
            rankOrder: 'asc', // Sắp xếp theo thứ tự ưu tiên
        },
    })
    const scholarshipCriteriaList = await prisma.scholarshipCriteria.findMany({
        where: {
            scholarshipId: { in: semesterScholarship.map((s) => s.id) },
            deletedAt: null,
            active: true,
        },
        orderBy: {
            scholarship: {
                rankOrder: 'asc', // Sắp xếp theo thứ tự ưu tiên
            },
        },
    })

    // Ds tiêu chỉ cảnh cáo học tập
    const warningCriteriaList = await prisma.academicWarningRule.findMany({
        where: {
            trainingCourseId: { in: Array.from(courseIds) },
            deletedAt: null,
            active: true,
        },
    })

    // Ds tiêu chí thôi học, lưu ban
    const academicActionConfig = await prisma.academicActionConfig.findMany({
        where: {
            trainingCourseId: { in: Array.from(courseIds) },
            actionType: academicActionType || undefined, // Chỉ lấy theo loại hành động học vụ nếu có
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
                // AcademicActionRuleSet
                include: {
                    config: true, // AcademicActionConditionConfig
                },
            },
        },
    })

    // Ds StudentAcademicDecision
    const studentAcademicDecision = await prisma.studentAcademicDecision.findMany({
        where: {
            studentId: { in: students.map((s) => s.id) },
            semesterId: semesterId,
            status: { not: DecisionStatus.APPROVED },
            actionTaken: academicActionType ? academicActionType : undefined,
            deletedAt: null,
            active: true,
        },
    })
    // Process students in parallel
    await Promise.all(
        students.map(async (student) => {
            console.log('student', student.hoTen)
            const courseId = student.khoaId
            // Synchronize access to courseMap to avoid race conditions
            if (!courseMap[courseId]) {
                courseMap[courseId] = {
                    courseId,
                    courseName: student.khoa,
                    students: [],
                }
            }
            const studentResult = await getStudentResult(
                student,
                semesterId,
                type,
                semesterScholarship,
                scholarshipCriteriaList,
                warningCriteriaList,
                academicActionConfig,
                actionRuleSet,
                actionCriteriaList,
                studentAcademicDecision
            )
            if (!studentResult) {
                console.warn(`No result found for student ${student.id} in semester ${semesterId}`)
                return
            }
            // Filter based on type
            console.log(
                `Student ${student.id} - hasScholarship: ${studentResult.hasScholarship}, hasAcademicWarning: ${studentResult.hasAcademicWarning}, hasAcademicAction: ${studentResult.hasAcademicAction}, decreaseAcademicWarning: ${studentResult.decreaseAcademicWarning}`
            )
            // bỏ qua nếu không đủ điều kiện
            const skip =
                (type === 'scholarship' && !studentResult.hasScholarship) ||
                (type === 'academicWarning' && !studentResult.hasAcademicWarning) ||
                (type === 'academicAction' && !studentResult.hasAcademicAction) ||
                (type === 'decreaseAcademicWarning' && !studentResult.decreaseAcademicWarning)
            if (skip) {
                console.log(`Skipping student ${student.id} in course ${courseId} for type ${type}`)
                return
            }
            // bỏ qua nếu đã có học bổng
            if (studentResult.scholarshipRecived.length > 0) {
                return
            }
            courseMap[courseId].students.push(studentResult)
        })
    )
    // bỏ các khóa học không có sinh viên
    for (const courseId in courseMap) {
        if (courseMap[courseId] && courseMap[courseId].students.length === 0) {
            delete courseMap[courseId]
        }
    }
    const result = sortStudentResultInfo(Object.values(courseMap))
    console.log(`Found ${result.length} courses with students for semester ${semesterId}`)
    return result.map((course) => CourseStudentResult.parse(course))
}

const checkStudentResultForRepeatGrade = async (
    studentIds: string[],
    semesterId: string
): Promise<string[]> => {
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
                        fixedClass: {
                            include: {
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
                        trainingObjectType: true,
                    },
                },
            },
            orderBy: {
                student: {
                    userProfile: {
                        firstName: 'asc',
                    },
                },
            },
        })

        if (!studentSemesterResult) {
            throw new Error(
                `Không tìm thấy kết quả học kỳ cho sinh viên trong học kỳ ${semesterId}`
            )
        }

        const scoreToRetainList = await prisma.trainingCourse.findMany({
            where: {
                id: {
                    in: studentSemesterResult.map(
                        (s) => s.student.fixedClass?.trainingCourseId || ''
                    ),
                },
                deletedAt: null,
                active: true,
            },
        })

        if (!scoreToRetainList) {
            throw new Error(
                `Không tìm thấy khóa học nào để xét điểm lưu ban cho sinh viên trong học kỳ ${semesterId}`
            )
        }

        const listStudentRepeatGrade: string[] = studentSemesterResult
            .map((result) => {
                const scoreToRetain = scoreToRetainList.find(
                    (course) => course.id === result.student.fixedClass?.trainingCourseId
                )

                if (
                    scoreToRetain &&
                    result.baseScore === 'Base10' &&
                    result.gpaBase10.toNumber() <= scoreToRetain.scoreToRetain
                ) {
                    return result.studentId
                }
                if (
                    scoreToRetain &&
                    result.baseScore === 'Base4' &&
                    result.gpaBase4.toNumber() <= scoreToRetain.scoreToRetain
                ) {
                    return result.studentId
                }
                return null // Ensure a value is always returned
            })
            .filter((id): id is string => id !== null)

        console.log('listStudentRepeatGrade', listStudentRepeatGrade)

        return listStudentRepeatGrade
    } catch (error) {
        console.error('Error fetching student result for repeat grade:', error)
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
                        fixedClass: {
                            include: {
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
                        trainingObjectType: true,
                    },
                },
            },
            orderBy: {
                student: {
                    userProfile: {
                        firstName: 'asc',
                    },
                },
            },
        })

        if (!studentSemesterResult) {
            throw new Error(
                `Không tìm thấy kết quả học kỳ cho sinh viên trong học kỳ ${semesterId}`
            )
        }

        const scoreToRetainList = await prisma.trainingCourse.findMany({
            where: {
                id: {
                    in: studentSemesterResult.map(
                        (s) => s.student.fixedClass?.trainingCourseId || ''
                    ),
                },
                deletedAt: null,
                active: true,
            },
        })

        if (!scoreToRetainList) {
            throw new Error(
                `Không tìm thấy khóa học nào để xét điểm lưu ban cho sinh viên trong học kỳ ${semesterId}`
            )
        }

        const listStudentRepeatGrade: string[] = studentSemesterResult
            .map((result) => {
                const scoreToRetain = scoreToRetainList.find(
                    (course) => course.id === result.student.fixedClass?.trainingCourseId
                )

                if (
                    scoreToRetain &&
                    result.baseScore === 'Base10' &&
                    result.gpaBase10.toNumber() <= scoreToRetain.scoreToRetain
                ) {
                    return result.studentId
                }
                if (
                    scoreToRetain &&
                    result.baseScore === 'Base4' &&
                    result.gpaBase4.toNumber() <= scoreToRetain.scoreToRetain
                ) {
                    return result.studentId
                }
                return null // Ensure a value is always returned
            })
            .filter((id): id is string => id !== null)

        console.log('listStudentRepeatGrade', listStudentRepeatGrade)

        if (listStudentRepeatGrade.length === 0) {
            console.log('No students to mark for repeat grade.')
            return []
        }

        const existingDecisions = await prisma.studentAcademicDecision.findMany({
            where: {
                studentId: { in: listStudentRepeatGrade },
                semesterId,
                actionTaken: 'REPEAT_YEAR',
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
                actionTaken: 'REPEAT_YEAR' as const,
                status: DecisionStatus.PENDING,
                reason: 'Tạo quyết định lưu ban theo yêu cầu',
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
            console.log('All students already have repeat grade decisions.')
        }
        const ListResult: StudentRepeatGrade[] = []
        for (const studentId of studentIds) {
            const newResult: StudentRepeatGrade = {
                id: studentId,
                studentName:
                    studentSemesterResult.find((result) => result.studentId === studentId)?.student
                        .userProfile.fullname || '',
                studentCode:
                    studentSemesterResult.find((result) => result.studentId === studentId)?.student
                        .userProfile.code || '',
                gpa_semester:
                    studentSemesterResult
                        .find((result) => result.studentId === studentId)
                        ?.gpaBase10.toNumber() || 0,
                gpa_academic:
                    studentSemesterResult
                        .find((result) => result.studentId === studentId)
                        ?.cumulativeGpaBase10.toNumber() || 0,
                total_credit:
                    studentSemesterResult.find((result) => result.studentId === studentId)
                        ?.totalCreditsByCurriculum || 0,
                repeatGradeTimes:
                    existingDecisions.filter((decision) => decision.studentId === studentId)
                        .length +
                    (newDecisions.some((decision) => decision.studentId === studentId) ? 1 : 0),
                statusRepeatGrade: existingStudentIds.has(studentId)
                    ? 'Đã có quyết định lưu ban'
                    : newDecisions.some((decision) => decision.studentId === studentId)
                      ? 'Chờ phê duyệt'
                      : 'Không lưu ban',
            }
            ListResult.push(newResult)
        }
        return ListResult
    } catch (error) {
        console.error('Error in SaveStudentRepeatGrade function:', error)
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
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
        console.error('Error in RepeatGrade function:', error)
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}
export type { StudentRepeatGrade }
