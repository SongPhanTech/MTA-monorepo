import { prisma } from ".."

/**
 * Xóa cứng lớp môn học và toàn bộ dữ liệu liên quan
 * (SV trong lớp, TKB, lịch sử, đề thi, điểm danh, khảo sát, tiết học, log ĐK, điểm liên kết…).
 */
export async function deleteSubjectClassCascade(subjectClassId: string) {
  const subjectClass = await prisma.subjectClass.findFirst({
    where: { id: subjectClassId },
    select: {
      id: true,
      code: true,
      name: true,
      scoreLinkSubjectVersionId: true,
    },
  })

  if (!subjectClass) {
    throw new Error("Lớp môn học không tồn tại")
  }

  await prisma.$transaction(
    async (tx) => {
      const scoreIds = (
        await tx.studentSubjectScore.findMany({
          where: { subjectClassId },
          select: { id: true },
        })
      ).map((row) => row.id)

      const attendanceIds = (
        await tx.subjectClassAttendance.findMany({
          where: { subjectClassId },
          select: { id: true },
        })
      ).map((row) => row.id)

      const surveyIds = (
        await tx.survey.findMany({
          where: { subjectClassId },
          select: { id: true },
        })
      ).map((row) => row.id)

      const examBankIds = (
        await tx.examBank.findMany({
          where: { subjectClassId },
          select: { id: true },
        })
      ).map((row) => row.id)

      const scheduleIds = (
        await tx.classSchedule.findMany({
          where: { subjectClassId },
          select: { id: true },
        })
      ).map((row) => row.id)

      // --- Điểm danh ---
      if (attendanceIds.length > 0) {
        await tx.subjectClassAttendanceStudent.deleteMany({
          where: { subjectClassAttendanceId: { in: attendanceIds } },
        })
        await tx.subjectClassAttendance.deleteMany({
          where: { id: { in: attendanceIds } },
        })
      }

      // --- Thời khoá biểu ---
      if (scheduleIds.length > 0) {
        await tx.subjectClassAttendance.deleteMany({
          where: { classScheduleId: { in: scheduleIds } },
        })
        // Gỡ quan hệ học bù trước khi xóa
        await tx.classSchedule.updateMany({
          where: { id: { in: scheduleIds }, originalScheduleId: { not: null } },
          data: { originalScheduleId: null },
        })
        await tx.classSchedule.deleteMany({
          where: { id: { in: scheduleIds } },
        })
      }

      await tx.subjectClassTime.deleteMany({ where: { subjectClassId } })
      await tx.subjectClassHistory.deleteMany({ where: { subjectClassId } })
      await tx.classRegisterLogs.deleteMany({ where: { subjectClassId } })

      // --- ExamBank (+ ExamBankQuestion cascade) ---
      if (examBankIds.length > 0) {
        await tx.examBankQuestion.deleteMany({
          where: { examBankId: { in: examBankIds } },
        })
        await tx.examBank.deleteMany({
          where: { id: { in: examBankIds } },
        })
      }

      // --- Survey ---
      if (surveyIds.length > 0) {
        const sessionIds = (
          await tx.surveySession.findMany({
            where: { surveyId: { in: surveyIds } },
            select: { id: true },
          })
        ).map((row) => row.id)

        if (sessionIds.length > 0) {
          await tx.surveyResponse.deleteMany({
            where: { surveySessionId: { in: sessionIds } },
          })
          await tx.surveySession.deleteMany({
            where: { id: { in: sessionIds } },
          })
        }

        for (const surveyId of surveyIds) {
          await tx.survey.update({
            where: { id: surveyId },
            data: {
              surveyObjectType: { set: [] },
              surveyChoice: { set: [] },
              surveyQuestion: { set: [] },
            },
          })
        }
        await tx.survey.deleteMany({ where: { id: { in: surveyIds } } })
      }

      // --- Sinh viên / điểm lớp ---
      if (scoreIds.length > 0) {
        await tx.studentSubjectScoreHistory.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.archivedCertificateOnStudentSubjectScore.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.archivedAwardOnStudentSubjectScore.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.scoreCorrectionItem.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.examPaper.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.studentResearchTopic.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.studentInternship.deleteMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
        })
        await tx.studentThesisRegistration.updateMany({
          where: { studentSubjectScoreId: { in: scoreIds } },
          data: { studentSubjectScoreId: null },
        })

        // M2M tốt nghiệp
        for (const scoreId of scoreIds) {
          await tx.studentSubjectScore.update({
            where: { id: scoreId },
            data: {
              graduationGpaScores: { set: [] },
              graduationSupplementaryScore: { set: [] },
            },
          })
        }

        await tx.studentSubjectScore.deleteMany({
          where: { id: { in: scoreIds } },
        })
      }

      const scoreLinkId = subjectClass.scoreLinkSubjectVersionId

      // Gỡ quan hệ M2M / FK trước khi xóa SubjectClass
      await tx.thesisProject.updateMany({
        where: { subjectClassId },
        data: { subjectClassId: null },
      })
      await tx.subjectClass.update({
        where: { id: subjectClassId },
        data: {
          fixedClasses: { set: [] },
          surveyObjectTypes: { set: [] },
          defenseRooms: { set: [] },
          expert: { set: [] },
          scoreLinkSubjectVersionId: null,
          examId: null,
        },
      })

      if (scoreLinkId) {
        await tx.scoreLinkStudent.deleteMany({
          where: { scoreLinkSubjectVersionId: scoreLinkId },
        })
        await tx.scoreLinkSubjectVersion.delete({
          where: { id: scoreLinkId },
        })
      }

      await tx.subjectClass.delete({ where: { id: subjectClassId } })
    },
    { timeout: 120_000 }
  )

  return {
    id: subjectClass.id,
    code: subjectClass.code,
    name: subjectClass.name,
  }
}
