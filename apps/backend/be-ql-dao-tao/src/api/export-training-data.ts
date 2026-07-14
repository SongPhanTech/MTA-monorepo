import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { exportTrainingData } from "../services/export-training-data"

const app = new OpenAPIHono()

const exportTrainingDataRequestSchema = z
  .object({
    classRegisterSessionId: z.string().openapi(fieldDesc("ID đợt đăng ký học online.")),
  })
  .openapi("ExportTrainingDataRequest")

const exportTrainingDataResponseSchema = z
  .object({
    version: z.string(),
    exportedAt: z.string(),
    filters: z.object({
      classRegisterSessionId: z.string(),
      semesterId: z.string(),
      trainingCourseIds: z.array(z.string()),
    }),
    counts: z.object({}).catchall(z.number()),
    data: z.object({}).catchall(z.array(z.object({}).catchall(z.any()))),
  })
  .openapi("ExportTrainingDataResponse")

const exportTrainingDataRoute = createRoute({
  operationId: "exportTrainingData",
  tags: ["Xuất dữ liệu"],
  path: "/export",
  method: "post",
  summary: "Xuất dữ liệu thô theo đợt đăng ký học",
  description: `Xuất gói JSON theo 1 đợt đăng ký học online để migrate sang môi trường internet.

**Bảng dữ liệu:** ClassRegisterSession, ClassRegisterSessionCredit, _ClassRegisterSessionToTrainingCourse, DM_DonVi, UserProfile, LecturerType, Lecturer, TrainingObjectType, SchoolYear, Semester, TrainingCourse, Subject, SubjectVersion, SubjectClass, SubjectClassTime, FixedClass, _FixedClassToSubjectClass, Room, Building, TrainingLocation, TrainingMajor, Curriculum, CurriculumVersion, Student, StudentSubjectScore, StudentSemesterResult, Exam, ClassSchedule.

**Tham số:** classRegisterSessionId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: exportTrainingDataRequestSchema,
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Gói dữ liệu JSON",
      content: {
        "application/json": {
          schema: exportTrainingDataResponseSchema,
        },
      },
    },
    404: {
      description: "Not Found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportTrainingDataRoute, async (c) => {
  const { classRegisterSessionId } = c.req.valid("json")

  try {
    const result = await exportTrainingData({ classRegisterSessionId })
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất dữ liệu thất bại"
    return c.json({ message }, 404)
  }
})

export default app
