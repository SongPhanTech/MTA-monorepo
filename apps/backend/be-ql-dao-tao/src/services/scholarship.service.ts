import * as XLSX from 'xlsx'
import { prisma } from '..'
import type { StudentScholarship, StudentTemplateData } from '../dto/student-info.dto'

// Lấy giá trị điểm C và D từ bảng chuyển đổi điểm ứng với từng khóa học
interface ScoreConvertResult {
    diemC: number
    diemD: number
}
const GiaTriDiemCvaD = async (trainingCourseId: string, scoreConvert: ScoreConvertItem[]) => {
    // Lấy giá trị điểm C và D từ bảng chuyển đổi điểm
    const diemCObj = scoreConvert.find(
        (item: { trainingCourseId: string; letter: string }) =>
            item.trainingCourseId === trainingCourseId && item.letter === 'C'
    )
    const diemDObj = scoreConvert.find(
        (item: { trainingCourseId: string; letter: string }) =>
            item.trainingCourseId === trainingCourseId && item.letter === 'D'
    )

    return {
        diemC: diemCObj ? diemCObj.base10Min : 0,
        diemD: diemDObj ? diemDObj.base10Min : 0,
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
    const DsDiem = await prisma.studentSubjectScore.findMany({
        where: {
            subjectClass: {
                semesterId,
            },
            studentId,
            subjectVersion: {
                trainingBlocks: {
                    some: {
                        // Chỉ lấy các môn có tính điểm
                        print: true,
                        useForFinalScore: true,
                    },
                },
            },
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
                            graduation: true, // Lấy thông tin in ấn của môn học
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
        const monTotNghiep = item.subjectVersion?.trainingBlocks.some((block) => block.graduation)
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
    let TongTinChi = 0
    DsDiem.forEach((item) => {
        const diemHe10 = item.manualFinalScore ? item.manualFinalScore : item.finalScore
        if (diemHe10 === null || diemHe10 === undefined) {
            return // Bỏ qua nếu điểm không hợp lệ
        }
        const soTinChi = item.subjectVersion?.credit || 0 // Số tín chỉ của môn học
        TongTinChi += soTinChi // Cộng dồn số tín chỉ
        const diemHe4 = layGiaTriDiem4(diemHe10, trainingCourseId, DsDiemChuyenDoi)
        DsDiemHe4.push(diemHe4 * soTinChi) // Nhân điểm hệ 4 với số tín chỉ
    })

    console.log('Điểm hệ 4 của sinh viên:', studentId, DsDiemHe4)

    if (TongTinChi === 0) {
        console.log('Không có tín chỉ nào, không thể tính điểm trung bình hệ 4')
        return {
            diemTrungBinh4: 0,
            xepLoaiHocTap: 'Chưa đủ dữ liệu để tính điểm trung bình',
            fullDiemD: !hasDiemDuoiD,
            fullDiemC: !hasDiemDuoiC,
        }
    }

    // Tính điểm trung bình hệ 4
    const diemTrungBinh4 = DsDiemHe4.reduce((sum, diem) => sum + diem, 0) / TongTinChi || 0
    console.log(
        'Điểm trung bình hệ 4 của sinh viên:',
        studentId,
        diemTrungBinh4,
        'Xếp loại :',
        phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId, DsDiemChuyenDoi)
    )
    return {
        diemTrungBinh4,
        xepLoaiHocTap: phanLoaiDiemHe4(diemTrungBinh4, trainingCourseId, DsDiemChuyenDoi),
        fullDiemD: !hasDiemDuoiD,
        fullDiemC: !hasDiemDuoiC,
    }
}

const ThongTinHocKy = async (
    studentId: string,
    trainingCourseId: string,
    semesterStartDate: any
) => {
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
        return {
            kyDangHoc: 0,
            kyCuoi: false,
            TongTinChiDaTichLuy: 0,
        }
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
        return {
            kyDangHoc: 0,
            kyCuoi: false,
            TongTinChiDaTichLuy: 0,
        }
    }

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
    // TODO

    return {
        kyDangHoc: DsHocKy.length,
        kyCuoi: false,
        TongTinChiDaTichLuy: TongTinChiDaTichLuy,
    }
}

export const listStudentInfo = async (semesterId: string) => {
    // Lấy thông tin học kỳ
    const hocKy = await prisma.semester.findUnique({
        where: { id: semesterId },
        select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
        },
    })
    // Lấy danh sách sinh viên học tại học kỳ đầu vào

    // lấy danh sách lớp môn học mở tại học kỳ
    const DsLopMonHoc = await prisma.subjectClass.findMany({
        where: {
            semesterId,
        },
    })

    // lấy danh sách học viên trong các lớp môn học

    const DsHocVien = await prisma.studentSubjectScore.findMany({
        where: {
            subjectClassId: {
                in: DsLopMonHoc.map((item) => item.id),
            },
            // studentId: 'cmc8rjif40002o00197ct07wz'
        },
        distinct: ['studentId'],
        include: {
            student: {
                include: {
                    userProfile: true,
                    trainingObjectType: true,
                    fixedClass: {
                        include: {
                            trainingCourse: {
                                include: {
                                    semesterStart: true, // Lấy thông tin kỳ bắt đầu
                                },
                            },
                            curriculumVersion: {
                                include: {
                                    curriculum: {
                                        include: {
                                            trainingMajor: true, // Lấy thông tin chuyên ngành
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

    // Thông tin điểm rèn luyện của sinh viên
    const DsDiemRenLuyen = await prisma.studentTrainingSemester.findMany({
        where: {
            semesterId,
        },
        select: {
            studentId: true,
            scoreAvg: true,
            trainingType: true,
        },
    })

    const studentsInfo: StudentScholarship[] = await Promise.all(
        DsHocVien.map(async ({ student }, idx) => {
            const userProfile = student.userProfile
            const DiemSinhVien = await ThongTinDiem(
                student.id,
                student.fixedClass?.trainingCourseId || '',
                semesterId
            )
            const ThongTinHocKySinhVien = await ThongTinHocKy(
                student.id,
                student.fixedClass?.trainingCourseId || '',
                hocKy?.startDate || new Date()
            )
            const diemRenLuyen = DsDiemRenLuyen.find((item) => item.studentId === student.id) || {
                scoreAvg: 0,
                trainingType: '',
            }
            return {
                stt: idx + 1,
                id: userProfile?.id ?? '',
                hoTen: `${userProfile?.lastName ?? ''} ${userProfile?.firstName ?? ''}`.trim(),
                maSinhVien: userProfile?.code || '',
                doiTuong: student.trainingObjectType?.name || '',
                khoa: student.fixedClass?.trainingCourse?.name || '',
                chuyenNganh:
                    student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || '',
                ngaySinh: userProfile?.dateOfBirth
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                    : '',
                fullDiemD: DiemSinhVien?.fullDiemD || false,
                fullDiemC: DiemSinhVien?.fullDiemC || false,
                diemTrungBinh4: DiemSinhVien?.diemTrungBinh4 || 0,
                diemTrungBinh10: 0,
                xepLoaiHocTap: DiemSinhVien?.xepLoaiHocTap || '',
                soTinChiTichLuy: ThongTinHocKySinhVien?.TongTinChiDaTichLuy || 0,
                soTinChiNo: 0,
                xepLoaiRenLuyen: diemRenLuyen?.trainingType || '',
                diemRenLuyen: diemRenLuyen?.scoreAvg || 0,
                soLanViPham: 0,
                biKyLuat: false,
                queQuan: userProfile?.homeTown || '',
                soTinChiYeuCau: 0,
                trinhDoNgoaiNgu: false,
                trinhDoTinHoc: false,
                kyDangHoc: ThongTinHocKySinhVien.kyDangHoc || 0,
                kyCuoi: ThongTinHocKySinhVien.kyCuoi || false,
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
    const workbook = XLSX.read(templateBuffer, { type: 'buffer', cellStyles: true })
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
            { t: 's', v: student.kyCuoi ? 'Có' : 'Không' }, // L TODO: Chưa xử lý
            { t: 'n', v: student.soTinChiTichLuy || 0 }, // I
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
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer', cellStyles: true })
}
