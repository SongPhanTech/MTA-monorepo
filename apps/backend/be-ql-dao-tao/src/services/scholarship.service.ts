import { CriteriaOperator } from '@workspace/db'
import * as XLSX from 'xlsx'
import { prisma } from '..'
import type { StudentScholarship, StudentTemplateData } from '../dto/student-info.dto'

// Lấy giá trị điểm C và D từ bảng chuyển đổi điểm ứng với từng khóa học
interface ScoreConvertResult {
    diemC: number
    diemD: number
}
const GiaTriDiemCvaD = async (trainingCourseId: string) => {
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
    // Lấy giá trị điểm C và D từ bảng chuyển đổi điểms
    const diemCObj = DsDiemChuyenDoi.find(
        (item: { trainingCourseId: string; letter: string }) =>
            item.trainingCourseId === trainingCourseId && item.letter === 'C'
    )
    const diemDObj = DsDiemChuyenDoi.find(
        (item: { trainingCourseId: string; letter: string }) =>
            item.trainingCourseId === trainingCourseId && item.letter === 'D'
    )
    return {
        diemC: diemCObj ? diemCObj.base4 : 0,
        diemD: diemDObj ? diemDObj.base4 : 0,
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

const ThongTinDiem = async (studentId: string, trainingCourseId: string, semesterId: string) => {
    try {
        const DsDiem = await prisma.studentSubjectScore.findMany({
            where: {
                subjectClass: {
                    semesterId,
                },
                studentId,
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

        const giaTriCD = await GiaTriDiemCvaD(trainingCourseId, DsDiemChuyenDoi)

        // Kiểm tra xem có điểm nào dưới D không
        const hasDiemDuoiD = DsDiem.some((item) => {
            const diemHe10 = item.manualFinalScore ? item.manualFinalScore : item.finalScore
            if (diemHe10 === null || diemHe10 === undefined) {
                return false // Bỏ qua nếu điểm không hợp lệ
            }
            return diemHe10 < giaTriCD.diemD // Kiểm tra điểm dưới D
        })
        console.log('Có điểm dưới D:', hasDiemDuoiD)

        // Kiểm tra xem có điểm nào dưới C không
        const hasDiemDuoiC = DsDiem.some((item) => {
            const monTotNghiep = item.subjectVersion?.trainingBlocks.some(
                (block) => block.graduation
            )
            if (monTotNghiep) {
                const diemHe10 = item.manualFinalScore ? item.manualFinalScore : item.finalScore
                if (diemHe10 === null || diemHe10 === undefined) {
                    return false // Bỏ qua nếu điểm không hợp lệ
                }
                return diemHe10 < giaTriCD.diemC // Kiểm tra điểm dưới C
            }
            return false // Bỏ qua nếu không phải môn tốt nghiệp
        })

        const DsDiemHe4: number[] = []
        let TongTinChiDangKy = 0
        DsDiem.forEach((item) => {
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
            DsDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
        })

        if (TongTinChiDangKy === 0) {
            // console.log('Không có tín chỉ nào, không thể tính điểm trung bình hệ 4')
            throw new Error('Không có tín chỉ nào để tính điểm trung bình hệ 4')
        }

        // Tính điểm trung bình hệ 4
        const diemTrungBinh4 =
            DsDiemHe4.reduce((sum, diem) => sum + diem, 0) / TongTinChiDangKy || 0

        return {
            diemTrungBinh4,
            xepLoaiHocTap: phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId, DsDiemChuyenDoi),
            fullDiemD: !hasDiemDuoiD,
            fullDiemC: !hasDiemDuoiC,
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin điểm:', error)
        return {
            diemTrungBinh4: 0,
            xepLoaiHocTap: 'Lỗi khi tính điểm',
            tongTinChiDangKy: 0,
            fullDiemD: false,
            fullDiemC: false,
        }
    } finally {
        await prisma.$disconnect()
        console.log('Đã hoàn thành việc lấy thông tin điểm cho sinh viên:', studentId)
    }
}

const ThongTinHocKy = async (
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
                semesterType: { in: ['FIRST', 'SECOND'] },
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
        const DsCacMonDaHoc = await prisma.studentSubjectScore.findMany({
            where: {
                studentId,
                status: 'Passed', // Chỉ lấy các môn đã hoàn thành
            },
            select: {
                subjectVersionId: true,
                subjectVersion: {
                    select: {
                        credit: true, // Số tín chỉ của môn học
                    },
                },
            },
            distinct: ['subjectVersionId'], // Tránh trùng lặp môn học
        })

        const TongTinChiDaTichLuy = DsCacMonDaHoc.reduce((tong, item) => {
            return tong + (item.subjectVersion?.credit || 0)
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

        // Kỳ lớn nhất của CTDT
        // Tìm kỳ dự kiến lớn nhất trong CTDT
        const maxSemester = Math.max(
            0,
            ...MonHocYeuCau.flatMap((item) => item.subjects.map((mon) => mon.semester ?? 0))
        )
        return {
            kyDangHoc: kyDangHoc,
            kyCuoi: kyDangHoc === maxSemester,
            TongTinChiDaTichLuy: TongTinChiDaTichLuy,
            TongTinChiYeuCau: TongTinChiYeuCau,
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin học kỳ:', error)
        return {
            kyDangHoc: 0,
            kyCuoi: false,
            TongTinChiDaTichLuy: 0,
            TongTinChiYeuCau: 0,
        }
    } finally {
        await prisma.$disconnect()
        console.log('Đã hoàn thành việc lấy thông tin học kỳ cho sinh viên:', studentId)
    }
}

export const listStudentInfo = async (semesterId: string) => {
    const DsHocVien = await prisma.studentSemesterResult.findMany({
        where: {
            semesterId,
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
                                            trainingMajor: true,
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

    const studentsInfo: StudentScholarship[] = await Promise.all(
        DsHocVien.map(async (item) => {
            const userProfile = item.student.userProfile
            const trainingCourseId = item.student.fixedClass?.trainingCourse?.id || ''
            const giaTriCD = await GiaTriDiemCvaD(trainingCourseId)

            return {
                stt: 0,
                id: userProfile?.id ?? '',
                hoTen: `${userProfile?.lastName ?? ''} ${userProfile?.firstName ?? ''}`.trim(),
                maSinhVien: userProfile?.code || '',
                doiTuong: item.student.trainingObjectType?.name || '',
                khoa: item.student.fixedClass?.trainingCourse?.name || '',
                chuyenNganh:
                    item.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                    '',
                ngaySinh: userProfile?.dateOfBirth
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                    : '',
                fullDiemD: item.lowestFinalScore >= giaTriCD.diemD,
                fullDiemC: (item.lowestGraduationScore ?? 4) >= giaTriCD.diemC,
                diemTrungBinh4: DiemSinhVien?.diemTrungBinh4 || 0,
                diemTrungBinh10: 0,
                xepLoaiHocTap: DiemSinhVien?.xepLoaiHocTap || '',
                soTinChiTichLuy: ThongTinHocKySinhVien?.TongTinChiDaTichLuy || 0,
                soTinChiNo: 0,
                soTinChiDangKy: DiemSinhVien?.tongTinChiDangKy || 0,
                xepLoaiRenLuyen: diemRenLuyen?.trainingType || '',
                diemRenLuyen: diemRenLuyen?.scoreAvg || 0,
                soLanViPham: 0,
                biKyLuat: false,
                queQuan: userProfile?.homeTown || '',
                soTinChiYeuCau: ThongTinHocKySinhVien?.TongTinChiYeuCau || 0,
                trinhDoNgoaiNgu: false,
                trinhDoTinHoc: false,
                kyDangHoc: ThongTinHocKySinhVien.kyDangHoc || 0,
                kyCuoi: ThongTinHocKySinhVien.kyCuoi || false,
                chucVuHocVien: 'Không', // Chức vụ học viên
                quocTich: 'Việt Nam', // Quốc tịch
                duDieuKienHocBong: true, // Điều kiện học bổng
                ghiChu: '', // Ghi chú,
                diemThuong: 0, // Điểm thưởng
                userProfile: userProfile, // Thông tin người dùng
            }
        })
    )

    return studentsInfo
}

export const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export const populateExcelTemplate = (
    templateBuffer: Buffer,
    templateData: StudentTemplateData
): Buffer => {
    // Read the template
    const workbook = XLSX.read(templateBuffer, {
        type: 'buffer',
        cellStyles: true,
    })
    const worksheetName = workbook.SheetNames[0] // Use first worksheet
    if (!worksheetName) {
        throw new Error('No worksheet found in the template.')
    }
    const worksheet = workbook.Sheets[worksheetName]

    if (!worksheet) {
        throw new Error('No valid worksheet found in the template.')
    }
    const startRow = 2

    // Write student data
    templateData.student.forEach((student, index) => {
        const row = startRow + index
        const cells = [
            { t: 'n', v: student.stt }, // A
            { t: 's', v: student.hoTen }, // B
            { t: 's', v: student.maSinhVien }, // C
            { t: 's', v: student.doiTuong || 'Chưa có dữ liệu' }, // D
            { t: 's', v: student.chuyenNganh || 'Chưa có dữ liệu' }, // E
            { t: 's', v: student.khoa || 'Chưa có dữ liệu' }, // F
            { t: 'n', v: student.diemTrungBinh4 }, // G
            { t: 's', v: student.xepLoaiHocTap || 0 }, // H
            { t: 'n', v: student.diemRenLuyen }, // I
            { t: 's', v: student.xepLoaiRenLuyen || 'Chưa có dữ liệu' }, // J
            { t: 'n', v: student.kyDangHoc }, // K
            { t: 'b', v: student.kyCuoi || false }, // L
            { t: 'n', v: student.soTinChiTichLuy || 0 }, // M
            { t: 'n', v: student.soTinChiYeuCau || 0 }, // N
            { t: 'b', v: student.biKyLuat || false }, // O TODO: Chưa có dữ liệu
            { t: 'b', v: student.trinhDoNgoaiNgu || true }, // P TODO: Chưa có dữ liệu
            { t: 'b', v: student.fullDiemD || true }, // Q TODO: Chưa có dữ liệu
            { t: 'b', v: student.fullDiemC || true }, // R TODO: Chưa có dữ liệu
            { t: 's', v: student.chucVuHocVien || true }, // S TODO: Chưa có dữ liệu
            { t: 'n', v: student.diemThuong || 0 }, // T TODO: Chưa có dữ liệu
            { t: 'b', v: student.duDieuKienHocBong || true }, // U TODO: Chưa có dữ liệu
            { t: 's', v: student.ghiChu || '' }, // V TODO
            { t: 's', v: student.quocTich || 'Việt Nam' }, // W TODO: Chưa có dữ liệu
        ]

        cells.forEach((cell, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: colIndex })
            worksheet[cellRef] = cell
        })
    })

    // Update worksheet range to include new data
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    range.e.r = Math.max(range.e.r, startRow + templateData.student.length - 1)
    // range.e.c = Math.max(range.e.c, headers.length - 1)
    worksheet['!ref'] = XLSX.utils.encode_range(range)

    // Write buffer
    return XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
        cellStyles: true,
    })
}

const checkEligible = (
    studentValue: any,
    criteriaValue: any,
    operator: CriteriaOperator
): boolean => {
    switch (operator) {
        case CriteriaOperator.EQ:
            return studentValue === criteriaValue
        case CriteriaOperator.GTE:
            return studentValue >= criteriaValue
        case CriteriaOperator.LTE:
            return studentValue <= criteriaValue
        default:
            console.warn(`Unknown operator: ${operator}`)
            return false // Mặc định là không đủ điều kiện nếu không nhận diện được toán tử
    }
}

// Lọc danh sách sinh viên đủ điều kiện học bổng
export const checkScholarshipEligibility = async (
    students: StudentScholarship[],
    scholarshipId: string
): Promise<StudentScholarship[]> => {
    // Lấy thông tin tiêu chí học bổng
    const scholarshipCriteriaList = await prisma.scholarshipCriteria.findMany({
        where: { scholarshipId: scholarshipId },
    })

    return students.filter((student) => {
        // Kiểm tra điều kiện học bổng
        const isEligible = scholarshipCriteriaList.every((criteria) => {
            switch (criteria.field) {
                // case "TOTAL_CREDITS": // Tổng số tín chỉ học tập trong học kỳ
                // 	return checkEligible(
                // 		student.soTinChiTichLuy,
                // 		criteria.value,
                // 		criteria.operator,
                // 	);
                // case "REGISTERED_CREDITS": // Số tín chỉ đăng ký trong học kỳ
                // 	return student.soTinChiTichLuy <= criteria.value;
                // case "ACCUMULATED_CREDITS_PERCENT": // % tín chỉ tích lũy so với kế hoạch
                // 	return !student.biKyLuat;
                // case "COURSE_GRADE_MIN": // Điểm thấp nhất trong các học phần
                // 	return student.xepLoaiRenLuyen === criteria.value;
                // case "SEMESTER_GPA": // Điểm trung bình học ksỳ
                // 	return student.diemRenLuyen >= criteria.value;
                // case "ENTRY_SCORE": // Điểm thi đầu vào (cho học viên mới)
                // 	return student.diemRenLuyen <= criteria.value;
                // case "CONDUCT": // Mức rèn luyện
                // 	return student.diemRenLuyen >= criteria.value;
                // case "FOREIGN_LANGUAGE": // Đạt chuẩn đầu ra ngoại ngữ (boolean)
                // 	return student.trinhDoNgoaiNgu;
                default:
                    return true // Mặc định là đủ điều kiện nếu không có tiêu chí
            }
        })
        return isEligible
    })
}
