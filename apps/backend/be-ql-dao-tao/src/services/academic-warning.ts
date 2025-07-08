import { AcademicRankingBaseType, CriteriaField, CriteriaOperator } from '@workspace/db'
import * as XLSX from 'xlsx'
import { prisma } from '..'
import {
    CourseStudentAcademicWarning,
    type StudentAcademicWarning,
    type StudentTemplateData,
} from '../dto/student-info.dto'

// Lấy giá trị điểm C và D từ bảng chuyển đổi điểm ứng với từng khóa học
interface ScoreConvertResult {
    diemC: number
    diemD: number
}
const GiaTriDiemCvaD = async (trainingCourseId: string, scoreConvert: ScoreConvertItem[]) => {
    // Lấy giá trị điểm C và D từ bảng chuyển đổi điểms
    const diemCObj = scoreConvert.find(
        (item: { trainingCourseId: string; letter: string }) =>
            item.trainingCourseId === trainingCourseId && item.letter === 'C'
    )
    const diemDObj = scoreConvert.find(
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

const phanLoaiDiemHe4 = async (diemHe4: number, trainingCourseId: string): Promise<string> => {
    try {
        const scoreConvert = await prisma.scoreConvert.findMany({
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
    } finally {
        // Đóng kết nối Prisma nếu cần thiết
        await prisma.$disconnect()
    }
}

const phanLoaiDiemHe10 = async (diemHe10: number, trainingCourseId: string): Promise<string> => {
    try {
        const scoreConvert = await prisma.scoreConvert.findMany({
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
    } finally {
        // Đóng kết nối Prisma nếu cần thiết
        await prisma.$disconnect()
    }
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
const checkStudentEligible = async (
    student: StudentAcademicWarning,
    trainingCourseId: string
): Promise<boolean> => {
    try {
        // Lấy thông tin tiêu chí học bổng
        const warningCriteriaList = await prisma.academicWarningRule.findMany({
            where: {
                trainingCourseId: trainingCourseId,
                OR: [
                    { semesterCondition: student.kyDangHoc },
                    { semesterCondition: null },
                    { yearCondition: student.namDangHoc },
                    { yearCondition: null },
                ],
            },
        })
        console.log('Warning Criteria List:', warningCriteriaList)
        const isEligible = warningCriteriaList.every((criteria) => {
            switch (criteria.field) {
                case CriteriaField.SEMESTER_PASSED_CREDITS: // Tổng số tín chỉ học tập trong học kỳ
                    console.log(
                        'Total Credits: ',
                        student.soTinChiDangKy,
                        criteria.threshold,
                        criteria.operator
                    )
                    return checkEligible(
                        student.soTinChiDangKy,
                        criteria.threshold,
                        criteria.operator
                    )
                case CriteriaField.SEMESTER_REGISTERED_CREDITS: // Số tín chỉ đăng ký trong học kỳ
                    console.log(
                        'Registered Credits: ',
                        student.soTinChiDangKy,
                        criteria.threshold,
                        criteria.operator
                    )
                    return checkEligible(
                        student.soTinChiDangKy,
                        criteria.threshold,
                        criteria.operator
                    )

                // TODO: CSDL thiếu
                // case CriteriaField.COURSE_GRADE_MIN: // Điểm thấp nhất trong các học phần bình thường
                //     console.log(
                //         'Course Grade Min: ',
                //         student.diemMonThuongNhoNhat,
                //         criteria.value,
                //         criteria.operator
                //     )
                //     return checkEligible(
                //         student.diemMonThuongNhoNhat,
                //         criteria.value,
                //         criteria.operator
                //     )
                // case CriteriaField.GRADUATION_GRADE_MIN: // Điểm thấp nhất trong các học phần tốt nghiệp
                //     console.log(
                //         'Graduation Grade Min: ',
                //         student.diemMonTotNghiepNhoNhat,
                //         criteria.value,
                //         criteria.operator
                //     )
                //     if (student.diemMonTotNghiepNhoNhat === undefined) {
                //         return true
                //     }

                //     return checkEligible(
                //         student.diemMonThuongNhoNhat,
                //         criteria.value,
                //         criteria.operator
                //     )
                case CriteriaField.SEMESTER_GPA: // Điểm trung bình học ksỳ
                    console.log(
                        'Semester GPA: ',
                        student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
                        criteria.threshold,
                        criteria.operator
                    )
                    return checkEligible(
                        student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
                        criteria.threshold,
                        criteria.operator
                    )

                default:
                    return true // Mặc định là đủ điều kiện nếu không có tiêu chí
            }
        })
        return isEligible
    } catch (error) {
        console.error('Error checking student eligibility:', error)
        return false // Trả về false nếu có lỗi xảy ra
    } finally {
        // Đóng kết nối Prisma nếu cần thiết
        await prisma.$disconnect()
    }
}

// Lọc danh sách sinh viên bị cảnh báo học tập
export const ListWarningEligibility = async (
    students: StudentAcademicWarning[],
    scholarshipId: string
): Promise<StudentAcademicWarning[]> => {
    // Lấy thông tin tiêu chí học bổng
    return students.filter((student) => {
        // Kiểm tra điều kiện học bổng
        return checkStudentEligible(student, scholarshipId)
    })
}

export const listStudentWarning = async (semesterId: string) => {
    try {
        const DsHocVien = await prisma.studentSemesterResult.findMany({
            where: {
                semesterId,
                // studentId: "cmc8rjif40002o00197ct07wy"
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

        const studentsInfo: StudentAcademicWarning[] = await Promise.all(
            DsHocVien.map(async (item) => {
                const userProfile = item.student.userProfile
                const trainingCourseId = item.student.fixedClass?.trainingCourse?.id || ''
                // Danh sách chuyển đổi

                const baseScore =
                    item.student.trainingObjectType?.baseScore || AcademicRankingBaseType.Base10 // Mặc định là 10 nếu không có thông tin
                const xepLoaiHocTap =
                    baseScore === AcademicRankingBaseType.Base10
                        ? await phanLoaiDiemHe10(item.gpaBase10, trainingCourseId)
                        : await phanLoaiDiemHe4(item.gpaBase4, trainingCourseId)
                return {
                    stt: 0,
                    id: userProfile?.id ?? '',
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
                    diemTrungBinh4: item.gpaBase4 || 0,
                    diemTrungBinh10: item.gpaBase10 || 0,
                    xepLoaiHocTap: xepLoaiHocTap || 'Chưa có dữ liệu',
                    soTinChiTichLuy: item.accumulatedCredits || 0,
                    soTinChiYeuCau: item.totalCreditsByCurriculum || 0,
                    soTinChiMoTrongKy: item.totalCredits || 0,
                    soTinChiNo: item.failedCredits || 0,
                    soTinChiDangKy: item.registeredCredits || 0,
                    xepLoaiRenLuyen: item.studentTrainingType,
                    //TODO: Chưa có dữ liệu
                    diemDauVao: 0, // Điểm đầu vào
                    soLanViPham: 0,
                    biKyLuat: false,
                    queQuan: userProfile?.homeTown || '',

                    trinhDoNgoaiNgu: false,
                    trinhDoTinHoc: false,
                    kyDangHoc: item.semesterIndexInCourse || 0,
                    kyCuoi: item.isLastSemester || false,
                    namDangHoc: item.semesterIndexInCourse / 2, // Năm đang học
                    chucVuHocVien: item.isClassMonitor
                        ? 'Lớp trưởng'
                        : item.isUnionLeader
                          ? 'Bí thư'
                          : '', // Chức vụ học viên
                    quocTich: userProfile.nationalityId ?? '', // Quốc tịch
                    ghiChu: '', // Ghi chú,
                    diemThuong: item.isClassMonitor || item.isUnionLeader ? 0.1 : 0, // Điểm thưởng
                    userProfile: userProfile, // Thông tin người dùng

                    diemHe10TichLuy: item.cumulativeGpaBase10 ?? 0,
                    diemHe4TichLuy: item.cumulativeGpaBase4 ?? 0,
                    noTinChiTrongKy: item.failedCredits ?? 0,
                    tongSoTinChiNo: item.totalFailedCredits ?? 0,
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
            { t: 'n', v: 0 }, // I
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
            { t: 'b', v: true }, // U TODO: Chưa có dữ liệu
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
export const resultCourseStudentWarning = async (
    students: StudentAcademicWarning[]
): Promise<CourseStudentAcademicWarning[]> => {
    const courseMap: Record<string, CourseStudentAcademicWarning> = {}

    // Process students in parallel

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
        courseMap[courseId].students.push(student)
    })

    console.log('courseMap', courseMap)
    const result = Object.values(courseMap)
    return result.map((course) => CourseStudentAcademicWarning.parse(course))
}
