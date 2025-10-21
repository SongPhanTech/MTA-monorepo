import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AcademicActionType, type Prisma, StudentStatus } from '@workspace/db'
import { postDMNhanViens } from '@workspace/libs/api/system'
import { parseSheetHeQuanSu, parseSheetStudent, zParseSheetError } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import {
    calculateStudentSemesterResult,
    listStudentResultInfo,
    resultCourseStudentResult,
} from '../services/student-result.service'
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
                    universityGraduationYear: Number.parseInt(
                        student.universityGraduationYear ?? '0',
                        10
                    ),
                    universityMajor: student.universityMajor,
                    universityRank: student.universityRank,
                    basic: student.basic ? Number.parseFloat(student.basic) : null,
                    facility: student.facility ? Number.parseFloat(student.facility) : null,
                    foreignLanguage: student.foreignLanguage,
                    priorityReason: student.priorityReason,
                    description: student.description,
                }
                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
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
                    await tx.student.update({
                        where: { id: existing.id },
                        data: {
                            ...studentData,
                            userProfile: { update: profileData },
                        },
                    })

                    const res = await postDMNhanViens(
                        {
                            Id: existing.userProfileId,
                            bLaCanBoNhanVien: true,
                            bLaTaiKhoan: true,
                            dNgaySinh: profileData.dateOfBirth
                                ? new Date(profileData.dateOfBirth)?.toISOString()
                                : null,
                            sCCCD: profileData.idCardNumber,
                            sEmail: profileData.email,
                            sHoVaDem: profileData.lastName,
                            sTen: profileData.firstName,
                            sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                        },
                        {
                            headers: {
                                'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                                'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                            },
                        }
                    )
                    // .catch(console.error)
                    console.log(res.status, res.data)
                } else {
                    const profileId = crypto.randomUUID()
                    const st = await tx.student.create({
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

                    postDMNhanViens(
                        {
                            Id: profileId,
                            bLaCanBoNhanVien: true,
                            bLaTaiKhoan: true,
                            dNgaySinh: profileData.dateOfBirth?.toString(),
                            sCCCD: profileData.idCardNumber,
                            sEmail: profileData.email,
                            sHoVaDem: profileData.lastName,
                            sTen: profileData.firstName,
                            sDM_GioiTinhId: student.gender ? genderMap.get(student.gender) : null,
                        },
                        {
                            headers: {
                                'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                                'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                            },
                        }
                    ).catch(console.error)

                    if (student.department) {
                        await tx.quaTrinhCongTac.create({
                            data: {
                                userProfileId: st.userProfileId,
                                donVi: student.department,
                                diaChi: student.departmentAddress,
                                chucVuId: positionMap.get(student.position ?? ''),
                            },
                        })
                    }

                    if (student.universitySchool && student.universityMajor) {
                        await tx.quaTrinhHocTap.create({
                            data: {
                                userProfileId: st.userProfileId,
                                tenTruongId: dmTruong.get(student.universitySchool) as string,
                                nganhHocId: dmNganh.get(student.universityMajor) as string,
                                chuyenNganhId: dmChuyenNganh.get(student.universityMajor) as string,
                            },
                        })
                    }
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

export default app
