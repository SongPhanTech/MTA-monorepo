import { AcademicRankingBaseType } from '@workspace/db'
import { prisma } from '..'
import type { StudentAcademicAction } from '../dto/student-info.dto'

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
export const listStudents = async (semesterId: string) => {
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

                    // Add missing required properties with default values
                    mucCanhCaoHocTap: 0, // or appropriate value
                    mucCanhCaoHocDuong: 0, // or appropriate value
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
