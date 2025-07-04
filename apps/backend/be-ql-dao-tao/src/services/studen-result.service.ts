import {
    AcademicRankingBaseType,
    SemesterType,
    type StudentSemesterResult,
    StudentStatus,
    StudentTrainingType,
    SubjectClassStudentStatus,
} from '@workspace/db'
import { prisma } from '..'

const checkStudentSemesterResult = async (
    semesterId: string,
    studentId: string
): Promise<boolean> => {
    const result = await prisma.studentSemesterResult.findFirst({
        where: {
            semesterId,
            studentId,
        },
    })
    return !!result
}

// #region ThongTinTichLuy
const ThongTinTichLuy = async (
    studentId: string,
    trainingCourseId: string,
    semesterStartDate: Date
) => {
    try {
        // Học kỳ bắt đầu của sinh viên (căn cứ theo khóa)
        const hocKyBatDau = await prisma.trainingCourse.findFirst({
            where: {
                id: trainingCourseId,
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
            where: { id: hocKyBatDau?.semesterStartId },
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

        // Kiểm tra tổng tích lũy tín chỉ của sinh viên đến kỳ xác định
        const DsCacMonDaHocRaw = await prisma.studentSubjectScore.findMany({
            where: {
                studentId,
            },
            select: {
                subjectVersionId: true,
                status: true, // Thông tin qua môn
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
            },
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
            },
            select: {
                trainingCourseId: true,
                letter: true,
                base10Min: true,
                base10Max: true,
                base4: true,
                classification: true,
            },
        })
        const DSDiemHe4: number[] = []
        const DSDiemHe10: number[] = []
        let TongTinChiDangKy = 0
        DsCacMonDaHocRaw.forEach((item) => {
            if (item.subjectVersion?.trainingBlocks.some((block) => !block.useForFinalScore)) {
                return // Bỏ qua nếu môn không tính điểm
            }

            const diemHe10 = item.manualFinalScore ? item.manualFinalScore : item.finalScore
            if (diemHe10 === null || diemHe10 === undefined) {
                return // Bỏ qua nếu điểm không hợp lệ
            }

            const soTinChi = item.subjectVersion?.credit || 0 // Số tín chỉ của môn học
            TongTinChiDangKy += soTinChi // Cộng dồn số tín chỉ
            const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, DsDiemChuyenDoi)
            DSDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
            DSDiemHe10.push(diemHe10 * soTinChi) // Nhân điểm hệ 10 với số tín chỉ
        })

        // GPA hệ 4
        const diemTrungBinh4 =
            Math.round(
                (DSDiemHe4.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100
        // Tính điểm trung bình hệ 10 trong kỳ
        const diemTrungBinh10 =
            Math.round(
                (DSDiemHe10.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0) * 100
            ) / 100

        // Số tín chỉ nợ tích lũy
        const TongTinChiNoTichLuy = DsCacMonDaHocRaw.reduce((tong, item) => {
            if (item.status === SubjectClassStudentStatus.NotPassed) {
                return tong + (item.subjectVersion?.credit || 0)
            }
            return tong // Bỏ qua nếu môn đã qua
        }, 0)

        // Kiểm tra tổng số tích lũy yêu cầu đến kỳ hiện tại
        const phienBanCTDT = await prisma.student.findFirst({
            where: {
                id: studentId,
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

        const TongTinChiYeuCau = MonHocYeuCau.reduce((tong, item) => {
            if (
                item.subjects
                    .map((subject) => subject.semester)
                    .some((semester) => (semester ?? 0) >= kyDangHoc)
            ) {
                return tong // Bỏ qua nếu môn học chưa đến kỳ hiện tại
            }
            return (
                tong +
                item.subjects.reduce((tongMon, mon) => {
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
            tongTinChiDaTichLuy: TongTinChiDangKy,
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

    if (!diemHe4) return 0
    // Lấy classification của điểm nhỏ hơn hoặc bằng gần nhất đối với diemHe4
    const sorted = scoreConvert
        .filter((item) => item.trainingCourseId === trainingCourseId && item.base4 <= diemHe4.base4)
        .sort((a, b) => b.base4 - a.base4)
    const closest = sorted[0]
    const classification = closest ? closest.classification : ''
    return diemHe4 ? diemHe4.base4 : 0
}

const phanLoaiDiemHe4 = (
    diemHe4: number,
    trainingCourseId: string,
    scoreConvert: ScoreConvertItem[]
): string => {
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
}

const ThongTinDiemHocKy = async (
    studentId: string,
    trainingCourseId: string,
    semesterId: string,
    baseType: AcademicRankingBaseType
) => {
    try {
        const DsDiem = await prisma.studentSubjectScore.findMany({
            where: {
                subjectClass: {
                    semesterId,
                },
                studentId,
                status: {
                    in: [SubjectClassStudentStatus.Passed, SubjectClassStudentStatus.NotPassed],
                },
            },
            select: {
                id: true,
                finalScore: true,
                status: true, // Thông tin qua môn
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
            },
        })

        // Danh sách chuyển đổi
        const DsDiemChuyenDoi = await prisma.scoreConvert.findMany({
            where: {
                trainingCourseId,
            },
            select: {
                trainingCourseId: true,
                letter: true,
                base10Min: true,
                base10Max: true,
                base4: true,
                classification: true,
            },
        })

        // Tính điểm trung bình của sinh viên
        console.log('Điểm của sinh viên:', studentId, DsDiem)

        const DsDiemHe4: number[] = []
        const DSDiemHe10: number[] = []
        let TongTinChiDangKy = 0
        let diemHe10ThapNhat = 0
        DsDiem.forEach((item) => {
            if (item.subjectVersion?.trainingBlocks.some((block) => !block.useForFinalScore)) {
                return // Bỏ qua nếu môn không tính điểm
            }
            const diemHe10 = item.manualFinalScore ? item.manualFinalScore : item.finalScore
            if (diemHe10 === null || diemHe10 === undefined) {
                return // Bỏ qua nếu điểm không hợp lệ
            }
            if (diemHe10 < diemHe10ThapNhat || diemHe10ThapNhat === 0) {
                diemHe10ThapNhat = diemHe10 // Cập nhật điểm thấp nhất
            }

            const soTinChi = item.subjectVersion?.credit || 0 // Số tín chỉ của môn học
            TongTinChiDangKy += soTinChi // Cộng dồn số tín chỉ
            const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, DsDiemChuyenDoi)
            DsDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
            DSDiemHe10.push(diemHe10 * soTinChi) // Nhân điểm hệ 10 với số tín chỉ
        })

        if (TongTinChiDangKy === 0) {
            // console.log('Không có tín chỉ nào, không thể tính điểm trung bình hệ 4')
            throw new Error('Không có tín chỉ nào để tính điểm trung bình hệ 4')
        }

        // Số tín chỉ đạt trong kỳ
        const soTinChiDat = DsDiem.filter((item) => {
            return item.status === SubjectClassStudentStatus.Passed
        }).length
        const soTinChiKhongDat = DsDiem.filter((item) => {
            return item.status === SubjectClassStudentStatus.NotPassed
        }).length

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

        // Điểm thấp nhất
        let diemThapNhat = Math.min(...DsDiemHe4) || 0
        if (baseType === AcademicRankingBaseType.Base10) {
            diemThapNhat = diemHe10ThapNhat // Nếu là hệ 10, lấy điểm thấp nhất hệ 10
        }
        return {
            diemTrungBinh4TrongKy: diemTrungBinh4,
            diemTrungBinh10TrongKy: diemTrungBinh10,
            tongTinChiDangKy: TongTinChiDangKy,
            xepLoaiHocTap: phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId, DsDiemChuyenDoi),
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

// Main function
export const calculateStudentSemesterResult = async (semesterId: string): Promise<string> => {
    const results: StudentSemesterResult[] = []

    try {
        // Thông tin học kỳ
        const hocKyDauVao = await prisma.semester.findUnique({
            where: { id: semesterId },
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
                subjectClassStudent: {
                    some: {
                        subjectClass: {
                            semesterId: semesterId, // Lớp môn học trong học kỳ này
                        },
                    },
                },
                // id: "cmc8rjif40002o00197ct07wy"
            },
            include: {
                fixedClass: {
                    select: {
                        id: true,
                        trainingCourseId: true, // Lấy ID khóa học
                    },
                },
                trainingObjectType: {
                    select: {
                        id: true,
                        name: true, // Lấy tên đối tượng đào tạo
                        code: true, // Lấy mã đối tượng đào tạo
                        baseScore: true, // Lấy điểm chuẩn của đối tượng đào tạo
                    },
                },

                subjectClassStudent: {
                    select: {
                        id: true,
                        status: true, // Lấy trạng thái của sinh viên trong lớp môn học
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
            const exists = await checkStudentSemesterResult(semesterId, student.id)

            // lấy khóa học
            const trainingCourseId = student.fixedClass?.trainingCourseId
            if (!trainingCourseId) {
                throw new Error(`Không tìm thấy khóa học cho sinh viên ${student.id}`)
            }

            // Lấy thông tin tích lũy của sinh viên
            const thongTinTichLuy = await ThongTinTichLuy(
                student.id,
                trainingCourseId,
                hocKyDauVao?.startDate || new Date() // Sử dụng ngày bắt đầu học
            )
            if (!thongTinTichLuy) {
                throw new Error(`Không tìm thấy thông tin học kỳ cho sinh viên ${student.id}`)
            }

            // Lấy thông tin điểm học viên
            const baseType = student.trainingObjectType?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là Base10 nếu không có thông tin

            // Lấy thông tin điểm học kỳ
            const thongTinDiemHocKy = await ThongTinDiemHocKy(
                student.id,
                trainingCourseId,
                semesterId,
                baseType
            )
            if (!thongTinDiemHocKy) {
                console.error(`Không tìm thấy thông tin điểm học kỳ cho sinh viên ${student.id}`)
                return
            }
            console.log('có thông tin điểm của học viên: ', student.id, exists)
            if (!exists) {
                // Nếu không có kết quả, tạo mới
                const newResult: StudentSemesterResult = {
                    id: crypto.randomUUID(), // Tạo ID ngẫu nhiên
                    studentId: student.id,
                    semesterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    studyYear: Math.floor(thongTinTichLuy.kyDangHoc / 2), // năm học thứ mấy
                    semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
                    isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

                    baseScore:
                        student.trainingObjectType?.baseScore || AcademicRankingBaseType.Base10, // Lấy baseScore từ đối tượng đào tạo, nếu không có thì mặc định là Base4
                    gpaBase4: thongTinDiemHocKy.diemTrungBinh4TrongKy,
                    gpaBase10: thongTinDiemHocKy.diemTrungBinh10TrongKy,
                    cumulativeGpaBase4: thongTinTichLuy.diemTrungBinh4TichLuy,
                    cumulativeGpaBase10: thongTinTichLuy.diemTrungBinh10TichLuy,

                    lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
                    //TODO: Chưa cập nhật
                    lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
                    totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ

                    registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ

                    //TODO: Chưa biết xác định thi lại ntn
                    retakingCredits: 0, // Số tín chỉ phải thi lại (hiện tại chưa có thông tin này)
                    passedCredits: thongTinDiemHocKy.soTinChiDat,
                    failedCredits: thongTinDiemHocKy.soTinChiKhongDat,

                    accumulatedCredits: thongTinTichLuy.tongTinChiDaTichLuy, // Số tín chỉ đã tích lũy
                    totalCreditsByCurriculum: thongTinTichLuy.tongTinChiYeuCauDenThoiDiemHienTai, // Số tín chỉ yêu cầu theo CTDT
                    totalFailedCredits: thongTinTichLuy.tongTinChiNoTichLuy, // Số tín chỉ nợ tích lũy
                    studentTrainingType: StudentTrainingType.GOOD,
                    //TODO: Chưa có thông tin này
                    foreignLangPass: true, // Đạt trình độ ngoại nsgữ theo quy định
                    isClassMonitor: false, // Chức vụ học viên (hiện tại chưa có thông tin này)
                    isUnionLeader: false, // Chức vụ đoàn viên (hiện tại chưa có thông tin này)
                    entryScore: null, // Điểm đầu vào (hiện tại chưa có thông tin này)
                    isImproving: false, // Đang cải thiện (hiện tại chưa có thông tin này)
                    postponeWithReason: false, // tạm ngưng có lý do
                    academicWarningLevel: 0, // mức cảnh cáo học tập
                    disciplinaryWarningLevel: 0, // mức cảnh cáo học đường
                    suspended: false, // đình chỉ học
                    expelled: false, // đuổi học
                    code: null,
                    active: true,
                    description: null,
                    deletedAt: null,
                }
                // Lưu kết quả học kỳ mới
                results.push(newResult)
                console.log(`Tạo mới kết quả học kỳ cho sinh viên ${student.id}`)
                console.log('Kết quả:', newResult)
                await prisma.studentSemesterResult.create({
                    data: newResult,
                })
            } else {
                // Cập nhật kết quả học kỳ nếu đã tồn tại
                const existingResult = await prisma.studentSemesterResult.findFirst({
                    where: {
                        studentId: student.id,
                        semesterId,
                    },
                })
                if (!existingResult) {
                    console.error(
                        `Không tìm thấy kết quả học kỳ để cập nhật cho sinh viên ${student.id}`
                    )
                    return
                }
                const updatedResult: StudentSemesterResult = {
                    id: existingResult.id, // Giữ nguyên ID để cập nhật
                    studentId: student.id,
                    semesterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    studyYear: Math.floor(thongTinTichLuy.kyDangHoc / 2), // năm học thứ mấy
                    semesterIndexInCourse: thongTinTichLuy.kyDangHoc, // Kỳ đang học
                    isLastSemester: thongTinTichLuy.kyCuoi, // Kỳ cuối hay không

                    baseScore:
                        student.trainingObjectType?.baseScore || AcademicRankingBaseType.Base10,
                    gpaBase4: thongTinDiemHocKy.diemTrungBinh4TrongKy,
                    gpaBase10: thongTinDiemHocKy.diemTrungBinh10TrongKy,
                    cumulativeGpaBase4: thongTinTichLuy.diemTrungBinh4TichLuy,
                    cumulativeGpaBase10: thongTinTichLuy.diemTrungBinh10TichLuy,

                    lowestFinalScore: thongTinDiemHocKy.diemThapNhat,
                    //TODO: Chưa cập nhật
                    lowestGraduationScore: thongTinDiemHocKy.diemThapNhat,
                    totalCredits: thongTinTichLuy.tongTinChiMoTrongKy, // Tổng số tín chỉ mở trong kỳ

                    registeredCredits: thongTinDiemHocKy.tongTinChiDangKy, // Số tín chỉ đăng ký trong học kỳ
                    studentTrainingType: StudentTrainingType.AVERAGE, // xếp loại rèn luyện

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
                    code: existingResult?.code || null,
                    active: existingResult?.active || true, // Trạng thái hoạt động
                    description: existingResult?.description || null,
                    deletedAt: existingResult?.deletedAt || null,
                }
                // Cập nhật kết quả học kỳ
                results.push(updatedResult)
                console.log(`Cập nhật kết quả học kỳ cho sinh viên ${student.id}`)
                console.log('Kết quả:', updatedResult)
                await prisma.studentSemesterResult.update({
                    where: {
                        id: existingResult.id,
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
