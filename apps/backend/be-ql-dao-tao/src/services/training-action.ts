import { AcademicRankingBaseType, CriteriaField, CriteriaOperator } from '@workspace/db'
import { prisma } from '..'
import { CourseStudentAcademicAction, type StudentAcademicAction } from '../dto/student-info.dto'

// Xử lý lưu ban
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
export const checkStudentEligible = async (
    student: StudentAcademicAction,
    trainingCourseId: string
): Promise<boolean> => {
    try {
        const actionCriteriaList = await prisma.academicActionCondition.findMany({
            where: {
                ruleSet: {
                    config: {
                        trainingCourseId: trainingCourseId,
                    },
                },
                OR: [{ yearCondition: student.namDangHoc }, { yearCondition: null }],
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
        if (!actionCriteriaList || actionCriteriaList.length === 0) {
            console.warn('No action criteria found for training course:', trainingCourseId)
            return false
        }
        // Kiểm tra từng điều kiện
        const isEligible = actionCriteriaList.every((criteria) => {
            switch (criteria.field) {
                case CriteriaField.SEMESTER_PASSED_CREDITS: // Tổng số tín chỉ học tập trong học kỳ
                    console.log(
                        'Total Credits: ',
                        student.soTinChiDangKy,
                        criteria.value,
                        criteria.operator
                    )
                    return checkEligible(student.soTinChiDangKy, criteria.value, criteria.operator)
                case CriteriaField.SEMESTER_REGISTERED_CREDITS: // Số tín chỉ đăng ký trong học kỳ
                    console.log(
                        'Registered Credits: ',
                        student.soTinChiDangKy,
                        criteria.value,
                        criteria.operator
                    )
                    return checkEligible(student.soTinChiDangKy, criteria.value, criteria.operator)
                case CriteriaField.CUMULATIVE_PROGRESS_PERCENT: // % tín chỉ tích lũy so với kế hoạch
                    console.log(
                        'Accumulated Credits Percent: ',
                        student.soTinChiTichLuy,
                        student.soTinChiYeuCau,
                        criteria.value,
                        criteria.operator
                    )
                    return checkEligible(
                        student.soTinChiTichLuy / student.soTinChiYeuCau,
                        criteria.value,
                        criteria.operator
                    )

                case CriteriaField.SEMESTER_GPA: // Điểm trung bình học ksỳ
                    console.log(
                        'Semester GPA: ',
                        student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
                        criteria.value,
                        criteria.operator
                    )
                    return checkEligible(
                        student.heSoDiem === 10 ? student.diemTrungBinh10 : student.diemTrungBinh4,
                        criteria.value,
                        criteria.operator
                    )

                default:
                    return true // Mặc định là đủ điều kiện nếu không có tiêu chí
            }
        })
        return isEligible
    } catch (error) {
        console.error('Error fetching action criteria:', error)
        throw new Error('Failed to fetch action checkStudentEligible')
    } finally {
        await prisma.$disconnect()
    }
}

export const listStudentAcademicAction = async (semesterId: string) => {
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

        const studentsInfo: StudentAcademicAction[] = await Promise.all(
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
                    namDangHoc: item.studyYear, // Năm đang học
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

                    mucCanhCaoHocTap: item.student.academicWarningLevel || 0,
                    mucCanhCaoHocDuong: item.student.disciplinaryWarningLevel || 0,
                    xepLoaiRenLuyenKy: '', // or appropriate value
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

export const resultCourseStudentAcademicAction = async (
    students: StudentAcademicAction[]
): Promise<CourseStudentAcademicAction[]> => {
    const courseMap: Record<string, CourseStudentAcademicAction> = {}

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
        // Check if the student is eligible for the course
        const checkStudent = await checkStudentEligible(student, courseId)
        if (!checkStudent) {
            return // Skip this student if not eligible
        }
        courseMap[courseId].students.push(student)
    })

    console.log('courseMap', courseMap)
    const result = Object.values(courseMap)
    return result.map((course) => CourseStudentAcademicAction.parse(course))
}
