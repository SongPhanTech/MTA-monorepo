import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import { parseSheetLecturer, zParseSheetError } from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import {
    buildDegreeRankTypeMapOrThrow,
    buildDegreeTypeMapOrThrow,
    buildGenderMapOrThrow,
    buildLecturerTypeMapOrThrow,
    buildOrgNameMapOrThrow,
} from '../utils'

const app = new OpenAPIHono({ strict: false })

const importLecturer = createRoute({
    operationId: 'import-lecturer',
    tags: ['Import'],
    path: '/import-lecturer',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import successfully',
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

app.openapi(importLecturer, async (c) => {
    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetLecturer(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const genderMap = await buildGenderMapOrThrow(
        prisma,
        data.lecturers.map(({ gender }) => gender)
    )

    const lecturerTypeMap = await buildLecturerTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ lecturerType }) => lecturerType)
    )

    const degreeTypeMap = await buildDegreeTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ degreeType }) => degreeType)
    )

    const degreeRankTypeMap = await buildDegreeRankTypeMapOrThrow(
        prisma,
        data.lecturers.map(({ degreeRankType }) => degreeRankType)
    )

    const organizationMap = await buildOrgNameMapOrThrow(
        prisma,
        data.lecturers.map(({ departmentOrganization }) => departmentOrganization)
    )

    const existingLecturer = await prisma.lecturer.findMany({
        where: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } },
        select: { id: true, code: true },
    })

    const existingLecturerMap = new Map(existingLecturer.map(({ code, id }) => [code, id]))

    const start = Date.now()
    await prisma.$transaction(
        async (tx) => {
            for (const lecturer of data.lecturers) {
                const lecturerData: Prisma.LecturerCreateInput = {
                    from: new Date(),
                    code: lecturer.code,
                    lecturerType: {
                        connect: { id: lecturerTypeMap.get(lecturer.lecturerType) },
                    },
                    organization: {
                        connect: {
                            Id: organizationMap.get(lecturer.departmentOrganization),
                        },
                    },
                    userProfile: {},
                    description: lecturer.description,
                }

                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
                        ...splitFullName(lecturer.fullname),
                        dateOfBirth: lecturer.dateOfBirth,
                        genderId: genderMap.get(lecturer.gender),
                        academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ''),
                        academicRankTypeId: degreeRankTypeMap.get(lecturer.degreeRankType ?? ''),
                        currentAddress: lecturer.currentAddress,
                        phoneNumber: lecturer.phoneNumber,
                        email: lecturer.email,
                        idCardNumber: lecturer.idCardNumber,
                    }

                const existingId = existingLecturerMap.get(lecturer.code)
                if (existingId) {
                    await tx.lecturer.update({
                        where: { id: existingId },
                        data: {
                            ...lecturerData,
                            userProfile: { update: profileData },
                        },
                    })
                } else {
                    await tx.lecturer.create({
                        data: {
                            ...lecturerData,
                            userProfile: {
                                connectOrCreate: {
                                    where: { idCardNumber: lecturer.idCardNumber },
                                    create: profileData,
                                },
                            },
                        },
                    })
                }
            }

            // TODO: sync with LSB
        },
        { timeout: timeout * 1000 }
    )

    return c.json(
        {
            message: `Import lecturers successfully: ${data.lecturers.length}`,
            time: Date.now() - start,
        },
        200
    )
})

export default app
