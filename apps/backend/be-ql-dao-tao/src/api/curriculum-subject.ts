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
    path: '/import-phien-ban-ctdt',
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
                    }).openapi('importPhienBanCTĐT'),
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
    const { curriculumVersionId, trainingObjectTypeId } = c.req.valid('form')

    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    console.log(buf)
    const data = parseSheetSubject(buf)
    console.log(data)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    const trainingBlockMap = await buildTrainingBlockMapOrThrow(
        prisma,
        data.trainingBlocks.map(({ name }) => name)
    )

    const subjectMap = await buildSubjectMapOrThrow(
        prisma,
        data.trainingBlocks.flatMap(({ subjects }) =>
            subjects.map((s) => ({
                trainingObjectTypeId,
                ...s,
                type: s.subjectVersionType,
            }))
        )
    )

    const trainingBlocksWithId = data.trainingBlocks.map((trainingBlock) => ({
        id: createId(),
        ...trainingBlock,
    }))

    const trainingBlockOnCurriculumVersion: Prisma.TrainingBlockOnCurriculumVersionCreateManyInput[] =
        trainingBlocksWithId.map(({ id, name, priority }) => ({
            id,
            curriculumVersionId,
            trainingBlockId: trainingBlockMap.get(name) as string,
            priority,
        }))

    const trainingBlockSubjects: Prisma.TrainingBlockSubjectCreateManyInput[] =
        trainingBlocksWithId.flatMap(({ id, subjects }) =>
            subjects.map(({ name, credit, period, organizationCode, ...subjectType }) => ({
                id: createId(),
                trainingBlockOnCurriculumVersionId: id,
                subjectId: subjectMap.get(name) as string,
                ...subjectType,
            }))
        )

    await prisma.$transaction(
        async (tx) => {
            await tx.trainingBlockOnCurriculumVersion.deleteMany({
                where: { curriculumVersionId },
            })
            await tx.trainingBlockOnCurriculumVersion.createMany({
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
            message: `Import training blocks successfully: ${data.trainingBlocks.length}`,
        },
        200
    )
})

export default app
