import { ThesisType } from "@workspace/db/client"
import { prisma } from ".."
import { expertVersionInclude } from "./expert-version"

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
              expertProfileVersion: {
                include: expertVersionInclude,
              },
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
        include: expertVersionInclude,
      },
      coSupervisor: {
        include: expertVersionInclude,
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
