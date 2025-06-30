import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createId, type Prisma } from '@workspace/db'
import { parseCurriculumSheet, zParseSheetError } from '@workspace/libs/parseExcel'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { buildSubjectMapOrThrow, buildTrainingBlockMapOrThrow } from '../utils'

const app = new OpenAPIHono({ strict: false })

const importCurriculumVersion = createRoute({
    operationId: 'import-phien-ban-CTDT',
    tags: ['Curriculum'],
    path: '/import-phien-ban-ctdt/{curriculumVersionId}',
    method: 'post',
    request: {
        params: z.object({ curriculumVersionId: z.string() }),
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        timeout: z.coerce.number().default(30),
                    }).openapi('importPhienBanCTĐT'),
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

app.openapi(importCurriculumVersion, async (c) => {
    const { curriculumVersionId } = c.req.valid('param')

    const { curriculum } = await prisma.curriculumVersion.findUniqueOrThrow({
        where: { id: curriculumVersionId },
        select: {
            curriculum: {
                select: { trainingMajor: { select: { name: true } } },
            },
        },
    })

    const { file, timeout } = c.req.valid('form')

    const buf = await file.arrayBuffer()
    const data = parseCurriculumSheet(buf)

    if (data.errors.length) {
        return c.json({ message: 'Lỗi khi đọc file', errors: data.errors }, 400)
    }

    if (data.trainingMajor !== curriculum.trainingMajor.name) {
        return c.json(
            {
                message: `Chuyên ngành đào tạo không khớp: ${data.trainingMajor} vs ${curriculum.trainingMajor.name}`,
            },
            400
        )
    }

    const trainingMajor = await prisma.trainingMajor.findFirst({
        where: { name: data.trainingMajor, active: true },
    })

    if (!trainingMajor) {
        return c.json({ message: `Đối tượng đào tạo không tồn tại: ${data.trainingMajor}` }, 400)
    }

    const trainingBlockMap = await buildTrainingBlockMapOrThrow(
        prisma,
        data.trainingBlocks.map(({ name }) => name)
    )

    const subjectMap = await buildSubjectMapOrThrow(
        prisma,
        data.trainingBlocks.flatMap(({ subjects }) => subjects)
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
