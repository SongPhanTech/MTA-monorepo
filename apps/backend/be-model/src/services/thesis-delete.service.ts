import { ThesisType } from "@workspace/db/client"
import type { Prisma } from "@workspace/db"
import { prisma } from ".."

export type DeleteStudentThesisParams = {
  thesisSessionId: string
  studentId: string
}

export type DeleteStudentThesisResult = {
  deleted: true
}

type Tx = Prisma.TransactionClient

async function hardDeleteThesisProject(tx: Tx, thesisProjectId: string) {
  const councilOnThesis = { thesis: { some: { id: thesisProjectId } } }

  await tx.paymentRecord.deleteMany({
    where: { councilMember: { council: councilOnThesis } },
  })
  await tx.invitation.deleteMany({
    where: { councilMember: { council: councilOnThesis } },
  })
  await tx.councilMember.deleteMany({
    where: { council: councilOnThesis },
  })

  await tx.thesisProject.update({
    where: { id: thesisProjectId },
    data: {
      supervisorPaymentId: null,
      coSupervisorPaymentId: null,
      singleSupervisorPaymentId: null,
      councilId: null,
    },
  })

  await tx.council.deleteMany({
    where: councilOnThesis,
  })

  await tx.documentFile.deleteMany({
    where: {
      OR: [
        { defenseRecord: { thesisId: thesisProjectId } },
        { librarySubmission: { thesisId: thesisProjectId } },
        { decision: { thesisProjectId } },
      ],
    },
  })
  await tx.defenseRecord.deleteMany({ where: { thesisId: thesisProjectId } })
  await tx.librarySubmission.deleteMany({ where: { thesisId: thesisProjectId } })
  await tx.decision.deleteMany({ where: { thesisProjectId } })

  await tx.supervisorPaymentRecord.deleteMany({
    where: {
      OR: [
        { thesisProjects: { some: { id: thesisProjectId } } },
        { coThesisProjects: { some: { id: thesisProjectId } } },
        { singleSupervisorPayment: { some: { id: thesisProjectId } } },
      ],
    },
  })

  await tx.thesisProject.delete({
    where: { id: thesisProjectId },
  })
}

export async function deleteStudentThesis(
  params: DeleteStudentThesisParams
): Promise<DeleteStudentThesisResult> {
  const { thesisSessionId, studentId } = params

  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }
  if (!studentId) {
    throw new Error("Không xác định được học viên.")
  }

  const registration = await prisma.studentThesisRegistration.findFirst({
    where: {
      studentId,
      deletedAt: null,
      thesisProject: {
        deletedAt: null,
        thesisSessionId,
        thesisType: ThesisType.THESIS,
      },
    },
    select: {
      id: true,
      thesisProjectId: true,
    },
  })

  if (!registration) {
    throw new Error("Không tìm thấy đăng ký luận văn để xóa")
  }

  const thesisProjectId = registration.thesisProjectId
  const registrationCouncil = { studentThesisRegistrationId: registration.id }

  await prisma.$transaction(async (tx) => {
    await tx.paymentRecord.deleteMany({
      where: { councilMember: { council: registrationCouncil } },
    })
    await tx.invitation.deleteMany({
      where: { councilMember: { council: registrationCouncil } },
    })
    await tx.councilMember.deleteMany({
      where: { council: registrationCouncil },
    })
    await tx.council.deleteMany({
      where: registrationCouncil,
    })

    await tx.studentThesisRegistration.delete({
      where: { id: registration.id },
    })

    const remainingRegistrations = await tx.studentThesisRegistration.count({
      where: { thesisProjectId },
    })

    if (remainingRegistrations === 0) {
      await hardDeleteThesisProject(tx, thesisProjectId)
    }
  })

  return { deleted: true }
}
