import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId, type Prisma } from '@workspace/db'
import { parseSheetSubject, zParseSheetError } from '@workspace/libs/parseExcel'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { buildSubjectMapOrThrow, buildTrainingBlockMapOrThrow } from '../utils'

const app = new OpenAPIHono({ strict: false })

const importCurriculumVersion = createRoute({
    operationId: 'import-phien-ban-CTDT-Subject',
    tags: ['Curriculum'],
    path: '/import-phien-ban-ctdt-subject',
    method: 'post',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        trainingObjectTypeId: z.string(),
                        curriculumVersionId: z.string(),
                        createNewSubjects: z.coerce.boolean().default(false),
                        timeout: z.coerce.number().default(30),
                    }).openapi('importPhienBanCTDTSubject'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Import successfully',
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

app.openapi(importCurriculumVersion, async (c) => {
    const { curriculumVersionId, trainingObjectTypeId, file, timeout, createNewSubjects } =
        c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseSheetSubject(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const uniqueTrainingBlockNames = [
        ...new Set(data.subjects.map(({ trainingBlockName }) => trainingBlockName)),
    ]

    const trainingBlockMap = await buildTrainingBlockMapOrThrow(prisma, uniqueTrainingBlockNames)

    const subjectMap = await buildSubjectMapOrThrow(
        prisma,
        data.subjects.map((s) => ({
            trainingObjectTypeId,
            ...s,
            type: s.subjectVersionType,
        })),
        createNewSubjects
    )

    const curriculumTrainingBlock = new Map(
        uniqueTrainingBlockNames.map((trainingBlock) => [trainingBlock, createId()])
    )
    // electiveCreditsRequired: 0 // TODO: read sheet 2

    const trainingBlockOnCurriculumVersion: Prisma.TrainingBlockOnCurriculumVersionCreateManyInput[] =
        Array.from(curriculumTrainingBlock.entries()).map(([name, id]) => ({
            id,
            curriculumVersionId,
            trainingBlockId: trainingBlockMap.get(name) as string,
            // priority,
        }))

    const trainingBlockSubjects: Prisma.TrainingBlockSubjectCreateManyInput[] = data.subjects.map(
        ({ name, trainingBlockName, semester, type, useForFinalScore, graduation }) => ({
            id: createId(),
            trainingBlockOnCurriculumVersionId: curriculumTrainingBlock.get(
                trainingBlockName
            ) as string,
            subjectId: subjectMap.get(name) as string,
            semester,
            type,
            useForFinalScore,
            graduation,
        })
    )

    await prisma.$transaction(
        async (tx) => {
            await tx.trainingBlockOnCurriculumVersion.deleteMany({
                where: { curriculumVersionId },
            })
            const d = await tx.trainingBlockOnCurriculumVersion.createMany({
                data: trainingBlockOnCurriculumVersion,
            })

            await tx.trainingBlockSubject.createMany({
                data: trainingBlockSubjects,
            })
        },
        { timeout: timeout * 1000 }
    )

    return c.json(
        {
            message: `Import training blocks successfully: ${uniqueTrainingBlockNames.length}`,
        },
        200
    )
})

export default app
