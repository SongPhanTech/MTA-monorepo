import { prisma } from ".."

export class DeleteStudentError extends Error {
  status: 400 | 404 | 409 | 500

  constructor(message: string, status: 400 | 404 | 409 | 500 = 400) {
    super(message)
    this.name = "DeleteStudentError"
    this.status = status
  }
}

export async function deleteStudent(studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: {
      _count: {
        select: {
          subjectClassStudent: true,
          studentSemesterResult: true,
          studentYearResult: true,
        },
      },
    },
  })

  if (!student) {
    throw new DeleteStudentError("Không tìm thấy sinh viên", 404)
  }

  const hasScores =
    student._count.subjectClassStudent > 0 ||
    student._count.studentSemesterResult > 0 ||
    student._count.studentYearResult > 0

  if (hasScores) {
    throw new DeleteStudentError("Sinh viên đã có điểm hoặc kết quả học tập, không thể xóa!", 400)
  }

  const userProfileId = student.userProfileId
  const [lecturerCount, staffCount, otherStudentCount] = await Promise.all([
    prisma.lecturer.count({ where: { userProfileId, deletedAt: null } }),
    prisma.staff.count({ where: { userProfileId, deletedAt: null } }),
    prisma.student.count({
      where: { userProfileId, deletedAt: null, id: { not: studentId } },
    }),
  ])
  const profileShared = lecturerCount > 0 || staffCount > 0 || otherStudentCount > 0

  await prisma.student.delete({ where: { id: studentId } })

  if (!profileShared) {
    await prisma.quaTrinhCongTac.deleteMany({ where: { userProfileId } })
    await prisma.quaTrinhHocTap.deleteMany({ where: { userProfileId } })
    try {
      await prisma.userProfile.delete({ where: { id: userProfileId } })
    } catch {
      await prisma.userProfile.update({
        where: { id: userProfileId },
        data: {
          deletedAt: new Date(),
          active: false,
          code: `${userProfileId}-deleted`,
          idCardNumber: `${userProfileId}-deleted`,
          email: null,
        },
      })
    }
  }

  return { id: studentId, userProfileId }
}
