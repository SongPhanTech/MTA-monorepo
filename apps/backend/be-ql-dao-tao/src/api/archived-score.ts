import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, createId } from "@workspace/db"
import { prisma } from ".."
import {
  exportStatsArchivedAward,
  getStatsArchivedAward,
  StatsArchivedResponseSchema,
} from "../services/stats-archived"
import {
  exportArchivedCertificate,
  exportArchivedCertificateMulti,
  exportStudentsMissingCertificate,
} from "../services/student"
import {
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  SuccessBooleanResponseSchema,
} from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const certificateScore = createRoute({
  operationId: "certificate-score",
  path: "/certificate-score",
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Phiên điểm chứng chỉ",
  description: `Tính / ghi điểm từ phiên chứng chỉ đã lưu trữ.

Chỉ phiên điểm khi chứng chỉ có môn được chọn (ArchivedCertificateSubjectScore). Không chọn môn thì chỉ phê duyệt chứng chỉ, không ghi điểm môn.

**Bảng dữ liệu nguồn:** ArchivedCertificate, ArchivedCertificateSubjectScore, StudentSubjectScore.

**Tham số:** archivedCertificateIds.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              archivedCertificateIds: z
                .string()
                .array()
                .openapi(fieldDesc("Danh sách ID phiên chứng chỉ.")),
            })
            .openapi("CertificateIds"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema.openapi("CertificateIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(certificateScore, async (c) => {
  const { archivedCertificateIds } = c.req.valid("json")

  const archivedCertificates = await prisma.archivedCertificate.findMany({
    where: {
      id: { in: archivedCertificateIds },
      active: true,
    },
    include: {
      certificate: { select: { isUsingScore: true } },
      subjectScores: {
        where: { deletedAt: null, active: true },
      },
    },
  })

  // Chứng chỉ Đạt/Không đạt (VD: GDQP-AN của SV chuyển trường): không có điểm, ghi nhận miễn học
  const translateSubjectScore = archivedCertificates.flatMap((archived) =>
    archived.subjectScores.map(({ subjectVersionId, finalScore }) => ({
      id: createId(),
      archivedCertificateId: archived.id,
      studentId: archived.studentId,
      subjectVersionId,
      ...(archived.certificate.isUsingScore
        ? { manualFinalScore: finalScore }
        : { manualFinalScore: null, exempted: true }),
    }))
  )

  await prisma.$transaction(async (tx) => {
    await tx.studentSubjectScore.createMany({
      data: translateSubjectScore.map(({ archivedCertificateId, ...score }) => score),
      skipDuplicates: true,
    })

    await tx.archivedCertificateOnStudentSubjectScore.createMany({
      data: translateSubjectScore.map(({ id, archivedCertificateId }) => ({
        studentSubjectScoreId: id,
        archivedCertificateId,
      })),
      skipDuplicates: true,
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
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Cộng điểm giải thưởng",
  description: `Cộng điểm thưởng từ giải thưởng đã lưu trữ.

**Bảng dữ liệu nguồn:** ArchivedAward, StudentSubjectScore.

**Tham số:** xem schema body.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              archivedAwardIds: z
                .string()
                .array()
                .openapi(fieldDesc("Danh sách ID phiên giải thưởng.")),
            })
            .openapi("AwardIds"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema.openapi("AwardIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
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
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Phê duyệt điểm giải thưởng",
  description: `Phê duyệt phiên cộng điểm giải thưởng.

**Bảng dữ liệu nguồn:** ArchivedAward, Award.

**Tham số:** xem schema body.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              archivedAwardIds: z
                .string()
                .array()
                .openapi(fieldDesc("Danh sách ID phiên giải thưởng.")),
            })
            .openapi("AwardIds"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema.openapi("AwardIdsResult"),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
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
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Thống kê điểm thưởng",
  description: `Thống kê điểm thưởng giữa hai học kỳ.

**Bảng dữ liệu nguồn:** ArchivedAward, Semester.

**Tham số:** xem schema body.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              fromSemesterId: z.string().openapi(fieldDesc("ID học kỳ bắt đầu.")),
              toSemesterId: z.string().openapi(fieldDesc("ID học kỳ kết thúc.")),
              trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
            })
            .openapi("StatsArchivedAwardInput"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
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
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Xuất file thống kê điểm thưởng",
  description: `Xuất Excel thống kê điểm thưởng theo khoảng học kỳ.

**Bảng dữ liệu nguồn:** ArchivedAward, Semester.

**Tham số:** xem schema body.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              fromSemesterId: z.string().openapi(fieldDesc("ID học kỳ bắt đầu.")),
              toSemesterId: z.string().openapi(fieldDesc("ID học kỳ kết thúc.")),
              trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
            })
            .openapi("StatsArchivedAwardInput"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Success",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
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
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Xuất Excel danh sách điểm chứng chỉ",
  description: `Xuất Excel điểm chứng chỉ đã lưu trữ.

**Bảng dữ liệu nguồn:** ArchivedCertificate, Student.

**Tham số:** query — xem schema.`,
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
      trainingCourseId: z
        .string()
        .optional()
        .openapi("trainingCourseId", { description: "ID khoá học" }),
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
    ...standardErrorResponses(),
    200: {
      description: "Export danh sách điểm chứng chỉ thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
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

const exportArchivedCertificateMultiExcel = createRoute({
  operationId: "exportArchivedCertificateMultiExcel",
  path: "/export-archived-certificate-multi-excel",
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Xuất Excel danh sách điểm chứng chỉ nhiều loại",
  description: `Xuất Excel điểm chứng chỉ nhiều khóa / nhiều loại.

**Bảng dữ liệu nguồn:** ArchivedCertificate, Certificate, TrainingCourse.

**Tham số:** body — xem schema.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              trainingObjectTypeId: z.string(),
              trainingCourseIds: z.string().array().min(1),
              certificateIds: z.string().array().min(1),
            })
            .openapi("ExportArchivedCertificateMultiInput"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Export danh sách điểm chứng chỉ thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportArchivedCertificateMultiExcel, async (c) => {
  const { trainingObjectTypeId, trainingCourseIds, certificateIds } = c.req.valid("json")

  try {
    const buffer = await exportArchivedCertificateMulti({
      trainingObjectTypeId,
      trainingCourseIds,
      certificateIds,
    })

    const fileName = "Danh_sach_diem_chung_chi_nhieu_loai.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(buffer, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    return c.json({ message: error.message || "Đã xảy ra lỗi khi xuất Excel" }, 404)
  }
})

const exportStudentsMissingCertificateExcel = createRoute({
  operationId: "exportStudentsMissingCertificateExcel",
  path: "/export-students-missing-certificate-excel",
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Xuất Excel danh sách sinh viên thiếu chứng chỉ",
  description: `Xuất Excel học viên thiếu điểm chứng chỉ.

**Bảng dữ liệu nguồn:** Student, ArchivedCertificate, Certificate.

**Tham số:** query — xem schema.`,
  method: "get",
  request: {
    query: z.object({
      trainingObjectTypeId: z
        .string()
        .openapi("trainingObjectTypeId", { description: "ID loại đối tượng đào tạo" }),
      trainingCourseId: z
        .string()
        .optional()
        .openapi("trainingCourseId", { description: "ID khoá học" }),
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
    ...standardErrorResponses(),
    200: {
      description: "Export danh sách sinh viên thiếu chứng chỉ thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportStudentsMissingCertificateExcel, async (c) => {
  const { trainingObjectTypeId, trainingCourseId, fixedClassId, certificateId } =
    c.req.valid("query")

  try {
    const buffer = await exportStudentsMissingCertificate({
      trainingObjectTypeId,
      trainingCourseId,
      fixedClassId,
      certificateId,
    })

    const fileName = "Danh_sach_sinh_vien_thieu_chung_chi.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(buffer, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    return c.json({ message: error.message || "Đã xảy ra lỗi khi xuất Excel" }, 404)
  }
})

const deleteArchivedCertificate = createRoute({
  operationId: "delete-archived-certificate",
  path: "/delete-archived-certificate",
  tags: ["Điểm chứng chỉ / Thưởng"],
  summary: "Xóa chứng chỉ đã lưu (kể cả đã duyệt)",
  description: `Xóa chứng chỉ của sinh viên. Nếu chứng chỉ đã duyệt, gỡ điểm phiên đã ghi từ chứng chỉ đó.

**Bảng dữ liệu nguồn:** ArchivedCertificate, ArchivedCertificateOnStudentSubjectScore, StudentSubjectScore.

**Tham số:** archivedCertificateIds.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              archivedCertificateIds: z
                .string()
                .array()
                .min(1)
                .openapi(fieldDesc("Danh sách ID chứng chỉ cần xóa.")),
            })
            .openapi("DeleteArchivedCertificateInput"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema.openapi("DeleteArchivedCertificateResult"),
        },
      },
    },
  },
})

app.openapi(deleteArchivedCertificate, async (c) => {
  const { archivedCertificateIds } = c.req.valid("json")
  const now = new Date()

  try {
    const certificates = await prisma.archivedCertificate.findMany({
      where: {
        id: { in: archivedCertificateIds },
        deletedAt: null,
      },
      include: {
        studentSubjectScore: {
          include: {
            studentSubjectScore: {
              select: {
                id: true,
                subjectClassId: true,
              },
            },
          },
        },
      },
    })

    if (certificates.length === 0) {
      return c.json({ message: "Không tìm thấy chứng chỉ cần xóa" }, 404)
    }

    const certificateIds = certificates.map((cert) => cert.id)
    const generatedScoreIds = [
      ...new Set(
        certificates.flatMap((cert) =>
          cert.studentSubjectScore
            .filter((link) => !link.studentSubjectScore.subjectClassId)
            .map((link) => link.studentSubjectScoreId)
        )
      ),
    ]

    await prisma.$transaction(
      async (tx) => {
        await tx.archivedCertificateOnStudentSubjectScore.deleteMany({
          where: { archivedCertificateId: { in: certificateIds } },
        })

        if (generatedScoreIds.length > 0) {
          const stillLinked = await tx.archivedCertificateOnStudentSubjectScore.findMany({
            where: { studentSubjectScoreId: { in: generatedScoreIds } },
            select: { studentSubjectScoreId: true },
          })
          const stillLinkedIds = new Set(stillLinked.map((item) => item.studentSubjectScoreId))
          const scoreIdsToRemove = generatedScoreIds.filter((id) => !stillLinkedIds.has(id))

          if (scoreIdsToRemove.length > 0) {
            await tx.studentSubjectScoreHistory.deleteMany({
              where: { studentSubjectScoreId: { in: scoreIdsToRemove } },
            })
            await tx.archivedAwardOnStudentSubjectScore.deleteMany({
              where: { studentSubjectScoreId: { in: scoreIdsToRemove } },
            })
            for (const scoreId of scoreIdsToRemove) {
              await tx.studentSubjectScore.update({
                where: { id: scoreId },
                data: {
                  graduationGpaScores: { set: [] },
                  graduationSupplementaryScore: { set: [] },
                  deletedAt: now,
                },
              })
            }
          }
        }

        await tx.archivedCertificateSubjectScore.updateMany({
          where: { archivedCertificateId: { in: certificateIds }, deletedAt: null },
          data: { deletedAt: now },
        })

        await tx.archivedCertificate.updateMany({
          where: { id: { in: certificateIds } },
          data: {
            deletedAt: now,
            status: $Enums.ArchivedCertificateStatus.CANCEL,
          },
        })
      },
      { timeout: 60_000 }
    )

    return c.json({ success: true, message: "Xóa chứng chỉ thành công" }, 200)
  } catch (error: any) {
    return c.json({ message: error?.message || "Đã xảy ra lỗi khi xóa chứng chỉ" }, 500)
  }
})

export default app
