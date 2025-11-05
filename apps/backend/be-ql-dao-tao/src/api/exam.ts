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

    const subjectClasses = await prisma.subjectClass.findMany({
        where: {
            trainingObjectTypeId,
            semesterId,
            cancelled: false,
            deletedAt: null,
            enteredScore: true,
            status: 'OFFICIAL',
            active: true,
            type: $Enums.SubjectClassType.NORMAL,
            examId: null,
        },
        select: {
            id: true,
            subjectId: true,
            subjectClassStudent: {
                select: {
                    id: true,
                },
            },
            roomId: true,
        },
    })

    const mapExamToSubjectClass: Record<string, string> = {}
    const exams = subjectClasses.map(({ id, subjectId }) => {
        if (mapExamToSubjectClass) {
            if (!mapExamToSubjectClass?.[subjectId]) {
                mapExamToSubjectClass[subjectId] = createId()
            }
        }
        const examId = isGroupBySubject ? mapExamToSubjectClass[subjectId] : createId()
        return {
            examId: examId as string,
            subjectClassId: id,
            subjectId: subjectId,
        }
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
        subjectId: items?.[0]?.subjectId ?? '',
        classIds: items?.map((i) => i.subjectClassId),
    }))

    await prisma.$transaction(async (tx) => {
        await tx.exam.createMany({
            data: groupedExams.map(({ examId, subjectId }) => ({
                id: examId,
                subjectVersionId: subjectId,
            })),
        })
    })

    return c.json({ success: true, message: 'Lên danh sách thi thành công' })
})

const createNewReExamList = createRoute({
    operationId: 'create-new-re-exam-list',
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
                        .openapi('CreateReExamsRequest'),
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

app.openapi(createNewReExamList, async (c) => {
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
                    subjectId: true,
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
            subjectId: cls.subjectId,
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
        subjectId: items?.[0]?.subjectId ?? '',
    }))

    await prisma.$transaction(async (tx) => {
        await tx.exam.createMany({
            data: groupedExams.map(({ examId, subjectId }) => ({
                id: examId,
                subjectVersionId: subjectId,
            })),
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

const mergeExam = createRoute({
    operationId: 'merge-exam',
    tags: ['Exam'],
    path: '/merge',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examIds: z.array(z.string()).min(2),
                        })
                        .openapi('MergeExamRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Ghép kỳ thi thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('MergeExamResponse'),
                },
            },
        },
        400: {
            description: 'Ghép kỳ thi thất bại',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            message: z.string(),
                        })
                        .openapi('MergeExamBadResponse'),
                },
            },
        },
    },
})

app.openapi(mergeExam, async (c) => {
    const { examIds } = c.req.valid('json')

    const classes = await prisma.subjectClass.findMany({
        where: {
            examId: { in: examIds },
            cancelled: false,
            deletedAt: null,
            status: 'OFFICIAL',
        },
        select: {
            id: true,
            examId: true,
            subjectId: true,
            subjectClassStudent: {
                select: { id: true },
                where: {
                    examBanned: false,
                    withdrew: false,
                    exempted: false,
                },
            },
        },
    })

    const subjectVersionIds = [...new Set(classes.map((cls) => cls.subjectId))]
    if (subjectVersionIds.length > 1) {
        return c.json(
            {
                success: false,
                message: 'Chỉ có thể ghép các kỳ thi cùng môn học',
            },
            400
        )
    }

    const subjectVersionId = subjectVersionIds[0] as string

    const newExamId = createId()

    const classIds = classes.map((cls) => cls.id)
    const studentSubjectScoreIds = classes.flatMap((cls) =>
        cls.subjectClassStudent.map((scs) => scs.id)
    )

    await prisma.$transaction(async (tx) => {
        await tx.exam.create({
            data: { id: newExamId, subjectVersionId },
        })
        await tx.subjectClass.updateMany({
            where: { id: { in: classIds } },
            data: { examId: newExamId },
        })
        // await tx.$executeRawUnsafe(`
        //     UPDATE "ql-dao-tao"."SubjectClass"
        //     SET "examId" = '${newExamId}'
        //     WHERE "id" IN (${classIds.map((id) => `'${id}'`).join(', ')});
        // `)
        if (studentSubjectScoreIds.length > 0) {
            await tx.studentSubjectScore.updateMany({
                where: { id: { in: studentSubjectScoreIds } },
                data: { examId: newExamId },
            })
            // await tx.$executeRawUnsafe(`
            //     UPDATE "ql-dao-tao"."StudentSubjectScore"
            //     SET "examId" = '${newExamId}'
            //     WHERE "id" IN (${studentSubjectScoreIds.map((id) => `'${id}'`).join(', ')});
            // `)
        }
        await tx.exam.deleteMany({
            where: { id: { in: examIds } },
        })
    })

    return c.json({ success: true, message: 'Ghép kỳ thi thành công' })
})

const unmergeExam = createRoute({
    operationId: 'unmerge-exam',
    tags: ['Exam'],
    path: '/unmerge',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({
                            examId: z.string(),
                        })
                        .openapi('UnmergeExamRequest'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Tách kỳ thi thành công',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('UnmergeExamResponse'),
                },
            },
        },
        400: {
            description: 'Tách kỳ thi thất bại',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            message: z.string(),
                        })
                        .openapi('UnmergeExamBadResponse'),
                },
            },
        },
    },
})

app.openapi(unmergeExam, async (c) => {
    const { examId } = c.req.valid('json')

    const classes = await prisma.subjectClass.findMany({
        where: {
            examId,
            cancelled: false,
            deletedAt: null,
            status: 'OFFICIAL',
        },
        select: {
            id: true,
            subjectId: true,
            subjectClassStudent: {
                select: { id: true },
                where: {
                    examBanned: false,
                    withdrew: false,
                    exempted: false,
                },
            },
        },
    })

    if (classes.length === 1) {
        return c.json(
            {
                success: false,
                message: 'Kỳ thi chỉ có 1 lớp, không cần tách',
            },
            400
        )
    }

    const subjectVersionId = classes?.[0]?.subjectId as string

    const newExams = classes.map((cls) => ({
        examId: createId(),
        classId: cls.id,
        studentSubjectScoreIds: cls.subjectClassStudent.map((scs) => scs.id),
    }))

    const newExamIds = newExams.map((e) => e.examId)

    await prisma.$transaction(async (tx) => {
        await tx.exam.createMany({
            data: newExamIds.map((id) => ({ id, subjectVersionId })),
        })

        await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."SubjectClass" AS c
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${newExams.map(({ examId, classId }) => `('${classId}', '${examId}')`).join(',\n')}
            ) AS data("classId", "examId")
            WHERE c."id" = data."classId";
        `)

        const studentUpdates = newExams.flatMap(({ examId, studentSubjectScoreIds }) =>
            studentSubjectScoreIds.map((id) => `('${id}', '${examId}')`)
        )

        if (studentUpdates.length > 0) {
            await tx.$executeRawUnsafe(`
                UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
                SET "examId" = data."examId"
                FROM (
                    VALUES
                    ${studentUpdates.join(',\n')}
                ) AS data("id", "examId")
                WHERE sss."id" = data."id";
            `)
        }

        await tx.exam.delete({
            where: { id: examId },
        })
    })

    return c.json({
        success: true,
        message: 'Đã tách kỳ thi thành công',
    })
})

export default app
