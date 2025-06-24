import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Gender, type Prisma } from '@workspace/db'
import { parseSheetHeQuanSu } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import {
    buildCurriculumMap,
    buildDistrictMap,
    buildEthnicityMap,
    buildNationalityMap,
    buildProvinceMap,
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
                    schema: z.object({
                        timeout: z.coerce.number().default(30),
                        file: z
                            .instanceof(File)
                            .refine(
                                (file) =>
                                    [
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                                        'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
                                        'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
                                        'application/vnd.ms-excel', // .xls
                                        'application/vnd.oasis.opendocument.spreadsheet', // .ods
                                    ].includes(file.type),
                                'Định dạng file không hỗ trợ'
                            )
                            .openapi({
                                type: 'string',
                                format: 'binary', // Required for OpenAPI file upload
                            }),
                    }),
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
                    schema: z.object({ message: z.string() }),
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

    const duplicateCodes = data.students
        .map((student) => student.code)
        .filter((code, index, arr) => arr.indexOf(code) !== index)

    if (duplicateCodes.length) {
        return c.json(
            { message: `Mã sinh viên bị trùng: ${duplicateCodes.join(', ')}` },
            400
        )
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
        return c.json(
            { message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` },
            400
        )
    }

    const ethnicityMap = await buildEthnicityMap(
        prisma,
        data.students.map((student) => student.ethnicity)
    )

    const nationalityMap = await buildNationalityMap(
        prisma,
        data.students.map((student) => student.nationality)
    )

    const provinceMap = await buildProvinceMap(
        prisma,
        data.students.map((student) => student.provinceHometown)
    )

    const districtMap = await buildDistrictMap(
        prisma,
        data.students.map((student) => student.districtHometown)
    )

    const curriculumVersionMap = await buildCurriculumMap(prisma, data.students)

    try {
        await prisma.$transaction(
            async (tx) => {
                for (const student of data.students) {
                    const existsFixedClass = await tx.fixedClass.findFirst({
                        where: {
                            name: student.fixedClass,
                            curriculumVersionId: curriculumVersionMap.get(
                                student.curriculum
                            ),
                        },
                    })

                    const fixedClass = existsFixedClass
                        ? existsFixedClass
                        : await tx.fixedClass.create({
                              data: {
                                  name: student.fixedClass,
                                  curriculumVersionId: curriculumVersionMap.get(
                                      student.curriculum
                                  ),
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
                                id: curriculumVersionMap.get(
                                    student.curriculum
                                ),
                            },
                        },
                    }
                    const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                        {
                            ...splitFullName(student.fullname),
                            // TODO: need to use idCardNumber
                            idCardNumber: student.code,
                            code: student.code,
                            gender:
                                student.gender === 'Nữ'
                                    ? Gender.Female
                                    : Gender.Male,
                            ethnicityId:
                                ethnicityMap.get(student.ethnicity || null) ||
                                null,
                            nationalityId:
                                nationalityMap.get(
                                    student.nationality || null
                                ) || null,
                            provinceHometownId:
                                provinceMap.get(
                                    student.provinceHometown || null
                                ) || null,
                            districtHometownId:
                                districtMap.get(
                                    student.districtHometown || null
                                ) || null,
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
    } catch (error) {
        console.log(error)
    }

    return c.json(
        { message: `Import students successfully: ${data.students.length}` },
        200
    )
})

export default app
