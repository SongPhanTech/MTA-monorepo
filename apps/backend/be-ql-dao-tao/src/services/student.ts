import { TrainingObjectTypes } from '@workspace/db'
import { getTemplateBuffer } from '@workspace/libs/server'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'
import XlsxTemplate from 'xlsx-template'
import { prisma } from '..'

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

export async function generateStudentImportTemplate(): Promise<ArrayBuffer> {
    const minioUrl = (process.env.MINIO_ENDPOINT || 'https://minio.swantech.vn').replace(/\/$/, '')
    const templateUrl = `${minioUrl}/mta/template/MauImportDSHV.xlsx`

    const [
        templateResponse,
        provinces,
        trainingFields,
        trainingMajors,
        nationalities,
        ethnicities,
        genders,
    ] = await Promise.all([
        fetch(templateUrl),
        prisma.dM_Tinh_New.findMany({
            where: { bActive: true, bDeleted: false },
            select: { sTen: true },
            orderBy: { sTen: 'asc' },
        }),
        prisma.trainingField.findMany({
            select: { name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.trainingMajor.findMany({
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

    if (!templateResponse.ok) {
        throw new Error(`Không thể tải file template: ${templateResponse.status} ${templateUrl}`)
    }


    const buffer = await getTemplateBuffer(prisma, 'MauImportDSHV.xlsx')

    console.log(111,buffer.length);
    
    const template = new XlsxTemplate(buffer)

    
    // const templateBuffer = Buffer.from(await templateResponse.arrayBuffer())
    
    // const template = new XlsxTemplate(templateBuffer)
    const provinceList = provinces.map((p) => ({ value: p.sTen ?? 'abc' }));
    
        template.substitute('DanhMucTinh', { provinceList })

    // template.substitute('DanhMucTinh', { data: provinces.map((p) => ({ value: p.sTen ?? '' })) })
    console.log(123);
    
    // template.substitute('DanhMucNganh', { data: trainingFields.map((p) => ({ value: p.name ?? '' })) })
    // template.substitute('DanhMucGioiTinh', { data: genders.map((p) => ({ value: p.sTen ?? '' })) })
    // template.substitute('DanhMucQuocTich', { data: nationalities.map((p) => ({ value: p.sTen ?? '' })) })
    // template.substitute('DanhMucDanToc', { data: ethnicities.map((p) => ({ value: p.sTen ?? '' })) })
    // template.substitute('DanhMucChuyenNganh', { data: trainingMajors.map((p) => ({ value: p.name ?? '' })) })

    return template.generate({ type: 'arraybuffer' }) as Promise<ArrayBuffer>
}
