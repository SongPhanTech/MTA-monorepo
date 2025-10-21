import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '..'
import { $Enums, createId } from '@workspace/db'

const app = new OpenAPIHono({ strict: false })

const createNewExamList = createRoute({
    operationId: 'create-exams',
    tags: ['Exam'],
    path: '',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            isGroupBySubject: z.boolean(),
                            trainingObjectTypeId: z.string(),
                            semesterId: z.string(),
                        })
                        .openapi('CreateExamsRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Lên danh sách thi thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('CreateExamsResponse'),
                },
            },
        },
        400: {
            description: 'Lên danh sách thi thất bại',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            message: z.string(),
                        })
                        .openapi('CreateExamsBadResponse'),
                },
            },
        },
    },
})

app.openapi(createNewExamList, async (c) => {
    const { isGroupBySubject, trainingObjectTypeId, semesterId } = c.req.valid('json')

    const subjects = await prisma.subjectVersion.findMany({
        where: {
            subjectClass: {
                some: {
                    trainingObjectTypeId,
                    semesterId,
                    cancelled: false,
                    deletedAt: null,
                    enteredScore: true,
                },
            },
        },
        select: {
            subjectClass: {
                select: {
                    id: true,
                    subjectClassStudent: {
                        select: { id: true },
                        where: {
                            examBanned: false,
                            withdrew: false,
                            exempted: false,
                        },
                    },
                },
                where: {
                    // TODO: cần kiểu tra theo yêu cầu
                    examId: null,
                },
            },
        },
    })

    const exams = subjects.flatMap(({ subjectClass }) => {
        const id = createId()
        return subjectClass.map((cls) => ({
            examId: isGroupBySubject ? id : createId(),
            classId: cls.id,
            studentSubjectScoreIds: cls.subjectClassStudent.map((scs) => scs.id),
        }))
    })

    if (exams.length === 0) {
        return c.json(
            { success: false, message: 'Không có lớp học nào cần lên danh sách thi' },
            400
        )
    }

    const grouped = Object.groupBy(exams, (exam) => exam.examId)

    const groupedExams = Object.entries(grouped).map(([examId, items]) => ({
        examId,
        classIds: items?.map((i) => i.classId),
        studentSubjectScoreIds: items?.flatMap((i) => i.studentSubjectScoreIds),
    }))

    await prisma.$transaction(async (tx) => {
        await tx.exam.createMany({
            data: groupedExams.map(({ examId }) => ({ id: examId })),
        })

        await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."SubjectClass" AS c
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams.map(({ examId, classId }) => `('${classId}', '${examId}')`).join(',\n')}
            ) AS data("classId", "examId")
            WHERE c."id" = data."classId";
            `)

        await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams
                    .flatMap(({ examId, studentSubjectScoreIds }) =>
                        studentSubjectScoreIds.map((id) => `('${id}', '${examId}')`)
                    )
                    .join(',\n')}
            ) AS data("id", "examId")
            WHERE sss."id" = data."id";
            `)
    })

    return c.json({ success: true, message: 'Lên danh sách thi thành công' })
})

const createNewReexamList = createRoute({
    operationId: 'create-new-reexam-list',
    tags: ['Exam'],
    path: '/reexam-list',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            trainingObjectTypeId: z.string(),
                            semesterId: z.string(),
                        })
                        .openapi('CreateExamsRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Lên danh sách thi lại thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('CreateExamsResponse'),
                },
            },
        },
        400: {
            description: 'Lên danh sách thi lại thất bại',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            message: z.string(),
                        })
                        .openapi('CreateExamsBadResponse'),
                },
            },
        },
    },
})

app.openapi(createNewReexamList, async (c) => {
    const { trainingObjectTypeId, semesterId } = c.req.valid('json')

    const subjects = await prisma.subjectVersion.findMany({
        where: {
            subjectClass: {
                some: {
                    trainingObjectTypeId,
                    semesterId,
                    cancelled: false,
                    deletedAt: null,
                    enteredScore: true,
                    enteredExamScore: true,
                    type: $Enums.SubjectClassType.REEXAM,
                },
            },
        },
        select: {
            subjectClass: {
                select: {
                    id: true,
                    subjectClassStudent: {
                        select: { id: true },
                        where: {
                            examPostponed: true,
                            suspended: true,
                        },
                    },
                },
                where: {
                    // TODO: cần kiểu tra theo yêu cầu
                    examId: null,
                },
            },
        },
    })

    const exams = subjects.flatMap(({ subjectClass }) => {
        const id = createId()
        return subjectClass.map((cls) => ({
            examId: id,
            classId: cls.id,
            studentSubjectScoreIds: cls.subjectClassStudent.map((scs) => scs.id),
        }))
    })

    if (exams.length === 0) {
        return c.json(
            { success: false, message: 'Không có lớp học nào cần lên danh sách thi lại' },
            400
        )
    }

    const grouped = Object.groupBy(exams, (exam) => exam.examId)

    const groupedExams = Object.entries(grouped).map(([examId, items]) => ({
        examId,
        classIds: items?.map((i) => i.classId),
        studentSubjectScoreIds: items?.flatMap((i) => i.studentSubjectScoreIds),
    }))

    await prisma.$transaction(async (tx) => {
        await tx.exam.createMany({
            data: groupedExams.map(({ examId }) => ({ id: examId })),
        })

        await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."SubjectClass" AS c
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams.map(({ examId, classId }) => `('${classId}', '${examId}')`).join(',\n')}
            ) AS data("classId", "examId")
            WHERE c."id" = data."classId";
            `)

        await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams
                    .flatMap(({ examId, studentSubjectScoreIds }) =>
                        studentSubjectScoreIds.map((id) => `('${id}', '${examId}')`)
                    )
                    .join(',\n')}
            ) AS data("id", "examId")
            WHERE sss."id" = data."id";
            `)
    })

    return c.json({ success: true, message: 'Lên danh sách thi lại thành công' })
})

export default app
