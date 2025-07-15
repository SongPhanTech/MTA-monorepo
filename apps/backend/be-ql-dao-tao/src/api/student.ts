import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Gender, type Prisma } from '@workspace/db'
import { parseSheetHeQuanSu, zParseSheetError } from '@workspace/libs/parseExcel'
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
    buildDistrictMapOrThrow,
    buildEthnicityMapOrThrow,
    buildNationalityMapOrThrow,
    buildProvinceMapOrThrow,
} from '../utils'

const app = new OpenAPIHono({ strict: false })

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
                    }).openapi('importHeQuanSu'),
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
                description: 'ID của kì học',
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
                description: 'ID của kì học',
            }),
            type: z.enum(['scholarship', 'academicWarning', 'academicAction']).openapi('type', {
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
app.openapi(dsKetQuaHocKySinhVienJson, async (c) => {
    const { semesterId, type, academicActionType } = c.req.valid('query')
    const students = await listStudentResultInfo(semesterId)
    console.log(`Found ${students.length} students for semester ${semesterId}`)
    console.log(`Students: ${JSON.stringify(students, null, 2)}`)
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

    const districtMap = await buildDistrictMapOrThrow(
        prisma,
        data.students.map((student) => student.districtHometown)
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
                        // TODO: need to use idCardNumber
                        idCardNumber: student.code,
                        code: student.code,
                        gender: student.gender === 'Nữ' ? Gender.Female : Gender.Male,
                        ethnicityId: ethnicityMap.get(student.ethnicity ?? '') || null,
                        nationalityId: nationalityMap.get(student.nationality ?? '') || null,
                        provinceHometownId: provinceMap.get(student.provinceHometown ?? '') || null,
                        districtHometownId: districtMap.get(student.districtHometown ?? '') || null,
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
