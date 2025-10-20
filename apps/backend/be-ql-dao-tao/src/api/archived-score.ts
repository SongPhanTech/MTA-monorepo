import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { $Enums, createId } from '@workspace/db'
import { prisma } from '..'

const app = new OpenAPIHono({ strict: false })

const certificateScore = createRoute({
    operationId: 'certificate-score',
    path: '/certificate-score',
    tags: ['ArchivedScore'],
    summary: 'Phiên điểm chứng chỉ',
    description: 'Phiên điểm chứng chi',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z
                        .object({ archivedCertificateIds: z.string().array() })
                        .openapi('CertificateIds'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('CertificateIdsResult'),
                },
            },
        },
        400: {
            description: 'Invalid request',
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

app.openapi(certificateScore, async (c) => {
    const { archivedCertificateIds } = c.req.valid('json')

    const certificates = await prisma.certificate.findMany({
        where: {
            archivedCertificate: { some: { id: { in: archivedCertificateIds } } },
            deletedAt: null,
            active: true,
        },
        include: {
            subjects: {
                include: {
                    subject: {
                        include: {
                            subjectVersion: true,
                        },
                    },
                },
            },
        },
    })

    const certMap = new Map(
        certificates.map((cert) => {
            const subjectVersions = cert.subjects.flatMap((s) =>
                s.subject.subjectVersion.map((sv) => ({
                    // subjectId: s.subjectId,
                    subjectVersionId: sv.id,
                    finalScore: s.finalScore,
                }))
            )

            return [cert.id, subjectVersions]
        })
    )

    const archivedCertificates = await prisma.archivedCertificate.findMany({
        where: {
            id: { in: archivedCertificateIds },
            active: true,
        },
        include: {
            student: {
                include: {
                    curriculumVersion: {
                        include: {
                            trainingBlocks: {
                                include: { subjects: true },
                            },
                        },
                    },
                    fixedClass: {
                        include: {
                            curriculumVersion: {
                                include: {
                                    trainingBlocks: {
                                        include: { subjects: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    const translateSubjectScore = archivedCertificates.flatMap((archived) => {
        const curriculumVersion =
            archived.student.curriculumVersion || archived.student.fixedClass?.curriculumVersion

        const cert = certMap.get(archived.id)

        if (!curriculumVersion || !cert) {
            return []
        }

        const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) =>
            subjects.map(({ subjectId }) => subjectId)
        )

        const translateSubject = cert
            .filter(({ subjectVersionId }) => curriculumSubjects.includes(subjectVersionId))
            .map(({ subjectVersionId, finalScore }) => ({
                id: createId(),
                archivedCertificateId: archived.id,
                studentId: archived.studentId,
                subjectVersionId,
                manualFinalScore: finalScore,
            }))

        return translateSubject
    })

    await prisma.$transaction(async (tx) => {
        await tx.studentSubjectScore.createMany({
            data: translateSubjectScore,
        })

        await tx.archivedCertificateOnStudentSubjectScore.createMany({
            data: translateSubjectScore.map(({ id, archivedCertificateId }) => ({
                studentSubjectScoreId: id,
                archivedCertificateId,
            })),
        })

        await tx.archivedCertificate.updateMany({
            where: { id: { in: archivedCertificateIds } },
            data: { status: $Enums.ArchivedCertificateStatus.APPROVED },
        })
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

const awardScore = createRoute({
    operationId: 'award-score',
    path: '/award-score',
    tags: ['ArchivedScore'],
    summary: 'Cộng điểm giải thưởng',
    description: 'Cộng điểm giải thưởng',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({ archivedAwardIds: z.string().array() }).openapi('AwardIds'),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: z
                        .object({
                            success: z.boolean(),
                            message: z.string(),
                        })
                        .openapi('AwardIdsResult'),
                },
            },
        },
        400: {
            description: 'Invalid request',
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

app.openapi(awardScore, async (c) => {
    const { archivedAwardIds } = c.req.valid('json')

    const awards = await prisma.award.findMany({
        where: {
            archivedAward: { some: { id: { in: archivedAwardIds } } },
            deletedAt: null,
            active: true,
        },
        include: {
            subjects: {
                include: {
                    subjectVersion: true,
                },
            },
        },
    })

    const awardMap = new Map(
        awards.map((award) => {
            const subjectVersions = award.subjects.flatMap((s) =>
                s.subjectVersion.map((sv) => ({
                    subjectVersionId: sv.id,
                    bonusScore: award.bonusScore,
                }))
            )

            return [award.id, subjectVersions]
        })
    )

    const archivedCertificates = await prisma.archivedCertificate.findMany({
        where: {
            id: { in: archivedAwardIds },
            active: true,
        },
        include: {
            student: {
                include: {
                    curriculumVersion: {
                        include: {
                            trainingBlocks: {
                                include: { subjects: true },
                            },
                        },
                    },
                    fixedClass: {
                        include: {
                            curriculumVersion: {
                                include: {
                                    trainingBlocks: {
                                        include: { subjects: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    const bonusSubjectScore = archivedCertificates.flatMap((archived) => {
        const curriculumVersion =
            archived.student.curriculumVersion || archived.student.fixedClass?.curriculumVersion

        const award = awardMap.get(archived.id)

        if (!curriculumVersion || !award) {
            return []
        }

        const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) =>
            subjects.map(({ subjectId }) => subjectId)
        )

        const translateSubject = award
            .filter(({ subjectVersionId }) => curriculumSubjects.includes(subjectVersionId))
            .map(({ subjectVersionId, bonusScore }) => ({
                studentId: archived.studentId,
                subjectVersionId,
                bonusScore,
            }))

        return translateSubject
    })

    return c.json({ success: true, message: 'Success' }, 200)
})

export default app
