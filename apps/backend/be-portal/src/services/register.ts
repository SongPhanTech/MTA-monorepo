import { prisma } from ".."

export const findClassRegisterSession = async (userId: string) => {
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
          },
        },
      },
    },
  })

  // trainingCourseId => curriculumVersion
  const map = new Map(
    profile.educationAndTraining.map((course) => {
      const curriculumVersion = course.curriculumVersion || course.fixedClass?.curriculumVersion
      return [course.fixedClass?.trainingCourse.id, curriculumVersion]
    })
  )

  const now = new Date()
  const classRegisterSession = await prisma.classRegisterSession.findMany({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
      active: true,
      deletedAt: null,
      trainingCourses: {
        some: {
          id: {
            in: profile.educationAndTraining.map(
              (item) => item.fixedClass?.trainingCourse.id || ""
            ),
          },
        },
      },
    },
    include: {
      semester: { include: { schoolYear: true } },
      trainingCourses: { select: { id: true } },
      creditLimit: true,
    },
  })

  const sessions = classRegisterSession.map((session) => {
    const curriculumVersions = [...map]
      .filter(([trainingCourseId]) =>
        session.trainingCourses.some(({ id }) => id === trainingCourseId)
      )
      .map(([_, curriculumVersion]) => curriculumVersion)

    return { ...session, curriculumVersions }
  })

  return sessions
}
