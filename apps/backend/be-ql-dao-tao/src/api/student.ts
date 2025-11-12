import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType, type Prisma, StudentStatus } from '@workspace/db'
import { postDMNhanViens, putDMNhanViens } from '@workspace/libs/api/system'
import { parseSheetHeQuanSu, parseSheetStudent, zParseSheetError } from '@workspace/libs/parseExcel'
import { getTemplateBuffer } from '@workspace/libs/server'
import { splitFullName } from '@workspace/libs/utils'
import dayjs from 'dayjs'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import {
    calculateStudentSemesterResult,
    listStudentResultInfo,
    resultCourseStudentResult,
} from '../services/student-result.service'
import type { ErrorExtra } from '../types/error-extra'
import {
    buildCurriculumMapOrThrow,
    buildDMChuyenNganhMap,
    buildDMNganhMap,
    buildDMTruongMap,
    buildEthnicityMapOrThrow,
    buildGenderMapOrThrow,
    buildNationalityMapOrThrow,
    buildPositionMapOrThrow,
    buildProvinceMapOrThrow,
    buildRankMapOrThrow,
} from '../utils'

const app = new OpenAPIHono({ strict: false })

const importStudent = createRoute({
    operationId: 'import-student',
    tags: ['Student'],
    path: '/import-student',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }).openapi('ImportStudentRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import Student successfully',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string(), time: z.number() }),
                },
            },
        },
        400: {
            description: 'Invalid file type',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        errors: z.array(zParseSheetError).optional(),
                    }),
                },
            },
        },
    },
})

app.openapi(importStudent, async (c) => {
    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetStudent(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const trainingObjectType = await prisma.trainingObjectType.findFirst({
        where: { name: data.trainingObjectType as string, active: true },
    })

    if (!trainingObjectType) {
        return c.json(
            {
                message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}`,
            },
            400
        )
    }

    const trainingCourse = await prisma.trainingCourse.findFirst({
        where: {
            OR: [{ name: data.trainingCourse as string }, { code: data.trainingCourse as string }],
            active: true,
        },
    })

    if (!trainingCourse) {
        return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.students.map((student) => student.gender)
    )

    const ethnicityMap = await buildEthnicityMapOrThrow(
        prisma,
        data.students.map((student) => student.ethnicity)
    )

    const nationalityMap = await buildNationalityMapOrThrow(
        prisma,
        data.students.map((student) => student.nationality)
    )

    const provinceMap = await buildProvinceMapOrThrow(
        prisma,
        data.students.map((student) => student.provinceHometown)
    )

    const rankMap = await buildRankMapOrThrow(
        prisma,
        data.students.map((student) => student.rank)
    )

    const positionMap = await buildPositionMapOrThrow(
        prisma,
        data.students.map((student) => student.position)
    )

    const curriculumVersionMap = await buildCurriculumMapOrThrow(prisma, data.students)

    const dmTruong = await buildDMTruongMap(
        prisma,
        data.students.map((student) => student.universitySchool)
    )

    const dmNganh = await buildDMNganhMap(
        prisma,
        data.students.map((student) => student.universityMajor)
    )

    const dmChuyenNganh = await buildDMChuyenNganhMap(
        prisma,
        data.students.map((student) => student.universityMajor)
    )

    const existingStudent = await prisma.student.findMany({
        where: { code: { in: data.students.map((student) => student.code) } },
        select: { id: true, code: true, userProfileId: true },
    })

    const existingStudentMap = new Map(
        existingStudent.map(({ code, id, userProfileId }) => [code, { id, userProfileId }])
    )

    const start = Date.now()
    // await prisma.$transaction(
    //     async (tx) => {
    await prisma.fixedClass.createMany({
        skipDuplicates: true,
        data: data.students.map(({ fixedClass, curriculum }) => ({
            name: fixedClass,
            trainingCourseId: trainingCourse.id,
            curriculumVersionId: curriculumVersionMap.get(curriculum),
            startYear: new Date().getFullYear(),
        })),
    })

    const fixedClass = await prisma.fixedClass.findMany({
        where: {
            OR: data.students.map(({ fixedClass, curriculum }) => ({
                name: fixedClass,
                trainingCourseId: trainingCourse.id,
                curriculumVersionId: curriculumVersionMap.get(curriculum),
            })),
        },
        select: { id: true, name: true },
    })

    const fixedClassMap = new Map(fixedClass.map(({ name, id }) => [name, id]))

    for (const student of data.students) {
        const studentData: Prisma.StudentCreateInput = {
            code: student.code,
            entryScore: Number.parseFloat(student.entryScore ?? '') || null,
            trainingObjectType: {
                connect: { id: trainingObjectType.id },
            },
            fixedClass: {
                connect: { id: fixedClassMap.get(student.fixedClass) },
            },
            curriculumVersion: {
                connect: { id: curriculumVersionMap.get(student.curriculum) },
            },
            userProfile: {},
            department: student.department,
            departmentAddress: student.departmentAddress,
            careerYear: Number.parseInt(student.careerYear ?? '0', 10),
            universitySchool: student.universitySchool,
            universityTrainingType: student.universityTrainingType,
            universityGraduationYear: Number.parseInt(student.universityGraduationYear ?? '0', 10),
            universityMajor: student.universityMajor,
            universityRank: student.universityRank,
            basic: student.basic ? Number.parseFloat(student.basic) : null,
            facility: student.facility ? Number.parseFloat(student.facility) : null,
            foreignLanguage: student.foreignLanguage,
            priorityReason: student.priorityReason,
            description: student.description,
        }
        const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(student.fullname),
            dateOfBirth: student.dateOfBirth,
            idCardNumber: student.idCardNumber,
            genderId: student.gender ? genderMap.get(student.gender) : null,
            ethnicityId: ethnicityMap.get(student.ethnicity ?? '') || null,
            nationalityId: nationalityMap.get(student.nationality ?? '') || null,
            provinceHometownId: provinceMap.get(student.provinceHometown ?? '') || null,
            phoneNumber: student.phoneNumber,
            officerNumber: student.officerNumber,
            rankId: rankMap.get(student.rank ?? '') || null,
            positionCPVId: positionMap.get(student.position ?? '') || null,
        }

        const existing = existingStudentMap.get(student.code)
        if (existing) {
            const res = await putDMNhanViens(
                {
                    Id: existing.userProfileId,
                    sMa: student.idCardNumber,
                    bLaHocVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: student.dateOfBirth
                        ? new Date(student.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: student.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: student.fullname,
                    sSDTDiDong: student.phoneNumber ?? '',
                    //! TODO: fix this
                    sDM_DonViId: 'e701b807-c390-45ff-a5c8-123f708ee0e1',
                    sEmail: `${student.idCardNumber}@gmail.com`,
                    sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )
            console.log('[LSB update User]:', res.status, res.data)
            if (res.status === 200) {
                await prisma.student.update({
                    where: { id: existing.id },
                    data: {
                        ...studentData,
                        userProfile: { update: profileData },
                    },
                })
            } else {
                const extra = res.data?.extra as ErrorExtra | undefined
                return c.json(
                    { message: extra?.message || [extra?.code, extra?.data].join(' ') },
                    400
                )
            }
        } else {
            // const profileId = crypto.randomUUID()

            const res = await postDMNhanViens(
                {
                    // Id: profileId,
                    sMa: student.idCardNumber,
                    bLaHocVien: true,
                    bLaTaiKhoan: true,
                    dNgaySinh: student.dateOfBirth
                        ? new Date(student.dateOfBirth)?.toISOString()
                        : null,
                    sCCCD: student.idCardNumber,
                    sHoVaDem: profileData.lastName,
                    sTen: profileData.firstName,
                    sTenDayDu: student.fullname,
                    sSDTDiDong: student.phoneNumber ?? '',
                    //! TODO: fix this
                    sDM_DonViId: 'e701b807-c390-45ff-a5c8-123f708ee0e1',
                    sEmail: `${student.idCardNumber}@gmail.com`,
                    sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                },
                {
                    headers: {
                        'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                        'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                    },
                }
            )
            console.log('[LSB create User]:', res.status, res.data)

            if (res.status === 200) {
                const st = await prisma.student.create({
                    data: {
                        ...studentData,
                        userProfile: {
                            connectOrCreate: {
                                where: { idCardNumber: student.idCardNumber },
                                create: profileData,
                            },
                        },
                    },
                })

                if (student.department) {
                    await prisma.quaTrinhCongTac.create({
                        data: {
                            userProfileId: st.userProfileId,
                            donVi: student.department,
                            diaChi: student.departmentAddress,
                            chucVuId: positionMap.get(student.position ?? ''),
                        },
                    })
                }

                if (student.universitySchool && student.universityMajor) {
                    await prisma.quaTrinhHocTap.create({
                        data: {
                            userProfileId: st.userProfileId,
                            tenTruongId: dmTruong.get(student.universitySchool) as string,
                            nganhHocId: dmNganh.get(student.universityMajor) as string,
                            chuyenNganhId: dmChuyenNganh.get(student.universityMajor) as string,
                        },
                    })
                }
            } else {
                const extra = res.data?.extra as ErrorExtra | undefined
                return c.json(
                    { message: extra?.message || [extra?.code, extra?.data].join(' ') },
                    400
                )
            }
        }
    }
    //     },
    //     { timeout: timeout * 1000 }
    // )

    return c.json(
        {
            message: `Import students successfully: ${data.students.length}`,
            time: Date.now() - start,
        },
        200
    )
})

const importHeQuanSu = createRoute({
    operationId: 'import-he-quan-su',
    tags: ['Student'],
    path: '/import-he-quan-su',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }).openapi('importHeQuanSuRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import He quan su successfully',
            content: {
                'application/json': {
                    schema: z.object({ message: z.string(), time: z.number() }),
                },
            },
        },
        400: {
            description: 'Invalid file type',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        errors: z.array(zParseSheetError).optional(),
                    }),
                },
            },
        },
    },
})

const tongKetHocKyHVSV = createRoute({
    operationId: 'calculateStudentSemesterResultJson',
    path: '/calculate-student-semester-result-json',
    tags: ['Student'],
    summary: 'Tổng kết kết quả học kỳ của học viên, sinh viên',
    description: 'Trả kết quả học kỳ của học viên, sinh viên dưới dạng JSON',
    method: 'post',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kỳ học',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student semester result as JSON',
            content: {
                'application/json': {
                    schema: z.any(),
                },
            },
        },
        400: {
            description: 'Invalid semester ID',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        500: {
            description: 'Server error during calculation',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const dsKetQuaHocKySinhVienJson = createRoute({
    operationId: 'exportStudentResultSemesterJson',
    path: '/export-json-list-student-to-check-academic',
    tags: ['Student'],
    summary: 'Danh sách học bổng, kỷ luật học tập, lưu ban, thôi học của học viên',
    description: 'Xuất tất cả học viên, sinh viên đủ điều kiện JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kỳ học',
            }),
            type: z
                .enum([
                    'scholarship',
                    'academicWarning',
                    'academicAction',
                    'decreaseAcademicWarning',
                ])
                .openapi('type', {
                    description: 'Loại danh sách',
                }),
            academicActionType: z
                .enum(['REPEAT_YEAR', 'SUSPENSION', 'EXPULSION'])
                .optional()
                .openapi('academicActionType', {
                    description: 'Loại hành động học vụ',
                }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student action academic as JSON',
            content: {
                'application/json': {
                    schema: z.array(z.any()), // You can replace z.any() with a more specific schema if available
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

const PheDuyetLuuBan = createRoute({
    operationId: 'updateStudentStatus',
    path: '/update-students-status',
    tags: ['Student'],
    summary: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
    description: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            decisionIds: z.string().array(),
                            academicActionType: z.nativeEnum(AcademicActionType),
                            classChanges: z
                                .array(
                                    z.object({
                                        decisionId: z.string(),
                                        fixedClassId: z.string(),
                                        changeCurriculumVersion: z.boolean(),
                                    })
                                )
                                .optional(),
                        })
                        .superRefine((data, ctx) => {
                            if (data.academicActionType === AcademicActionType.REPEAT_YEAR) {
                                if (!data.classChanges || data.classChanges.length === 0) {
                                    ctx.addIssue({
                                        code: z.ZodIssueCode.custom,
                                        path: ['classChanges'],
                                        message:
                                            'classChanges is required when academicActionType is REPEAT_YEAR',
                                    })
                                }
                            }
                        }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Cập nhật trạng thái, điểm học viên theo xử lý học tập',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        count: z.number(),
                    }),
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(PheDuyetLuuBan, async (c) => {
    const { decisionIds, academicActionType, classChanges } = c.req.valid('json')

    if (
        academicActionType === AcademicActionType.REPEAT_YEAR &&
        decisionIds.length !== classChanges?.length
    ) {
        return c.json(
            { message: 'classChanges is required when academicActionType is REPEAT_YEAR' },
            400
        )
    }

    const decisions = await prisma.studentAcademicDecision.findMany({
        where: {
            id: { in: decisionIds },
            actionTaken: academicActionType,
            updatedResult: false,
        },
        select: { studentId: true },
    })

    const studentIds = decisions.map((decision) => decision.studentId)

    const actionMap = {
        [AcademicActionType.REPEAT_YEAR]: StudentStatus.REPEATED,
        [AcademicActionType.SUSPENSION]: StudentStatus.ACADEMIC_SUSPENSION,
        [AcademicActionType.EXPULSION]: StudentStatus.WITHDRAWN,
    }

    const { count } = await prisma.$transaction(async (tx) => {
        await tx.studentAcademicDecision.updateMany({
            where: { id: { in: decisionIds } },
            data: { updatedResult: true },
        })

        const { count } = await tx.student.updateMany({
            where: {
                id: { in: studentIds },
                status: { not: StudentStatus.GRADUATED },
            },
            data: {
                status: actionMap[academicActionType],
            },
        })

        await tx.studentAcademicDecision.updateMany({
            where: { id: { in: decisionIds } },
            data: { status: 'APPROVED' },
        })

        if (academicActionType === AcademicActionType.REPEAT_YEAR && classChanges) {
            // update student fixedClassId independently based on classChanges
            for (const classChange of classChanges) {
                await tx.student.updateMany({
                    where: {
                        studentAcademicDecision: {
                            some: { id: classChange.decisionId },
                        },
                    },
                    data: {
                        fixedClassId: classChange.fixedClassId,
                        curriculumVersionId: classChange.changeCurriculumVersion ? null : undefined,
                    },
                })
            }

            await tx.studentSubjectScore.updateMany({
                where: { studentId: { in: studentIds }, repeated: false },
                data: { repeated: true },
            })
        }

        return { count }
    })

    // const listStudentRepeatGrade = await StudentRepeatGradeService(studentIds, semesterId)

    return c.json({ message: `Đã cập nhật ${count} trạng thái sinh viên`, count }, 200)
})

app.openapi(dsKetQuaHocKySinhVienJson, async (c) => {
    const { semesterId, type, academicActionType } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId)
    console.log(`Found ${students.length} students for semester ${semesterId}`)
    // console.log(`Students: ${JSON.stringify(students, null, 2)}`)
    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }
    const filteredStudents = await resultCourseStudentResult(
        students,
        semesterId,
        type,
        academicActionType
    )
    return c.json(filteredStudents, 200)
})

app.openapi(tongKetHocKyHVSV, async (c) => {
    const { semesterId } = c.req.valid('query')
    // Validate semester existence
    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
    })
    if (!semester) {
        return c.json({ message: `Kỳ học với ID ${semesterId} không tồn tại` }, 400)
    }
    try {
        const studentResults = await calculateStudentSemesterResult(semesterId)
        return c.json(studentResults, 200)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
        console.error(
            `Error calculating semester results for semester ${semesterId}: ${errorMessage}`
        )
        return c.json({ message: `Lỗi khi tính toán kết quả học kỳ: ${errorMessage}` }, 500)
    }
})

app.openapi(importHeQuanSu, async (c) => {
    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetHeQuanSu(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const trainingObjectType = await prisma.trainingObjectType.findFirst({
        where: { name: data.trainingObjectType as string, active: true },
    })

    if (!trainingObjectType) {
        return c.json(
            {
                message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}`,
            },
            400
        )
    }

    const trainingCourse = await prisma.trainingCourse.findFirst({
        where: { name: data.trainingCourse as string, active: true },
    })

    if (!trainingCourse) {
        return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.students.map((student) => student.gender)
    )

    const ethnicityMap = await buildEthnicityMapOrThrow(
        prisma,
        data.students.map((student) => student.ethnicity)
    )

    const nationalityMap = await buildNationalityMapOrThrow(
        prisma,
        data.students.map((student) => student.nationality)
    )

    const provinceMap = await buildProvinceMapOrThrow(
        prisma,
        data.students.map((student) => student.provinceHometown)
    )

    const curriculumVersionMap = await buildCurriculumMapOrThrow(prisma, data.students)

    const existingStudent = await prisma.student.findMany({
        where: { code: { in: data.students.map((student) => student.code) } },
        select: { id: true, code: true },
    })

    const existingStudentMap = new Map(existingStudent.map(({ code, id }) => [code, id]))

    const start = Date.now()
    await prisma.$transaction(
        async (tx) => {
            await tx.fixedClass.createMany({
                skipDuplicates: true,
                data: data.students.map(({ fixedClass, curriculum }) => ({
                    name: fixedClass,
                    trainingCourseId: trainingCourse.id,
                    curriculumVersionId: curriculumVersionMap.get(curriculum),
                    startYear: new Date().getFullYear(),
                })),
            })

            const fixedClass = await tx.fixedClass.findMany({
                where: {
                    OR: data.students.map(({ fixedClass, curriculum }) => ({
                        name: fixedClass,
                        trainingCourseId: trainingCourse.id,
                        curriculumVersionId: curriculumVersionMap.get(curriculum),
                    })),
                },
                select: { id: true, name: true },
            })

            const fixedClassMap = new Map(fixedClass.map(({ name, id }) => [name, id]))

            for (const student of data.students) {
                const studentData: Prisma.StudentCreateInput = {
                    code: student.code,
                    entryScore: Number.parseFloat(student.admissionScore ?? '') || null,
                    trainingObjectType: {
                        connect: { id: trainingObjectType.id },
                    },
                    fixedClass: {
                        connect: { id: fixedClassMap.get(student.fixedClass) },
                    },
                    curriculumVersion: {
                        connect: { id: curriculumVersionMap.get(student.curriculum) },
                    },
                    userProfile: {},
                }
                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
                        ...splitFullName(student.fullname),
                        dateOfBirth: student.dateOfBirth,
                        // TODO: need to use idCardNumber
                        idCardNumber: student.code,
                        genderId: student.gender ? genderMap.get('Nữ') : null,
                        ethnicityId: ethnicityMap.get(student.ethnicity ?? '') || null,
                        nationalityId: nationalityMap.get(student.nationality ?? '') || null,
                        provinceHometownId: provinceMap.get(student.provinceHometown ?? '') || null,
                    }

                const existingId = existingStudentMap.get(student.code)
                if (existingId) {
                    await tx.student.update({
                        where: { id: existingId },
                        data: {
                            ...studentData,
                            userProfile: { update: profileData },
                        },
                    })
                } else {
                    await tx.student.create({
                        data: {
                            ...studentData,
                            userProfile: {
                                connectOrCreate: {
                                    where: { idCardNumber: student.code }, // TODO: need to use idCardNumber
                                    create: profileData,
                                },
                            },
                        },
                    })
                }
            }
        },
        { timeout: timeout * 1000 }
    )

    return c.json(
        {
            message: `Import students successfully: ${data.students.length}`,
            time: Date.now() - start,
        },
        200
    )
})

const debtStatistics = createRoute({
    operationId: 'debt-statistics',
    tags: ['Student'],
    path: '/debt-statistics',
    method: 'get',
    request: {
        query: z.object({
            trainingObjectTypeId: z.string(),
            trainingCourseId: z.string(),
            date: z.coerce.date().optional(),
        }),
    },
    responses: {
        200: {
            description: 'Export thống kê nợ',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})

app.openapi(debtStatistics, async (c) => {
    const { trainingObjectTypeId, trainingCourseId, date = new Date() } = c.req.valid('query')

    const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
        where: { id: trainingObjectTypeId },
        select: { name: true },
    })

    const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
        where: { id: trainingCourseId },
        select: { name: true },
    })

    type Result = {
        studentId: string
        studentCode: string
        fullname: string
        dateOfBirth: string
        fixedClassCode: string
        subjectCode: string
        subjectName: string
        subjectCredit: number
        semesterCode: string
        finalScore: number | null
    }[]

    const res = await prisma.$queryRaw<Result>`
                    select
                        SSS."studentId",
                        S."code" as "studentCode",
                        "UP"."fullname" as "fullname",
                        "UP"."dateOfBirth" as "dateOfBirth",
                        FC.code as "fixedClassCode",
                        sv.code as "subjectCode",
                        sv.name as "subjectName",
                        sv.credit as "subjectCredit",
                        SEM.code as "semesterCode",
                        SSS."finalScore" as "finalScore"
                    from "ql-dao-tao"."StudentSubjectScore" as SSS
                        inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                        inner join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                        inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                        inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                        inner join "ql-dao-tao"."Semester" SEM on SEM.id = SC."semesterId"
                        inner join "ql-dao-tao"."SubjectVersion" sv on sv.id = SSS."subjectVersionId"
                        inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                        inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV on CV.id = TBOCV."curriculumVersionId"
                        inner join "ql-dao-tao"."TrainingBlockSubject" TBS on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId" and TBS."subjectId" = sv.id
                    where
                        SC.cancelled = false and
                        SEM."endDate" <= ${date} and
                        (
                            SSS."finalScore" is null or
                            (TBS.graduation = true and SSS."finalScore" < TC."scoreToPassGraduation") or
                            (TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass") or
                            (TBS."useForFinalScore" = false and SSS."finalScore" < TC."scoreToPassConditional") or
                            SSS."examBanned" = true or
                            SSS.suspended = true
                        )
                        and SSS.withdrew = false
                        and SSS.exempted = false
                        and SSS."examPostponed" = false
                        and (
                            ${trainingObjectTypeId}::TEXT IS NULL
                            OR sv."trainingObjectTypeId" = ${trainingObjectTypeId}
                        )
                        and (
                            ${trainingCourseId}::TEXT IS NULL
                            OR TC.id = ${trainingCourseId}
                        )
                        and not exists (
                            select 1
                            from "ql-dao-tao"."StudentSubjectScore" as SSS_pass
                                inner join "ql-dao-tao"."Student" S_pass on S_pass.id = SSS_pass."studentId"
                                inner join "ql-dao-tao"."SubjectVersion" sv_pass on sv_pass.id = SSS_pass."subjectVersionId"
                                inner join "ql-dao-tao"."FixedClass" FC_pass on FC_pass.id = S_pass."fixedClassId"
                                inner join "ql-dao-tao"."TrainingCourse" TC_pass on TC_pass.id = FC_pass."trainingCourseId"
                                inner join "ql-dao-tao"."CurriculumVersion" CV_pass on CV_pass.id = S_pass."curriculumVersionId"
                                inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV_pass on CV_pass.id = TBOCV_pass."curriculumVersionId"
                                inner join "ql-dao-tao"."TrainingBlockSubject" TBS_pass on TBOCV_pass.id = TBS_pass."trainingBlockOnCurriculumVersionId" and TBS_pass."subjectId" = sv_pass.id
                            where
                                SSS_pass."studentId" = SSS."studentId" and sv_pass.id = sv.id
                                and SSS_pass.withdrew = false
                                and SSS_pass.exempted = false
                                and SSS_pass."examPostponed" = false
                                and SSS_pass."examBanned" = false
                                and SSS_pass.suspended = false
                                and (
                                    (TBS_pass.graduation = true and SSS_pass."finalScore" >= TC_pass."scoreToPassGraduation" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPassGraduation") or
                                    (TBS_pass."useForFinalScore" = true and SSS_pass."finalScore" >= TC_pass."scoreToPass" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPass") or
                                    (TBS_pass."useForFinalScore" = false and SSS_pass."finalScore" >= TC_pass."scoreToPassConditional" or SSS_pass."manualFinalScore" >= TC_pass."scoreToPassConditional")
                                )
                        )
                    order by SSS."studentId", sv.id
                    `

    type SubjectAttempt = {
        semesterCode: string
        finalScore: number | null
    }

    type DebtSubject = {
        subjectCode: string
        subjectName: string
        subjectCredit: number
        attempts: SubjectAttempt[]
    }

    type StudentDebtSummary = {
        studentId: string
        studentCode: string
        fullname: string
        dateOfBirth: string
        fixedClassCode: string
        subjects: DebtSubject[]
    }

    const studentDebtMap = res.reduce(
        (acc, record) => {
            const {
                studentId,
                studentCode,
                fullname,
                dateOfBirth,
                fixedClassCode,
                subjectCode,
                subjectName,
                subjectCredit,
                semesterCode,
                finalScore,
            } = record

            if (!acc[studentId]) {
                acc[studentId] = {
                    studentId,
                    studentCode,
                    fullname,
                    dateOfBirth,
                    fixedClassCode,
                    subjects: {},
                }
            }

            if (!acc[studentId].subjects[subjectCode]) {
                acc[studentId].subjects[subjectCode] = {
                    subjectCode,
                    subjectName,
                    subjectCredit,
                    attempts: [],
                }
            }

            acc[studentId].subjects[subjectCode].attempts.push({ semesterCode, finalScore })

            return acc
        },
        {} as Record<
            string,
            {
                studentId: string
                studentCode: string
                fullname: string
                dateOfBirth: string
                fixedClassCode: string
                subjects: Record<string, DebtSubject>
            }
        >
    )

    const debtSummary: StudentDebtSummary[] = Object.values(studentDebtMap).map((student) => ({
        ...student,
        subjects: Object.values(student.subjects),
    }))

    const rows = debtSummary.flatMap((s) => {
        const totalDebtSubject = s.subjects.length
        const totalDebtCredit = Object.values(s.subjects).reduce(
            (acc, subject) => acc + subject.subjectCredit,
            0
        )

        return s.subjects.map((subject) => {
            const finalScores = subject.attempts.map((attempt) => attempt.finalScore)
            let type = 'THI LẠI'
            let note = 'Đã thi trượt 1 lần'

            if (finalScores[finalScores.length - 1] === null) {
                type = 'CHƯA THI'
                note = 'Chưa thi hoặc GV chưa nhập điểm thi'
            } else if (finalScores.length > 1) {
                type = 'HỌC LẠI'
                note = `Đã thi trượt ít nhất ${finalScores.length} lần`
            }

            return {
                studentCode: s.studentCode,
                fullname: s.fullname,
                dateOfBirth: s.dateOfBirth ? dayjs(s.dateOfBirth).format('DD/MM/YYYY') : '',
                fixedClassCode: s.fixedClassCode,
                totalDebtSubject,
                totalDebtCredit,
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                subjectCredit: subject.subjectCredit,
                semesters: subject.attempts.map((attempt) => attempt.semesterCode).join('/'),
                finalScores: subject.attempts
                    .map((attempt) => String(attempt.finalScore))
                    .join('/'),
                type,
                note,
            }
        })
    })

    const buffer = await getTemplateBuffer(prisma, 'THONG_KE_NO')
    const template = new XlsxTemplate(buffer)
    const sheetName = 'DS HV nợ môn'

    template.substitute(sheetName, {
        ĐTĐT: trainingObjectType.name,
        KHOÁ: trainingCourse.name,
        DATE: dayjs(date).format('DD/MM/YYYY'),
        data: rows.map((r, idx) => ({ no: idx + 1, ...r })),
    })

    const result = await template.generate({ type: 'arraybuffer' })

    const fileName = `thong_ke_no_${trainingObjectType.name}_${trainingCourse.name}.xlsx`
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
    })
})

export default app
