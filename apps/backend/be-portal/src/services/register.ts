import { prisma } from '..'

export const findClassRegisterSession = async (userId: string) => {
    const currentYear = new Date().getFullYear()
    const profile = await prisma.userProfile.findUniqueOrThrow({
        where: { id: userId },
        include: {
            educationAndTraining: {
                include: {
                    curriculumVersion: true,
                    fixedClass: {
                        include: {
                            trainingCourse: true,
                            curriculumVersion: true,
                        },
                        where: {
                            trainingCourse: {
                                endYear: { lte: currentYear },
                            },
                        },
                    },
                },
            },
        },
    })

    // trainingCourseId => curriculumVersion
    const map = new Map(
        profile.educationAndTraining.map((course) => {
            const curriculumVersion =
                course.curriculumVersion || course.fixedClass?.curriculumVersion
            return [course.fixedClass?.trainingCourse.id, curriculumVersion]
        })
    )

    const now = new Date()
    const classRegisterSession = await prisma.classRegisterSession.findMany({
        where: {
            startDate: { lte: now },
            endDate: { gte: now },
            trainingCourses: {
                some: {
                    id: {
                        in: profile.educationAndTraining.map(
                            (item) => item.fixedClass?.trainingCourse.id || ''
                        ),
                    },
                },
            },
        },
        include: {
            semester: { include: { schoolYear: true } },
            trainingCourses: { select: { id: true } },
        },
    })

    return classRegisterSession
}
