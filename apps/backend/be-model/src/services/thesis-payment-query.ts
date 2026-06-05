import { ThesisType } from "@workspace/db/client"
import { prisma } from ".."

export function thesisProjectWhere(thesisSessionId: string, studentIds?: string[]) {
  return {
    deletedAt: null,
    thesisType: ThesisType.THESIS,
    thesisSessionId,
    ...(studentIds?.length
      ? {
          registrations: {
            some: {
              deletedAt: null,
              studentId: { in: studentIds },
            },
          },
        }
      : {}),
  } as const
}

export async function loadThesisProjectsForPayment(thesisSessionId: string, studentIds?: string[]) {
  return prisma.thesisProject.findMany({
    where: thesisProjectWhere(thesisSessionId, studentIds),
    include: {
      thesisSession: {
        include: {
          configPayment: {
            include: {
              councilPayAmounts: true,
              supervisorPayAmounts: true,
            },
          },
        },
      },
      organization: true,
      council: {
        include: {
          members: {
            include: {
              expert: {
                include: {
                  lecturer: {
                    include: {
                      userProfile: true,
                    },
                  },
                },
              },
              payment: true,
            },
          },
        },
      },
      supervisor: {
        include: {
          academicRankType: true,
          academicDegreeType: true,
          lecturer: {
            include: {
              userProfile: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                },
              },
            },
          },
        },
      },
      coSupervisor: {
        include: {
          academicRankType: true,
          academicDegreeType: true,
          lecturer: {
            include: {
              userProfile: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                },
              },
            },
          },
        },
      },
      supervisorPayment: true,
      coSupervisorPayment: true,
      singleSupervisorPayment: true,
      registrations: {
        where: { deletedAt: null },
        include: {
          student: {
            include: {
              userProfile: true,
              fixedClass: {
                include: {
                  trainingCourse: {
                    include: { trainingObjectType: true },
                  },
                  curriculumVersion: {
                    include: {
                      curriculum: {
                        include: {
                          trainingMajor: {
                            include: { organization: true },
                          },
                        },
                      },
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
}
