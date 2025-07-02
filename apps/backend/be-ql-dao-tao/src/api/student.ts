import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { Gender, type Prisma } from '@workspace/db'
import { parseSheetHeQuanSu, zParseSheetError } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import type { StudentTemplateData } from '../dto/student-info.dto'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import {
    listStudentInfo,
    populateExcelTemplate,
    sanitizeFilename,
} from '../services/scholarship.service'
import { getBufferFromUrl } from '../services/template.service'
import {
    buildCurriculumMapOrThrow,
    buildDistrictMapOrThrow,
    buildEthnicityMapOrThrow,
    buildNationalityMapOrThrow,
    buildProvinceMapOrThrow,
    getCurrentDateForReport,
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
                    schema: z.object({ message: z.string() }),
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

const dsRaSoatHocBongExcel = createRoute({
    operationId: 'exportStudentScholarship',
    path: '/export-xlsx-list-student-to-check-scholarship',
    tags: ['Student'],
    summary: 'Xuất file xlsx danh sách sinh viên trong rà soát học bổng',
    description: 'xuất tất cả học viên, sinh viên để rà soát',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kì học',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student scholarship as .xlsx',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },
        400: {
            description: 'Invalid file upload',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
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

const dsRaSoatHocBongJson = createRoute({
    operationId: 'exportStudentScholarshipJson',
    path: '/export-json-list-student-to-check-scholarship',
    tags: ['Student'],
    summary: 'Danh sách sinh viên trong rà soát học bổng',
    description: 'Xuất tất cả học viên, sinh viên đủ điều kiện học bổng dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kì học',
            }),
            scholarshipId: z.string().optional().openapi('scholarshipId', {
                description:
                    'ID của học bổng, nếu không sẽ hiển thị thông tin của tất cả sinh viên',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student scholarship as JSON',
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

const dsRaKyLuatHocTapJson = createRoute({
    operationId: 'exportStudentLearningDisciplineJson',
    path: '/export-json-list-student-to-check-learning-discipline',
    tags: ['Student'],
    summary: 'Danh sách sinh viên trong rà soát kỷ luật học tập',
    description: 'Xuất tất cả học viên, sinh viên đủ điều kiện kỷ luật dưới dạng JSON',
    method: 'get',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của kì học',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of student scholarship as JSON',
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

    await prisma.$transaction(
        async (tx) => {
            for (const student of data.students) {
                const existsFixedClass = await tx.fixedClass.findFirst({
                    where: {
                        name: student.fixedClass,
                        curriculumVersionId: curriculumVersionMap.get(student.curriculum),
                    },
                })

                const fixedClass = existsFixedClass
                    ? existsFixedClass
                    : await tx.fixedClass.create({
                          data: {
                              name: student.fixedClass,
                              curriculumVersionId: curriculumVersionMap.get(student.curriculum),
                              startYear: new Date().getFullYear(),
                              trainingCourseId: trainingCourse.id,
                          },
                      })

                const existingStudent = await tx.student.findFirst({
                    where: { code: student.code },
                })

                const studentData: Prisma.StudentCreateInput = {
                    trainingObjectType: {
                        connect: { id: trainingObjectType.id },
                    },
                    fixedClass: { connect: { id: fixedClass.id } },
                    curriculumVersion: {
                        connect: {
                            id: curriculumVersionMap.get(student.curriculum),
                        },
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
                        ethnicityId: ethnicityMap.get(student.ethnicity || null) || null,
                        nationalityId: nationalityMap.get(student.nationality || null) || null,
                        provinceHometownId:
                            provinceMap.get(student.provinceHometown || null) || null,
                        districtHometownId:
                            districtMap.get(student.districtHometown || null) || null,
                    }

                if (existingStudent) {
                    await tx.student.update({
                        where: { id: existingStudent.id },
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

    return c.json({ message: `Import students successfully: ${data.students.length}` }, 200)
})

app.openapi(dsRaSoatHocBongExcel, async (c) => {
    const { semesterId } = c.req.valid('query')
    const student = await listStudentInfo(semesterId)

    const { date, month, year } = getCurrentDateForReport()

    const templateData: StudentTemplateData = {
        date,
        month,
        year,
        student,
    }

    const templateBuffer = await getBufferFromUrl('SCHOLARSHIP_LIST')
    const excelBuffer = populateExcelTemplate(templateBuffer, templateData)

    // Set response headers
    const sanitizedClassName = sanitizeFilename('Class')
    return c.body(excelBuffer, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`DSLop_${sanitizedClassName}.xlsx`)}`,
    })
})

app.openapi(dsRaSoatHocBongJson, async (c) => {
    const { semesterId, scholarshipId } = c.req.valid('query')
    const students = await listStudentInfo(semesterId)

    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }

    return c.json(students, 200)
})

app.openapi(dsRaKyLuatHocTapJson, async (c) => {
    const { semesterId } = c.req.valid('query')
    const students = await listStudentInfo(semesterId)

    if (!students || students.length === 0) {
        return c.json({ message: 'Không có sinh viên nào trong danh sách' }, 404)
    }

    return c.json(students, 200)
})

export default app
