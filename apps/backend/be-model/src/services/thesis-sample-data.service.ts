import { CouncilProposalStatus, FixedClassType, ThesisType } from "@workspace/db/client"
import { prisma } from ".."

export type CreateSampleThesisDataParams = {
  thesisSessionId: string
  studentIds: string[]
}

export type CreateSampleThesisDataResult = {
  createdCount: number
}

function studentHasThesisInSession(
  student: {
    thesisRegistrations: Array<{
      thesisProject: {
        deletedAt: Date | null
        thesisType: ThesisType
        thesisSessionId: string | null
      } | null
    }>
  },
  thesisSessionId: string
) {
  return student.thesisRegistrations.some((registration) => {
    const project = registration.thesisProject
    if (!project || project.deletedAt) return false
    return project.thesisType === ThesisType.THESIS && project.thesisSessionId === thesisSessionId
  })
}

export async function createSampleThesisData(
  params: CreateSampleThesisDataParams
): Promise<CreateSampleThesisDataResult> {
  const { thesisSessionId, studentIds } = params
  const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))]

  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }
  if (uniqueStudentIds.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một sinh viên.")
  }

  const session = await prisma.thesisSession.findFirst({
    where: { id: thesisSessionId, deletedAt: null },
    select: { id: true },
  })
  if (!session) {
    throw new Error("Không tìm thấy đợt luận văn.")
  }

  const students = await prisma.student.findMany({
    where: { id: { in: uniqueStudentIds }, deletedAt: null },
    select: {
      id: true,
      fixedClass: { select: { classType: true } },
      curriculumVersion: {
        select: {
          curriculum: {
            select: {
              trainingMajor: {
                select: { organization: { select: { Id: true } } },
              },
            },
          },
        },
      },
      thesisRegistrations: {
        where: { deletedAt: null },
        select: {
          thesisProject: {
            select: {
              deletedAt: true,
              thesisType: true,
              thesisSessionId: true,
            },
          },
        },
      },
    },
  })

  if (students.length !== uniqueStudentIds.length) {
    throw new Error("Một số sinh viên không tồn tại hoặc đã bị xóa.")
  }

  if (students.some((student) => studentHasThesisInSession(student, thesisSessionId))) {
    throw new Error("Không thể tạo cho sinh viên đã có luận văn/đề án trong đợt.")
  }

  const createdCount = await prisma.$transaction(async (tx) => {
    let count = 0
    for (const student of students) {
      const organizationId =
        student.curriculumVersion?.curriculum?.trainingMajor?.organization?.Id ?? null
      const typeLabel =
        student.fixedClass?.classType === FixedClassType.APPLICATION ? "Đề án" : "Luận văn"

      const council = await tx.council.create({
        data: {
          proposedDate: new Date(),
          status: CouncilProposalStatus.PENDING,
        },
      })

      await tx.thesisProject.create({
        data: {
          title: "",
          summary: "",
          titleEN: "",
          maxStudents: 1,
          language: "Tiếng Việt",
          type: typeLabel,
          organizationId,
          thesisSessionId,
          thesisType: ThesisType.THESIS,
          councilId: council.id,
          librarySubmission: {
            create: {
              isHardcopy: false,
              isSoftcopy: false,
              librarianNote: "",
            },
          },
          defenseRecord: {
            create: {
              isProfileComplete: false,
            },
          },
          registrations: {
            create: {
              studentId: student.id,
            },
          },
        },
      })
      count += 1
    }
    return count
  })

  return { createdCount }
}
