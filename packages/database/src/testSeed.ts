import { PrismaClient } from '../generated/prisma-client'

const prisma = new PrismaClient()

const cls = await prisma.fixedClass.findFirst({
    include: {
        curriculumVersion: {
            include: {
                trainingBlocks: {
                    include: {
                        subjects: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                },
            },
        },
        students: {
            include: {
                curriculumVersion: {
                    include: {
                        trainingBlocks: {
                            include: {
                                subjects: {
                                    include: {
                                        subject: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
})

cls?.students.forEach((s) => {
    const curriculumVersion = s.curriculumVersion || cls.curriculumVersion

    const scores = curriculumVersion?.trainingBlocks.flatMap(({ subjects }) => subjects)
})
