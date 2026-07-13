import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { exportTrainingData } from "../services/export-training-data"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono()

const exportTrainingDataRequestSchema = z
  .object({
    semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
    trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
    trainingCourseId: z
      .string()
      .optional()
      .openapi(fieldDesc("ID khóa học (lọc tùy chọn).")),
    type: z
      .enum(["NORMAL", "RETAKE", "REEXAM"])
      .optional()
      .openapi(fieldDesc("Loại lớp học phần.")),
  })
  .openapi("ExportTrainingDataRequest")

const exportTrainingDataResponseSchema = z
  .object({
    version: z.string(),
    exportedAt: z.string(),
    filters: z.object({
      semesterId: z.string(),
      trainingObjectTypeId: z.string(),
      trainingCourseId: z.string().nullable(),
      type: z.string().nullable(),
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
  summary: "Xuất dữ liệu đào tạo JSON",
  description: `Xuất gói dữ liệu JSON để migrate/import, lọc theo học kỳ và hệ đào tạo.

**Bảng dữ liệu:** DM_DonVi, UserProfile, LecturerType, Lecturer, TrainingObjectType, SchoolYear, Semester, TrainingCourse, Subject, SubjectVersion, SubjectClass, SubjectClassTime, FixedClass, _FixedClassToSubjectClass, Room, Building, TrainingLocation, TrainingMajor, Curriculum, CurriculumVersion, Student, StudentSubjectScore, PlanTraining, PlanTrainingSubject, Exam, ClassSchedule.

**Tham số:** semesterId, trainingObjectTypeId, trainingCourseId (tùy chọn), type (NORMAL | RETAKE | REEXAM).`,
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
  const { semesterId, trainingObjectTypeId, trainingCourseId, type } = c.req.valid("json")

  try {
    const result = await exportTrainingData({
      semesterId,
      trainingObjectTypeId,
      trainingCourseId,
      type,
    })

    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xuất dữ liệu thất bại"
    return c.json({ message }, 404)
  }
})

export default app
