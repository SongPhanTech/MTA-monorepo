import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Prisma } from '@workspace/db'
import { postDMNhanViens, putDMNhanViens } from '@workspace/libs/api/system'
import {
    parseSheetHeQuanSu,
    parseSheetLecturer,
    parseSheetStudent,
    zParseSheetError,
} from '@workspace/libs/parseExcel'
import { splitFullName } from '@workspace/libs/utils'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import type { ErrorExtra } from '../types/error-extra'
import {
    buildCurriculumMapOrThrow,
    buildDegreeRankTypeMapOrThrow,
    buildDegreeTypeMapOrThrow,
    buildDMChuyenNganhMap,
    buildDMNganhMap,
    buildDMTruongMap,
    buildEthnicityMapOrThrow,
    buildGenderMapOrThrow,
    buildLecturerTypeMapOrThrow,
    buildNationalityMapOrThrow,
    buildOrgNameMapOrThrow,
    buildPositionMapOrThrow,
    buildProvinceMapOrThrow,
    buildRankMapOrThrow,
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

    const existingProfiles = await prisma.userProfile.findMany({
        where: {
            idCardNumber: {
                in: data.lecturers.map((lecturer) => lecturer.idCardNumber),
            },
        },
        select: { id: true, idCardNumber: true },
    })

    const existingProfileMap = new Map(
        existingProfiles.map(({ idCardNumber, id }) => [idCardNumber, id])
    )

    const existingLecturer = await prisma.lecturer.findMany({
        where: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } },
        select: { id: true, code: true, userProfileId: true },
    })

    const existingLecturerMap = new Map(
        existingLecturer.map(({ code, id, userProfileId }) => [code, { id, userProfileId }])
    )

    const start = Date.now()
    // await prisma.$transaction(
    //     async (tx) => {
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

        const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(lecturer.fullname),
            bLaGiangVien: true,
            bLaCanBoNhanVien: true,
            dateOfBirth: lecturer.dateOfBirth,
            genderId: genderMap.get(lecturer.gender),
            academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ''),
            academicRankTypeId: degreeRankTypeMap.get(lecturer.degreeRankType ?? ''),
            currentAddress: lecturer.currentAddress,
            phoneNumber: lecturer.phoneNumber,
            email: lecturer.email,
            idCardNumber: lecturer.idCardNumber,
        }

        const existingProfileId = existingProfileMap.get(lecturer.idCardNumber)
        if (existingProfileId) {
            const payload = {
                Id: existingProfileId,
                sMa: lecturer.code,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                dNgaySinh: lecturer.dateOfBirth
                    ? new Date(lecturer.dateOfBirth)?.toISOString()
                    : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? '',
                sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
            }
            console.log(payload)

            const res = await putDMNhanViens(payload, {
                headers: {
                    'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                    'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                },
            })

            const existing = existingLecturerMap.get(lecturer.code)
            if (existing) {
                // @ts-expect-error
                console.log('[LSB update User]:', res.status, res.data, res.data?.extra?.data)
                if (res.status === 200) {
                    await prisma.lecturer.update({
                        where: { id: existing.id },
                        data: {
                            ...lecturerData,
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
                await prisma.lecturer.create({
                    data: {
                        ...lecturerData,
                        userProfile: {
                            connectOrCreate: {
                                where: { idCardNumber: lecturer.idCardNumber },
                                create: { id: res.data as string, ...profileData },
                            },
                        },
                    },
                })
            }
        } else {
            // const profileId = crypto.randomUUID()
            const payload = {
                // Id: profileId,
                sMa: lecturer.idCardNumber,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                bLaTaiKhoan: true,
                dNgaySinh: lecturer.dateOfBirth
                    ? new Date(lecturer.dateOfBirth)?.toISOString()
                    : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? '',
                sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
            }
            console.log(payload)

            const res = await postDMNhanViens(payload, {
                headers: {
                    'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                    'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
                },
            })

            // @ts-expect-error
            console.log('[LSB create User]:', res.status, res.data, res.data?.extra?.data.Master)
            if (res.status === 200) {
                await prisma.lecturer.create({
                    data: {
                        ...lecturerData,
                        userProfile: {
                            connectOrCreate: {
                                where: { idCardNumber: lecturer.idCardNumber },
                                create: { id: res.data as string, ...profileData },
                            },
                        },
                    },
                })
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
            message: `Import lecturers successfully: ${data.lecturers.length}`,
            time: Date.now() - start,
        },
        200
    )
})

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
            deletedAt: null,
            active: true,
            OR: [
                {
                    trainingObjectTypeId: trainingObjectType.id,
                    name: data.trainingCourse as string,
                },
                {
                    trainingObjectTypeId: trainingObjectType.id,
                    code: data.trainingCourse as string,
                },
            ],
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

    const existingProfile = await prisma.userProfile.findMany({
        where: { idCardNumber: { in: data.students.map((student) => student.idCardNumber) } },
        select: { id: true, idCardNumber: true },
    })

    const existingProfileMap = new Map(
        existingProfile.map(({ idCardNumber, id }) => [idCardNumber, id])
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
            fixedClass: { connect: { id: fixedClassMap.get(student.fixedClass) } },
            curriculumVersion: { connect: { id: curriculumVersionMap.get(student.curriculum) } },
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
            bLaGiangVien: false,
            bLaHocVien: true,
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

        const existingProfile = existingProfileMap.get(student.idCardNumber)
        const existing = existingStudentMap.get(student.code)

        const createStudentFn = async () => {
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
        }

        if (existingProfile) {
            const res = await putDMNhanViens(
                {
                    Id: existingProfile,
                    sMa: student.idCardNumber,
                    bLaGiangVien: false,
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
            // @ts-expect-error
            console.log('[LSB update User]:', res.status, res.data, res.data?.extra?.data)
            if (existing) {
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
                await createStudentFn()
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
            // @ts-expect-error
            console.log('[LSB create User]:', res.status, res.data, res.data?.extra?.data.Master)

            if (res.status === 200) {
                await createStudentFn()
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
                    fixedClass: { connect: { id: fixedClassMap.get(student.fixedClass) } },
                    curriculumVersion: {
                        connect: { id: curriculumVersionMap.get(student.curriculum) },
                    },
                    userProfile: {},
                }
                const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput =
                    {
                        ...splitFullName(student.fullname),
                        bLaGiangVien: false,
                        bLaHocVien: true,
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
