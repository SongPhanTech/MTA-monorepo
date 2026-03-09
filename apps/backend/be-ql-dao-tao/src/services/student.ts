import { TrainingObjectTypes } from '@workspace/db'
import { getTemplateBuffer } from '@workspace/libs/server'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import ExcelJS from 'exceljs'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import {
    listStudentResultInfo,
    resultCourseStudentScholarship,
    resultCourseStudentAcademicWarning,
} from './student-result.service'

dayjs.extend(utc)
dayjs.extend(timezone)

export async function exportStudentProfile({ trainingCourseId }: { trainingCourseId: string }) {
    const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
        where: { id: trainingCourseId },
        select: {
            name: true,
            trainingObjectType: {
                select: { name: true, type: true },
            },
        },
    })

    const students = await prisma.student.findMany({
        where: { fixedClass: { trainingCourseId } },
        select: {
            registerNumber: true,
            doctoralCode: true,
            code: true,
            admissionCombination: true,
            entryScore: true,
            competencyScore: true,
            description: true,
            userProfile: {
                select: {
                    fullname: true,
                    dateOfBirth: true,
                    idCardNumber: true,
                    phoneNumber: true,
                    gender: { select: { sTen: true } },
                    ethnicity: { select: { sTen: true } },
                    provinceHometown: { select: { sTen: true } },
                    nationality: { select: { sTen: true } },
                    officerNumber: true,
                    rank: { select: { sTen: true } },
                    chucVuChinhQuyen: { select: { sTen: true } },
                },
            },
            fixedClass: {
                select: {
                    code: true,
                    name: true,
                    curriculumVersion: {
                        select: {
                            name: true,
                            curriculum: {
                                select: {
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
            curriculumVersion: {
                select: {
                    name: true,
                    curriculum: {
                        select: {
                            trainingMajor: {
                                include: {
                                    trainingField: true,
                                },
                            },
                        },
                    },
                },
            },
            studentSemesterResult: {
                select: {
                    cumulativeGpaBase10: true,
                    cumulativeGpaBase4: true,
                },
                take: 1,
                orderBy: { semester: { startDate: 'desc' } },
            },
        },
        orderBy: [{ userProfile: { firstName: 'asc' } }, { userProfile: { lastName: 'asc' } }],
    })

    const TrainingObjectType = {
        [TrainingObjectTypes.MILITARY]: 'Quân sự',
        [TrainingObjectTypes.CIVILIAN]: 'Dân sự',
        [TrainingObjectTypes.INTERNATIONAL_MILITARY]: 'Quốc tế',
    }

    const data = students.map((student, idx) => {
        const curriculumVersion = student.curriculumVersion || student.fixedClass?.curriculumVersion

        const dateOfBirth = student.userProfile.dateOfBirth
            ? dayjs(student.userProfile.dateOfBirth)
            : null

        return {
            no: idx + 1,
            registerNumber: student.registerNumber,
            doctoralCode: student.doctoralCode,
            code: student.code,
            fullname: student.userProfile.fullname,
            dateOfBirth: dateOfBirth ? `'${dateOfBirth?.format('DD/MM/YYYY')}` : '',
            gender: student.userProfile.gender?.sTen,
            ethnicity: student.userProfile.ethnicity?.sTen,
            nationality: student.userProfile.nationality?.sTen,
            provinceHometown: student.userProfile.provinceHometown?.sTen,
            idCardNumber: student.userProfile.idCardNumber,
            phoneNumber: student.userProfile.phoneNumber,
            admissionCombination: student.admissionCombination,
            entryScore: student.entryScore,
            competencyScore: student.competencyScore,
            fixedClassCode: student.fixedClass?.code,
            fixedClassName: student.fixedClass?.name,
            trainingField: curriculumVersion?.curriculum.trainingMajor?.trainingField?.name,
            trainingMajor: curriculumVersion?.curriculum.trainingMajor?.name,
            curriculum: curriculumVersion?.name,
            trainingObjectType:
                TrainingObjectType[
                    trainingCourse.trainingObjectType.type || TrainingObjectTypes.MILITARY
                ],
            officerNumber: student.userProfile.officerNumber,
            rank: student.userProfile.rank?.sTen,
            chucvu: student.userProfile.chucVuChinhQuyen?.sTen,

            description: student.description,
            gpaBase10: student.studentSemesterResult?.[0]?.cumulativeGpaBase10?.toNumber(),
            gpaBase4: student.studentSemesterResult?.[0]?.cumulativeGpaBase4?.toNumber(),
        }
    })

    const buffer = await getTemplateBuffer(prisma, 'DANH_SACH_SV')

    const template = new XlsxTemplate(buffer)

    template.substitute(1, {
        trainingCourse: trainingCourse.name,
        trainingObjectType: trainingCourse.trainingObjectType.name,
        data,
    })

    const result = (await template.generate({ type: 'arraybuffer' })) as ArrayBuffer

    return result
}

export const exportStudentScholarship = async ({
    semesterId,
    trainingObjectTypeId,
}: {
    semesterId: string
    trainingObjectTypeId: string
}) => {
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)

    if (!students || students.length === 0) {
        throw new Error('Không có sinh viên nào trong danh sách')
    }

    const filteredCourseStudents = await resultCourseStudentScholarship(students, semesterId)

    // Flatten data
    const rows = []
    let stt = 1
    for (const courseItem of filteredCourseStudents) {
        for (const student of courseItem.students) {
            // Check if student has scholarships
            if (student.hasScholarship && student.scholarship && student.scholarship.length > 0) {
                // Get general student info
                const studentName =
                    (student.userProfile as any)?.fullname ||
                    (student.studentSemesterResult as any)?.studentName ||
                    ''
                const studentCode = student.code || ''
                const dob = (student.userProfile as any)?.dateOfBirth
                    ? dayjs((student.userProfile as any).dateOfBirth).format('DD/MM/YYYY')
                    : ''
                const courseName = courseItem.courseName
                const classCode = student.fixedClass?.code || ''

                const trainingMajor = student.trainingMajor

                // Semester Result info
                const result: any = student.studentSemesterResult
                const semester = result?.semesterIndexInCourse || ''
                const gpaSemester = result?.gpaBase10 || 0
                // const academicClassification = result?.rank?.classification || ''

                const note = student.reason || ''

                for (const scholarship of student.scholarship) {
                    rows.push({
                        stt: stt++,
                        studentCode,
                        studentName,
                        dob,
                        trainingMajor,
                        courseName,
                        classCode,
                        semester,
                        gpaSemester,
                        // academicClassification,
                        scholarshipName: scholarship.name,
                        note,
                    })
                }
            }
        }
    }

    if (rows.length === 0) {
        throw new Error('Không có dữ liệu học bổng để xuất')
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Danh sách học bổng')

    worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã học viên', key: 'studentCode', width: 15 },
        { header: 'Tên học viên', key: 'studentName', width: 25 },
        { header: 'Ngày sinh', key: 'dob', width: 15 },
        { header: 'Chuyên ngành', key: 'trainingMajor', width: 25 },
        { header: 'Khóa', key: 'courseName', width: 15 },
        { header: 'Lớp', key: 'classCode', width: 15 },
        { header: 'Kỳ đang học', key: 'semester', width: 15 },
        { header: 'Trung bình học kỳ', key: 'gpaSemester', width: 18 },
        // { header: 'Xếp loại học tập', key: 'academicClassification', width: 20 },
        { header: 'Học bổng', key: 'scholarshipName', width: 25 },
        { header: 'Ghi chú', key: 'note', width: 30 },
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true }

    worksheet.addRows(rows)

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
}

export const exportStudentAcademicWarning = async ({
    semesterId,
    trainingObjectTypeId,
}: {
    semesterId: string
    trainingObjectTypeId: string
}) => {
    const students = await listStudentResultInfo(semesterId, trainingObjectTypeId)

    if (!students || students.length === 0) {
        throw new Error('Không có sinh viên nào trong danh sách')
    }

    const filteredCourseStudents = await resultCourseStudentAcademicWarning(students, semesterId)

    // Flatten data
    const rows = []
    for (const courseItem of filteredCourseStudents) {
        for (const student of courseItem.students) {
            // Get general student info
            const studentName =
                (student.userProfile as any)?.fullname ||
                (student.studentSemesterResult as any)?.studentName ||
                ''
            const dob = (student.userProfile as any)?.dateOfBirth
                ? dayjs((student.userProfile as any).dateOfBirth).format('DD/MM/YYYY')
                : ''
            const studentCode = student.code || ''
            const className = student.fixedClass?.name || ''
            const courseName = courseItem.courseName

            // Semester Result info
            const result: any = student.studentSemesterResult
            const gpaSemester = result?.gpaBase10 || 0
            const trainingPoint = result?.conductScore || 0
            // const academicClassification = result?.academicClassification || ''

            // Reason for warning
            const reason = student.reason || ''

            rows.push({
                studentCode,
                studentName,
                dob,
                className,
                courseName,
                gpaSemester,
                trainingPoint,
                // academicClassification,
                reason,
            })
        }
    }

    if (rows.length === 0) {
        throw new Error('Không có dữ liệu cảnh cáo học tập để xuất')
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Danh sách cảnh cáo học tập')

    worksheet.columns = [
        { header: 'Mã SV', key: 'studentCode', width: 15 },
        { header: 'Họ và tên', key: 'studentName', width: 25 },
        { header: 'Ngày sinh', key: 'dob', width: 15 },
        { header: 'Lớp', key: 'className', width: 15 },
        { header: 'Khoá', key: 'courseName', width: 15 },
        { header: 'ĐTB Học kỳ', key: 'gpaSemester', width: 15 },
        { header: 'ĐRL', key: 'trainingPoint', width: 10 },
        // { header: 'Xếp loại HT', key: 'academicClassification', width: 15 },
        { header: 'Lý do', key: 'reason', width: 40 },
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true }

    worksheet.addRows(rows)

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
}

export async function generateStudentImportTemplate(
    trainingObjectTypeId: string
): Promise<ArrayBuffer> {
    const [provinces, trainingFields, trainingMajors, nationalities, ethnicities, genders] =
        await Promise.all([
            prisma.dM_Tinh_New.findMany({
                where: { bActive: true, bDeleted: false },
                select: { sTen: true },
                orderBy: { sTen: 'asc' },
            }),
            prisma.trainingField.findMany({
                where: { trainingObjectTypes: { some: { trainingObjectTypeId } } },
                select: { name: true },
                orderBy: { name: 'asc' },
            }),
            prisma.trainingMajor.findMany({
                where: { trainingObjectTypes: { some: { trainingObjectTypeId } } },
                select: { name: true },
                orderBy: { name: 'asc' },
            }),
            prisma.dM_QuocGia.findMany({
                where: { bActive: true, bDeleted: false },
                select: { sTen: true },
                orderBy: { sTen: 'asc' },
            }),
            prisma.dM_DanToc.findMany({
                where: { bActive: true, bDeleted: false },
                select: { sTen: true },
                orderBy: { sTen: 'asc' },
            }),
            prisma.dM_GioiTinh.findMany({
                where: { bActive: true, bDeleted: false },
                select: { sTen: true },
                orderBy: { sTen: 'asc' },
            }),
        ])

    const buffer = await getTemplateBuffer(prisma, 'MauImportDSHV.xlsx')
    const template = new XlsxTemplate(buffer)

    template.substitute('DanhMucTinh', {
        data: provinces.filter((p) => p.sTen).map((p) => ({ name: p.sTen })),
    })
    template.substitute('DanhMucNganh', {
        data: trainingFields.filter((p) => p.name).map((p) => ({ name: p.name })),
    })
    template.substitute('DanhMucGioiTinh', {
        data: genders.filter((p) => p.sTen).map((p) => ({ name: p.sTen })),
    })
    template.substitute('DanhMucQuocTich', {
        data: nationalities.filter((p) => p.sTen).map((p) => ({ name: p.sTen })),
    })
    template.substitute('DanhMucDanToc', {
        data: ethnicities.filter((p) => p.sTen).map((p) => ({ name: p.sTen })),
    })
    template.substitute('DanhMucChuyenNganh', {
        data: trainingMajors.filter((p) => p.name).map((p) => ({ name: p.name })),
    })

    return template.generate({ type: 'arraybuffer' }) as Promise<ArrayBuffer>
}

export const exportArchivedCertificate = async ({
    trainingObjectTypeId,
    trainingCourseId,
    fixedClassId,
    certificateId,
}: {
    trainingObjectTypeId: string
    trainingCourseId?: string
    fixedClassId?: string
    certificateId?: string
}) => {
    const where: any = {
        deletedAt: null,
        student: {
            fixedClass: {
                trainingCourse: {
                    trainingObjectTypeId,
                    deletedAt: null,
                    active: true,
                },
            },
        },
    }

    if (trainingCourseId) {
        where.student.fixedClass.trainingCourseId = trainingCourseId
    }

    if (fixedClassId) {
        where.student.fixedClassId = fixedClassId
    }

    if (certificateId) {
        where.certificateId = certificateId
    }

    const archivedCertificates = await prisma.archivedCertificate.findMany({
        where,
        include: {
            certificate: true,
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
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    if (!archivedCertificates || archivedCertificates.length === 0) {
        throw new Error('Không có dữ liệu điểm chứng chỉ để xuất')
    }

    // Map status
    const statusMap: Record<string, string> = {
        PENDING: 'Chờ duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Từ chối',
        CANCEL: 'Đã huỷ',
    }

    // Flatten data
    const data = archivedCertificates.map((item, idx) => {
        const student = item.student
        const userProfile = student?.userProfile
        const fixedClass = student?.fixedClass
        // const trainingCourse = fixedClass?.trainingCourse
        const curriculum = fixedClass?.curriculumVersion?.curriculum
        const trainingMajor = curriculum?.trainingMajor
        // const trainingField = trainingMajor?.trainingField

        return {
            no: idx + 1,
            // studentCode: userProfile?.code || '',
            studentName: userProfile?.fullname || '',
            // phoneNumber: userProfile?.phoneNumber || '',
            dateOfBirth: userProfile?.dateOfBirth
                ? `'${dayjs.utc(userProfile.dateOfBirth).local().format('DD/MM/YYYY')}`
                : '',
            // fixedClassName: fixedClass?.name || '',
            // fixedClassCode: fixedClass?.code || '',
            // trainingCourseName: trainingCourse?.name || '',
            // trainingFieldName: trainingField?.name || '',
            trainingMajorName: trainingMajor?.name || '',
            certificateName: item.certificate?.name || '',
            score: item.score ?? '',
            // decisionNumber: item.decisionNumber || '',
            issuedDate: item.issuedDate 
                ? `'${dayjs.utc(item.issuedDate).local().format('DD/MM/YYYY')}` 
                : '',
            issuedBy: item.issuedBy || '',
            // expiredDate: item.expiredDate
            //     ? `'${dayjs(item.expiredDate).format('DD/MM/YYYY')}`
            //     : '',
            // status: statusMap[item.status] || item.status,
        }
    })

    const buffer = await getTemplateBuffer(prisma, 'DIEM_CHUNG_CHI.xlsx')
    const template = new XlsxTemplate(buffer)

    template.substitute(1, {
        data,
    })

    const result = (await template.generate({ type: 'arraybuffer' })) as ArrayBuffer
    return result
}
