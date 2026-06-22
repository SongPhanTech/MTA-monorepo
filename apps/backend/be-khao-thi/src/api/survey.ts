import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { Prisma } from "@workspace/db"
import { models } from "@workspace/db/zod"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"
import { prisma } from ".."
import { SurveyStatisticSchema } from "../dto/survey-statistic.dto"
import { getBufferFromUrl } from "../services/template.service"
import { getCurrentDateForReport } from "../utils"
import { ListOf, PaginationQuerySchema } from "../zod/base"

const app = new OpenAPIHono({ strict: false })

const exportReportSurvey = createRoute({
  operationId: "export-report-survey",
  path: "/export-report-survey",
  tags: ["Survey"],
  summary: "Báo cáo khảo sát",
  description: "Báo cáo khảo sát",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              surveyId: z.string().openapi("surveyId", {
                description: "ID của khảo sát",
              }),
            })
            .openapi("export-report-survey"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export báo cáo khảo sát.",
      content: {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
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
    404: {
      description: "Not found",
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

app.openapi(exportReportSurvey, async (c) => {
  const { surveyId } = c.req.valid("json")

  const survey = await prisma.survey.findFirstOrThrow({
    where: { id: surveyId },
    include: {
      surveyObjectType: true,
    },
  })
  if (!survey) {
    return c.json({ message: "Khảo sát không tồn tại" }, 404)
  }

  const { date, month, year } = getCurrentDateForReport()
  const templateData = {
    date,
    month,
    year,
    tittle: survey.name,
    SurveyObjectType: survey.surveyObjectType.map((item) => item.name).join(", "),
    phamvi: "",
    ketqua: "",
  }

  const docxBuffer = await getBufferFromUrl("SURVEY_RP")
  const templateZip = new PizZip(docxBuffer)
  const document = new Docxtemplater(templateZip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  const reportDocx = document.render(templateData)
  return c.body(reportDocx.getZip().generate({ type: "arraybuffer" }), 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="BaoCaoKhaoThi.docx"`,
  })
})

const exportReportSurveyOrganizational = createRoute({
  operationId: "export-report-survey-organizational",
  path: "/export-report-survey-organizational",
  tags: ["Survey"],
  summary: "Báo cáo khảo sát theo đơn vị",
  description: "Báo cáo khảo sát theo đơn vị",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              semesterId: z.string().openapi("semesterId", {
                description: "ID của học kỳ",
              }),
              organizationId: z.string().openapi("organizationId", {
                description: "ID của đơn vị",
              }),
            })
            .openapi("export-report-survey"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export báo cáo khảo sát.",
      content: {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
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
    404: {
      description: "Not found",
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

app.openapi(exportReportSurveyOrganizational, async (c) => {
  const { semesterId, organizationId } = c.req.valid("json")

  const semester = await prisma.semester.findFirstOrThrow({
    where: { id: semesterId },
  })
  if (!semester) {
    return c.json({ message: "Học kỳ không tồn tại" }, 404)
  }

  const organization = await prisma.dM_DonVi.findFirstOrThrow({
    where: { Id: organizationId },
  })
  if (!organization) {
    return c.json({ message: "Đơn vị không tồn tại" }, 404)
  }

  const { date, month, year } = getCurrentDateForReport()
  const templateData = {
    date,
    month,
    year,
    tittle: `Báo cáo khảo sát của đơn vị ${organization.sTen}`,
  }

  const docxBuffer = await getBufferFromUrl("SURVEY_RP")
  const templateZip = new PizZip(docxBuffer)
  const document = new Docxtemplater(templateZip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  const reportDocx = document.render(templateData)
  return c.body(reportDocx.getZip().generate({ type: "arraybuffer" }), 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="BaoCaoKhaoThi.docx"`,
  })
})

const getSurveyStatistics = createRoute({
  operationId: "get-survey-statistics",
  path: "/{id}/statistics",
  method: "get",
  tags: ["Statistics"],
  summary: "Thống kê câu trả lời cho từng câu hỏi trong một đợt khảo sát",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "ID của khảo sát cần xem thống kê.",
      }),
    }),
  },
  responses: {
    200: {
      description: "Lấy dữ liệu thống kê thành công.",
      content: {
        "application/json": {
          schema: SurveyStatisticSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy khảo sát.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getSurveyStatistics, async (c) => {
  const { id } = c.req.valid("param")

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyQuestion: {
        where: { type: "SINGLE_CHOICE" },
      },
      surveyChoice: true,
    },
  })

  if (!survey) {
    return c.json({ message: "Không tìm thấy khảo sát" }, 404)
  }

  const questionIds = survey.surveyQuestion.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId", "surveyChoiceId"],
    where: {
      surveySession: { surveyId: survey.id },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const answerCountMap = answerCounts.reduce(
    (acc, curr) => {
      if (curr.surveyChoiceId) {
        const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
        acc[key] = curr._count.surveyChoiceId
      }
      return acc
    },
    {} as Record<string, number>
  )

  const questions = survey.surveyQuestion.map((question) => {
    const answers = survey.surveyChoice.map((choice) => {
      const key = `${question.id}-${choice.id}`
      return {
        id: choice.id,
        answer: choice.answer,
        description: choice.description,
        count: answerCountMap[key] || 0,
      }
    })
    return { id: question.id, name: question.name, answers }
  })

  const responseData = {
    surveyId: survey.id,
    surveyName: survey.name,
    questions,
  }

  return c.json(responseData, 200)
})

const getSurveyStatisticsToField = createRoute({
  operationId: "get-survey-statistics-to-Field",
  path: "/{id}/statistics-to-Field",
  method: "get",
  tags: ["Statistics"],
  summary: "Thống kê câu trả lời cho từng nhóm câu hỏi trong một đợt khảo sát",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "ID của khảo sát cần xem thống kê.",
      }),
    }),
  },
  responses: {
    200: {
      description: "Lấy dữ liệu thống kê thành công.",
      content: {
        "application/json": {
          schema: z.object({
            surveyId: z.string(),
            surveyName: z.string(),
            data: z.array(z.any()),
          }),
        },
      },
    },
    404: {
      description: "Không tìm thấy khảo sát.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getSurveyStatisticsToField, async (c) => {
  const { id } = c.req.valid("param")

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyQuestion: {
        where: { type: "SINGLE_CHOICE" },
        include: {
          surveyQuestionGroup: true,
        },
      },
      surveyChoice: true,
    },
  })

  if (!survey) {
    return c.json({ message: "Không tìm thấy khảo sát" }, 404)
  }

  const questionIds = survey.surveyQuestion.map((q) => q.id)

  const answerCounts = await prisma.surveyResponse.groupBy({
    by: ["surveyQuestionId", "surveyChoiceId"],
    where: {
      surveySession: { surveyId: survey.id },
      surveyQuestionId: { in: questionIds },
      surveyChoiceId: { not: null },
    },
    _count: { surveyChoiceId: true },
  })

  const questionToGroupMap = Object.fromEntries(
    survey.surveyQuestion.map((q) => [q.id, q.surveyQuestionGroupId ?? "ungrouped"])
  )

  const answerCountMap = answerCounts.reduce<Record<string, number>>((acc, curr) => {
    if (!curr.surveyChoiceId) return acc

    const groupId = questionToGroupMap[curr.surveyQuestionId]
    const key = `${groupId}-${curr.surveyChoiceId}`

    acc[key] = (acc[key] ?? 0) + curr._count.surveyChoiceId
    return acc
  }, {})

  const groupsMap = new Map<
    string,
    {
      id: string
      name?: string
      questions: any[]
    }
  >()

  survey.surveyQuestion.forEach((question) => {
    const groupId = question.surveyQuestionGroupId ?? "ungrouped"

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        id: groupId,
        name: question?.surveyQuestionGroup?.name,
        questions: [],
      })
    }

    const group = groupsMap.get(groupId)!

    const answers = survey.surveyChoice.map((choice) => {
      const key = `${groupId}-${choice.id}`

      return {
        id: choice.id,
        answer: choice.answer,
        description: choice.description,
        count: answerCountMap[key] || 0,
      }
    })

    group.questions.push({
      id: question.id,
      name: question.name,
      answers,
    })
  })

  function calcTotalCount(answers: any[]): any {
    return answers.reduce((total, item) => total + item.count, 0)
  }
  function calcGroupAnswerTotals(groups: any[]) {
    return groups.map((group) => {
      const answers = group.questions[0].answers.map((i: any) => {
        return { ...i }
      })
      // answers.forEach((answer: any, index: number) => {
      //     answers[index].count= group.questions[0].answers.reduce((sum:any, item:any) => sum + item.count, 0)

      // })
      // group.questions.forEach((question: any) => {
      //     question.answers.forEach((answer: any, index: number) => {
      //         answers[index].count += answer.count
      //     })
      // })

      const totalCount = calcTotalCount(answers)

      return {
        groupId: group.id,
        groupName: group.name,
        answers: answers.map((i: any) => {
          return {
            ...i,
            totalCount,
            percent: totalCount === 0 ? 0 : Number(((i.count / totalCount) * 100).toFixed(2)),
          }
        }),
      }
    })
  }

  const result =
    Array.from(groupsMap.values())?.length > 0
      ? calcGroupAnswerTotals(Array.from(groupsMap.values()) || [])
      : []

  // const answerCountMap = answerCounts.reduce(
  //     (acc, curr) => {
  //         if (curr.surveyChoiceId) {
  //             const key = `${curr.surveyQuestionId}-${curr.surveyChoiceId}`
  //             acc[key] = curr._count.surveyChoiceId
  //         }
  //         return acc
  //     },
  //     {} as Record<string, number>
  // )

  // const questions = survey.surveyQuestion.map((question) => {
  //     const answers = survey.surveyChoice.map((choice) => {
  //         const key = `${question.id}-${choice.id}`
  //         return {
  //             id: choice.id,
  //             answer: choice.answer,
  //             description: choice.description,
  //             count: answerCountMap[key] || 0,
  //         }
  //     })
  //     return { id: question.id, name: question.name, answers }
  // })

  const responseData = {
    surveyId: survey.id,
    surveyName: survey.name,
    data: result,
  }

  return c.json(responseData, 200)
})

const getSurveyObjects = createRoute({
  operationId: "get-survey-objects",
  path: "/objects",
  method: "get",
  tags: ["Survey"],
  summary: "Danh sách người làm khảo sát",
  request: {
    query: PaginationQuerySchema.extend({
      id: z.string(),
      fullname: z.string().optional(),
      organizationId: z.string().array().optional(),
      lecturerCode: z.string().optional(),
      staffCode: z.string().optional(),
      studentCode: z.string().optional(),
      fixedClassIds: z.string().array().optional(),
      trainingCourseIds: z.string().array().optional(),
      taken: z.boolean().optional(),
      isStudent: z.enum(["student", "lecturer", "all"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ListOf(
            models.UserProfileScalarSchema.extend({
              lecturer: models.LecturerScalarSchema.extend({
                organization: models.DM_DonViScalarSchema,
              }).nullable(),
              staffs: models.StaffScalarSchema.extend({
                organization: models.DM_DonViScalarSchema,
              }).nullable(),
              educationAndTraining: models.StudentScalarSchema.extend({
                fixedClass: models.FixedClassScalarSchema.extend({
                  curriculumVersion: models.CurriculumVersionScalarSchema.extend({
                    curriculum: models.CurriculumScalarSchema.extend({
                      trainingMajor: models.TrainingMajorScalarSchema.extend({
                        trainingField: models.TrainingFieldScalarSchema,
                      }),
                    }),
                  }).nullable(),
                }).nullable(),
                trainingCourse: models.TrainingCourseScalarSchema.optional(),
              }).array(),
              surveySession: models.SurveySessionScalarSchema.optional(),
            })
          ),
        },
      },
    },
    404: {
      description: "Không tìm thấy khảo sát.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getSurveyObjects, async (c) => {
  const { id, limit = 10, page = 1, ...q } = c.req.valid("query")

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyObjectType: {
        include: {
          organizations: { select: { Id: true } },
          trainingFields: { select: { id: true } },
          trainingMajors: { select: { id: true } },
          trainingCourses: { select: { id: true } },
          fixedClasses: { select: { id: true } },
          subjectClasses: { select: { id: true } },
        },
      },
    },
  })

  if (!survey) {
    return c.json({ message: "Không tìm thấy khảo sát" }, 404)
  }

  const profileIds = new Set<string>()

  for (const objectType of survey.surveyObjectType) {
    const objectTypeProfiles = await prisma.userProfile.findMany({
      select: { id: true },
      where: {
        deletedAt: null,
        active: true,
        ...(q.fullname ? { fullname: { contains: q.fullname, mode: "insensitive" } } : {}),
        OR: [
          q?.isStudent !== "student"
            ? {
                lecturer: {
                  ...(q.lecturerCode
                    ? {
                        code: {
                          contains: q.lecturerCode,
                          mode: "insensitive",
                        },
                      }
                    : {}),
                  organizationId: {
                    in:
                      q?.organizationId && q?.organizationId?.length > 0
                        ? q.organizationId
                        : objectType.organizations.map((org) => org.Id),
                  },
                },
              }
            : {},
          q?.isStudent !== "student"
            ? {
                staffs: {
                  ...(q.staffCode
                    ? {
                        code: {
                          contains: q.staffCode,
                          mode: "insensitive",
                        },
                      }
                    : {}),
                  organizationId: {
                    in:
                      q?.organizationId && q?.organizationId?.length > 0
                        ? q.organizationId
                        : objectType.organizations.map((org) => org.Id),
                  },
                },
              }
            : {},
          q?.isStudent !== "lecturer"
            ? {
                educationAndTraining: {
                  some: {
                    ...(q.studentCode
                      ? {
                          code: {
                            contains: q.studentCode,
                            mode: "insensitive",
                          },
                        }
                      : {}),
                    fixedClass: {
                      ...(objectType.fixedClasses.length
                        ? {
                            id: {
                              in: objectType.fixedClasses.map((fc) => fc.id),
                            },
                          }
                        : {}),
                      ...(q.fixedClassIds
                        ? {
                            id: { in: q.fixedClassIds },
                          }
                        : {}),
                      ...(objectType.trainingCourses.length
                        ? {
                            trainingCourseId: {
                              in: objectType.trainingCourses.map((tc) => tc.id),
                            },
                          }
                        : {}),
                      ...(q.trainingCourseIds
                        ? {
                            trainingCourseId: {
                              in: q.trainingCourseIds,
                            },
                          }
                        : {}),
                      ...(objectType.trainingMajors.length || objectType.trainingFields.length
                        ? {
                            curriculumVersion: {
                              curriculum: {
                                trainingMajor: {
                                  ...(objectType.trainingMajors.length
                                    ? {
                                        id: {
                                          in: objectType.trainingMajors.map((tm) => tm.id),
                                        },
                                      }
                                    : {}),
                                  ...(objectType.trainingFields.length
                                    ? {
                                        trainingFieldId: {
                                          in: objectType.trainingFields.map((tf) => tf.id),
                                        },
                                      }
                                    : {}),
                                },
                              },
                            },
                          }
                        : {}),
                    },
                    ...(objectType.subjectClasses.length
                      ? {
                          subjectClassStudent: {
                            some: {
                              subjectClassId: {
                                in: objectType.subjectClasses.map((sc) => sc.id),
                              },
                            },
                          },
                        }
                      : {}),
                  },
                },
              }
            : {},
        ],
      },
    })

    for (const { id } of objectTypeProfiles) {
      profileIds.add(id)
    }
  }

  const where: Prisma.UserProfileWhereInput = {
    id: { in: [...profileIds] },
    deletedAt: null,
    active: true,
    ...(q.taken === true ? { surveySession: { some: { surveyId: id } } } : {}),
    ...(q.taken === false ? { surveySession: { none: { surveyId: id } } } : {}),
  }

  const profiles = await prisma.userProfile.findMany({
    where,
    include: {
      lecturer: { include: { organization: true } },
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              curriculumVersion: {
                include: { curriculum: { include: { trainingMajor: true } } },
              },
              trainingCourse: true,
            },
          },
        },
      },
      staffs: { include: { organization: true } },
      surveySession: { where: { surveyId: id } },
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: [
      { lecturer: { organizationId: "asc" } },
      { staffs: { organizationId: "asc" } },
      { firstName: "asc" },
    ],
  })

  const count = await prisma.userProfile.count({ where })

  const data = profiles.map((profile) => ({
    ...profile,
    surveySession: profile.surveySession[0],
  }))

  return c.json({ data, count }, 200)
})

const getSurveyObjectCount = createRoute({
  operationId: "get-survey-object-count",
  path: "/objects/count",
  method: "get",
  tags: ["Survey"],
  summary: "Lấy số người làm khảo sát",
  request: {
    query: z.object({
      id: z.string(),
      fullname: z.string().optional(),
      organizationId: z.string().array().optional(),
      lecturerCode: z.string().optional(),
      staffCode: z.string().optional(),
      studentCode: z.string().optional(),
      fixedClassIds: z.string().array().optional(),
      trainingCourseIds: z.string().array().optional(),
      taken: z.boolean().optional(),
      isStudent: z.enum(["student", "lecturer", "all"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: models.SurveyObjectTypeScalarSchema.extend({
            total: z.number(),
            taken: z.number(),
          }).array(),
        },
      },
    },
    404: {
      description: "Không tìm thấy khảo sát.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getSurveyObjectCount, async (c) => {
  const { id, ...q } = c.req.valid("query")

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyObjectType: {
        include: {
          organizations: { select: { Id: true } },
          trainingFields: { select: { id: true } },
          trainingMajors: { select: { id: true } },
          trainingCourses: { select: { id: true } },
          fixedClasses: { select: { id: true } },
          subjectClasses: { select: { id: true } },
        },
      },
    },
  })

  if (!survey) {
    return c.json({ message: "Không tìm thấy khảo sát" }, 404)
  }

  const data = await Promise.all(
    survey.surveyObjectType.map(async (surveyObjectType) => {
      const objectTypeProfiles = await prisma.userProfile.findMany({
        select: { id: true },
        where: {
          deletedAt: null,
          active: true,
          ...(q.fullname ? { fullname: { contains: q.fullname, mode: "insensitive" } } : {}),
          OR: [
            q?.isStudent !== "student"
              ? {
                  lecturer: {
                    ...(q.lecturerCode
                      ? {
                          code: {
                            contains: q.lecturerCode,
                            mode: "insensitive",
                          },
                        }
                      : {}),
                    organizationId: {
                      in:
                        q?.organizationId && q?.organizationId?.length > 0
                          ? q.organizationId
                          : surveyObjectType.organizations.map((org) => org.Id),
                    },
                  },
                }
              : {},
            q?.isStudent !== "student"
              ? {
                  staffs: {
                    ...(q.staffCode
                      ? {
                          code: {
                            contains: q.staffCode,
                            mode: "insensitive",
                          },
                        }
                      : {}),
                    organizationId: {
                      in:
                        q?.organizationId && q?.organizationId?.length > 0
                          ? q.organizationId
                          : surveyObjectType.organizations.map((org) => org.Id),
                    },
                  },
                }
              : {},
            q?.isStudent !== "lecturer"
              ? {
                  educationAndTraining: {
                    some: {
                      ...(q.studentCode
                        ? {
                            code: {
                              contains: q.studentCode,
                              mode: "insensitive",
                            },
                          }
                        : {}),
                      fixedClass: {
                        ...(surveyObjectType.fixedClasses.length
                          ? {
                              id: {
                                in: surveyObjectType.fixedClasses.map((fc) => fc.id),
                              },
                            }
                          : {}),
                        ...(q.fixedClassIds
                          ? {
                              id: { in: q.fixedClassIds },
                            }
                          : {}),
                        ...(surveyObjectType.trainingCourses.length
                          ? {
                              trainingCourseId: {
                                in: surveyObjectType.trainingCourses.map((tc) => tc.id),
                              },
                            }
                          : {}),
                        ...(q.trainingCourseIds
                          ? {
                              trainingCourseId: {
                                in: q.trainingCourseIds,
                              },
                            }
                          : {}),
                        ...(surveyObjectType.trainingMajors.length ||
                        surveyObjectType.trainingFields.length
                          ? {
                              curriculumVersion: {
                                curriculum: {
                                  trainingMajor: {
                                    ...(surveyObjectType.trainingMajors.length
                                      ? {
                                          id: {
                                            in: surveyObjectType.trainingMajors.map((tm) => tm.id),
                                          },
                                        }
                                      : {}),
                                    ...(surveyObjectType.trainingFields.length
                                      ? {
                                          trainingFieldId: {
                                            in: surveyObjectType.trainingFields.map((tf) => tf.id),
                                          },
                                        }
                                      : {}),
                                  },
                                },
                              },
                            }
                          : {}),
                      },
                      ...(surveyObjectType.subjectClasses.length
                        ? {
                            subjectClassStudent: {
                              some: {
                                subjectClassId: {
                                  in: surveyObjectType.subjectClasses.map((sc) => sc.id),
                                },
                              },
                            },
                          }
                        : {}),
                    },
                  },
                }
              : {},
          ],
        },
      })

      const taken = await prisma.surveySession.count({
        where: {
          surveyId: survey.id,
          profileId: { in: objectTypeProfiles.map((p) => p.id) },
        },
      })

      return {
        ...surveyObjectType,
        total: objectTypeProfiles.length,
        taken,
      }
    })
  )

  return c.json(data, 200)
})

const getSurveysByProfile = createRoute({
  operationId: "get-surveys-of-profile",
  path: "/of-profile/{id}",
  method: "get",
  tags: ["Survey"],
  summary: "Danh sách khảo sát cần làm",
  request: {
    params: z.object({ id: z.string() }),
    query: PaginationQuerySchema.extend({
      name: z.string().optional(),
      code: z.string().optional(),
      taken: z.boolean().optional(),
      lecturerName: z.string().optional(),
      subjectClassName: z.string().optional(),
      semesterId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ListOf(
            models.SurveyScalarSchema.extend({
              lecture: models.LecturerScalarSchema.extend({
                organization: models.DM_DonViScalarSchema,
                userProfile: models.UserProfileScalarSchema,
              }).nullable(),
              subjectClass: models.SubjectClassScalarSchema.nullable(),
              surveyTopic: models.SurveyTopicScalarSchema,
              surveyQuestion: models.SurveyQuestionScalarSchema.array().nullable(),
              surveySessions: models.SurveySessionScalarSchema.array().nullable(),
            })
          ),
        },
      },
    },
    404: {
      description: "Không tìm thấy khảo sát.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(getSurveysByProfile, async (c) => {
  const { id } = c.req.valid("param")
  const { semesterId, limit = 10, page = 1, ...q } = c.req.valid("query")

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id },
    include: {
      lecturer: true,
      staffs: true,
      educationAndTraining: {
        include: {
          fixedClass: {
            include: {
              curriculumVersion: {
                include: {
                  curriculum: {
                    include: {
                      trainingMajor: true,
                    },
                  },
                },
              },
            },
          },
          subjectClassStudent: {
            select: { subjectClassId: true },
            where: { subjectClassId: { not: null } },
          },
        },
      },
    },
  })

  // Build the logic to find surveys targeted at the user based on their roles.
  // A user can be a lecturer, a staff member, or a student (with one or more educational records).

  // 1. Match by Organization (for Lecturers/Staff)
  const organizationId = profile.lecturer?.organizationId ?? profile.staffs?.organizationId

  // 2. Match by Student Education Records
  // A survey is relevant to a student if ONE of the survey's "SurveyObjectTypes" matches
  // the student's educational context (e.g., class, course, major).
  // An object type matches a student if ALL of its defined criteria are met by the student.
  // For each criterion (e.g., fixedClasses), if the object type does not specify any, it is
  // considered a wildcard and matches all students for that criterion.
  // This is implemented with the `{ OR: [{ relation: { none: {} } }, { relation: { some: { ... } } }] }` pattern.
  const studentWhereClauses: Prisma.SurveyWhereInput[] = profile.educationAndTraining
    .map((et) => {
      const studentCriteria: Prisma.SurveyObjectTypeWhereInput[] = []

      if (et.fixedClassId) {
        studentCriteria.push({
          OR: [{ fixedClasses: { none: {} } }, { fixedClasses: { some: { id: et.fixedClassId } } }],
        })
      }
      if (et.fixedClass?.trainingCourseId) {
        studentCriteria.push({
          OR: [
            { trainingCourses: { none: {} } },
            { trainingCourses: { some: { id: et.fixedClass.trainingCourseId } } },
          ],
        })
      }
      if (et.fixedClass?.curriculumVersion?.curriculum?.trainingMajorId) {
        studentCriteria.push({
          OR: [
            { trainingMajors: { none: {} } },
            {
              trainingMajors: {
                some: {
                  id: et.fixedClass.curriculumVersion.curriculum.trainingMajorId,
                },
              },
            },
          ],
        })
      }
      if (et.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingFieldId) {
        studentCriteria.push({
          OR: [
            { trainingFields: { none: {} } },
            {
              trainingFields: {
                some: {
                  id: et.fixedClass.curriculumVersion.curriculum.trainingMajor.trainingFieldId,
                },
              },
            },
          ],
        })
      }
      const subjectClassIds = et.subjectClassStudent?.map((scs) => scs.subjectClassId)
      if (subjectClassIds?.length) {
        studentCriteria.push({
          OR: [
            { subjectClasses: { none: {} } },
            { subjectClasses: { some: { id: { in: subjectClassIds as string[] } } } },
          ],
        })
      }

      if (studentCriteria.length === 0) {
        return null
      }

      return { surveyObjectType: { some: { AND: studentCriteria } } }
    })
    .filter(Boolean) as Prisma.SurveyWhereInput[]

  // Combine all matching conditions.
  // A survey is a match if it's public OR if it matches the user's audience criteria.
  const audienceMatch: Prisma.SurveyWhereInput = { OR: [] }

  profile.educationAndTraining.forEach((et) => {
    audienceMatch.OR?.push({
      subjectClass: {
        subjectClassStudent: {
          some: {
            student: {
              userProfile: {
                id,
              },
            },
          },
        },
      },
    })
  })

  if (organizationId) {
    audienceMatch.OR?.push({
      surveyObjectType: { some: { organizations: { some: { Id: organizationId } } } },
    })
  }
  if (studentWhereClauses.length > 0) {
    audienceMatch.OR?.push(...studentWhereClauses)
  }

  const where: Prisma.SurveyWhereInput = {
    ...(q.name ? { name: { contains: q.name, mode: "insensitive" } } : {}),
    ...(semesterId && { semesterId }),
    ...(q.lecturerName
      ? {
          lecture: {
            userProfile: { fullname: { contains: q.lecturerName, mode: "insensitive" } },
          },
        }
      : {}),
    ...(q.subjectClassName
      ? { subjectClass: { name: { contains: q.subjectClassName, mode: "insensitive" } } }
      : {}),

    deletedAt: null,
    isPublic: false,
    // startDate: { lte: new Date() },
  }

  if (audienceMatch.OR?.length) {
    where.AND = [{ OR: [{ anonymous: false }, audienceMatch] }]
  } else {
    where.anonymous = false
  }

  const surveys = await prisma.survey.findMany({
    where,
    include: {
      lecture: { include: { organization: true, userProfile: true } },
      surveyTopic: true,
      subjectClass: true,
      surveyQuestion: true,
      surveySessions: {
        where: {
          profileId: id,
        },
      },
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { createdAt: "desc" },
  })

  const count = await prisma.survey.count({ where })

  return c.json({ data: surveys, count }, 200)
})

const getPrivateSurvey = createRoute({
  operationId: "get-private-survey",
  path: "/get-private-survey/{id}",
  tags: ["Survey"],
  summary: "Thông tin đợt khảo sát không công khai",
  description: "Lấy thông tin đợt khảo sát không công khai",
  method: "get",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của khảo sát." }),
    }),
    query: z.object({
      profileId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Get Survey result",
      content: {
        "application/json": {
          schema: models.SurveyScalarSchema.merge(
            z.object({
              surveyQuestion: z.array(
                models.SurveyQuestionScalarSchema.merge(
                  z.object({
                    surveyQuestionGroup: models.SurveyQuestionGroupScalarSchema.nullable(),
                    specificChoice: models.SpecificChoiceScalarSchema.array(),
                  })
                )
              ),
              surveyChoice: models.SurveyChoiceScalarSchema.array(),
              lectureInfo: z
                .object({
                  firstName: z.string(),
                  lastName: z.string(),
                  academicDegree: z.string().nullish(),
                  academicRank: z.string().nullish(),
                  organization: z.string().nullable(),
                })
                .nullable(),
              subjectClass: models.SubjectClassScalarSchema.nullable(),
              semester: models.SemesterScalarSchema.nullable(),
            })
          ).openapi("get-survey-result"),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
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

app.openapi(getPrivateSurvey, async (c) => {
  const { id } = c.req.valid("param")
  const { profileId, ...q } = c.req.valid("query")
  const checkExist = await prisma.surveySession.findFirst({
    where: {
      profileId,
      surveyId: id,
    },
  })
  if (checkExist) {
    return c.json({ message: "Bạn đã làm khảo sát" }, 400)
  }
  const survey = await prisma.survey.findUnique({
    where: { id, deletedAt: null, active: true },
    include: {
      surveyQuestion: {
        include: {
          surveyQuestionGroup: true,
          specificChoice: true,
        },
      },
      surveyChoice: true,
      lecture: {
        select: {
          userProfile: {
            select: {
              firstName: true,
              lastName: true,
              academicDegreeType: {
                select: { sTen: true },
              },
              academicRankType: {
                select: { sTen: true },
              },
            },
          },
          organization: {
            select: {
              sTen: true,
            },
          },
        },
      },
      subjectClass: true,
      semester: true,
    },
  })
  if (!survey) {
    return c.json({ message: "Đợt khảo sát không tồn tại" }, 404)
  }

  if (survey.startDate > new Date()) {
    return c.json({ message: "Khảo sát chưa mở" }, 400)
  }

  if (survey.endDate && survey.endDate < new Date()) {
    return c.json({ message: "Khảo sát đã đóng" }, 400)
  }

  const { lecture, ...data } = survey

  const lectureInfo = lecture
    ? {
        firstName: lecture.userProfile.firstName,
        lastName: lecture.userProfile.lastName,
        academicDegree: lecture.userProfile.academicDegreeType?.sTen,
        academicRank: lecture.userProfile.academicRankType?.sTen,
        organization: lecture.organization.sTen,
      }
    : null

  return c.json({ ...data, lectureInfo }, 200)
})

const sinhdetudong = createRoute({
  operationId: "automatic-topic-generation",
  path: "/automatic-topic-generation",
  tags: ["Survey"],
  summary: "Sinh đề tự động",
  description: "Sinh đề tự động",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: models.ExamBankScalarSchema.extend({
            quantity: z.number(),
            examTime: z.number().optional(),
            examFrameworkId: z.string().nonempty(),
            examMatrixId: z.string().nonempty(),
            examId: z.string().nonempty(),
            codeFrom: z.number(),
            subjectClassId: z.string(),
            isNote: z.boolean(),
            description: z.string().optional(),
            isGroup: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
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
    404: {
      description: "Not found",
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

app.openapi(sinhdetudong, async (c) => {
  const body = c.req.valid("json")

  function getRandomItems<T>(arr: T[], n: number): T[] {
    const copy: any = [...arr]
    const result: T[] = []

    while (result.length < n) {
      const idx = Math.floor(Math.random() * copy.length)
      result.push(copy[idx])
      copy.splice(idx, 1)
    }

    return result
  }

  function shuffleWithConstraints(questions: any[]): any[] {
    const arr = [...questions]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    const hasImage = (q: any): boolean =>
      typeof q.content === "string" && q.content.includes("<img")

    const result: any[] = []
    const remaining = [...arr]

    while (remaining.length > 0) {
      const prev = result[result.length - 1]
      let pickedIdx = -1

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i]
        const sameBlock =
          prev?.knowledgeBlockId && candidate.knowledgeBlockId === prev.knowledgeBlockId
        const bothHaveImage = prev && hasImage(prev) && hasImage(candidate)

        if (!sameBlock && !bothHaveImage) {
          pickedIdx = i
          break
        }
      }

      if (pickedIdx === -1) pickedIdx = 0
      result.push(remaining[pickedIdx])
      remaining.splice(pickedIdx, 1)
    }

    return result
  }

  const matrixData: any = await prisma.knowledgeBlock.findMany({
    where: {
      examMatrixId: body?.examMatrixId,
      deletedAt: null,
    },
    include: {
      questions: {
        where: {
          deletedAt: null,
          parentQuestionId: null,
        },
        include: {
          subQuestions: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            include: {
              multipleChoiceOptions: { orderBy: { order: "asc" } },
              fillInBlankSlots: { orderBy: { order: "asc" } },
              orderingItems: true,
            },
          },
        },
      },
      configExams: true,
    },
  })

  if (!matrixData.length) {
    return c.json(
      {
        message: "Chưa có ma trận đề",
      },
      400
    )
  }
  if (body?.quantity > 0) {
    const usedQuestionIds = new Set<string>()

    for (let t = 0; t < body?.quantity; t++) {
      let questions: any = []

      for (const knowledgeBlock of matrixData) {
        if (knowledgeBlock.configExams.length) {
          for (const configExam of knowledgeBlock.configExams) {
            const pool = knowledgeBlock.questions.filter(
              (i: any) =>
                i?.difficult === configExam.difficult &&
                (configExam.type == null || i?.type === configExam.type) &&
                i?.point === configExam.point
            )

            if (pool.length < configExam.quantity) {
              return c.json(
                {
                  message: "Không đúng số câu hỏi",
                },
                400
              )
            }

            const unused = pool.filter((q: any) => !usedQuestionIds.has(q.id))
            const used = pool.filter((q: any) => usedQuestionIds.has(q.id))

            let selected: any[]
            if (unused.length >= configExam.quantity) {
              selected = getRandomItems(unused, configExam.quantity)
            } else {
              const fromUnused = getRandomItems(unused, unused.length)
              const stillNeeded = configExam.quantity - fromUnused.length
              const fromUsed = getRandomItems(used, stillNeeded)
              selected = [...fromUnused, ...fromUsed]
            }

            selected.forEach((q: any) => {
              usedQuestionIds.add(q.id)
              q.subQuestions?.forEach((sub: any) => usedQuestionIds.add(sub.id))
            })
            questions = [...questions, ...selected]
          }
        }
      }

      questions = shuffleWithConstraints(questions)

      await prisma.examBank.create({
        data: {
          examCode: `${body?.examCode}_${body?.codeFrom + t}`,
          explain: body.explain,
          examDay: body.examDay,
          examTime: body.examTime,
          examMatrixId: body?.examMatrixId,
          examId: body?.examId,
          examType: body?.examType,
          subjectClassId: body?.subjectClassId,
          isNote: body.isNote,
          isGroup: body.isGroup,
          description: body.description,
          questions: {
            createMany: {
              data: questions.map((item: any) => {
                return {
                  questionId: item.id,
                }
              }),
            },
          },
        },
      })
    }
  }
  return c.json({ message: "Success" })
})

export default app
