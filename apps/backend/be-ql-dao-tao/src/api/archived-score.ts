import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, createId } from "@workspace/db"
import { prisma } from ".."
import {
  exportStatsArchivedAward,
  getStatsArchivedAward,
  StatsArchivedResponseSchema,
} from "../services/stats-archived"
import { exportArchivedCertificate } from "../services/student"

const app = new OpenAPIHono({ strict: false })

const certificateScore = createRoute({
  operationId: "certificate-score",
  path: "/certificate-score",
  tags: ["ArchivedScore"],
  summary: "Phiên điểm chứng chỉ",
  description: "Phiên điểm chứng chi",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({ archivedCertificateIds: z.string().array() })
            .openapi("CertificateIds"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.boolean(),
              message: z.string(),
            })
            .openapi("CertificateIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(certificateScore, async (c) => {
  const { archivedCertificateIds } = c.req.valid("json")

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

    const cert = certMap.get(archived.certificateId)

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
      data: translateSubjectScore.map(({ archivedCertificateId, ...score }) => score),
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

  return c.json({ success: true, message: "Success" }, 200)
})

const awardScore = createRoute({
  operationId: "award-score",
  path: "/award-score",
  tags: ["ArchivedScore"],
  summary: "Cộng điểm giải thưởng",
  description: "Cộng điểm giải thưởng",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ archivedAwardIds: z.string().array() }).openapi("AwardIds"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.boolean(),
              message: z.string(),
            })
            .openapi("AwardIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(awardScore, async (c) => {
  const { archivedAwardIds } = c.req.valid("json")

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
          awardId: award.id,
          subjectVersionId: sv.id,
          bonusScore: award.bonusScore,
        }))
      )

      return [award.id, subjectVersions]
    })
  )

  const archivedAwards = await prisma.archivedAward.findMany({
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
              trainingCourse: true,
            },
          },
        },
      },
    },
  })

  const bonusSubjectScores = archivedAwards.flatMap((archived) => {
    const curriculumVersion =
      archived.student.curriculumVersion || archived.student.fixedClass?.curriculumVersion
    const scoreToPass = archived.student.fixedClass?.trainingCourse.scoreToPass || 0

    const award = awardMap.get(archived.awardId)

    if (!curriculumVersion || !award) {
      return []
    }

    const curriculumSubjects = curriculumVersion.trainingBlocks.flatMap(({ subjects }) =>
      subjects.map(({ subjectId }) => subjectId)
    )

    const translateSubject = award
      .filter(({ subjectVersionId }) => curriculumSubjects.includes(subjectVersionId))
      .map(({ awardId, subjectVersionId, bonusScore }) => ({
        awardId,
        archivedAwardId: archived.id,
        studentId: archived.studentId,
        subjectVersionId,
        bonusScore,
        scoreToPass,
      }))

    return translateSubject
  })

  const studentSubjectScores = await prisma.studentSubjectScore.findMany({
    where: {
      deletedAt: null,
      OR: bonusSubjectScores.map(({ awardId, studentId, subjectVersionId, scoreToPass }) => ({
        studentId,
        subjectVersionId,
        OR: [{ finalScore: { gte: scoreToPass } }, { manualFinalScore: { gte: scoreToPass } }],
        awards: {
          none: { archivedAward: { awardId } },
        },
      })),
    },
  })

  await prisma.$transaction(async (tx) => {
    for (const s of studentSubjectScores) {
      const bonusSubjectScore = bonusSubjectScores.find(
        ({ studentId, subjectVersionId }) =>
          studentId === s.studentId && subjectVersionId === s.subjectVersionId
      )

      const bonusScore = bonusSubjectScore?.bonusScore || 0
      await tx.studentSubjectScore.update({
        where: { id: s.id },
        data: {
          ...(s.finalScore ? { finalScore: s.finalScore.add(bonusScore) } : {}),
          ...(s.manualFinalScore ? { manualFinalScore: s.manualFinalScore + bonusScore } : {}),
        },
      })
    }

    const pairs = studentSubjectScores.map((s) => {
      const bonusSubjectScore = bonusSubjectScores.find(
        ({ studentId, subjectVersionId }) =>
          studentId === s.studentId && subjectVersionId === s.subjectVersionId
      )

      return {
        studentSubjectScoreId: s.id,
        archivedAwardId: bonusSubjectScore?.archivedAwardId as string,
      }
    })

    await tx.archivedAwardOnStudentSubjectScore.createMany({
      data: pairs,
    })

    await tx.archivedAward.updateMany({
      where: { id: { in: archivedAwardIds } },
      data: { status: $Enums.ArchivedCertificateStatus.APPROVED },
    })
  })

  return c.json({ success: true, message: "Success" }, 200)
})

const approveAwardScore = createRoute({
  operationId: "approve-award-score",
  path: "/approve-award-score",
  tags: ["ArchivedScore"],
  summary: "Phê duyệt điểm giải thưởng",
  description: "Phê duyệt điểm giải thưởng",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ archivedAwardIds: z.string().array() }).openapi("AwardIds"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.boolean(),
              message: z.string(),
            })
            .openapi("AwardIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(approveAwardScore, async (c) => {
  const { archivedAwardIds } = c.req.valid("json")

  const archivedAwards = await prisma.archivedAward.findMany({
    where: { id: { in: archivedAwardIds } },
    include: {
      studentSubjectScore: { include: { studentSubjectScore: true } },
    },
  })

  const archivedAwardOnStudentSubjectScoreIds = archivedAwards.flatMap((archivedAward) =>
    archivedAward.studentSubjectScore.map((studentSubjectScore) => studentSubjectScore.id)
  )

  const studentSubjectScores = archivedAwards.flatMap((archivedAward) => {
    const bonusScore = archivedAward.bonusScore
    return archivedAward.studentSubjectScore.map((awardOnStudentSubjectScore) => {
      const finalScore = awardOnStudentSubjectScore.studentSubjectScore.finalScore?.add(bonusScore)
      const manualFinalScore = awardOnStudentSubjectScore.studentSubjectScore.manualFinalScore
        ? awardOnStudentSubjectScore.studentSubjectScore.manualFinalScore + bonusScore
        : null
      return {
        id: awardOnStudentSubjectScore.studentSubjectScoreId,
        finalScore,
        manualFinalScore,
      }
    })
  })

  await prisma.$transaction(async (tx) => {
    await tx.archivedAward.updateMany({
      where: { id: { in: archivedAwardIds } },
      data: { status: $Enums.ArchivedCertificateStatus.APPROVED },
    })

    await tx.archivedAwardOnStudentSubjectScore.updateMany({
      where: { id: { in: archivedAwardOnStudentSubjectScoreIds } },
      data: { status: $Enums.ArchivedCertificateStatus.APPROVED },
    })

    await Promise.all(
      studentSubjectScores.map((s) =>
        tx.studentSubjectScore.update({
          where: { id: s.id },
          data: { finalScore: s.finalScore },
        })
      )
    )
  })

  return c.json({ success: true, message: "Success" }, 200)
})

const statsArchivedAward = createRoute({
  operationId: "stats-archived-award",
  path: "/stats-archived-award",
  tags: ["ArchivedScore"],
  summary: "Thống kê điểm thưởng",
  description: "Thống kê điểm thưởng từ học kỳ đến học kỳ",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              fromSemesterId: z.string(),
              toSemesterId: z.string(),
              trainingCourseId: z.string(),
            })
            .openapi("StatsArchivedAwardInput"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: StatsArchivedResponseSchema,
        },
      },
    },
  },
})

app.openapi(statsArchivedAward, async (c) => {
  const { fromSemesterId, toSemesterId, trainingCourseId } = c.req.valid("json")
  const result = await getStatsArchivedAward({ fromSemesterId, toSemesterId, trainingCourseId })
  return c.json(result, 200)
})

const exportStatsArchivedAwardRoute = createRoute({
  operationId: "export-stats-archived-award",
  path: "/export-stats-archived-award",
  tags: ["ArchivedScore"],
  summary: "Xuất file thống kê điểm thưởng",
  description: "Xuất file excel thống kê điểm thưởng từ học kỳ đến học kỳ",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              fromSemesterId: z.string(),
              toSemesterId: z.string(),
              trainingCourseId: z.string(),
            })
            .openapi("StatsArchivedAwardInput"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
  },
})

app.openapi(exportStatsArchivedAwardRoute, async (c) => {
  const { fromSemesterId, toSemesterId, trainingCourseId } = c.req.valid("json")

  const result = await exportStatsArchivedAward({ fromSemesterId, toSemesterId, trainingCourseId })

  const fileName = "THONG_KE_DIEM_THUONG.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportArchivedCertificateExcel = createRoute({
  operationId: "exportArchivedCertificateExcel",
  path: "/export-archived-certificate-excel",
  tags: ["ArchivedScore"],
  summary: "Xuất Excel danh sách điểm chứng chỉ",
  description: "Xuất danh sách điểm chứng chỉ của học viên dưới dạng file Excel",
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
      trainingCourseId: z
        .string()
        .optional()
        .openapi("trainingCourseId", { description: "ID khóa học" }),
      fixedClassId: z
        .string()
        .optional()
        .openapi("fixedClassId", { description: "ID lớp quản lý" }),
      certificateId: z
        .string()
        .optional()
        .openapi("certificateId", { description: "ID chứng chỉ" }),
    }),
  },
  responses: {
    200: {
      description: "Export danh sách điểm chứng chỉ thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(exportArchivedCertificateExcel, async (c) => {
  const { trainingObjectTypeId, trainingCourseId, fixedClassId, certificateId } =
    c.req.valid("query")

  try {
    const buffer = await exportArchivedCertificate({
      trainingObjectTypeId,
      trainingCourseId,
      fixedClassId,
      certificateId,
    })

    const fileName = "Danh_sach_diem_chung_chi.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(buffer, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    return c.json({ message: error.message || "Đã xảy ra lỗi khi xuất Excel" }, 404)
  }
})

export default app
